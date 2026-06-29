"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

async function safeCount(table: string) {
  const { count, error } = await supabaseProductionFinal.from(table).select("*", { count: "exact", head: true });
  return { table, count: error ? 0 : count || 0, error: error?.message || null };
}

export async function fetchSprint0Status() {
  const tables = [
    "plm_raw_materials",
    "plm_raw_material_components",
    "plm_formulas",
    "plm_formula_lines",
    "plm_documents",
    "plm_table_archive_registry",
    "plm_user_profiles",
    "plm_audit_logs",
  ];
  const results = await Promise.all(tables.map(safeCount));
  const errors = results.filter((x) => x.error).length;
  const empty = results.filter((x) => !x.error && x.count === 0).length;
  return { overall: errors > 0 ? "오류" : empty > 0 ? "확인필요" : "정상", tables: results };
}

export async function fetchSprint0ArchiveRegistry() {
  const { data, error } = await supabaseProductionFinal
    .from("plm_table_archive_registry")
    .select("*")
    .order("category", { ascending: true });
  if (error) throw error;
  return data || [];
}
