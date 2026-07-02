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

export async function fetchRawMaterials(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_raw_materials")
    .select("*")
    .eq("is_active", true)
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
  return (data || []) as RawMaterial[];
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
