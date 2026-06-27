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
    { label: "처방", value: formulas.count, hint: "등록된 처방 수", status: formulas.count > 0 ? "LIVE" : "EMPTY" },
    { label: "원료", value: rawMaterials.count.toLocaleString(), hint: "원료 마스터 데이터", status: rawMaterials.count > 0 ? "LIVE" : "EMPTY" },
    { label: "문서", value: documents.count, hint: "생성된 문서", status: documents.count > 0 ? "LIVE" : "WATCH" },
    { label: "제조", value: batches.count, hint: "제조 Batch", status: batches.count > 0 ? "LIVE" : "WATCH" },
    { label: "샘플", value: samples.count, hint: "샘플 요청", status: samples.count > 0 ? "LIVE" : "WATCH" },
    { label: "AI 실행", value: aiRuns.count, hint: "AI 실행 이력", status: aiRuns.count > 0 ? "LIVE" : "WATCH" },
    { label: "확인 필요", value: openAiActions.count || 0, hint: "열린 AI Action", status: (openAiActions.count || 0) > 0 ? "WATCH" : "LIVE" },
    { label: "출시 가능", value: releaseScores.count || 0, hint: "90점 이상 처방", status: (releaseScores.count || 0) > 0 ? "LIVE" : "WATCH" },
  ];

  const workItems: UxWorkItem[] = [
    { title: "AI로 신규 처방 만들기", area: "AI 연구", status: "준비됨", href: "/enterprise-ai-autopilot", priority: "P0" },
    { title: "처방 검증 실행하기", area: "처방 검증", status: validations.count > 0 ? "진행됨" : "준비됨", href: "/enterprise-gold-formula-validation", priority: "P0" },
    { title: "원가 계산하기", area: "원가", status: costRuns.count > 0 ? "진행됨" : "준비됨", href: "/enterprise-gold-formula-cost", priority: "P1" },
    { title: "문서 패키지 만들기", area: "문서", status: documents.count > 0 ? "진행됨" : "준비됨", href: "/enterprise-gold-documents", priority: "P1" },
    { title: "출시 준비도 확인하기", area: "출시", status: "준비됨", href: "/enterprise-launch-readiness", priority: "P1" },
  ];

  const modules: UxModule[] = [
    { title: "대시보드", description: "오늘 할 일과 전체 현황", href: "/enterprise", status: "LIVE", count: 0 },
    { title: "역할별 업무공간", description: "연구/품질/규제/생산/영업/관리자별 화면", href: "/enterprise-role-workspace", status: "LIVE", count: 0 },
    { title: "업무흐름", description: "AI → 처방 → 검증 → 원가 → 문서 → 출시 → 제조", href: "/enterprise-workflow", status: "LIVE", count: formulas.count },
    { title: "출시 준비도", description: "제품별 출시 가능 상태 확인", href: "/enterprise-launch-readiness", status: "LIVE", count: releaseScores.count || 0 },
    { title: "통합검색", description: "처방, 원료, 문서를 한 번에 검색", href: "/enterprise-global-search", status: "LIVE", count: 0 },
    { title: "알림센터", description: "확인 필요한 업무 알림", href: "/enterprise-notifications", status: (openAiActions.count || 0) > 0 ? "WATCH" : "LIVE", count: openAiActions.count || 0 },
    { title: "활동이력", description: "최근 작업과 변경 이력", href: "/enterprise-activity", status: "LIVE", count: 0 },
    { title: "처방관리", description: "처방 작성, 수정, 검증, 원가", href: "/enterprise-gold-formula-live", status: formulas.count > 0 ? "LIVE" : "WATCH", count: formulas.count },
    { title: "AI 도우미", description: "AI 처방 생성과 추천", href: "/enterprise-ai-autopilot", status: "LIVE", count: aiRuns.count },
    { title: "문서관리", description: "처방서, 전성분, Spec, COA, 제조지시서", href: "/enterprise-gold-documents", status: documents.count > 0 ? "LIVE" : "WATCH", count: documents.count },
    { title: "제조관리", description: "Batch, 원료소요량, 제조단계", href: "/enterprise-gold-manufacturing", status: batches.count > 0 ? "LIVE" : "WATCH", count: batches.count },
    { title: "지식DB", description: "INCI, 규제, 상용성, 처방 라이브러리", href: "/enterprise-knowledge-db", status: "LIVE", count: 0 },
    { title: "관리자", description: "전체 KPI와 시스템 점검", href: "/enterprise-gold-command", status: "LIVE", count: 0 },
  ];

  return { kpis, workItems, modules };
}
