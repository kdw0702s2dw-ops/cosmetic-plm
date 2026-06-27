"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { GoldMasterCheckItem, GoldMasterSummary } from "@/types/enterpriseV51GoldMaster";

async function safeCount(table: string, filter?: (query: any) => any) {
  let query = supabaseProductionFinal.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return { count: 0, error: error.message };
  return { count: count || 0, error: null };
}

export async function fetchGoldMasterCompletion(): Promise<GoldMasterSummary> {
  const [
    formulas,
    lines,
    raws,
    docs,
    batches,
    smartRuns,
    releaseRuns,
    markers,
    activities,
  ] = await Promise.all([
    safeCount("gold_formula_headers"),
    safeCount("gold_formula_lines"),
    safeCount("enterprise_raw_material_master"),
    safeCount("gold_documents"),
    safeCount("gold_manufacturing_batches"),
    safeCount("v51_smart_formula_runs"),
    safeCount("v51_release_readiness_runs"),
    safeCount("enterprise_release_markers"),
    safeCount("enterprise_activity_events"),
  ]);

  const items: GoldMasterCheckItem[] = [
    check("처방 기본 데이터", formulas.count, 1, "처방 Header 데이터"),
    check("처방 원료 데이터", lines.count, 1, "처방 Line 데이터"),
    check("원료 마스터", raws.count, 100, "원료 Master 데이터"),
    check("문서관리", docs.count, 1, "생성 문서 데이터"),
    check("제조관리", batches.count, 1, "Batch 데이터"),
    check("스마트 처방엔진", smartRuns.count, 1, "Smart Formula 계산 이력"),
    check("출시 준비도", releaseRuns.count, 1, "Go/No-Go 계산 이력"),
    check("릴리즈 기록", markers.count, 10, "패키지 적용 이력"),
    check("활동 이력", activities.count, 1, "시스템/작업 이력"),
  ];

  const overall_score = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
  const overall_status =
    items.some((item) => item.status === "미완료") ? "미완료" :
    items.some((item) => item.status === "확인필요") ? "확인필요" :
    "완료";

  return { overall_score, overall_status, items };
}

function check(area: string, count: number, minimum: number, label: string): GoldMasterCheckItem {
  if (count >= minimum) {
    return { area, status: "완료", score: 100, message: `${label} ${count.toLocaleString()}건 확인` };
  }
  if (count > 0) {
    return { area, status: "확인필요", score: 70, message: `${label} ${count.toLocaleString()}건입니다. 추가 데이터 권장` };
  }
  return { area, status: "미완료", score: 30, message: `${label}가 없습니다. 테스트 데이터 생성 또는 기능 실행 필요` };
}

export async function createGoldMasterSnapshot(summary: GoldMasterSummary) {
  const eventCode = `GOLD-MASTER-${Date.now().toString().slice(-8)}`;

  const { error } = await supabaseProductionFinal
    .from("enterprise_activity_events")
    .insert({
      event_code: eventCode,
      area: "Gold Master",
      action: "COMPLETION_CHECK",
      title: `v5.1 GOLD MASTER 완성도 점검: ${summary.overall_status}`,
      description: `종합점수 ${summary.overall_score}점`,
      href: "/enterprise-v5/gold-master",
      created_by: "v5.1 GOLD MASTER",
    });

  if (error) throw error;
  return eventCode;
}
