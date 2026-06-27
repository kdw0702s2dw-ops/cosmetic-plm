"use client";

import { supabaseAiResearch } from "@/lib/supabaseAiResearchClient";
import { generateAiResearchResult } from "./aiResearchRuleEngine";
import type { AiResearchMode } from "@/types/enterpriseAiResearch";

export async function fetchAiResearchProjects() {
  const { data, error } = await supabaseAiResearch
    .from("v40_ai_research_projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createAiResearchProject(input: {
  title: string;
  mode: AiResearchMode;
  productType: string;
  claim: string;
  targetCost: number | null;
  targetCountry: string;
  prompt: string;
}) {
  const projectCode = `AIR-${new Date().toISOString().slice(2,10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const result = generateAiResearchResult({
    projectCode,
    mode: input.mode,
    productType: input.productType,
    claim: input.claim,
    targetCost: input.targetCost,
    targetCountry: input.targetCountry,
    prompt: input.prompt,
  });

  const { data, error } = await supabaseAiResearch
    .from("v40_ai_research_projects")
    .insert({
      project_code: projectCode,
      title: input.title,
      mode: input.mode,
      target_product_type: input.productType,
      target_claim: input.claim,
      target_cost_per_kg: input.targetCost,
      target_country: input.targetCountry,
      prompt: input.prompt,
      status: "GENERATED",
      result_json: result,
      created_by: "R&D",
    })
    .select()
    .single();
  if (error) throw error;

  if (result.actions.length > 0) {
    const { error: actionError } = await supabaseAiResearch.from("v40_ai_research_actions").insert(result.actions);
    if (actionError) throw actionError;
  }

  return data;
}

export async function fetchAiResearchActions(projectCode: string) {
  const { data, error } = await supabaseAiResearch
    .from("v40_ai_research_actions")
    .select("*")
    .eq("project_code", projectCode)
    .order("priority", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateAiResearchAction(id: string, status: "OPEN" | "DONE" | "HOLD") {
  const { error } = await supabaseAiResearch
    .from("v40_ai_research_actions")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function applyGeneratedFormulaToGold(project: any) {
  const result = project.result_json || {};
  const formulaCode = `AI-F-${Date.now().toString().slice(-6)}`;
  const revision = "R0";

  const { error: headerError } = await supabaseAiResearch
    .from("gold_formula_headers")
    .insert({
      formula_code: formulaCode,
      formula_name: project.title,
      revision,
      status: "DRAFT",
      product_type: project.target_product_type,
      customer: "AI Research",
      target_country: project.target_country,
      claim: project.target_claim,
      created_by: "AI Research Platform",
    });
  if (headerError) throw headerError;

  const lines = (result.generated_formula_lines || []).map((line: any) => ({
    formula_code: formulaCode,
    revision,
    line_no: line.line_no,
    phase: line.phase,
    raw_code: line.raw_code,
    raw_name: line.raw_name,
    inci_en: line.inci_en,
    inci_kr: line.inci_kr,
    percentage: line.percentage,
    function_en: line.function_en,
    note: line.reason,
  }));

  if (lines.length > 0) {
    const { error: lineError } = await supabaseAiResearch.from("gold_formula_lines").insert(lines);
    if (lineError) throw lineError;
  }

  await supabaseAiResearch
    .from("v40_ai_research_projects")
    .update({ status: "APPLIED" })
    .eq("project_code", project.project_code);

  return { formulaCode, revision };
}
