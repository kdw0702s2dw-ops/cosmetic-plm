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
  assigned_researcher?: string;
  development_type?: string;
  progress_status?: string;
  exposure_type?: string;
  target_market?: string;
  claim?: string;
};

export type ProductionBomRow = {
  id?: string;
  formula_code?: string;
  revision?: string;
  production_code?: string;
  product_name?: string;
  material_name_1?: string;
  material_name_2?: string;
  material_name_3?: string;
  molding_type?: string;
  remarks?: string;
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
  percentage: number | string; // 입력 중 "0.0005" 같은 문자열을 그대로 유지 (계산 시 Number()로 변환)
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
      // exposure_type/target_market은 DB에 CHECK IN (...) 제약이 있어서 빈 문자열은 위반됨 - 미선택이면 null로 저장
      exposure_type: formula.exposure_type || null,
      target_market: formula.target_market || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertSprint1FormulaLines(lines: Sprint1FormulaLine[]) {
  if (lines.length === 0) return [];

  const payload = lines.map((line) => ({
    ...line,
    phase: line.phase || "A",
    cost_per_kg: Number(((Number(line.percentage || 0) / 100) * Number(line.unit_price || 0)).toFixed(4)),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .upsert(payload, { onConflict: "formula_code,revision,line_no" })
    .select();

  if (error) throw error;
  return data;
}

export async function deleteSprint1FormulaLines(formulaCode: string, revision: string, lineNos: number[]) {
  if (lineNos.length === 0) return;

  const { error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .in("line_no", lineNos);

  if (error) throw error;
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

export async function fetchProductionBomRows(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_bom")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ProductionBomRow[];
}

// 생산 BOM은 라인 번호 같은 고유키가 없어서, 원료 구성성분 저장 방식과 동일하게
// 현재 처방분을 전부 지우고 화면에 있는 행을 다시 넣는 방식으로 저장한다.
export async function saveProductionBomRows(formulaCode: string, revision: string, rows: ProductionBomRow[]) {
  const { error: delError } = await supabaseProductionFinal
    .from("plm_production_bom")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (delError) throw delError;

  const clean = rows.filter((r) =>
    r.production_code || r.product_name || r.material_name_1 || r.material_name_2 || r.material_name_3 || r.molding_type || r.remarks
  );
  if (clean.length === 0) return [];

  const payload = clean.map((r) => ({
    production_code: r.production_code || null,
    product_name: r.product_name || null,
    material_name_1: r.material_name_1 || null,
    material_name_2: r.material_name_2 || null,
    material_name_3: r.material_name_3 || null,
    molding_type: r.molding_type || null,
    remarks: r.remarks || null,
    formula_code: formulaCode,
    revision,
  }));

  const { data, error } = await supabaseProductionFinal
    .from("plm_production_bom")
    .insert(payload)
    .select();

  if (error) throw error;
  return (data || []) as ProductionBomRow[];
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
