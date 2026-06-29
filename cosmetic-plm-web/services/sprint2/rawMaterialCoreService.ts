"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type RawMaterialCore = {
  raw_code: string;
  raw_name: string;
  trade_name?: string;
  raw_type?: "SINGLE" | "COMPLEX";
  manufacturer?: string;
  supplier?: string;
  unit_price?: number;
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

export type RawMaterialComponentCore = {
  raw_code: string;
  component_no: number;
  component_name_kr?: string;
  component_name_en?: string;
  inci_kr?: string;
  inci_en?: string;
  inci_cn?: string;
  inci_jp?: string;
  cas_no?: string;
  ec_no?: string;
  composition_percent: number;
  function_kr?: string;
  function_en?: string;
  note?: string;
};

export async function fetchSprint2RawMaterials(keyword = "") {
  let query = supabaseProductionFinal
    .from("plm_raw_materials")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,trade_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,cas_no.ilike.%${k}%,supplier.ilike.%${k}%,manufacturer.ilike.%${k}%,function_kr.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchSprint2RawComponents(rawCode: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_components")
    .select("*")
    .eq("raw_code", rawCode)
    .order("component_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertSprint2RawMaterial(raw: RawMaterialCore) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .upsert({
      ...raw,
      raw_type: raw.raw_type || "SINGLE",
      currency: raw.currency || "KRW",
      is_active: raw.is_active ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "raw_code" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteSprint2RawMaterial(rawCode: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("raw_code", rawCode);
  if (error) throw error;
}

export async function upsertSprint2RawComponent(component: RawMaterialComponentCore) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_components")
    .upsert({ ...component, updated_at: new Date().toISOString() }, { onConflict: "raw_code,component_no" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSprint2RawComponent(rawCode: string, componentNo: number) {
  const { error } = await supabaseProductionFinal
    .from("plm_raw_material_components")
    .delete()
    .eq("raw_code", rawCode)
    .eq("component_no", componentNo);
  if (error) throw error;
}

export async function syncSprint2RawFromComponents(rawCode: string) {
  const comps = await fetchSprint2RawComponents(rawCode);
  if (comps.length === 0) return null;

  const sorted = comps.slice().sort((a: any, b: any) => Number(b.composition_percent || 0) - Number(a.composition_percent || 0));
  const join = (field: string, fallback?: string) => sorted.map((x: any) => x[field] || (fallback ? x[fallback] : "")).filter(Boolean).join(", ");

  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .update({
      raw_type: comps.length > 1 ? "COMPLEX" : "SINGLE",
      inci_kr: join("inci_kr", "component_name_kr"),
      inci_en: join("inci_en", "component_name_en"),
      inci_cn: join("inci_cn"),
      inci_jp: join("inci_jp"),
      cas_no: Array.from(new Set(sorted.map((x: any) => x.cas_no).filter(Boolean))).join(", "),
      ec_no: Array.from(new Set(sorted.map((x: any) => x.ec_no).filter(Boolean))).join(", "),
      function_kr: Array.from(new Set(sorted.map((x: any) => x.function_kr).filter(Boolean))).join(", "),
      function_en: Array.from(new Set(sorted.map((x: any) => x.function_en).filter(Boolean))).join(", "),
      updated_at: new Date().toISOString(),
    })
    .eq("raw_code", rawCode)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateSprint2RawMaterial(raw: RawMaterialCore, components: RawMaterialComponentCore[]) {
  const nextCode = `${raw.raw_code}-COPY-${Date.now().toString().slice(-5)}`;
  const saved = await upsertSprint2RawMaterial({
    ...raw,
    raw_code: nextCode,
    raw_name: `${raw.raw_name} 복사본`,
    trade_name: raw.trade_name ? `${raw.trade_name} 복사본` : raw.trade_name,
  });

  for (const c of components) {
    await upsertSprint2RawComponent({ ...c, raw_code: nextCode });
  }
  await syncSprint2RawFromComponents(nextCode);
  return saved;
}

export function nextRawComponentNo(components: RawMaterialComponentCore[]) {
  return Math.max(0, ...components.map((x) => Number(x.component_no || 0))) + 1;
}

export function componentTotalPercent(components: RawMaterialComponentCore[]) {
  return Number(components.reduce((sum, x) => sum + Number(x.composition_percent || 0), 0).toFixed(4));
}

export function buildComponentInciList(components: RawMaterialComponentCore[], lang: "kr" | "en" = "kr") {
  const key = lang === "kr" ? "inci_kr" : "inci_en";
  const fallback = lang === "kr" ? "component_name_kr" : "component_name_en";
  return components.slice().sort((a, b) => Number(b.composition_percent || 0) - Number(a.composition_percent || 0)).map((x: any) => x[key] || x[fallback]).filter(Boolean).join(", ");
}
