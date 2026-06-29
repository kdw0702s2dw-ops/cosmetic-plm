"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type Sprint1Formula = {
  formula_code: string;
  revision: string;
  formula_name: string;
  status?: string;
  product_type?: string;
  customer?: string;
  target_country?: string;
  claim?: string;
};

export type Sprint1FormulaLine = {
  id?: string;
  formula_code: string;
  revision: string;
  line_no: number;
  phase: string;
  raw_code?: string;
  raw_name?: string;
  inci_kr?: string;
  inci_en?: string;
  percentage: number;
  function_kr?: string;
  function_en?: string;
  unit_price?: number;
  cost_per_kg?: number;
  note?: string;
};

export async function fetchSprint1Formulas(keyword = "") {
  let query = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,product_type.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchSprint1FormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchSprint1RawOptions(keyword = "") {
  let query = supabaseProductionFinal
    .from("plm_raw_materials")
    .select("*")
    .eq("is_active", true)
    .order("raw_code", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,trade_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function upsertSprint1Formula(formula: Sprint1Formula) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .upsert({
      ...formula,
      status: formula.status || "DRAFT",
      revision: formula.revision || "R0",
      updated_at: new Date().toISOString(),
    }, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertSprint1FormulaLine(line: Sprint1FormulaLine) {
  const cost = Number(((Number(line.percentage || 0) / 100) * Number(line.unit_price || 0)).toFixed(4));

  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .upsert({
      ...line,
      phase: line.phase || "A",
      cost_per_kg: cost,
      updated_at: new Date().toISOString(),
    }, { onConflict: "formula_code,revision,line_no" })
    .select()
    .single();

  if (error) throw error;

  await recalcSprint1Formula(line.formula_code, line.revision);
  return data;
}

export async function deleteSprint1FormulaLine(formulaCode: string, revision: string, lineNo: number) {
  const { error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .eq("line_no", lineNo);

  if (error) throw error;
  await recalcSprint1Formula(formulaCode, revision);
}

export async function softDeleteSprint1Formula(formulaCode: string, revision: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;
}

export async function recalcSprint1Formula(formulaCode: string, revision: string) {
  const lines = await fetchSprint1FormulaLines(formulaCode, revision);

  const total = Number(lines.reduce((sum: number, x: any) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((sum: number, x: any) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));

  const { error } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({
      total_percent: total,
      estimated_cost_per_kg: cost,
      updated_at: new Date().toISOString(),
    })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;

  return { total_percent: total, estimated_cost_per_kg: cost };
}

export function buildSprint1InciList(lines: Sprint1FormulaLine[]) {
  return lines
    .slice()
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .map((x) => x.inci_kr || x.inci_en || x.raw_name)
    .filter(Boolean)
    .join(", ");
}

export function nextSprint1LineNo(lines: Sprint1FormulaLine[]) {
  return (Math.max(0, ...lines.map((x) => Number(x.line_no || 0))) + 1);
}
