"use client";

import { supabaseFormula } from "@/lib/supabaseFormulaClient";
import type { FormulaHeader, FormulaLine } from "@/types/goldFormula";

export async function fetchFormulaHeaders(search = "", limit = 100): Promise<FormulaHeader[]> {
  let query = supabaseFormula
    .from("gold_formula_headers")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,claim.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FormulaHeader[];
}

export async function fetchFormulaLines(formulaCode: string, revision: string): Promise<FormulaLine[]> {
  const { data, error } = await supabaseFormula
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return (data || []) as FormulaLine[];
}

export async function upsertFormulaHeader(header: FormulaHeader) {
  const { data, error } = await supabaseFormula
    .from("gold_formula_headers")
    .upsert(header, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (error) throw error;
  return data as FormulaHeader;
}

export async function upsertFormulaLine(line: FormulaLine) {
  const { data, error } = await supabaseFormula
    .from("gold_formula_lines")
    .upsert(line, { onConflict: "formula_code,revision,line_no" })
    .select()
    .single();

  if (error) throw error;
  return data as FormulaLine;
}

export async function deleteFormulaLine(formulaCode: string, revision: string, lineNo: number) {
  const { error } = await supabaseFormula
    .from("gold_formula_lines")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .eq("line_no", lineNo);

  if (error) throw error;
}

export function validateFormulaLines(lines: FormulaLine[]) {
  const totalPercent = Number(lines.reduce((sum, item) => sum + Number(item.percentage || 0), 0).toFixed(4));
  const isValid100 = Math.abs(totalPercent - 100) < 0.0001;
  return {
    totalPercent,
    lineCount: lines.length,
    isValid100,
    message: isValid100 ? "처방 합계 100% 정상" : `처방 합계 ${totalPercent}% - 100% 보정 필요`,
  };
}
