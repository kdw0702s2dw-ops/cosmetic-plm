"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type RawMaterial = {
  id?: string;
  raw_code: string;
  raw_name: string;
  trade_name?: string;
  raw_type?: string;
  manufacturer?: string;
  supplier?: string;
  unit_price?: number | null;
  currency?: string;
  moq?: string;
  lead_time?: string;
  origin_country?: string;
  inci_kr?: string;
  inci_en?: string;
  inci_cn?: string;
  inci_jp?: string;
  cas_no?: string;
  ec_no?: string;
  function_kr?: string;
  function_en?: string;
  regulatory_note?: string;
  note?: string;
  is_active?: boolean;
};

// 원료 목록 화면 전용 타입 - v_plm_raw_material_list 뷰 기준 (복합원료는 구성성분 전체가 inci_display에 합쳐져 옴)
export type RawMaterialListItem = {
  raw_code: string;
  raw_name: string;
  trade_name: string | null;
  manufacturer: string | null;
  supplier: string | null;
  unit_price: number | null;
  currency: string | null;
  inci_kr: string | null;
  inci_en: string | null;
  inci_display: string | null;
  updated_at: string;
};

export type Component = {
  component_no?: number;
  inci_en?: string;
  inci_kr?: string;
  inci_cn?: string;
  inci_jp?: string;
  cas_no?: string;
  ec_no?: string;
  composition_percent?: number | string;
  function_kr?: string;
  function_en?: string;
  is_allergen?: boolean;
  allergen_id?: string | null;
};

export type AllergenMaster = {
  id: string;
  allergen_name_en: string;
  allergen_name_kr: string | null;
  cas_no: string | null;
};

export type IngredientHit = {
  inci_en: string | null;
  inci_kr: string | null;
  inci_cn: string | null;
  inci_jp: string | null;
  cas_no: string | null;
  ec_no: string | null;
  function_kr: string | null;
  function_en: string | null;
};

// 목록 화면용: v_plm_raw_material_list 뷰 사용 (INCI 컬럼에 복합원료 전성분이 합쳐져서 나옴)
export async function fetchRawMaterials(keyword = ""): Promise<RawMaterialListItem[]> {
  let q = supabaseProductionFinal
    .from("v_plm_raw_material_list")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(
      `raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,trade_name.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_en.ilike.%${k}%`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as RawMaterialListItem[];
}

// 원료 목록 검색창 자동완성 (원료코드/원료명/INCI 국문·영문 매칭, ilike라 대소문자 구분 없음)
export async function searchRawMaterialsAutocomplete(keyword: string): Promise<RawMaterialListItem[]> {
  const k = keyword.trim();
  if (!k) return [];
  const { data, error } = await supabaseProductionFinal
    .from("v_plm_raw_material_list")
    .select("*")
    .or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_en.ilike.%${k}%`)
    .limit(15);
  if (error) throw error;
  return (data || []) as RawMaterialListItem[];
}

// "+ 새 원료" 클릭 시 다음 순번(RM-00001부터) 자동 채번용 - 비활성(삭제) 원료 코드도 충돌 방지를 위해 포함해서 계산
export async function fetchNextRawCode(): Promise<string> {
  const { data, error } = await supabaseProductionFinal.from("plm_raw_materials").select("raw_code");
  if (error) throw error;
  const nums = (data || [])
    .map((r: any) => r.raw_code as string)
    .filter((code) => /^RM-\d{5}$/.test(code))
    .map((code) => Number(code.slice(3)));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `RM-${String(next).padStart(5, "0")}`;
}

// 편집 패널용: 목록 뷰엔 없는 필드(moq, cas_no 등)까지 전부 필요해서 원본 테이블에서 단건 조회
export async function fetchRawMaterialByCode(rawCode: string): Promise<RawMaterial> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .select("*")
    .eq("raw_code", rawCode)
    .single();
  if (error) throw error;
  return data as RawMaterial;
}

export type PriceUpdateRow = { raw_code: string; unit_price: number };

// plm_raw_materials.raw_name 등 NOT NULL 컬럼 때문에 upsert(부분 컬럼)는 사용 불가
// (ON CONFLICT DO UPDATE도 postgres가 INSERT 후보 행의 NOT NULL을 먼저 검증함) → RPC로 순수 UPDATE 수행
export async function bulkUpdateUnitPrices(rows: PriceUpdateRow[]) {
  const chunkSize = 500;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabaseProductionFinal.rpc("plm_bulk_update_raw_prices", { p_rows: chunk });
    if (error) throw error;
    for (const r of (data || []) as { raw_code: string; updated: boolean }[]) {
      if (r.updated) updated++;
      else skipped++;
    }
  }
  return { updated, skipped };
}

export async function searchIngredients(keyword: string): Promise<IngredientHit[]> {
  const { data, error } = await supabaseProductionFinal.rpc("plm_search_ingredients", { keyword });
  if (error) throw error;
  return (data || []) as IngredientHit[];
}

export async function saveRawMaterial(rm: RawMaterial) {
  const payload = { ...rm, is_active: rm.is_active ?? true };
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .upsert(payload, { onConflict: "raw_code" })
    .select("*")
    .single();
  if (error) throw error;

  if (rm.inci_en || rm.inci_kr) {
    await supabaseProductionFinal.from("plm_ingredient_dictionary").insert({
      inci_en: rm.inci_en || null,
      inci_kr: rm.inci_kr || null,
      inci_cn: rm.inci_cn || null,
      inci_jp: rm.inci_jp || null,
      cas_no: rm.cas_no || null,
      ec_no: rm.ec_no || null,
      function_kr: rm.function_kr || null,
      function_en: rm.function_en || null,
      source: "raw_material_save",
    });
  }
  return data as RawMaterial;
}

// 원료 삭제 - 소프트 삭제(is_active=false)로 처리. 물리적으로 지우지 않아서 처방에 이미 쓰인 원료의 이력이 깨지지 않음.
export async function deleteRawMaterial(rawCode: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .update({ is_active: false })
    .eq("raw_code", rawCode);
  if (error) throw error;
}

export async function fetchAllergenMaster(): Promise<AllergenMaster[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_allergen_master")
    .select("id, allergen_name_en, allergen_name_kr, cas_no")
    .eq("is_active", true)
    .order("allergen_name_en");
  if (error) throw error;
  return (data || []) as AllergenMaster[];
}

export async function fetchComponents(rawCode: string): Promise<Component[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_components")
    .select("*")
    .eq("raw_code", rawCode)
    .order("component_no", { ascending: true });
  if (error) throw error;
  return (data || []) as Component[];
}

export async function saveComponents(rawCode: string, components: Component[]) {
  const clean = components
    .filter((c) => c.inci_en || c.inci_kr)
    .map((c) => ({
      inci_en: c.inci_en ?? "",
      inci_kr: c.inci_kr ?? "",
      inci_cn: c.inci_cn ?? "",
      inci_jp: c.inci_jp ?? "",
      cas_no: c.cas_no ?? "",
      ec_no: c.ec_no ?? "",
      composition_percent: String(c.composition_percent ?? ""),
      function_kr: c.function_kr ?? "",
      function_en: c.function_en ?? "",
      is_allergen: !!c.is_allergen,
      allergen_id: c.allergen_id ?? "",
    }));

  const { data, error } = await supabaseProductionFinal.rpc("plm_save_components", {
    p_raw_code: rawCode,
    p_components: clean,
  });
  if (error) throw error;
  return data as number;
}

export function sumComposition(components: Component[]) {
  return components.reduce((s, c) => s + (Number(c.composition_percent) || 0), 0);
}
