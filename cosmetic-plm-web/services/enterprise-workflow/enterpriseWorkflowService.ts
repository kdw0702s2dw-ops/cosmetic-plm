"use client";

import { supabaseEnterpriseUx } from "@/lib/supabaseEnterpriseUxClient";
import type { WorkflowStep, WorkflowSummary } from "@/types/enterpriseWorkflow";

async function countTable(table: string, filter?: (query: any) => any) {
  let query = supabaseEnterpriseUx.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function fetchWorkflowSummary(): Promise<WorkflowSummary> {
  const [
    formula_count,
    validation_count,
    cost_count,
    intelligence_count,
    document_count,
    release_ready_count,
    batch_count,
    ai_run_count,
  ] = await Promise.all([
    countTable("gold_formula_headers"),
    countTable("gold_formula_validation_runs"),
    countTable("gold_formula_cost_summaries"),
    countTable("gold_formula_scores"),
    countTable("gold_documents"),
    countTable("gold_formula_scores", (q) => q.gte("overall_score", 90)),
    countTable("gold_manufacturing_batches"),
    countTable("v40_ai_autopilot_runs"),
  ]);

  return {
    formula_count,
    validation_count,
    cost_count,
    intelligence_count,
    document_count,
    release_ready_count,
    batch_count,
    ai_run_count,
  };
}

export function buildWorkflowSteps(summary: WorkflowSummary): WorkflowStep[] {
  return [
    {
      step_no: 1,
      step_key: "AI_AUTOPILOT",
      title: "AI 처방 생성",
      description: "자연어 요청으로 신규 처방을 만들고 Gold Formula로 등록합니다.",
      href: "/enterprise-ai-autopilot",
      status: summary.ai_run_count > 0 ? "DONE" : "READY",
      count: summary.ai_run_count,
      action_label: "AI Autopilot 열기",
    },
    {
      step_no: 2,
      step_key: "FORMULA",
      title: "처방 작성/수정",
      description: "Formula Header와 Line을 수정하고 처방을 정리합니다.",
      href: "/enterprise-gold-formula-live",
      status: summary.formula_count > 0 ? "IN_PROGRESS" : "READY",
      count: summary.formula_count,
      action_label: "Formula 열기",
    },
    {
      step_no: 3,
      step_key: "VALIDATION",
      title: "처방 검증",
      description: "총합 100%, 중복 원료, INCI 누락, 문서 상태를 검증합니다.",
      href: "/enterprise-gold-formula-validation",
      status: summary.validation_count > 0 ? "DONE" : "WATCH",
      count: summary.validation_count,
      action_label: "Validation 실행",
    },
    {
      step_no: 4,
      step_key: "COST",
      title: "원가 계산",
      description: "kg당 원가, 제조 규모별 원가, 목표 원가 차이를 계산합니다.",
      href: "/enterprise-gold-formula-cost",
      status: summary.cost_count > 0 ? "DONE" : "WATCH",
      count: summary.cost_count,
      action_label: "Cost Engine 실행",
    },
    {
      step_no: 5,
      step_key: "INTELLIGENCE",
      title: "Intelligence 평가",
      description: "안정성, 규제, 문서, 원가를 통합해 Formula Score를 산출합니다.",
      href: "/enterprise-gold-intelligence",
      status: summary.intelligence_count > 0 ? "DONE" : "WATCH",
      count: summary.intelligence_count,
      action_label: "Intelligence 실행",
    },
    {
      step_no: 6,
      step_key: "DOCUMENT",
      title: "문서 생성",
      description: "Formula Sheet, 전성분, Spec, COA, BOM, 제조지시서를 생성합니다.",
      href: "/enterprise-gold-documents",
      status: summary.document_count > 0 ? "DONE" : "WATCH",
      count: summary.document_count,
      action_label: "Documents 열기",
    },
    {
      step_no: 7,
      step_key: "RELEASE",
      title: "Release 검토",
      description: "출시 후보와 Go-Live 체크리스트를 확인합니다.",
      href: "/enterprise-gold-release",
      status: summary.release_ready_count > 0 ? "READY" : "WATCH",
      count: summary.release_ready_count,
      action_label: "Release Center 열기",
    },
    {
      step_no: 8,
      step_key: "MANUFACTURING",
      title: "제조 Batch 생성",
      description: "Release 이후 Batch, 원료소요량, 제조단계를 생성합니다.",
      href: "/enterprise-gold-manufacturing",
      status: summary.batch_count > 0 ? "IN_PROGRESS" : "READY",
      count: summary.batch_count,
      action_label: "Manufacturing 열기",
    },
  ];
}
