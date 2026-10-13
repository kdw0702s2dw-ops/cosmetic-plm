"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { isStockManagedRawCode } from "@/services/sprint2/rawMaterialStockService";
import {
  calcItemAmounts, emptyPurchaseOrder, emptyPurchaseOrderItem,
  type PurchaseOrder, type PurchaseOrderItem,
} from "@/services/sprint2/purchaseOrderService";

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
  // 원료관리에 등록된 공급사(plm_raw_materials.supplier_company_id) - 원료 발주관리와 연동해서 발주
  // 초안을 만들 때, 이 값 기준으로 공급사별 발주로 묶는다("합산 부족 원료 목록을 발주서로 연동" 요청사항).
  // 공급사가 아직 등록 안 된 원료는 undefined/null로 남아 초안 생성 대상에서 제외된다.
  supplier_company_id?: string | null;
  supplier_name?: string | null;
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
  rawMaterialInfo?: Map<string, { unit_price?: number | null; currency?: string; moq?: string; supplier_company_id?: string | null; supplier_name?: string | null }>
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
        supplier_company_id: info?.supplier_company_id ?? null, supplier_name: info?.supplier_name ?? null,
      });
    }
  }
  return rows.sort((a, b) => a.raw_code.localeCompare(b.raw_code));
}

// ---- 원료 발주관리 연동: 합산 부족 원료 목록 -> 공급사별 발주 초안 ----
// "검토 요청"에 따른 설계: 발주(원료 발주관리)는 공급사 1곳 단위라서, 부족 원료 목록에 여러 공급사가
// 섞여 있으면 공급사별로 나눠 초안을 여러 건 만든다. 자동 저장하지 않고 "초안"만 만들어 원료 발주관리의
// 입력 폼에 띄워주며, 사용자가 내용을 확인하고 "발주 저장"을 직접 눌러야 실제로 저장된다. 공급사가
// 원료관리에 아직 등록 안 된 원료는 어느 발주에도 못 묶으므로 unresolved로 따로 모아 안내한다.
export type PurchaseOrderDraftGroup = {
  supplier_company_id: string;
  supplier_name: string;
  order: PurchaseOrder;
};

export type PurchaseOrderDraftUnresolvedRow = {
  raw_code: string;
  raw_name: string;
  shortage_qty: number;
};

export type PurchaseOrderDraftResult = {
  drafts: PurchaseOrderDraftGroup[];
  unresolved: PurchaseOrderDraftUnresolvedRow[];
};

export function buildPurchaseOrderDraftsFromShortage(rows: ShortageRow[]): PurchaseOrderDraftResult {
  const groups = new Map<string, PurchaseOrderDraftGroup>();
  const unresolved: PurchaseOrderDraftUnresolvedRow[] = [];

  for (const r of rows) {
    if (!r.supplier_company_id) {
      unresolved.push({ raw_code: r.raw_code, raw_name: r.raw_name, shortage_qty: r.shortage_qty });
      continue;
    }
    if (!groups.has(r.supplier_company_id)) {
      groups.set(r.supplier_company_id, {
        supplier_company_id: r.supplier_company_id,
        supplier_name: r.supplier_name || "(이름없음)",
        order: { ...emptyPurchaseOrder(), supplier_company_id: r.supplier_company_id, items: [] },
      });
    }
    const group = groups.get(r.supplier_company_id)!;
    // 부족량(kg)을 발주 수량으로 그대로 가져온다 - MOQ는 "20kg/drum" 같은 자유 텍스트라 포장 단위
    // 반올림까지는 자동으로 못 해주므로, 패킹 칸에 참고용으로만 채워주고 수량은 저장 전에 직접 확인/
    // 조정하도록 안내한다(패널의 안내문).
    const quantity = Math.round(r.shortage_qty * 1000) / 1000;
    const unit_price = r.unit_price || 0;
    const item: PurchaseOrderItem = {
      ...emptyPurchaseOrderItem(),
      raw_code: r.raw_code,
      raw_name: r.raw_name,
      unit_price,
      quantity,
      unit: "kg",
      packing: r.moq || "",
      ...calcItemAmounts({ unit_price, quantity, vat_rate: 0.1 }),
      note: "제조량 확인 · 합산 부족 원료 목록에서 생성",
    };
    group.order.items.push(item);
  }

  return { drafts: Array.from(groups.values()), unresolved };
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
