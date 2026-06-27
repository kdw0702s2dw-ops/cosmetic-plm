"use client";

import { supabaseAiAutopilot } from "@/lib/supabaseAiAutopilotClient";
import { generateAutopilotFormula } from "./autopilotFormulaGenerator";

async function addStep(runCode: string, stepNo: number, stepKey: string, stepName: string, status: string, message: string, output: any = {}) {
  const { error } = await supabaseAiAutopilot.from("v40_ai_autopilot_steps").insert({
    run_code: runCode,
    step_no: stepNo,
    step_key: stepKey,
    step_name: stepName,
    status,
    message,
    output_json: output,
  });
  if (error) throw error;
}

export async function fetchAutopilotRuns() {
  const { data, error } = await supabaseAiAutopilot
    .from("v40_ai_autopilot_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function fetchAutopilotSteps(runCode: string) {
  const { data, error } = await supabaseAiAutopilot
    .from("v40_ai_autopilot_steps")
    .select("*")
    .eq("run_code", runCode)
    .order("step_no", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function runAiAutopilot(input: {
  title: string;
  requestText: string;
  productType: string;
  claim: string;
  targetCost: number | null;
  targetCountry: string;
}) {
  const runCode = `AUTO-${new Date().toISOString().slice(2,10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const formulaCode = `AUTO-F-${Date.now().toString().slice(-6)}`;
  const revision = "R0";

  const { error: runError } = await supabaseAiAutopilot.from("v40_ai_autopilot_runs").insert({
    run_code: runCode,
    title: input.title,
    request_text: input.requestText,
    target_product_type: input.productType,
    target_claim: input.claim,
    target_cost_per_kg: input.targetCost,
    target_country: input.targetCountry,
    generated_formula_code: formulaCode,
    generated_revision: revision,
    status: "RUNNING",
    result_json: {},
  });
  if (runError) throw runError;

  await addStep(runCode, 1, "GENERATE_FORMULA", "AI 처방 생성", "RUNNING", "AI 처방 생성 시작");
  const lines = generateAutopilotFormula({ formulaCode, revision, productType: input.productType, claim: input.claim, requestText: input.requestText });

  const { error: headerError } = await supabaseAiAutopilot.from("gold_formula_headers").insert({
    formula_code: formulaCode,
    formula_name: input.title,
    revision,
    status: "DRAFT",
    product_type: input.productType,
    customer: "AI Autopilot",
    target_country: input.targetCountry,
    claim: input.claim,
    created_by: "AI Autopilot",
  });
  if (headerError) throw headerError;

  const { error: lineError } = await supabaseAiAutopilot.from("gold_formula_lines").insert(lines);
  if (lineError) throw lineError;
  await addStep(runCode, 1, "GENERATE_FORMULA", "AI 처방 생성", "DONE", `${formulaCode}/${revision} 생성 완료`, { formulaCode, revision, lineCount: lines.length });

  await addStep(runCode, 2, "VALIDATION_PLAN", "검증 계획", "DONE", "Formula Validation Engine에서 검증을 실행하세요.", { nextUrl: "/enterprise-gold-formula-validation" });
  await addStep(runCode, 3, "COST_PLAN", "원가 계획", "DONE", "Formula Cost Engine에서 목표 원가를 입력하고 계산하세요.", { nextUrl: "/enterprise-gold-formula-cost", targetCost: input.targetCost });
  await addStep(runCode, 4, "INTELLIGENCE_PLAN", "Intelligence 계획", "DONE", "Formula Intelligence Center에서 안정성/규제/점수를 실행하세요.", { nextUrl: "/enterprise-gold-intelligence" });
  await addStep(runCode, 5, "DOCUMENT_PLAN", "문서 계획", "DONE", "Document Automation에서 Formula Sheet, Spec, COA를 생성하세요.", { nextUrl: "/enterprise-gold-documents" });
  await addStep(runCode, 6, "MANUFACTURING_PLAN", "제조 계획", "DONE", "Release 후 Manufacturing Batch를 생성하세요.", { nextUrl: "/enterprise-gold-manufacturing" });

  const result = {
    formula_code: formulaCode,
    revision,
    generated_lines: lines.length,
    next_workflow: [
      "/enterprise-gold-formula-validation",
      "/enterprise-gold-formula-cost",
      "/enterprise-gold-intelligence",
      "/enterprise-gold-documents",
      "/enterprise-gold-release",
      "/enterprise-gold-manufacturing",
    ],
  };

  const { error: updateError } = await supabaseAiAutopilot.from("v40_ai_autopilot_runs")
    .update({ status: "COMPLETED", result_json: result })
    .eq("run_code", runCode);
  if (updateError) throw updateError;

  return { runCode, formulaCode, revision };
}
