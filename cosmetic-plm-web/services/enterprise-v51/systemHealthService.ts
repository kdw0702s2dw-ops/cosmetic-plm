"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { V51HealthItem, V51HealthSummary, V51HealthStatus } from "@/types/enterpriseV51SystemHealth";

const healthTargets = [
  { area: "처방 기본정보", table: "gold_formula_headers", required: true },
  { area: "처방 원료라인", table: "gold_formula_lines", required: true },
  { area: "원료 마스터", table: "enterprise_raw_material_master", required: true },
  { area: "문서관리", table: "gold_documents", required: true },
  { area: "제조 Batch", table: "gold_manufacturing_batches", required: false },
  { area: "제조 원료소요량", table: "gold_manufacturing_materials", required: false },
  { area: "제조 단계", table: "gold_manufacturing_steps", required: false },
  { area: "스마트 처방 계산", table: "v51_smart_formula_runs", required: true },
  { area: "출시 준비도", table: "v51_release_readiness_runs", required: true },
  { area: "릴리즈 기록", table: "enterprise_release_markers", required: true },
  { area: "알림", table: "enterprise_notifications", required: false },
  { area: "활동 이력", table: "enterprise_activity_events", required: false },
];

async function tableCount(table: string) {
  const { count, error } = await supabaseProductionFinal
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) return { count: 0, error: error.message };
  return { count: count || 0, error: null };
}

export async function fetchV51SystemHealth(): Promise<V51HealthSummary> {
  const items: V51HealthItem[] = [];

  for (const target of healthTargets) {
    const result = await tableCount(target.table);

    let status: V51HealthStatus = "정상";
    let message = `${result.count.toLocaleString()}건 확인`;

    if (result.error) {
      status = target.required ? "오류" : "주의";
      message = `테이블 조회 실패: ${result.error}`;
    } else if (target.required && result.count === 0) {
      status = "주의";
      message = "필수 데이터가 비어 있습니다.";
    } else if (!target.required && result.count === 0) {
      status = "주의";
      message = "아직 생성된 데이터가 없습니다.";
    }

    items.push({
      area: target.area,
      table_name: target.table,
      count: result.count,
      status,
      message,
    });
  }

  const error_count = items.filter((x) => x.status === "오류").length;
  const watch_count = items.filter((x) => x.status === "주의").length;
  const ready_count = items.filter((x) => x.status === "정상").length;
  const overall_status: V51HealthStatus = error_count > 0 ? "오류" : watch_count > 0 ? "주의" : "정상";

  return { overall_status, ready_count, watch_count, error_count, items };
}

export async function fetchV51ReleaseMarkers() {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_release_markers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) throw error;
  return data || [];
}

export async function createV51HealthSnapshot(summary: V51HealthSummary) {
  const eventCode = `HEALTH-${Date.now().toString().slice(-8)}`;

  const { error } = await supabaseProductionFinal
    .from("enterprise_activity_events")
    .insert({
      event_code: eventCode,
      area: "System",
      action: "HEALTH_CHECK",
      title: `v5.1 시스템 점검: ${summary.overall_status}`,
      description: `정상 ${summary.ready_count} / 주의 ${summary.watch_count} / 오류 ${summary.error_count}`,
      href: "/enterprise",
      created_by: "v5.1 System Health",
    });

  if (error) throw error;
  return eventCode;
}
