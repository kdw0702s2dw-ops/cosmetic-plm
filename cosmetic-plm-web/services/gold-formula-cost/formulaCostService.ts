"use client";

import { supabaseFormulaCost } from "@/lib/supabaseFormulaCostClient";
import { calculateFormulaCost } from "./formulaCostEngine";

export async function fetchFormulaCostTargets() {
  const { data, error } = await supabaseFormulaCost
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function fetchFormulaCostLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseFormulaCost
    .from("gold_formula_lines")
    .select(`
      formula_code,
      revision,
      line_no,
      phase,
      raw_code,
      raw_name,
      inci_en,
      inci_kr,
      percentage,
      function_en
    `)
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;

  const rawCodes = Array.from(new Set((data || []).map((line: any) => line.raw_code).filter(Boolean)));

  const { data: rawData, error: rawError } = await supabaseFormulaCost
    .from("enterprise_raw_material_master")
    .select("raw_code, unit_price")
    .in("raw_code", rawCodes);

  if (rawError) throw rawError;

  const priceMap = new Map((rawData || []).map((raw: any) => [raw.raw_code, raw.unit_price]));

  return (data || []).map((line: any) => ({
    ...line,
    unit_price: priceMap.get(line.raw_code) ?? null,
  }));
}

export async function runAndSaveFormulaCost(formulaCode: string, revision: string, targetCostPerKg: number | null) {
  const sourceLines = await fetchFormulaCostLines(formulaCode, revision);
  const result = calculateFormulaCost({ formulaCode, revision, lines: sourceLines, targetCostPerKg });

  const { data: summaryData, error: summaryError } = await supabaseFormulaCost
    .from("gold_formula_cost_summaries")
    .upsert(result.summary, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (summaryError) throw summaryError;

  await supabaseFormulaCost
    .from("gold_formula_cost_lines")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (result.lines.length > 0) {
    const { error: lineError } = await supabaseFormulaCost
      .from("gold_formula_cost_lines")
      .insert(result.lines);

    if (lineError) throw lineError;
  }

  await supabaseFormulaCost
    .from("gold_formula_cost_optimization")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (result.recommendations.length > 0) {
    const { error: recError } = await supabaseFormulaCost
      .from("gold_formula_cost_optimization")
      .insert(result.recommendations);

    if (recError) throw recError;
  }

  return { summary: summaryData, lines: result.lines, recommendations: result.recommendations };
}

export async function fetchSavedCost(formulaCode: string, revision: string) {
  const [summaryRes, linesRes, recRes] = await Promise.all([
    supabaseFormulaCost.from("gold_formula_cost_summaries").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseFormulaCost.from("gold_formula_cost_lines").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("cost_per_kg", { ascending: false }),
    supabaseFormulaCost.from("gold_formula_cost_optimization").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("expected_saving_per_kg", { ascending: false }),
  ]);

  if (summaryRes.error) throw summaryRes.error;
  if (linesRes.error) throw linesRes.error;
  if (recRes.error) throw recRes.error;

  return {
    summary: summaryRes.data,
    lines: linesRes.data || [],
    recommendations: recRes.data || [],
  };
}
