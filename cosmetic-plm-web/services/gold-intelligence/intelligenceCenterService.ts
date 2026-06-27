"use client";

import { supabaseIntelligence } from "@/lib/supabaseIntelligenceClient";
import { buildRecommendations, evaluateRegulation, evaluateStability, scoreFormula } from "./intelligenceRuleEngine";

export async function fetchIntelligenceFormulas(search = "") {
  let query = supabaseIntelligence
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

export async function fetchFormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseIntelligence
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchLatestValidation(formulaCode: string, revision: string) {
  const { data, error } = await supabaseIntelligence
    .from("gold_formula_validation_runs")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchCostSummary(formulaCode: string, revision: string) {
  const { data, error } = await supabaseIntelligence
    .from("gold_formula_cost_summaries")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function runAndSaveIntelligence(formulaCode: string, revision: string) {
  const [lines, validation, cost] = await Promise.all([
    fetchFormulaLines(formulaCode, revision),
    fetchLatestValidation(formulaCode, revision),
    fetchCostSummary(formulaCode, revision),
  ]);

  const stabilityRisks = evaluateStability({ formulaCode, revision, lines });
  const regulationRisks = evaluateRegulation({ formulaCode, revision, lines });

  const score = scoreFormula({
    formulaCode,
    revision,
    validationStatus: validation?.validation_status,
    validationIssues: validation?.issue_count || 0,
    blockerCount: validation?.blocker_count || 0,
    costStatus: cost?.status,
    stabilityRisks,
    regulationRisks,
  });

  const recommendations = buildRecommendations({
    formulaCode,
    revision,
    score,
    stabilityRisks,
    regulationRisks,
    validationIssues: validation?.issue_count || 0,
  });

  await supabaseIntelligence.from("gold_formula_stability_risks").delete().eq("formula_code", formulaCode).eq("revision", revision);
  await supabaseIntelligence.from("gold_formula_regulation_risks").delete().eq("formula_code", formulaCode).eq("revision", revision);
  await supabaseIntelligence.from("gold_formula_recommendations").delete().eq("formula_code", formulaCode).eq("revision", revision);

  if (stabilityRisks.length > 0) {
    const { error } = await supabaseIntelligence.from("gold_formula_stability_risks").insert(stabilityRisks);
    if (error) throw error;
  }

  if (regulationRisks.length > 0) {
    const { error } = await supabaseIntelligence.from("gold_formula_regulation_risks").insert(regulationRisks);
    if (error) throw error;
  }

  const { data: scoreData, error: scoreError } = await supabaseIntelligence
    .from("gold_formula_scores")
    .upsert(score, { onConflict: "formula_code,revision" })
    .select()
    .single();
  if (scoreError) throw scoreError;

  if (recommendations.length > 0) {
    const { error } = await supabaseIntelligence.from("gold_formula_recommendations").insert(recommendations);
    if (error) throw error;
  }

  return { score: scoreData, stabilityRisks, regulationRisks, recommendations };
}

export async function fetchSavedIntelligence(formulaCode: string, revision: string) {
  const [score, stability, regulation, recommendations] = await Promise.all([
    supabaseIntelligence.from("gold_formula_scores").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseIntelligence.from("gold_formula_stability_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseIntelligence.from("gold_formula_regulation_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseIntelligence.from("gold_formula_recommendations").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("priority", { ascending: true }),
  ]);

  if (score.error) throw score.error;
  if (stability.error) throw stability.error;
  if (regulation.error) throw regulation.error;
  if (recommendations.error) throw recommendations.error;

  return {
    score: score.data,
    stabilityRisks: stability.data || [],
    regulationRisks: regulation.data || [],
    recommendations: recommendations.data || [],
  };
}
