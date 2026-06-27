"use client";

import { supabaseAiRecommendation } from "@/lib/supabaseAiRecommendationClient";
import { buildAiRecommendations } from "./aiRecommendationEngine";

export async function fetchAiRecommendationRuns() {
  const { data, error } = await supabaseAiRecommendation
    .from("v40_ai_recommendation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

async function fetchRecommendationContext() {
  const [formulas, rawMaterials, inciRows, regulationRules, compatibilityRules] = await Promise.all([
    supabaseAiRecommendation.from("knowledge_formula_library").select("*").limit(500),
    supabaseAiRecommendation.from("enterprise_raw_material_master").select("raw_code, raw_name, inci_en, inci_kr, unit_price, supplier").limit(500),
    supabaseAiRecommendation.from("knowledge_global_inci_master").select("*").limit(500),
    supabaseAiRecommendation.from("knowledge_regulation_rules").select("*").limit(500),
    supabaseAiRecommendation.from("knowledge_compatibility_matrix").select("*").limit(500),
  ]);

  for (const res of [formulas, rawMaterials, inciRows, regulationRules, compatibilityRules]) {
    if (res.error) throw res.error;
  }

  return {
    formulas: formulas.data || [],
    rawMaterials: rawMaterials.data || [],
    inciRows: inciRows.data || [],
    regulationRules: regulationRules.data || [],
    compatibilityRules: compatibilityRules.data || [],
  };
}

export async function runAiRecommendation(input: {
  requestText: string;
  productType: string;
  claim: string;
  targetCost: number | null;
  targetCountry: string;
}) {
  const runCode = `AIR-R-${new Date().toISOString().slice(2,10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const context = await fetchRecommendationContext();
  const result = buildAiRecommendations({
    runCode,
    requestText: input.requestText,
    productType: input.productType,
    claim: input.claim,
    targetCost: input.targetCost,
    targetCountry: input.targetCountry,
    ...context,
  });

  const { data, error } = await supabaseAiRecommendation
    .from("v40_ai_recommendation_runs")
    .insert({
      run_code: runCode,
      source_formula_code: null,
      source_revision: null,
      request_text: input.requestText,
      target_product_type: input.productType,
      target_claim: input.claim,
      target_cost_per_kg: input.targetCost,
      target_country: input.targetCountry,
      result_json: result,
      status: "GENERATED",
    })
    .select()
    .single();
  if (error) throw error;

  if (result.items.length > 0) {
    const { error: itemError } = await supabaseAiRecommendation
      .from("v40_ai_recommendation_items")
      .insert(result.items);
    if (itemError) throw itemError;
  }

  return data;
}

export async function fetchAiRecommendationItems(runCode: string) {
  const { data, error } = await supabaseAiRecommendation
    .from("v40_ai_recommendation_items")
    .select("*")
    .eq("run_code", runCode)
    .order("priority", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateAiRecommendationItem(id: string, status: "OPEN" | "APPLIED" | "HOLD" | "REJECTED") {
  const { error } = await supabaseAiRecommendation
    .from("v40_ai_recommendation_items")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
