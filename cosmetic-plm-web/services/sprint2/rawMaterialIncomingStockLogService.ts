"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 칭량_원료재고 화면에서 "입고재고량"을 입력/수정해서 저장할 때마다 남기는 이력. plm_raw_material_stock_ledger는
// (원료, 날짜) 조합당 1행만 upsert로 유지되는 "현재 스냅샷" 테이블이라, 같은 날짜의 입고재고량을 나중에
// 고쳐서 다시 저장하면 이전 값이 사라진다 - "원료재고량 입력 관련 이력을 확인하고 싶다" 요청 대응으로,
// 저장 시점마다 이전값/이후값을 별도로 기록해서 사용량 이력 화면에서 조회할 수 있게 한다.
export type IncomingStockLogRow = {
  id?: string;
  raw_code: string;
  ledger_date: string; // YYYY-MM-DD
  old_incoming_stock: number | null; // 이 날짜에 처음 입력하는 경우 null (비교할 이전 값이 없음)
  new_incoming_stock: number;
  created_by?: string | null;
  created_at?: string;
};

export type IncomingStockLogInput = {
  raw_code: string;
  ledger_date: string;
  old_incoming_stock: number | null;
  new_incoming_stock: number;
  created_by?: string | null;
};

export async function logIncomingStockEvents(entries: IncomingStockLogInput[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabaseProductionFinal.from("plm_raw_material_incoming_stock_log").insert(entries);
  if (error) throw error;
}

export type IncomingStockLogFilter = {
  dateFrom: string;
  dateTo: string;
  keyword?: string; // 원료코드
};

// 사용량 이력(plm_raw_material_usage_log)과 동일하게 날짜 범위로 조회하고, 키워드(원료코드)는
// 클라이언트 쪽에서 한 번 더 걸러낸다(건수가 많지 않은 로그라 날짜 범위 조회 후 필터링해도 충분).
export async function fetchIncomingStockLog(filter: IncomingStockLogFilter): Promise<IncomingStockLogRow[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_incoming_stock_log")
    .select("*")
    .gte("ledger_date", filter.dateFrom)
    .lte("ledger_date", filter.dateTo)
    .order("ledger_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  let rows = (data || []) as IncomingStockLogRow[];
  const k = filter.keyword?.trim().toLowerCase();
  if (k) {
    rows = rows.filter((r) => r.raw_code.toLowerCase().includes(k));
  }
  return rows;
}
