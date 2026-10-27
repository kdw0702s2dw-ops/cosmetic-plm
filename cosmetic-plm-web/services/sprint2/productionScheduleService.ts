"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 생산관리 "생산일정관리" 전용 - 처방(제품) 단위로 칭량/제조/도포/타공/포장/출고 6개 공정의 날짜를
// 달력으로 관리한다. 처방 검색은 원료 소싱 일정관리(useSourcingSchedule)와 동일한 함수를 재사용한다.
export { searchFormulasByCodeOrConfirmedCode } from "./sourcingScheduleService";

export const SCHEDULE_TYPES = ["칭량", "제조", "도포", "타공", "포장", "출고"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const SCHEDULE_STATUSES = ["예정", "진행중", "완료", "지연"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

// 유형별 색상 - 달력 점/뱃지/목록 테두리에 일관되게 사용
export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  칭량: "#0891b2",
  제조: "#2563eb",
  도포: "#7c3aed",
  타공: "#d97706",
  포장: "#16a34a",
  출고: "#db2777",
};

export type ProductionSchedule = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string | null;
  confirmed_code?: string | null;
  // 처방 컨펌 후 확정된 제품명(plm_formulas.product_name) - DB(plm_production_schedules)에는 저장되지
  // 않고, 조회할 때마다 attachLiveFormulaInfo가 plm_formulas에서 최신값을 가져와 채워 넣는다(아래 참고).
  product_name?: string | null;
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
  return attachLiveFormulaInfo((data || []) as ProductionSchedule[]);
}

// 일정에는 등록 시점의 확정코드 스냅샷만 저장돼 있는데, 처방관리에서 확정코드/제품명(컨펌 후 확정)을
// 일정 등록 "이후"에 입력하거나 수정하면 이미 등록된 일정에는 반영되지 않는 문제가 있다(생산실적관리와
// 동일한 문제 - services/sprint2/productionRecordService.ts의 attachLiveProductNames 참고). 그래서
// 조회할 때마다 plm_formulas에서 해당 처방(formula_code+revision)의 "현재" 확정코드/제품명을 다시
// 가져와 있으면 그 값으로 덮어쓰고, 처방이 이미 삭제됐거나 값이 비어있으면 저장된 스냅샷으로 폴백한다.
async function attachLiveFormulaInfo(items: ProductionSchedule[]): Promise<ProductionSchedule[]> {
  if (items.length === 0) return items;
  const codes = Array.from(new Set(items.map((i) => i.formula_code)));
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, confirmed_code, product_name")
    .in("formula_code", codes);
  if (error || !data) return items; // 보강 조회가 실패해도 기존 스냅샷 표시는 그대로 유지
  const liveMap = new Map<string, { confirmed_code?: string | null; product_name?: string | null }>();
  for (const f of data as { formula_code: string; revision: string; confirmed_code?: string | null; product_name?: string | null }[]) {
    liveMap.set(`${f.formula_code}__${f.revision}`, { confirmed_code: f.confirmed_code, product_name: f.product_name });
  }
  return items.map((item) => {
    const live = liveMap.get(`${item.formula_code}__${item.revision}`);
    if (!live) return item;
    return {
      ...item,
      confirmed_code: live.confirmed_code || item.confirmed_code,
      product_name: live.product_name || item.product_name,
    };
  });
}

// "생산_일정관리 검색" - 이미 등록된 일정을 확정코드/처방코드/처방명/제품명/담당자로 바로 찾아서
// (달력에 표시 중인 달과 무관하게 전체 기간에서) 해당 날짜로 점프하는 데 쓴다. plm_production_schedules에는
// Lot No.가 없다 - Lot No.는 실제 생산이 끝난 뒤 생산실적(plm_production_records)에만 부여되는
// 값이라, 아직 일정 단계인 이 화면에서는 애초에 존재하지 않는다(생산실적 관리 화면에서 찾아야 함).
//
// 일정 테이블에는 "등록 시점" 확정코드/처방명 스냅샷만 있어서, 일정을 먼저 등록해두고 나중에
// 처방관리에서 확정코드를 새로 넣거나 바꾸면 그 새 값으로는 검색되지 않는 문제가 있었다(화면
// 표시는 attachLiveFormulaInfo가 매번 plm_formulas 최신값으로 덮어써서 괜찮아 보였을 뿐). 그래서
// 저장된 스냅샷뿐 아니라 plm_formulas의 "현재" 확정코드/처방코드/처방명/제품명도 먼저 찾아, 거기
// 걸리는 처방의 formula_code로도 같이 검색한다.
export async function searchProductionSchedules(keyword: string): Promise<ProductionSchedule[]> {
  const k = keyword.trim();
  if (!k) return [];

  const { data: liveFormulas, error: liveError } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code")
    .or(`confirmed_code.ilike.%${k}%,formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,product_name.ilike.%${k}%`);
  if (liveError) throw liveError;
  const liveCodes = Array.from(new Set((liveFormulas || []).map((f: { formula_code: string }) => f.formula_code)));

  const orParts = [
    `confirmed_code.ilike.%${k}%`,
    `formula_code.ilike.%${k}%`,
    `formula_name.ilike.%${k}%`,
    `assignee.ilike.%${k}%`,
  ];
  if (liveCodes.length > 0) orParts.push(`formula_code.in.(${liveCodes.join(",")})`);

  const { data, error } = await supabaseProductionFinal
    .from("plm_production_schedules")
    .select("*")
    .or(orParts.join(","))
    .order("schedule_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return attachLiveFormulaInfo((data || []) as ProductionSchedule[]);
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
