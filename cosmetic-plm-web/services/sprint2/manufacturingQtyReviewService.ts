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
  // 원료관리(plm_raw_materials)의 단가/MOQ를 연동해서 함께 보여주고, 발주 금액을 계산한다
  // ("합산 부족 원료 목록에서 단가 MOQ 정보가 연동되서... 발주 금액이랑 총 발주 금액도 계산" 요청사항).
  // 단가 정보가 없는 원료(unit_price 미입력)는 order_amount가 0으로 계산되므로 화면에서 별도로 구분
  // 표시한다. moq는 원료관리에서 자유 텍스트로 관리되는 값이라 "20, 25"처럼 깔끔한 숫자가 아닌 값도
  // 섞여 있을 수 있는데, 실제 데이터를 보면 거의 전부(plm_raw_materials.moq) 단순 숫자(kg)라서
  // 순수 숫자로만 파싱되는 경우에 한해 order_qty/order_amount 계산에 반영한다(parseMoqKg 참고).
  unit_price?: number | null;
  currency?: string;
  moq?: string;
  // 실제 발주해야 할 수량 - 부족량(shortage_qty)이 MOQ보다 적으면 MOQ만큼 발주해야 하므로
  // max(shortage_qty, MOQ 숫자)로 올림한다(요청사항: "부족량이 MOQ보다 적어도 MOQ만큼 발주해야함").
  // MOQ가 순수 숫자로 파싱되지 않으면(자유 텍스트 등) 보수적으로 shortage_qty를 그대로 쓴다.
  order_qty?: number;
  order_amount?: number;
  // 원료관리에 등록된 공급사(plm_raw_materials.supplier_company_id) - 원료 발주관리와 연동해서 발주
  // 초안을 만들 때, 이 값 기준으로 공급사별 발주로 묶는다("합산 부족 원료 목록을 발주서로 연동" 요청사항).
  // 공급사가 아직 등록 안 된 원료는 undefined/null로 남아 초안 생성 대상에서 제외된다.
  supplier_company_id?: string | null;
  supplier_name?: string | null;
};

// MOQ는 원료관리에서 자유 텍스트로 입력받는 칸이라 이론상 "20kg/drum" 같은 복합 표기도 가능하지만,
// 실제 DB 데이터는 거의 전부(plm_raw_materials.moq) 순수 숫자 문자열("20", "0.01" 등)이다. 순수
// 숫자로 깔끔하게 파싱되는 경우에만 발주량 계산에 반영하고, 그 외(쉼표로 여러 값 나열 등 드문 경우)는
// null을 반환해서 기존처럼 부족량 그대로를 쓰게 한다(잘못 해석해서 발주량을 틀리게 만들지 않기 위함).
export function parseMoqKg(moq: string | null | undefined): number | null {
  const trimmed = (moq || "").trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

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
// rawMaterialInfo가 주어지면 원료코드별 단가/통화/MOQ를 함께 싣고, 발주량(부족량과 MOQ 중 큰 값) ×
// 단가로 발주 금액을 계산한다(단가가 없으면 order_amount는 0 - 화면에서 "-"로 표시해 실제 0원과 구분).
// MOQ가 부족량보다 크면 부족량만큼이 아니라 MOQ만큼 발주해야 하므로(검토 요청사항: "부족량이 13kg이고
// MOQ가 20kg이면 20kg 발주해야 하고 발주 금액도 그 기준으로 계산") order_qty를 따로 계산한다.
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
      const moqNum = parseMoqKg(info?.moq);
      const order_qty = moqNum !== null ? Math.max(shortage_qty, moqNum) : shortage_qty;
      const order_amount = Math.round(order_qty * (unit_price || 0) * 100) / 100;
      rows.push({
        raw_code, raw_name, required_qty, current_stock, shortage_qty,
        unit_price, currency: info?.currency, moq: info?.moq, order_qty, order_amount,
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
    // 발주 수량은 부족량이 아니라 order_qty(부족량과 MOQ 숫자 중 큰 값)를 가져온다 - 부족량이 MOQ보다
    // 적어도 그 공급사에서는 MOQ만큼 발주해야 하기 때문(검토 요청사항). order_qty가 없는(구버전 이력
    // 등) 경우에만 보수적으로 shortage_qty로 대체한다. MOQ가 숫자로 안 읽히는 자유 텍스트인 경우는
    // order_qty 계산 단계(calcCombinedShortageRows)에서 이미 shortage_qty로 대체돼 있으므로 여기서는
    // 추가 처리가 필요 없다 - 패킹 칸에는 원문 그대로를 참고용으로 채워주고 저장 전 확인하도록 안내한다.
    const quantity = Math.round((r.order_qty ?? r.shortage_qty) * 1000) / 1000;
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
