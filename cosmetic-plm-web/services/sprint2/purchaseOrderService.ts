"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 원료 발주관리 - 발주(헤더) + 발주 품목(원료별 라인) 서비스.
// DB 구조: supabase/migrations/21_raw_material_purchase_orders.sql, 22_purchase_order_refinements.sql 참고.
// - plm_raw_material_purchase_orders: 발주 헤더(공급사 1곳 단위). order_no는 BEFORE INSERT 트리거
//   (plm_set_purchase_order_no)가 order_date 기준 연월로 자동 채번("PO<YYYYMM>-####", 연월별 1부터
//   시작) - 등록 "시각"이 아니라 사용자가 지정한 발주일 기준이라 발주일을 과거/미래로 입력해도 어긋나지 않음.
// - plm_raw_material_purchase_order_items: 발주 품목(원료별 라인, 단가/수량/패킹은 저장 시점 스냅샷)
// - v_plm_purchase_order_summary: 목록 화면용(공급사명 + 품목 합계 조인)
// - v_plm_purchase_order_items_detail: 상세 화면용(원료명/Trade Name 조인)
// - plm_save_purchase_order_items RPC: 품목을 한 번에 교체 저장(기존 전체 삭제 후 재삽입)

export type PurchaseOrderStatus = "주문완료" | "부분입고" | "입고완료" | "취소";
export type PurchaseOrderPaymentStatus = "미결제" | "결제완료";

export const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = ["주문완료", "부분입고", "입고완료", "취소"];
export const PURCHASE_ORDER_PAYMENT_STATUSES: PurchaseOrderPaymentStatus[] = ["미결제", "결제완료"];

export type PurchaseOrderItem = {
  id?: string;
  purchase_order_id?: string;
  line_no?: number;
  raw_code: string;
  raw_name?: string; // 조회 시에만 채워짐(v_plm_purchase_order_items_detail 조인) - 저장 대상 아님
  trade_name?: string; // 위와 동일
  unit_price: number;
  quantity: number;
  unit?: string | null;
  packing?: string | null; // 패킹 정보 (예: "20kg/drum", "1kg 병x10")
  supply_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  note?: string | null;
};

export type PurchaseOrder = {
  id?: string;
  order_no?: string; // 신규 저장 시 DB 트리거(plm_set_purchase_order_no)가 order_date 기준으로 자동 채워짐
  supplier_company_id: string | null;
  order_date: string; // yyyy-mm-dd
  payment_due_date?: string | null;
  payment_date?: string | null;
  status: PurchaseOrderStatus;
  payment_status: PurchaseOrderPaymentStatus;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  items: PurchaseOrderItem[];
};

export type PurchaseOrderSummary = {
  id: string;
  order_no: string;
  supplier_company_id: string | null;
  supplier_name_kr: string | null;
  supplier_name_en: string | null;
  order_date: string;
  payment_due_date: string | null;
  payment_date: string | null;
  status: PurchaseOrderStatus;
  payment_status: PurchaseOrderPaymentStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  supply_amount_sum: number;
  vat_amount_sum: number;
  total_amount_sum: number;
};

export type PurchaseOrderListFilter = {
  keyword?: string; // 발주번호/공급사명/비고
  status?: PurchaseOrderStatus | "";
  paymentStatus?: PurchaseOrderPaymentStatus | "";
  dateFrom?: string; // 발주일 기준
  dateTo?: string;
};

// 목록 조회 - 공급사명/발주번호로 정렬해 화면에서 공급사별 섹션으로 묶기 쉽게 한다.
export async function fetchPurchaseOrders(filter: PurchaseOrderListFilter = {}): Promise<PurchaseOrderSummary[]> {
  let q = supabaseProductionFinal
    .from("v_plm_purchase_order_summary")
    .select("*")
    .order("order_date", { ascending: false })
    .limit(500);

  if (filter.status) q = q.eq("status", filter.status);
  if (filter.paymentStatus) q = q.eq("payment_status", filter.paymentStatus);
  if (filter.dateFrom) q = q.gte("order_date", filter.dateFrom);
  if (filter.dateTo) q = q.lte("order_date", filter.dateTo);
  if (filter.keyword?.trim()) {
    const k = filter.keyword.trim();
    q = q.or(`order_no.ilike.%${k}%,supplier_name_kr.ilike.%${k}%,supplier_name_en.ilike.%${k}%,note.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as PurchaseOrderSummary[];
}

// 발주 상세(헤더+품목) 조회
export async function fetchPurchaseOrderDetail(id: string): Promise<PurchaseOrder> {
  const [{ data: header, error: headerError }, { data: items, error: itemsError }] = await Promise.all([
    supabaseProductionFinal.from("plm_raw_material_purchase_orders").select("*").eq("id", id).single(),
    supabaseProductionFinal.from("v_plm_purchase_order_items_detail").select("*").eq("purchase_order_id", id).order("line_no", { ascending: true }),
  ]);
  if (headerError) throw headerError;
  if (itemsError) throw itemsError;
  return { ...(header as PurchaseOrder), items: (items || []) as PurchaseOrderItem[] };
}

// 발주 헤더 저장(신규 INSERT 또는 기존 UPDATE) - order_no는 신규일 때 DB 기본값으로 자동 생성되므로 보내지 않는다.
export async function savePurchaseOrderHeader(order: PurchaseOrder): Promise<PurchaseOrder> {
  const payload = {
    supplier_company_id: order.supplier_company_id,
    order_date: order.order_date,
    payment_due_date: order.payment_due_date || null,
    payment_date: order.payment_date || null,
    status: order.status,
    payment_status: order.payment_status,
    note: order.note || null,
    updated_at: new Date().toISOString(),
  };

  const query = order.id
    ? supabaseProductionFinal.from("plm_raw_material_purchase_orders").update(payload).eq("id", order.id).select("*").single()
    : supabaseProductionFinal.from("plm_raw_material_purchase_orders").insert({ ...payload, created_by: order.created_by }).select("*").single();

  const { data, error } = await query;
  if (error) throw error;
  return data as PurchaseOrder;
}

// 발주 품목 저장 - 기존 품목을 전부 지우고 현재 화면의 품목으로 다시 채우는 RPC(plm_save_purchase_order_items)를
// 호출한다. raw_name/trade_name은 조회 전용(조인 결과)이라 저장 대상에서 제외한다.
export async function savePurchaseOrderItems(orderId: string, items: PurchaseOrderItem[]): Promise<void> {
  const clean = items
    .filter((i) => i.raw_code?.trim())
    .map((i) => ({
      raw_code: i.raw_code,
      unit_price: i.unit_price || 0,
      quantity: i.quantity || 0,
      unit: i.unit || null,
      packing: i.packing || null,
      supply_amount: i.supply_amount || 0,
      vat_rate: i.vat_rate ?? 0.1,
      vat_amount: i.vat_amount || 0,
      total_amount: i.total_amount || 0,
      note: i.note || null,
    }));

  const { error } = await supabaseProductionFinal.rpc("plm_save_purchase_order_items", {
    p_order_id: orderId,
    p_items: clean,
  });
  if (error) throw error;
}

// 헤더+품목을 함께 저장하고 최종 발주 id를 반환 - 화면에서는 이 함수 하나만 호출하면 된다.
export async function savePurchaseOrder(order: PurchaseOrder): Promise<string> {
  const savedHeader = await savePurchaseOrderHeader(order);
  await savePurchaseOrderItems(savedHeader.id!, order.items);
  return savedHeader.id!;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  // items는 on delete cascade라 헤더만 지우면 품목도 함께 삭제된다.
  const { error } = await supabaseProductionFinal.from("plm_raw_material_purchase_orders").delete().eq("id", id);
  if (error) throw error;
}

// 금액 자동계산 - 화면(품목 행)에서 단가/수량/부가세율이 바뀔 때마다 호출해서 공급가/부가세/총액을
// 다시 계산한다. 계산 결과는 수정 가능한 일반 필드라 사용자가 직접 고쳐도 무방하다(예: 공급사 세금계산서와
// 반올림 차이가 나는 경우).
export function calcItemAmounts(item: Pick<PurchaseOrderItem, "unit_price" | "quantity" | "vat_rate">): {
  supply_amount: number;
  vat_amount: number;
  total_amount: number;
} {
  const supply = Math.round((item.unit_price || 0) * (item.quantity || 0) * 100) / 100;
  const vat = Math.round(supply * (item.vat_rate ?? 0.1) * 100) / 100;
  return { supply_amount: supply, vat_amount: vat, total_amount: Math.round((supply + vat) * 100) / 100 };
}

export function emptyPurchaseOrderItem(): PurchaseOrderItem {
  return { raw_code: "", unit_price: 0, quantity: 0, unit: "", packing: "", supply_amount: 0, vat_rate: 0.1, vat_amount: 0, total_amount: 0, note: "" };
}

export function emptyPurchaseOrder(): PurchaseOrder {
  const today = new Date().toISOString().slice(0, 10);
  return {
    supplier_company_id: null,
    order_date: today,
    payment_due_date: null,
    payment_date: null,
    status: "주문완료",
    payment_status: "미결제",
    note: "",
    items: [emptyPurchaseOrderItem()],
  };
}
