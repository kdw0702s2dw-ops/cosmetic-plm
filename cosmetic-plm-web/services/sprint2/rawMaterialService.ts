"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { findIngredientByCasNo } from "@/services/sprint2/ingredientDictionaryService";

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

// 원료코드 중복 체크 (신규 등록/수정 저장 전 확인용). excludeId를 주면 본인 행은 제외하고 검사한다.
export async function checkRawCodeExists(rawCode: string, excludeId?: string): Promise<boolean> {
  let q = supabaseProductionFinal.from("plm_raw_materials").select("id").eq("raw_code", rawCode).limit(1);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).length > 0;
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

// CSV 다운로드용: 100건 제한이 있는 목록 뷰가 아니라 원본 테이블에서 전체 조회 (활성 원료만, 화면 목록과 동일 기준)
export async function fetchRawMaterialsForExport(): Promise<RawMaterial[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .select("raw_code, raw_name, trade_name, inci_kr, inci_en, cas_no, ec_no, manufacturer, supplier, unit_price, moq, lead_time, origin_country")
    .eq("is_active", true)
    .order("raw_code", { ascending: true });
  if (error) throw error;
  return (data || []) as RawMaterial[];
}

export async function searchIngredients(keyword: string): Promise<IngredientHit[]> {
  const { data, error } = await supabaseProductionFinal.rpc("plm_search_ingredients", { keyword });
  if (error) throw error;
  return (data || []) as IngredientHit[];
}

// rm.id가 있으면(기존 원료 편집) id 기준 UPDATE - raw_code 값 자체를 바꿔도 새 행이 생기지 않고 그 컬럼만 바뀐다.
// rm.id가 없으면(신규 등록, 또는 CSV 일괄 등록의 raw_code 기준 upsert) 기존처럼 raw_code 기준 upsert.
export async function saveRawMaterial(rm: RawMaterial) {
  const payload = { ...rm, is_active: rm.is_active ?? true, updated_at: new Date().toISOString() };
  const query = rm.id
    ? supabaseProductionFinal.from("plm_raw_materials").update(payload).eq("id", rm.id).select("*").single()
    : supabaseProductionFinal.from("plm_raw_materials").upsert(payload, { onConflict: "raw_code" }).select("*").single();
  const { data, error } = await query;
  if (error) throw error;

  await upsertIngredientDictionary(rm);
  return data as RawMaterial;
}

// cas_no가 있으면 cas_no로, 없으면 inci_kr로 기존 행을 찾아서 있으면 UPDATE, 없으면 INSERT
// (매번 조건 없이 insert하던 버그 수정 - 동시성은 이 앱 트래픽 규모에서 무시 가능)
async function upsertIngredientDictionary(rm: RawMaterial) {
  if (!rm.inci_en && !rm.inci_kr) return;

  const casNo = (rm.cas_no || "").trim();
  const inciKr = (rm.inci_kr || "").trim();

  let existingId: string | null = null;
  if (casNo) {
    const match = await findIngredientByCasNo(casNo);
    existingId = match?.id ?? null;
  } else if (inciKr) {
    const { data } = await supabaseProductionFinal
      .from("plm_ingredient_dictionary").select("id").eq("inci_kr", inciKr).limit(1).maybeSingle();
    existingId = data?.id ?? null;
  }

  const fields = {
    inci_en: rm.inci_en || null, inci_kr: rm.inci_kr || null,
    inci_cn: rm.inci_cn || null, inci_jp: rm.inci_jp || null,
    cas_no: rm.cas_no || null, ec_no: rm.ec_no || null,
    function_kr: rm.function_kr || null, function_en: rm.function_en || null,
  };

  if (existingId) {
    // 원료가 이 INCI를 참조해서 저장한다는 건 실제 사용 중이라는 뜻이므로,
    // 전성분관리에서 삭제(is_active=false) 상태였어도 다시 활성화한다.
    await supabaseProductionFinal.from("plm_ingredient_dictionary")
      .update({ ...fields, is_active: true, updated_at: new Date().toISOString() }).eq("id", existingId);
  } else {
    await supabaseProductionFinal.from("plm_ingredient_dictionary")
      .insert({ ...fields, source: "raw_material_save", is_active: true });
  }
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
