"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 사용량 이력 화면(생산관리 > 사용량 이력) > "처방 반영 요약" 아래에 두는 자유 비고. 특정 반영
// 건(날짜+처방)에 종속되지 않는, 생산 특이사항 등을 적어두는 용도라 날짜 범위 필터와 무관하게
// 최근 작성순으로 전체를 보여준다. 연구원 홈 "시스템 업데이트"(SystemUpdatesSection)와 비슷한
// 형태지만, 그쪽은 등록 후 일정 기간이 지나면 자동으로 사라지는 공지용인 반면 이 비고는 생산
// 기록의 일부라 만료 없이 계속 남는다.
export type UsageNote = {
  id: string;
  note: string;
  created_by?: string | null;
  created_at: string;
};

const FETCH_LIMIT = 50;

export async function fetchUsageNotes(): Promise<UsageNote[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_usage_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FETCH_LIMIT);
  if (error) throw error;
  return (data || []) as UsageNote[];
}

export async function addUsageNote(note: string, createdBy?: string | null): Promise<void> {
  const { error } = await supabaseProductionFinal
    .from("plm_raw_material_usage_notes")
    .insert({ note, created_by: createdBy || null });
  if (error) throw error;
}

export async function deleteUsageNote(id: string): Promise<void> {
  const { error } = await supabaseProductionFinal.from("plm_raw_material_usage_notes").delete().eq("id", id);
  if (error) throw error;
}
