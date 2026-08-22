"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 연구원 홈 "원료 소싱 및 바이어 요청사항 일정 관리" 전용 - 개발 착수 전 원료 소싱 진행 상황을
// 처방 단위로 4단계 칸반(소싱 요청 → 입고 대기 → 바이어 논의 중 → 견본 준비 중)으로 추적한다.
// 상태 키(REQUESTED/QUOTE_WAIT/ARRIVAL_WAIT/SENT)는 기존 DB 값을 그대로 유지하고 화면에 보이는
// 라벨만 바꾼 것 - 마지막 단계(SENT)가 되어도 완전히 사라지지 않고 마지막 칼럼에 최근 항목 위주로 남는다
// (화면에서는 최신순으로 일부만 노출 - fetchSourcingBoardItems의 limit/슬라이스로 처리).
export const SOURCING_STATUSES = [
  { key: "REQUESTED", label: "소싱 요청" },
  { key: "QUOTE_WAIT", label: "입고 대기" },
  { key: "ARRIVAL_WAIT", label: "바이어 논의 중" },
  { key: "SENT", label: "견본 준비 중" },
] as const;
export type SourcingStatus = (typeof SOURCING_STATUSES)[number]["key"];

export type SourcingScheduleNote = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  note?: string | null;
  status: SourcingStatus;
  requested_date?: string | null; // YYYY-MM-DD
  expected_arrival_date?: string | null; // YYYY-MM-DD
  assignee?: string | null;
  sample_sent: boolean;
  sample_sent_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

// 예상 입고일이 지났거나(연체) dueSoonDays 이내로 임박했는지 - 발송 완료 건은 항상 false.
export function isDueSoonOrOverdue(item: SourcingScheduleNote, dueSoonDays = 2): boolean {
  if (item.status === "SENT" || !item.expected_arrival_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${item.expected_arrival_date}T00:00:00`);
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
  return diffDays <= dueSoonDays;
}

export function isOverdue(item: SourcingScheduleNote): boolean {
  if (item.status === "SENT" || !item.expected_arrival_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${item.expected_arrival_date}T00:00:00`);
  return target.getTime() < today.getTime();
}

// 처방코드 또는 확정코드로 처방을 찾는다.
export async function searchFormulasByCodeOrConfirmedCode(keyword: string) {
  const k = keyword.trim();
  if (!k) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, formula_name, confirmed_code")
    .eq("is_active", true)
    .or(`formula_code.ilike.%${k}%,confirmed_code.ilike.%${k}%`)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

// 칸반 보드 전체 항목 (최근 수정순, 최대 300건 - SENT 칼럼은 화면에서 상위 N개만 잘라 보여줌)
export async function fetchSourcingBoardItems(): Promise<SourcingScheduleNote[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_sourcing_schedule_notes")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data || []) as SourcingScheduleNote[];
}

// 같은 처방(같은 Revision)에 이미 진행 중인(발송 완료 아닌) 소싱 메모가 있으면 그대로 불러와 수정할 수 있게 한다.
export async function fetchActiveSourcingNoteForFormula(formulaCode: string, revision: string): Promise<SourcingScheduleNote | null> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_sourcing_schedule_notes")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .neq("status", "SENT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SourcingScheduleNote) || null;
}

export async function saveSourcingNote(entry: SourcingScheduleNote) {
  const { id, ...rest } = entry;
  if (id) {
    const { data, error } = await supabaseProductionFinal
      .from("plm_sourcing_schedule_notes")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as SourcingScheduleNote;
  }
  const { data, error } = await supabaseProductionFinal
    .from("plm_sourcing_schedule_notes")
    .insert({ ...rest, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as SourcingScheduleNote;
}

// 칸반 칼럼 이동(상태 변경). SENT로 이동하면 발송 완료 시각을 기록하고, SENT에서 다른 단계로
// 되돌리면(예: 실수로 넘긴 경우) 발송 완료 표시를 함께 해제한다.
export async function updateSourcingStatus(id: string, status: SourcingStatus) {
  const patch: { status: SourcingStatus; updated_at: string; sample_sent: boolean; sample_sent_at: string | null } = {
    status,
    updated_at: new Date().toISOString(),
    sample_sent: status === "SENT",
    sample_sent_at: status === "SENT" ? new Date().toISOString() : null,
  };
  const { error } = await supabaseProductionFinal.from("plm_sourcing_schedule_notes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSourcingNote(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_sourcing_schedule_notes").delete().eq("id", id);
  if (error) throw error;
}
