"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 칭량_원료재고 > "오늘 제조한 처방으로 금일사용량 자동 반영" 기능 사용 중 생기는 두 가지 이력을 기록한다.
// 여러 사람이 같은 날짜에 각자 처방을 불러와서 반영/수정할 수 있어서, 누가 언제 어떤 처방을 얼마나
// 반영했는지(apply_formula), 그리고 이미 저장된 금일사용량이 나중에 고쳐졌을 때 이전값/이후값이
// 무엇이었는지(manual_edit) 확인할 수 있어야 한다는 요청사항 대응. 사람이 직접 입력하는 화면은 없고
// useRawMaterialStockCheck 훅이 반영/저장 시점에 자동으로 기록한다.
export type UsageLogEventType = "apply_formula" | "manual_edit";

export type UsageLogRow = {
  id?: string;
  raw_code: string;
  ledger_date: string; // YYYY-MM-DD
  event_type: UsageLogEventType;
  formula_code?: string | null;
  formula_revision?: string | null;
  formula_name?: string | null;
  confirmed_code?: string | null;
  target_qty_kg?: number | null;
  applied_usage?: number | null;
  old_usage_today?: number | null;
  new_usage_today?: number | null;
  created_by?: string | null;
  created_at?: string;
};

export type ApplyFormulaLogInput = {
  raw_code: string;
  ledger_date: string;
  formula_code: string;
  formula_revision: string;
  formula_name?: string;
  confirmed_code?: string | null;
  target_qty_kg: number;
  applied_usage: number;
  created_by?: string | null;
};

export type ManualEditLogInput = {
  raw_code: string;
  ledger_date: string;
  old_usage_today: number;
  new_usage_today: number;
  created_by?: string | null;
};

export async function logFormulaApplyEvents(entries: ApplyFormulaLogInput[]): Promise<void> {
  if (entries.length === 0) return;
  const payload = entries.map((e) => ({ ...e, event_type: "apply_formula" as const }));
  const { error } = await supabaseProductionFinal.from("plm_raw_material_usage_log").insert(payload);
  if (error) throw error;
}

export async function logManualEditEvents(entries: ManualEditLogInput[]): Promise<void> {
  if (entries.length === 0) return;
  const payload = entries.map((e) => ({ ...e, event_type: "manual_edit" as const }));
  const { error } = await supabaseProductionFinal.from("plm_raw_material_usage_log").insert(payload);
  if (error) throw error;
}

export type UsageLogFilter = {
  dateFrom: string;
  dateTo: string;
  keyword?: string; // 원료코드/처방코드/처방명/확정코드
};

// "일자별/주별 이력 확인" 요청사항 대응 - 날짜 범위로 조회하고, 화면에서 원료코드·처방명 등으로
// 다시 한 번 걸러낼 수 있도록 키워드 필터는 클라이언트 쪽에서 적용한다(건수가 많지 않은 로그라
// 날짜 범위 조회 후 필터링해도 충분).
export async function fetchUsageLog(filter: UsageLogFilter): Promise<UsageLogRow[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_usage_log")
    .select("*")
    .gte("ledger_date", filter.dateFrom)
    .lte("ledger_date", filter.dateTo)
    .order("ledger_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  let rows = (data || []) as UsageLogRow[];
  const k = filter.keyword?.trim().toLowerCase();
  if (k) {
    rows = rows.filter(
      (r) =>
        r.raw_code.toLowerCase().includes(k) ||
        (r.formula_code || "").toLowerCase().includes(k) ||
        (r.formula_name || "").toLowerCase().includes(k) ||
        (r.confirmed_code || "").toLowerCase().includes(k)
    );
  }
  return rows;
}
