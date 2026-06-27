"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

async function safeCount(table: string) {
  const { count, error } = await supabaseProductionFinal
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}

export async function fetchV50KnowledgeSummary() {
  const [raws, inci, regulations, compatibility] = await Promise.all([
    safeCount("enterprise_raw_material_master"),
    safeCount("knowledge_global_inci_master"),
    safeCount("knowledge_regulation_rules"),
    safeCount("knowledge_compatibility_matrix"),
  ]);
  return { raws, inci, regulations, compatibility };
}

export async function searchV50RawKnowledge(keyword = "") {
  let query = supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .select("*")
    .order("raw_code", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchV50InciKnowledge(keyword = "") {
  let query = supabaseProductionFinal
    .from("knowledge_global_inci_master")
    .select("*")
    .order("inci_en", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_cn.ilike.%${k}%,inci_jp.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchV50RegulationKnowledge(keyword = "") {
  let query = supabaseProductionFinal
    .from("knowledge_regulation_rules")
    .select("*")
    .order("country", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`country.ilike.%${k}%,keyword.ilike.%${k}%,risk_type.ilike.%${k}%,rule_summary.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchV50CompatibilityKnowledge(keyword = "") {
  let query = supabaseProductionFinal
    .from("knowledge_compatibility_matrix")
    .select("*")
    .order("compat_code", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`ingredient_a.ilike.%${k}%,ingredient_b.ilike.%${k}%,risk_summary.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchV50AdminSummary() {
  const [formulas, raws, docs, batches, users, markers, notifications, activities] = await Promise.all([
    safeCount("gold_formula_headers"),
    safeCount("enterprise_raw_material_master"),
    safeCount("gold_documents"),
    safeCount("gold_manufacturing_batches"),
    safeCount("user_profiles"),
    safeCount("enterprise_release_markers"),
    safeCount("enterprise_notifications"),
    safeCount("enterprise_activity_events"),
  ]);
  return { formulas, raws, docs, batches, users, markers, notifications, activities };
}

export async function fetchV50ReleaseMarkers() {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_release_markers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function fetchV50AdminActivities() {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_activity_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
