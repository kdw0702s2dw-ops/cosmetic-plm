"use client";

import { supabaseKnowledge } from "@/lib/supabaseKnowledgeClient";

export async function fetchKnowledgeStats() {
  const tables = [
    ["Global INCI", "knowledge_global_inci_master"],
    ["Regulation", "knowledge_regulation_rules"],
    ["Formula Library", "knowledge_formula_library"],
    ["Compatibility", "knowledge_compatibility_matrix"],
    ["Raw Materials", "enterprise_raw_material_master"],
  ];

  const result = [];
  for (const [module, table] of tables) {
    const { count, error } = await supabaseKnowledge.from(table).select("*", { count: "exact", head: true });
    result.push({ module, table, count: count || 0, status: error ? "ERROR" : (count || 0) > 0 ? "ACTIVE" : "EMPTY", message: error?.message || "OK" });
  }
  return result;
}

export async function searchGlobalInci(keyword = "") {
  let query = supabaseKnowledge.from("knowledge_global_inci_master").select("*").order("inci_en", { ascending: true }).limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_cn.ilike.%${k}%,inci_jp.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchRegulation(keyword = "") {
  let query = supabaseKnowledge.from("knowledge_regulation_rules").select("*").order("country", { ascending: true }).limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`country.ilike.%${k}%,keyword.ilike.%${k}%,risk_type.ilike.%${k}%,rule_summary.ilike.%${k}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchFormulaLibrary(keyword = "") {
  let query = supabaseKnowledge.from("knowledge_formula_library").select("*").order("library_code", { ascending: true }).limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`formula_name.ilike.%${k}%,product_type.ilike.%${k}%,claim.ilike.%${k}%,key_ingredients.ilike.%${k}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchCompatibility(keyword = "") {
  let query = supabaseKnowledge.from("knowledge_compatibility_matrix").select("*").order("compat_code", { ascending: true }).limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`ingredient_a.ilike.%${k}%,ingredient_b.ilike.%${k}%,risk_summary.ilike.%${k}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function upsertKnowledgeRow(table: string, row: any, conflict: string) {
  const { data, error } = await supabaseKnowledge.from(table).upsert(row, { onConflict: conflict }).select().single();
  if (error) throw error;
  return data;
}
