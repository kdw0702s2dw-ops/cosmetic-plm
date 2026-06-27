"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { runSmartFormulaEngine } from "@/services/enterprise-v51/smartFormulaEngineService";
import type { V51ReleaseItem, V51ReleaseStatus } from "@/types/enterpriseV51Release";

async function countRows(table: string, filter?: (query: any) => any) {
  let query = supabaseProductionFinal.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function fetchV51ReleaseFormulas() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function calculateV51ReleaseReadiness(formula: any) {
  const smart = await runSmartFormulaEngine(formula.formula_code, formula.revision);

  const [validation, cost, documents, batches, smartDocs] = await Promise.all([
    countRows("gold_formula_validation_runs", (q) => q.eq("formula_code", formula.formula_code).eq("revision", formula.revision).eq("status", "PASS")),
    countRows("gold_formula_cost_summaries", (q) => q.eq("formula_code", formula.formula_code).eq("revision", formula.revision)),
    countRows("gold_documents", (q) => q.eq("formula_code", formula.formula_code).eq("revision", formula.revision)),
    countRows("gold_manufacturing_batches", (q) => q.eq("formula_code", formula.formula_code).eq("revision", formula.revision)),
    countRows("gold_documents", (q) => q.eq("formula_code", formula.formula_code).eq("revision", formula.revision).ilike("document_type", "SMART%")),
  ]);

  const items: V51ReleaseItem[] = [
    {
      area: "처방 총합",
      status: smart.total_percent === 100 ? "READY" : "BLOCK",
      score: smart.total_percent === 100 ? 100 : 40,
      message: `총합 ${smart.total_percent}%`,
    },
    {
      area: "스마트 처방점수",
      status: smart.formula_score >= 85 ? "READY" : smart.formula_score >= 70 ? "WATCH" : "BLOCK",
      score: smart.formula_score,
      message: `${smart.formula_score}점`,
    },
    {
      area: "처방 검증",
      status: validation > 0 ? "READY" : "WATCH",
      score: validation > 0 ? 100 : 60,
      message: validation > 0 ? "검증 PASS 이력 있음" : "검증 PASS 필요",
    },
    {
      area: "원가 계산",
      status: cost > 0 ? "READY" : "WATCH",
      score: cost > 0 ? 100 : 60,
      message: cost > 0 ? "원가 계산 이력 있음" : "원가 계산 필요",
    },
    {
      area: "문서",
      status: documents >= 5 ? "READY" : documents >= 2 ? "WATCH" : "BLOCK",
      score: Math.min(100, documents * 18),
      message: `문서 ${documents}건`,
    },
    {
      area: "스마트 문서",
      status: smartDocs >= 3 ? "READY" : smartDocs > 0 ? "WATCH" : "BLOCK",
      score: Math.min(100, smartDocs * 25),
      message: `스마트 문서 ${smartDocs}건`,
    },
    {
      area: "Batch",
      status: batches > 0 ? "READY" : "WATCH",
      score: batches > 0 ? 100 : 60,
      message: batches > 0 ? "Batch 생성 완료" : "Batch 생성 필요",
    },
    {
      area: "리스크",
      status: smart.alerts.length === 0 ? "READY" : smart.alerts.length <= 2 ? "WATCH" : "BLOCK",
      score: smart.alerts.length === 0 ? 100 : smart.alerts.length <= 2 ? 75 : 40,
      message: smart.alerts.length === 0 ? "중요 리스크 없음" : `리스크 ${smart.alerts.length}건`,
    },
  ];

  const releaseScore = Math.round(items.reduce((sum, x) => sum + x.score, 0) / items.length);
  const status: V51ReleaseStatus =
    items.some((x) => x.status === "BLOCK") ? "BLOCK" : releaseScore >= 90 ? "READY" : "WATCH";

  const payload = {
    formula_code: formula.formula_code,
    revision: formula.revision,
    formula_name: formula.formula_name,
    release_score: releaseScore,
    status,
    items,
    smart,
  };

  await supabaseProductionFinal.from("v51_release_readiness_runs").insert({
    formula_code: formula.formula_code,
    revision: formula.revision,
    release_score: releaseScore,
    status,
    result_json: payload,
    created_by: "v5.1 Release Readiness PRO",
  });

  return payload;
}

export async function fetchV51ReleaseHistory(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("v51_release_readiness_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (formulaCode && revision) query = query.eq("formula_code", formulaCode).eq("revision", revision);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
