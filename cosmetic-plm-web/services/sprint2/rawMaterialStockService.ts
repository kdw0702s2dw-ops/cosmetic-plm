"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 재고 관리 대상 원료 "카테고리 코드" (영문 3자리) - raw_code 앞자리 숫자(1, 2, ...)는 신규 벤더/사급
// 계열이 추가될 때마다 바뀌어 왔지만(1ACA -> 2ACA 추가 확인됨), 뒤의 영문 3자리는 고정되어 있다. 그래서
// "숫자 1자리 + 카테고리 3자리" 패턴으로 판정하면, 앞으로 3ACA/2BSA 같은 새 자리수가 추가돼도 코드 수정
// 없이 자동으로 재고관리 대상에 포함된다.
export const STOCK_MANAGED_CATEGORY_CODES = ["ACA", "BSA", "CLA", "FRA", "OLA", "LQA", "WXA"];

const STOCK_MANAGED_PATTERN = new RegExp(`^.(${STOCK_MANAGED_CATEGORY_CODES.join("|")})`);

// 하위 호환/참고용: 실제로 존재가 확인된 접두사 목록 (현재까지 1ACA~1WXA, 2ACA). 판정 로직 자체는 더 이상
// 이 배열을 쓰지 않고 위 STOCK_MANAGED_PATTERN(정규식)을 사용한다 - 새 접두사가 생겨도 이 배열을 고칠
// 필요가 없다.
export const STOCK_MANAGED_PREFIXES = [
  "1ACA", "1BSA", "1CLA", "1FRA", "1OLA", "1LQA", "1WXA", "2ACA",
];

export function isStockManagedRawCode(rawCode: string | null | undefined) {
  if (!rawCode) return false;
  return STOCK_MANAGED_PATTERN.test(rawCode);
}

export type StockManagedRawMaterial = { raw_code: string; raw_name: string };

export type StockLedgerRow = {
  id?: string;
  raw_code: string;
  ledger_date: string; // YYYY-MM-DD
  opening_stock: number;
  incoming_stock: number; // 해당 날짜 입고재고량. 최종재고량 = opening_stock + incoming_stock - usage_today
  usage_today: number;
  closing_stock: number;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

// 재고 관리 대상 원료 목록 (원료명 표시용) - 카테고리 코드 OR 조건. "_"는 PostgREST ilike에서 "글자 1개"
// 와일드카드라서 앞자리 숫자가 몇이든("1ACA...", "2ACA..." 등) 모두 매칭된다 - isStockManagedRawCode와
// 동일한 "숫자 1자리 + 카테고리 3자리" 판정을 DB 쿼리 쪽에서도 똑같이 적용.
export async function fetchStockManagedRawMaterials(): Promise<StockManagedRawMaterial[]> {
  const orFilter = STOCK_MANAGED_CATEGORY_CODES.map((c) => `raw_code.ilike._${c}%`).join(",");
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_materials")
    .select("raw_code, raw_name")
    .eq("is_active", true)
    .or(orFilter)
    .order("raw_code", { ascending: true });
  if (error) throw error;
  return (data || []) as StockManagedRawMaterial[];
}

// 선택한 날짜의 원장 행 조회 (raw_code -> row). 이미 저장된 날짜를 다시 열람/수정할 때 사용.
export async function fetchLedgerForDate(rawCodes: string[], ledgerDate: string): Promise<Map<string, StockLedgerRow>> {
  if (rawCodes.length === 0) return new Map();
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_stock_ledger")
    .select("*")
    .in("raw_code", rawCodes)
    .eq("ledger_date", ledgerDate);
  if (error) throw error;
  return new Map((data || []).map((r: any) => [r.raw_code, r as StockLedgerRow]));
}

// raw_code별 "선택 날짜 이전 가장 최근" 원장 행 조회 (carry-forward 소스, 공백일 있어도 가장 최근 값을 찾음)
export async function fetchLatestLedgerBefore(rawCodes: string[], beforeDate: string): Promise<Map<string, StockLedgerRow>> {
  if (rawCodes.length === 0) return new Map();
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_stock_ledger")
    .select("*")
    .in("raw_code", rawCodes)
    .lt("ledger_date", beforeDate)
    .order("ledger_date", { ascending: false });
  if (error) throw error;
  const map = new Map<string, StockLedgerRow>();
  for (const row of (data || []) as StockLedgerRow[]) {
    if (!map.has(row.raw_code)) map.set(row.raw_code, row); // 최신 날짜 우선 정렬이라 처음 만난 행이 최신
  }
  return map;
}

// "사용량 통계"용: 원료 1개의 전체 원장 이력(날짜 오름차순) 조회 - 일별/월별/년별 집계는 호출 측(훅)에서 계산한다.
export async function fetchLedgerHistory(rawCode: string): Promise<StockLedgerRow[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_stock_ledger")
    .select("*")
    .eq("raw_code", rawCode)
    .order("ledger_date", { ascending: true });
  if (error) throw error;
  return (data || []) as StockLedgerRow[];
}

// "제조량 검토"용: raw_code별 가장 최근(날짜 무관) closing_stock 조회
export async function fetchLatestStockByRawCodes(rawCodes: string[]): Promise<Map<string, { closing_stock: number; ledger_date: string }>> {
  if (rawCodes.length === 0) return new Map();
  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_stock_ledger")
    .select("raw_code, ledger_date, closing_stock")
    .in("raw_code", rawCodes)
    .order("ledger_date", { ascending: false });
  if (error) throw error;
  const map = new Map<string, { closing_stock: number; ledger_date: string }>();
  for (const row of (data || []) as any[]) {
    if (!map.has(row.raw_code)) map.set(row.raw_code, { closing_stock: Number(row.closing_stock), ledger_date: row.ledger_date });
  }
  return map;
}

// "사용량 TOP 랭킹"용: 지정 기간(from~to, 양 끝 포함) 동안 raw_code별 금일사용량 합계. 기존
// fetchLedgerHistory는 원료 1개 전용이라 전체 원료를 한 번에 집계할 수 없어 별도로 둔다 - 필요한
// 컬럼(raw_code, usage_today)만 받아와 클라이언트에서 합산한다.
// 원장은 날짜마다 대상 원료 전체(130여 행)를 저장하므로 한 달만 돼도 Supabase 1회 조회 상한(1000행)을
// 넘는다 - 상한을 넘으면 에러 없이 잘려서 순위가 틀어지므로, 사용량 0인 행은 서버에서 거르고
// (raw_code, ledger_date) 순으로 정렬해 1000행씩 끝까지 나눠 받는다.
const USAGE_RANGE_PAGE_SIZE = 1000;

export async function fetchUsageForRange(dateFrom: string, dateTo: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (let offset = 0; ; offset += USAGE_RANGE_PAGE_SIZE) {
    const { data, error } = await supabaseProductionFinal
      .from("plm_raw_material_stock_ledger")
      .select("raw_code, usage_today")
      .gte("ledger_date", dateFrom)
      .lte("ledger_date", dateTo)
      .gt("usage_today", 0)
      .order("raw_code")
      .order("ledger_date")
      .range(offset, offset + USAGE_RANGE_PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data || []) as { raw_code: string; usage_today: number }[];
    for (const row of page) {
      const prev = map.get(row.raw_code) || 0;
      map.set(row.raw_code, prev + Number(row.usage_today || 0));
    }
    if (page.length < USAGE_RANGE_PAGE_SIZE) break;
  }
  return map;
}

// 화면에 표시된 대상 원료 전체를 해당 날짜로 batch upsert.
// opening_stock은 항상 호출 측(훅)이 이미 확정한 값을 그대로 저장한다 - 기존에 저장된 날짜를 수정하는
// 경우엔 원래 저장돼있던 opening_stock을, 새 날짜를 처음 저장하는 경우엔 carry-forward로 계산한
// 값(혹은 최초 등록 baseline)을 그대로 넘겨받아 고정한다 (저장 시점 freeze 방식).
export async function saveLedgerRows(rows: StockLedgerRow[]) {
  if (rows.length === 0) return;
  const payload = rows.map((r) => ({
    raw_code: r.raw_code,
    ledger_date: r.ledger_date,
    opening_stock: r.opening_stock,
    incoming_stock: r.incoming_stock,
    usage_today: r.usage_today,
    closing_stock: r.closing_stock,
    note: r.note ?? null,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabaseProductionFinal
    .from("plm_raw_material_stock_ledger")
    .upsert(payload, { onConflict: "raw_code,ledger_date" });
  if (error) throw error;
}
