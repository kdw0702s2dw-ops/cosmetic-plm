"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 재고 관리 대상 원료 접두사 (7개) - 이 접두사로 시작하는 raw_code만 원료재고 검토/제조량 검토 대상
export const STOCK_MANAGED_PREFIXES = ["1ACA", "1BSA", "1CLA", "1FRA", "1OLA", "1LQA", "1WXA"];

export function isStockManagedRawCode(rawCode: string | null | undefined) {
  if (!rawCode) return false;
  return STOCK_MANAGED_PREFIXES.some((p) => rawCode.startsWith(p));
}

export type StockManagedRawMaterial = { raw_code: string; raw_name: string };

export type StockLedgerRow = {
  id?: string;
  raw_code: string;
  ledger_date: string; // YYYY-MM-DD
  opening_stock: number;
  usage_today: number;
  closing_stock: number;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

// 재고 관리 대상 원료 목록 (원료명 표시용) - 7개 접두사 OR 조건
export async function fetchStockManagedRawMaterials(): Promise<StockManagedRawMaterial[]> {
  const orFilter = STOCK_MANAGED_PREFIXES.map((p) => `raw_code.ilike.${p}%`).join(",");
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
