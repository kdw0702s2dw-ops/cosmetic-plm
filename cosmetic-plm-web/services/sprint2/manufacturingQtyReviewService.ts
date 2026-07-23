"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { isStockManagedRawCode } from "@/services/sprint2/rawMaterialStockService";

export type ShortageRow = {
  raw_code: string;
  raw_name: string;
  required_qty: number;
  current_stock: number;
  shortage_qty: number;
};

export type ManufacturingQtyReviewSheet = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  target_qty_kg: number;
  shortage_rows: ShortageRow[];
  note?: string;
  created_by?: string;
  created_at?: string;
};

// BOM 라인 중 재고 관리 대상(7개 접두사) 원료만 대상으로 필요량/부족량을 계산한다.
// 같은 원료가 여러 Phase/라인에 나뉘어 쓰인 경우 필요량을 raw_code 기준으로 합산한 뒤 재고와 비교한다.
// 필요량 = 목표제조량(kg) * BOM 함량%(/100), 부족량 = max(0, 필요량 - 현재재고량). 부족량>0인 원료만 반환.
export function calcShortageRows(
  lines: { raw_code?: string; raw_name?: string; percentage: number | string }[],
  targetQtyKg: number,
  latestStock: Map<string, { closing_stock: number }>
): ShortageRow[] {
  const requiredByRawCode = new Map<string, { raw_name: string; required_qty: number }>();
  for (const l of lines) {
    if (!isStockManagedRawCode(l.raw_code)) continue;
    const rawCode = l.raw_code!;
    const required_qty = (targetQtyKg * Number(l.percentage || 0)) / 100;
    const existing = requiredByRawCode.get(rawCode);
    requiredByRawCode.set(rawCode, {
      raw_name: existing?.raw_name || l.raw_name || "",
      required_qty: (existing?.required_qty || 0) + required_qty,
    });
  }

  const rows: ShortageRow[] = [];
  for (const [raw_code, { raw_name, required_qty }] of requiredByRawCode) {
    const current_stock = latestStock.get(raw_code)?.closing_stock ?? 0;
    const shortage_qty = Math.max(0, required_qty - current_stock);
    if (shortage_qty > 0) {
      rows.push({ raw_code, raw_name, required_qty, current_stock, shortage_qty });
    }
  }
  return rows;
}

export async function saveManufacturingQtyReviewSheet(sheet: ManufacturingQtyReviewSheet) {
  const { id, ...payload } = sheet;
  const { data, error } = await supabaseProductionFinal
    .from("plm_manufacturing_qty_review_sheets")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as ManufacturingQtyReviewSheet;
}

export async function fetchManufacturingQtyReviewSheets(formulaCode: string, revision: string): Promise<ManufacturingQtyReviewSheet[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_manufacturing_qty_review_sheets")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ManufacturingQtyReviewSheet[];
}

export async function deleteManufacturingQtyReviewSheet(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_manufacturing_qty_review_sheets").delete().eq("id", id);
  if (error) throw error;
}
