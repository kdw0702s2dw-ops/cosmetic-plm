"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export async function fetchExecutiveKpi() {
  const [
    formulas,
    rawMaterials,
    documents,
    batches,
    samples,
    aiRuns,
    openActions,
    scores,
  ] = await Promise.all([
    supabaseProductionFinal.from("gold_formula_headers").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("enterprise_raw_material_master").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("gold_documents").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("gold_manufacturing_batches").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("gold_sample_requests").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("gold_ai_copilot_runs").select("*", { count: "exact", head: true }),
    supabaseProductionFinal.from("gold_ai_copilot_actions").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
    supabaseProductionFinal.from("gold_formula_scores").select("*").gte("overall_score", 90),
  ]);

  for (const res of [formulas, rawMaterials, documents, batches, samples, aiRuns, openActions, scores]) {
    if (res.error) throw res.error;
  }

  return {
    formulas: formulas.count || 0,
    raw_materials: rawMaterials.count || 0,
    documents: documents.count || 0,
    batches: batches.count || 0,
    samples: samples.count || 0,
    ai_runs: aiRuns.count || 0,
    open_actions: openActions.count || 0,
    release_ready: scores.data?.length || 0,
  };
}

export async function fetchFinalModulesHealth() {
  const tables = [
    ["Raw Material", "enterprise_raw_material_master"],
    ["Formula", "gold_formula_headers"],
    ["Validation", "gold_formula_validation_runs"],
    ["Cost", "gold_formula_cost_summaries"],
    ["Intelligence", "gold_formula_scores"],
    ["Documents", "gold_documents"],
    ["AI Copilot", "gold_ai_copilot_runs"],
    ["Manufacturing", "gold_manufacturing_batches"],
    ["Samples", "gold_sample_requests"],
    ["Release", "gold_release_checklists"],
  ];

  const rows = [];
  for (const [module, table] of tables) {
    const { count, error } = await supabaseProductionFinal.from(table).select("*", { count: "exact", head: true });
    rows.push({ module, table, count: count || 0, status: error ? "BLOCK" : (count || 0) > 0 ? "PASS" : "WATCH", message: error?.message || "OK" });
  }
  return rows;
}
