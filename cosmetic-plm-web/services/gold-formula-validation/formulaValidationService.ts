"use client";

import { supabaseFormulaValidation } from "@/lib/supabaseFormulaValidationClient";
import { runFormulaValidationEngine } from "./formulaValidationEngine";
import type { FormulaLineForValidation, FormulaValidationIssue, FormulaValidationRun, RawMaterialRule } from "@/types/goldFormulaValidation";

export async function fetchFormulaListForValidation(search = "") {
  let query = supabaseFormulaValidation
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

export async function fetchFormulaLinesForValidation(formulaCode: string, revision: string): Promise<FormulaLineForValidation[]> {
  const { data, error } = await supabaseFormulaValidation
    .from("gold_formula_lines")
    .select("formula_code, revision, line_no, phase, raw_code, raw_name, inci_en, inci_kr, percentage, function_en, note")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return (data || []) as FormulaLineForValidation[];
}

export async function fetchRawMaterialRules(rawCodes: string[]): Promise<RawMaterialRule[]> {
  if (rawCodes.length === 0) return [];

  const { data, error } = await supabaseFormulaValidation
    .from("enterprise_raw_material_master")
    .select("raw_code, raw_name, inci_en, inci_kr, cas_no, document_status")
    .in("raw_code", rawCodes);

  if (error) throw error;
  return (data || []) as RawMaterialRule[];
}

export async function runAndSaveFormulaValidation(formulaCode: string, revision: string, user = "R&D") {
  const lines = await fetchFormulaLinesForValidation(formulaCode, revision);
  const rawCodes = Array.from(new Set(lines.map((line) => line.raw_code).filter(Boolean)));
  const rawMaterials = await fetchRawMaterialRules(rawCodes);

  const result = runFormulaValidationEngine({ formulaCode, revision, lines, rawMaterials });

  const { data: runData, error: runError } = await supabaseFormulaValidation
    .from("gold_formula_validation_runs")
    .insert({
      formula_code: formulaCode,
      revision,
      total_percent: result.totalPercent,
      validation_status: result.validationStatus,
      issue_count: result.issueCount,
      blocker_count: result.blockerCount,
      created_by: user,
    })
    .select()
    .single();

  if (runError) throw runError;

  if (result.issues.length > 0) {
    const issuesToInsert = result.issues.map((issue) => ({
      ...issue,
      run_id: runData.id,
    }));

    const { error: issueError } = await supabaseFormulaValidation
      .from("gold_formula_validation_issues")
      .insert(issuesToInsert);

    if (issueError) throw issueError;
  }

  return { run: runData as FormulaValidationRun, issues: result.issues as FormulaValidationIssue[] };
}

export async function fetchValidationRuns(formulaCode: string, revision: string): Promise<FormulaValidationRun[]> {
  const { data, error } = await supabaseFormulaValidation
    .from("gold_formula_validation_runs")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as FormulaValidationRun[];
}

export async function fetchValidationIssues(runId: string): Promise<FormulaValidationIssue[]> {
  const { data, error } = await supabaseFormulaValidation
    .from("gold_formula_validation_issues")
    .select("*")
    .eq("run_id", runId)
    .order("severity", { ascending: true });

  if (error) throw error;
  return (data || []) as FormulaValidationIssue[];
}
