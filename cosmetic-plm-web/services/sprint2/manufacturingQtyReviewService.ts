"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { isStockManagedRawCode } from "@/services/sprint2/rawMaterialStockService";

export type ShortageRow = {
  raw_code: string;
  raw_name: string;
  required_qty: number;
  current_stock: number;
  shortage_qty: number;
  // 원료관리(plm_raw_materials)의 단가/MOQ를 연동해서 함께 보여주고, 부족량 기준 발주 금액을 계산한다
  // ("합산 부족 원료 목록에서 단가 MOQ 정보가 연동되서... 발주 금액이랑 총 발주 금액도 계산" 요청사항).
  // 단가 정보가 없는 원료(unit_price 미입력)는 order_amount가 0으로 계산되므로 화면에서 별도로 구분
  // 표시한다. moq는 원료관리에서 자유 텍스트("20kg/drum" 등)로 관리되는 값이라 발주 금액 계산(수량
  // 반올림)에는 쓰지 않고, 발주 시 참고할 수 있도록 그대로 노출만 한다.
  unit_price?: number | null;
  currency?: string;
  moq?: string;
  order_amount?: number;
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
// rawMaterialInfo가 주어지면 원료코드별 단가/통화/MOQ를 함께 싣고, 부족량 × 단가로 발주 금액을 계산한다
// (단가가 없으면 order_amount는 0 - 화면에서 "-"로 표시해 실제 0원과 구분).
export function calcCombinedShortageRows(
  entries: { lines: { raw_code?: string; raw_name?: string; percentage: number | string }[]; target_qty_kg: number }[],
  latestStock: Map<string, { closing_stock: number }>,
  rawMaterialInfo?: Map<string, { unit_price?: number | null; currency?: string; moq?: string }>
): ShortageRow[] {
  const requiredByRawCode = sumRequiredByRawCode(entries);
  const rows: ShortageRow[] = [];
  for (const [raw_code, { raw_name, required_qty }] of requiredByRawCode) {
    const current_stock = latestStock.get(raw_code)?.closing_stock ?? 0;
    const shortage_qty = Math.max(0, required_qty - current_stock);
    if (shortage_qty > 0) {
      const info = rawMaterialInfo?.get(raw_code);
      const unit_price = info?.unit_price ?? null;
      const order_amount = Math.round(shortage_qty * (unit_price || 0) * 100) / 100;
      rows.push({
        raw_code, raw_name, required_qty, current_stock, shortage_qty,
        unit_price, currency: info?.currency, moq: info?.moq, order_amount,
      });
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
