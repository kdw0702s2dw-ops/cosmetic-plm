"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { FormulaWorkspaceDocType } from "@/types/enterpriseV50Workspace";

export async function runV50Validation(formulaCode: string, revision: string) {
  const { data: lines, error: lineError } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (lineError) throw lineError;

  const total = Number((lines || []).reduce((sum: number, x: any) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const issueCount = total === 100 ? 0 : 1;

  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_validation_runs")
    .insert({
      formula_code: formulaCode,
      revision,
      status: issueCount === 0 ? "PASS" : "FAIL",
      issue_count: issueCount,
      blocker_count: issueCount,
      result_json: {
        total_percent: total,
        message: issueCount === 0 ? "처방 총합이 100%입니다." : `처방 총합이 ${total}%입니다. 100%로 보정이 필요합니다.`,
      },
      created_by: "v5.0 Formula Workspace",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function runV50Cost(formulaCode: string, revision: string, targetCost = 2500) {
  const { data: lines, error: lineError } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (lineError) throw lineError;

  let totalCost = 0;
  for (const line of lines || []) {
    const { data: raw } = await supabaseProductionFinal
      .from("enterprise_raw_material_master")
      .select("unit_price")
      .eq("raw_code", line.raw_code)
      .maybeSingle();
    totalCost += Number(line.percentage || 0) / 100 * Number(raw?.unit_price || 0);
  }

  const costPerKg = Math.round(totalCost);
  const status = costPerKg === 0 ? "NO_PRICE" : costPerKg > targetCost ? "OVER_TARGET" : "PASS";

  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_cost_summaries")
    .upsert({
      formula_code: formulaCode,
      revision,
      target_cost_per_kg: targetCost,
      cost_per_kg: costPerKg,
      difference: costPerKg - targetCost,
      status,
      result_json: { message: status === "PASS" ? "목표 원가 이내입니다." : "원가 확인이 필요합니다." },
    }, { onConflict: "formula_code,revision" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function runV50Score(formulaCode: string, revision: string) {
  const [validation, cost, docs] = await Promise.all([
    supabaseProductionFinal.from("gold_formula_validation_runs").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseProductionFinal.from("gold_formula_cost_summaries").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseProductionFinal.from("gold_documents").select("*", { count: "exact", head: true }).eq("formula_code", formulaCode).eq("revision", revision),
  ]);

  const validationScore = validation.data?.status === "PASS" ? 35 : 15;
  const costScore = cost.data?.status === "PASS" ? 30 : cost.data?.status === "OVER_TARGET" ? 15 : 10;
  const docScore = Math.min(25, (docs.count || 0) * 5);
  const overall = validationScore + costScore + docScore + 10;

  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_scores")
    .upsert({
      formula_code: formulaCode,
      revision,
      overall_score: overall,
      status: overall >= 90 ? "READY" : overall >= 70 ? "WATCH" : "BLOCK",
      score_json: { validation_score: validationScore, cost_score: costScore, document_score: docScore },
    }, { onConflict: "formula_code,revision" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createV50Document(formulaCode: string, revision: string, documentType: FormulaWorkspaceDocType) {
  const documentCode = `DOC-${documentType}-${Date.now().toString().slice(-6)}`;
  const titleMap: Record<FormulaWorkspaceDocType, string> = {
    FORMULA_SHEET: "처방서",
    FULL_INGREDIENT_LIST: "전성분표",
    INGREDIENT_COMPOSITION: "원료조성표",
    PRODUCT_SPEC: "제품규격서",
    COA: "COA",
    MANUFACTURING_ORDER: "제조지시서",
  };

  const { data, error } = await supabaseProductionFinal
    .from("gold_documents")
    .insert({
      document_code: documentCode,
      formula_code: formulaCode,
      revision,
      document_type: documentType,
      title: titleMap[documentType],
      status: "GENERATED",
      payload_json: { generated_by: "v5.0 Formula Workspace", generated_at: new Date().toISOString() },
      created_by: "R&D",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createV50DocumentPackage(formulaCode: string, revision: string) {
  const types: FormulaWorkspaceDocType[] = ["FORMULA_SHEET","FULL_INGREDIENT_LIST","INGREDIENT_COMPOSITION","PRODUCT_SPEC","COA","MANUFACTURING_ORDER"];
  const created = [];
  for (const type of types) created.push(await createV50Document(formulaCode, revision, type));
  return created;
}

export async function fetchV50WorkspaceStatus(formulaCode: string, revision: string) {
  const [validation, cost, score, docs] = await Promise.all([
    supabaseProductionFinal.from("gold_formula_validation_runs").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseProductionFinal.from("gold_formula_cost_summaries").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseProductionFinal.from("gold_formula_scores").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseProductionFinal.from("gold_documents").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }),
  ]);
  for (const res of [validation, cost, score, docs]) if (res.error) throw res.error;
  return { validation: validation.data, cost: cost.data, score: score.data, documents: docs.data || [] };
}
