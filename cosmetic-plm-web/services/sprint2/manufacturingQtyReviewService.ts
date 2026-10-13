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

// "제조 목록"에 담긴 처방 1건 - 처방 정보 + 그 처방의 목표 제조량(kg). 여러 처방을 한 목록에 담아
// 원료를 합산할 수 있도록 단일 처방이 아니라 배열(formulas)로 시트를 구성한다.
export type ManufacturingListFormula = {
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  target_qty_kg: number;
};

export type ManufacturingQtyReviewSheet = {
  id?: string;
  formulas: ManufacturingListFormula[];
  shortage_rows: ShortageRow[];
  note?: string;
  created_by?: string;
  created_at?: string;
};

// BOM 라인 중 재고 관리 대상(7개 접두사) 원료만 대상으로, 처방(목표 제조량 포함) 여러 건의 필요량을
// raw_code 기준으로 합산한다. 처방이 1건뿐이면 기존 단일 처방 계산과 동일한 결과가 나온다.
function sumRequiredByRawCode(
  entries: { lines: { raw_code?: string; raw_name?: string; percentage: number | string }[]; target_qty_kg: number }[]
): Map<string, { raw_name: string; required_qty: number }> {
  const requiredByRawCode = new Map<string, { raw_name: string; required_qty: number }>();
  for (const entry of entries) {
    for (const l of entry.lines) {
      if (!isStockManagedRawCode(l.raw_code)) continue;
      const rawCode = l.raw_code!;
      const required_qty = (entry.target_qty_kg * Number(l.percentage || 0)) / 100;
      const existing = requiredByRawCode.get(rawCode);
      requiredByRawCode.set(rawCode, {
        raw_name: existing?.raw_name || l.raw_name || "",
        required_qty: (existing?.required_qty || 0) + required_qty,
      });
    }
  }
  return requiredByRawCode;
}

// 필요량 합산 결과를 현재 재고와 비교해 부족량>0인 원료만 반환한다(제조 목록 전체 기준 합산 부족 원료 목록).
export function calcCombinedShortageRows(
  entries: { lines: { raw_code?: string; raw_name?: string; percentage: number | string }[]; target_qty_kg: number }[],
  latestStock: Map<string, { closing_stock: number }>
): ShortageRow[] {
  const requiredByRawCode = sumRequiredByRawCode(entries);
  const rows: ShortageRow[] = [];
  for (const [raw_code, { raw_name, required_qty }] of requiredByRawCode) {
    const current_stock = latestStock.get(raw_code)?.closing_stock ?? 0;
    const shortage_qty = Math.max(0, required_qty - current_stock);
    if (shortage_qty > 0) {
      rows.push({ raw_code, raw_name, required_qty, current_stock, shortage_qty });
    }
  }
  return rows.sort((a, b) => a.raw_code.localeCompare(b.raw_code));
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

// 저장 이력 - 처방 1건이 아니라 "목록 전체" 단위로 저장되므로 특정 처방 기준 필터 없이 최근 N건을 가져온다.
export async function fetchManufacturingQtyReviewSheets(limit = 50): Promise<ManufacturingQtyReviewSheet[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_manufacturing_qty_review_sheets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ManufacturingQtyReviewSheet[];
}

export async function deleteManufacturingQtyReviewSheet(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_manufacturing_qty_review_sheets").delete().eq("id", id);
  if (error) throw error;
}
