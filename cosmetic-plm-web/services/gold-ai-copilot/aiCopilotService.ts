"use client";

import { supabaseAiCopilot } from "@/lib/supabaseAiCopilotClient";
import { runAiCopilotRuleEngine } from "./aiCopilotRuleEngine";
import type { AiCopilotCommandType, AiCopilotRun } from "@/types/goldAiCopilot";

export async function fetchAiCopilotFormulas(search = "") {
  let query = supabaseAiCopilot.from("gold_formula_summary").select("*").order("formula_code", { ascending: true }).limit(100);
  if (search.trim()) {
    const k = search.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchAiContext(formulaCode: string, revision: string) {
  const [validation, cost, score, stability, regulation, documents] = await Promise.all([
    supabaseAiCopilot.from("gold_formula_validation_runs").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAiCopilot.from("gold_formula_cost_summaries").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseAiCopilot.from("gold_formula_scores").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseAiCopilot.from("gold_formula_stability_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseAiCopilot.from("gold_formula_regulation_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseAiCopilot.from("gold_documents").select("*").eq("formula_code", formulaCode).eq("revision", revision),
  ]);
  for (const res of [validation, cost, score, stability, regulation, documents]) if (res.error) throw res.error;
  return { validation: validation.data, cost: cost.data, score: score.data, stability: stability.data || [], regulation: regulation.data || [], documents: documents.data || [] };
}

export async function runAndSaveAiCopilot(input: { formulaCode: string; revision: string; commandType: AiCopilotCommandType; prompt: string }) {
  const context = await fetchAiContext(input.formulaCode, input.revision);
  const runCode = `AI-${input.formulaCode}-${input.revision}-${Date.now()}`;
  const engine = runAiCopilotRuleEngine({ runCode, formulaCode: input.formulaCode, revision: input.revision, commandType: input.commandType, prompt: input.prompt, ...context });

  const run: AiCopilotRun = {
    run_code: runCode,
    formula_code: input.formulaCode,
    revision: input.revision,
    command_type: input.commandType,
    user_prompt: input.prompt,
    status: engine.status as any,
    result_json: engine.result,
    created_by: "R&D",
  };

  const { data, error } = await supabaseAiCopilot.from("gold_ai_copilot_runs").insert(run).select().single();
  if (error) throw error;

  if (engine.actions.length > 0) {
    const { error: actionError } = await supabaseAiCopilot.from("gold_ai_copilot_actions").insert(engine.actions);
    if (actionError) throw actionError;
  }
  return { run: data, actions: engine.actions };
}

export async function fetchAiRuns(formulaCode: string, revision: string) {
  const { data, error } = await supabaseAiCopilot.from("gold_ai_copilot_runs").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return data || [];
}

export async function fetchAiActions(runCode: string) {
  const { data, error } = await supabaseAiCopilot.from("gold_ai_copilot_actions").select("*").eq("run_code", runCode).order("priority", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateAiActionStatus(id: string, status: "OPEN" | "DONE" | "HOLD") {
  const { error } = await supabaseAiCopilot.from("gold_ai_copilot_actions").update({ status }).eq("id", id);
  if (error) throw error;
}
