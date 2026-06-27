"use client";

import { supabaseEnterpriseUx } from "@/lib/supabaseEnterpriseUxClient";
import type { UxKpi, UxModule, UxWorkItem } from "@/types/enterpriseUx";

async function safeCount(table: string) {
  const { count, error } = await supabaseEnterpriseUx
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) return { count: 0, error: error.message };
  return { count: count || 0, error: null };
}

export async function fetchEnterpriseUxDashboard() {
  const [
    formulas,
    rawMaterials,
    documents,
    batches,
    samples,
    aiRuns,
    openAiActions,
    releaseScores,
    validations,
    costRuns,
  ] = await Promise.all([
    safeCount("gold_formula_headers"),
    safeCount("enterprise_raw_material_master"),
    safeCount("gold_documents"),
    safeCount("gold_manufacturing_batches"),
    safeCount("gold_sample_requests"),
    safeCount("gold_ai_copilot_runs"),
    supabaseEnterpriseUx.from("gold_ai_copilot_actions").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
    supabaseEnterpriseUx.from("gold_formula_scores").select("*", { count: "exact", head: true }).gte("overall_score", 90),
    safeCount("gold_formula_validation_runs"),
    safeCount("gold_formula_cost_summaries"),
  ]);

  const kpis: UxKpi[] = [
    { label: "처방", value: formulas.count, hint: "등록된 Gold Formula", status: formulas.count > 0 ? "LIVE" : "EMPTY" },
    { label: "원료", value: rawMaterials.count.toLocaleString(), hint: "원료 마스터", status: rawMaterials.count > 0 ? "LIVE" : "EMPTY" },
    { label: "문서", value: documents.count, hint: "생성 문서", status: documents.count > 0 ? "LIVE" : "WATCH" },
    { label: "제조 Batch", value: batches.count, hint: "제조/파일럿", status: batches.count > 0 ? "LIVE" : "WATCH" },
    { label: "샘플", value: samples.count, hint: "샘플 요청", status: samples.count > 0 ? "LIVE" : "WATCH" },
    { label: "AI 실행", value: aiRuns.count, hint: "AI Copilot / Research", status: aiRuns.count > 0 ? "LIVE" : "WATCH" },
    { label: "AI Action", value: openAiActions.count || 0, hint: "처리 필요", status: (openAiActions.count || 0) > 0 ? "WATCH" : "LIVE" },
    { label: "Launch Ready", value: releaseScores.count || 0, hint: "90점 이상 처방", status: (releaseScores.count || 0) > 0 ? "LIVE" : "WATCH" },
  ];

  const workItems: UxWorkItem[] = [
    { title: "AI Autopilot으로 신규 처방 생성", area: "AI Research", status: "READY", href: "/enterprise-ai-autopilot", priority: "P0" },
    { title: "처방 검증 실행", area: "Formula", status: validations.count > 0 ? "LIVE" : "READY", href: "/enterprise-gold-formula-validation", priority: "P0" },
    { title: "원가 계산 실행", area: "Cost", status: costRuns.count > 0 ? "LIVE" : "READY", href: "/enterprise-gold-formula-cost", priority: "P1" },
    { title: "문서 패키지 생성", area: "Documents", status: documents.count > 0 ? "LIVE" : "READY", href: "/enterprise-gold-documents", priority: "P1" },
    { title: "Release Center 확인", area: "Release", status: "READY", href: "/enterprise-gold-release", priority: "P1" },
  ];

  const modules: UxModule[] = [
    { title: "Dashboard", description: "오늘 할 일과 운영 KPI", href: "/enterprise", status: "LIVE", count: 0 },
    { title: "Projects", description: "프로젝트/고객 개발 과제", href: "/enterprise-gold-release", status: "LIVE", count: formulas.count },
    { title: "Formula", description: "처방 작성, 검증, 원가, Intelligence", href: "/enterprise-gold-formula-live", status: formulas.count > 0 ? "LIVE" : "WATCH", count: formulas.count },
    { title: "Raw Materials", description: "원료/INCI/공급사/문서", href: "/enterprise-db-live", status: rawMaterials.count > 0 ? "LIVE" : "WATCH", count: rawMaterials.count },
    { title: "AI Assistant", description: "AI Research, 추천, Autopilot", href: "/enterprise-ai-autopilot", status: "LIVE", count: aiRuns.count },
    { title: "Documents", description: "처방서, COA, Spec, 제조지시서", href: "/enterprise-gold-documents", status: documents.count > 0 ? "LIVE" : "WATCH", count: documents.count },
    { title: "Quality", description: "검증, QC, 문서 승인", href: "/enterprise-gold-document-workflow", status: "LIVE", count: validations.count },
    { title: "Regulation", description: "국가별 규제와 출시 리스크", href: "/enterprise-gold-intelligence", status: "LIVE", count: 0 },
    { title: "Samples", description: "샘플 요청 및 파일럿", href: "/enterprise-gold-samples", status: samples.count > 0 ? "LIVE" : "WATCH", count: samples.count },
    { title: "Manufacturing", description: "Batch, 원료소요량, 제조단계", href: "/enterprise-gold-manufacturing", status: batches.count > 0 ? "LIVE" : "WATCH", count: batches.count },
    { title: "Knowledge DB", description: "INCI, 규제, 상용성, 처방 라이브러리", href: "/enterprise-knowledge-db", status: "LIVE", count: 0 },
    { title: "Administration", description: "운영 점검 및 Executive Command", href: "/enterprise-gold-command", status: "LIVE", count: 0 },
  ];

  return { kpis, workItems, modules };
}
