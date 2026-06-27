"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { LiveFormulaLine } from "@/types/enterpriseV50Live";

async function safeCount(table: string) {
  const { count, error } = await supabaseProductionFinal
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}

export async function fetchV50Dashboard() {
  const [
    formula_count,
    raw_count,
    document_count,
    batch_count,
    sample_count,
    ai_count,
  ] = await Promise.all([
    safeCount("gold_formula_headers"),
    safeCount("enterprise_raw_material_master"),
    safeCount("gold_documents"),
    safeCount("gold_manufacturing_batches"),
    safeCount("gold_sample_requests"),
    safeCount("v40_ai_autopilot_runs"),
  ]);

  return { formula_count, raw_count, document_count, batch_count, sample_count, ai_count };
}

export async function fetchV50Formulas(search = "") {
  let query = supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchV50FormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchV50RawMaterials(search = "") {
  let query = supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .select("*")
    .order("raw_code", { ascending: true })
    .limit(80);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addV50FormulaLine(line: LiveFormulaLine) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .insert(line)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateV50FormulaLine(id: string, patch: Partial<LiveFormulaLine>) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteV50FormulaLine(id: string) {
  const { error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function createV50Formula(input: {
  formula_name: string;
  product_type: string;
  customer: string;
  claim: string;
  target_country: string;
}) {
  const formulaCode = `F-${Date.now().toString().slice(-6)}`;
  const revision = "R0";

  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_headers")
    .insert({
      formula_code: formulaCode,
      formula_name: input.formula_name,
      revision,
      status: "DRAFT",
      product_type: input.product_type,
      customer: input.customer,
      claim: input.claim,
      target_country: input.target_country,
      created_by: "R&D",
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, formula_code: formulaCode, revision };
}

export async function fetchV50Documents(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("gold_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (formulaCode && revision) {
    query = query.eq("formula_code", formulaCode).eq("revision", revision);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchV50Batches() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;
  return data || [];
}
