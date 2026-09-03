"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 생산관리 "생산일정관리" 전용 - 처방(제품) 단위로 제조/타공/포장/출고 4개 공정의 날짜를
// 달력으로 관리한다. 처방 검색은 원료 소싱 일정관리(useSourcingSchedule)와 동일한 함수를 재사용한다.
export { searchFormulasByCodeOrConfirmedCode } from "./sourcingScheduleService";

export const SCHEDULE_TYPES = ["제조", "타공", "포장", "출고"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const SCHEDULE_STATUSES = ["예정", "진행중", "완료", "지연"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

// 유형별 색상 - 달력 점/뱃지/목록 테두리에 일관되게 사용
export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  제조: "#2563eb",
  타공: "#d97706",
  포장: "#16a34a",
  출고: "#7c3aed",
};

export type ProductionSchedule = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string | null;
  confirmed_code?: string | null;
  schedule_type: ScheduleType;
  schedule_date: string; // YYYY-MM-DD
  quantity?: number | null;
  assignee?: string | null;
  status: ScheduleStatus;
  memo?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

// 완료가 아닌데 예정일이 지났으면 지연으로 본다 - 상태값을 수동으로 "지연"으로 바꾸지 않았어도
// 화면에서 빨간 뱃지로 즉시 눈에 띄게 하기 위한 보조 판정(저장된 status 값 자체는 건드리지 않음).
export function isScheduleOverdue(item: ProductionSchedule): boolean {
  if (item.status === "완료" || item.status === "지연") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${item.schedule_date}T00:00:00`);
  return target.getTime() < today.getTime();
}

// 달력 범위(from~to, YYYY-MM-DD, inclusive) 내 일정을 모두 가져온다.
export async function fetchProductionSchedules(from: string, to: string): Promise<ProductionSchedule[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_schedules")
    .select("*")
    .gte("schedule_date", from)
    .lte("schedule_date", to)
    .order("schedule_date", { ascending: true });
  if (error) throw error;
  return (data || []) as ProductionSchedule[];
}

export async function saveProductionSchedule(entry: ProductionSchedule): Promise<ProductionSchedule> {
  const { id, ...rest } = entry;
  if (id) {
    const { data, error } = await supabaseProductionFinal
      .from("plm_production_schedules")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ProductionSchedule;
  }
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_schedules")
    .insert({ ...rest, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductionSchedule;
}

export async function updateProductionScheduleStatus(id: string, status: ScheduleStatus) {
  const { error } = await supabaseProductionFinal
    .from("plm_production_schedules")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProductionSchedule(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_production_schedules").delete().eq("id", id);
  if (error) throw error;
}
