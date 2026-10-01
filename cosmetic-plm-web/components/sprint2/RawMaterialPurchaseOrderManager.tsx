"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { fetchSprint1RawOptions } from "@/services/sprint1/formulaCoreService";
import { searchCompaniesAutocomplete, fetchCompanyById, type Company } from "@/services/sprint2/companyService";
import {
  fetchPurchaseOrders, fetchPurchaseOrderDetail, savePurchaseOrder, deletePurchaseOrder,
  calcItemAmounts, emptyPurchaseOrder, emptyPurchaseOrderItem,
  PURCHASE_ORDER_STATUSES, PURCHASE_ORDER_PAYMENT_STATUSES,
  type PurchaseOrder, type PurchaseOrderItem, type PurchaseOrderSummary, type PurchaseOrderListFilter,
  type PurchaseOrderStatus, type PurchaseOrderPaymentStatus,
} from "@/services/sprint2/purchaseOrderService";
import SearchDropdown from "@/components/common/SearchDropdown";
import { useAnchorPosition } from "@/hooks/useAnchorPosition";
import Toast, { type ToastState } from "@/components/common/Toast";
import "@/styles/enterprise-v50.css";

function formatCurrency(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("ko-KR");
}

const STATUS_COLOR: Record<PurchaseOrderStatus, { bg: string; fg: string }> = {
  주문완료: { bg: "#dbeafe", fg: "#1d4ed8" },
  부분입고: { bg: "#fef3c7", fg: "#b45309" },
  입고완료: { bg: "#dcfce7", fg: "#16a34a" },
  취소: { bg: "#f1f5f9", fg: "#64748b" },
};
const PAYMENT_STATUS_COLOR: Record<PurchaseOrderPaymentStatus, { bg: string; fg: string }> = {
  미결제: { bg: "#fee2e2", fg: "#dc2626" },
  결제완료: { bg: "#dcfce7", fg: "#16a34a" },
};

function Badge({ text, color }: { text: string; color: { bg: string; fg: string } }) {
  return (
    <span style={{ background: color.bg, color: color.fg, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

type SupplierGroup = {
  key: string;
  name: string;
  orders: PurchaseOrderSummary[];
  unpaidTotal: number;
  grandTotal: number;
};

/**
 * 원료 발주관리 - 공급사별로 원료를 발주(주문)하고 결제 현황을 관리하는 화면.
 * 발주 1건 = 공급사 1곳 + 품목(원료) 여러 개 (처방관리의 "처방+BOM"과 동일한 헤더+라인 구조).
 * 목록은 공급사별로 섹션을 나눠서 보여준다 - 월말 결제처럼 여러 공급사에 각각 결제할 금액을
 * 한눈에 파악해야 하는 실무 흐름에 맞춘 것 (요청사항: "섹션이 나눠서 구분이 되어야해").
 */
export default function RawMaterialPurchaseOrderManager() {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteMaterials;

  const [filter, setFilter] = useState<PurchaseOrderListFilter>({ status: "", paymentStatus: "" });
  const [list, setList] = useState<PurchaseOrderSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const load = useCallback(async (f: PurchaseOrderListFilter) => {
    setListLoading(true);
    try {
      setList(await fetchPurchaseOrders(f));
    } catch (e: any) {
      setMsg("목록 조회 오류: " + e.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, []); // eslint-disable-line

  // 공급사별 섹션으로 묶기 - 미지정(supplier_company_id 없음)은 "공급사 미지정" 섹션으로 모은다.
  const groups: SupplierGroup[] = useMemo(() => {
    const map = new Map<string, SupplierGroup>();
    for (const o of list) {
      const key = o.supplier_company_id || "__none__";
      const name = o.supplier_company_id ? (o.supplier_name_kr || o.supplier_name_en || "(이름없음)") : "공급사 미지정";
      if (!map.has(key)) map.set(key, { key, name, orders: [], unpaidTotal: 0, grandTotal: 0 });
      const g = map.get(key)!;
      g.orders.push(o);
      g.grandTotal += o.total_amount_sum || 0;
      if (o.payment_status === "미결제" && o.status !== "취소") g.unpaidTotal += o.total_amount_sum || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.unpaidTotal - a.unpaidTotal || a.name.localeCompare(b.name, "ko"));
  }, [list]);

  const overallUnpaid = useMemo(() => groups.reduce((s, g) => s + g.unpaidTotal, 0), [groups]);
  const overallTotal = useMemo(() => groups.reduce((s, g) => s + g.grandTotal, 0), [groups]);

  function newOrder() {
    setOrder(emptyPurchaseOrder());
    setMsg("새 발주 입력 모드");
  }

  async function selectOrder(id: string) {
    setMsg("불러오는 중...");
    try {
      setOrder(await fetchPurchaseOrderDetail(id));
      setMsg("");
    } catch (e: any) {
      setMsg("발주 조회 오류: " + e.message);
    }
  }

  async function handleDelete(o: PurchaseOrderSummary) {
    if (!confirm(`발주 "${o.order_no}"를 삭제하시겠습니까? (품목도 함께 삭제되며 되돌릴 수 없습니다.)`)) return;
    try {
      await deletePurchaseOrder(o.id);
      if (order?.id === o.id) setOrder(null);
      setToast({ type: "success", text: "삭제되었습니다: " + o.order_no });
      await load(filter);
    } catch (e: any) {
      setToast({ type: "error", text: "삭제 실패: " + e.message });
    }
  }

  function updateOrder(patch: Partial<PurchaseOrder>) {
    setOrder((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateItem(i: number, patch: Partial<PurchaseOrderItem>) {
    setOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.slice();
      const merged = { ...items[i], ...patch };
      // 단가/수량/부가세율이 바뀌면 공급가/부가세/총액을 자동으로 다시 계산한다(수동 수정도 계속 가능).
      if ("unit_price" in patch || "quantity" in patch || "vat_rate" in patch) {
        Object.assign(merged, calcItemAmounts(merged));
      }
      items[i] = merged;
      return { ...prev, items };
    });
  }

  function addItemRow() {
    setOrder((prev) => (prev ? { ...prev, items: [...prev.items, emptyPurchaseOrderItem()] } : prev));
  }

  function removeItemRow(i: number) {
    setOrder((prev) => (prev ? { ...prev, items: prev.items.filter((_, idx) => idx !== i) } : prev));
  }

  const itemTotals = useMemo(() => {
    if (!order) return { supply: 0, vat: 0, total: 0 };
    return order.items.reduce(
      (acc, it) => ({ supply: acc.supply + (it.supply_amount || 0), vat: acc.vat + (it.vat_amount || 0), total: acc.total + (it.total_amount || 0) }),
      { supply: 0, vat: 0, total: 0 }
    );
  }, [order]);

  async function handleSave() {
    if (!order) return;
    if (!order.supplier_company_id) { setMsg("공급사를 선택하세요."); return; }
    const validItems = order.items.filter((i) => i.raw_code?.trim());
    if (validItems.length === 0) { setMsg("품목을 1개 이상 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      const id = await savePurchaseOrder({ ...order, created_by: order.created_by ?? auth.profile?.email });
      const saved = await fetchPurchaseOrderDetail(id);
      setOrder(saved);
      setToast({ type: "success", text: "저장되었습니다: " + saved.order_no });
      await load(filter);
    } catch (e: any) {
      setToast({ type: "error", text: "저장 실패: " + e.message });
    } finally {
      setSaving(false);
    }
  }

  function applyFilter() {
    load(filter);
  }

  // ---- 원료코드 검색 자동완성(품목 행) ----
  const [rawHits, setRawHits] = useState<any[]>([]);
  const [activeRawRow, setActiveRawRow] = useState<number | null>(null);
  const rawInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const rawSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawAnchorPos = useAnchorPosition(activeRawRow, () => (activeRawRow != null ? rawInputRefs.current[activeRawRow] : null), rawHits);

  function searchRawForRow(i: number, value: string) {
    updateItem(i, { raw_code: value, raw_name: undefined, trade_name: undefined });
    setActiveRawRow(i);
    if (rawSearchTimer.current) clearTimeout(rawSearchTimer.current);
    if (!value.trim()) { setRawHits([]); return; }
    rawSearchTimer.current = setTimeout(async () => {
      try { setRawHits(await fetchSprint1RawOptions(value.trim())); }
      catch { setRawHits([]); }
    }, 250);
  }

  function pickRawForRow(raw: any) {
    if (activeRawRow == null) return;
    // 발주 화면에서 처음 담는 순간의 단가를 기본값으로 채워주되(원료 마스터 최근 단가), 실제 계약 단가가
    // 다르면 바로 아래 칸에서 수정하면 된다.
    updateItem(activeRawRow, {
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      trade_name: raw.trade_name,
      unit_price: raw.unit_price ?? 0,
      ...calcItemAmounts({ unit_price: raw.unit_price ?? 0, quantity: order?.items[activeRawRow]?.quantity || 0, vat_rate: order?.items[activeRawRow]?.vat_rate ?? 0.1 }),
    });
    setRawHits([]);
    setActiveRawRow(null);
  }

  // ---- 공급사 검색 자동완성(헤더) ----
  const [supplierKeyword, setSupplierKeyword] = useState("");
  const [supplierHits, setSupplierHits] = useState<Company[]>([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement | null>(null);
  const supplierSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supplierAnchorPos = useAnchorPosition(supplierOpen ? "supplier" : null, () => supplierInputRef.current, supplierHits);

  // 발주를 불러오면(선택/신규) 그 발주의 공급사명을 입력창에 표시한다.
  useEffect(() => {
    if (!order) { setSupplierKeyword(""); return; }
    if (!order.supplier_company_id) { setSupplierKeyword(""); return; }
    let cancelled = false;
    fetchCompanyById(order.supplier_company_id)
      .then((c) => { if (!cancelled) setSupplierKeyword(c.name_kr || c.name_en || ""); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [order?.id]); // eslint-disable-line

  function onSupplierInputChange(v: string) {
    setSupplierKeyword(v);
    updateOrder({ supplier_company_id: null });
    setSupplierOpen(true);
    if (supplierSearchTimer.current) clearTimeout(supplierSearchTimer.current);
    if (!v.trim()) { setSupplierHits([]); return; }
    supplierSearchTimer.current = setTimeout(async () => {
      try { setSupplierHits(await searchCompaniesAutocomplete(v.trim(), "공급사")); }
      catch { setSupplierHits([]); }
    }, 250);
  }

  function pickSupplier(c: Company) {
    setSupplierKeyword(c.name_kr || c.name_en || "");
    updateOrder({ supplier_company_id: c.id! });
    setSupplierHits([]);
    setSupplierOpen(false);
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료 발주관리</h1>
          <p className="v50-desc">공급사별 원료 발주와 결제 현황을 관리합니다. 목록은 공급사별로 섹션이 나뉘어 표시됩니다.</p>
        </div>
        {canWrite && <button className="v50-button" onClick={newOrder}>+ 새 발주</button>}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>발주 목록</h2>
          <div style={{ display: "flex", gap: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>전체 미결제 합계 {formatCurrency(overallUnpaid)}원</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>전체 발주 총액 {formatCurrency(overallTotal)}원</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="검색(발주번호/공급사/비고)">
            <input className="v50-input" style={{ minWidth: 220 }} value={filter.keyword || ""}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()} />
          </Field>
          <Field label="진행상태">
            <select className="v50-input" value={filter.status || ""} onChange={(e) => setFilter({ ...filter, status: e.target.value as PurchaseOrderStatus | "" })}>
              <option value="">전체</option>
              {PURCHASE_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="결제상태">
            <select className="v50-input" value={filter.paymentStatus || ""} onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value as PurchaseOrderPaymentStatus | "" })}>
              <option value="">전체</option>
              {PURCHASE_ORDER_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="발주일(시작)">
            <input className="v50-input" type="date" value={filter.dateFrom || ""} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
          </Field>
          <Field label="발주일(종료)">
            <input className="v50-input" type="date" value={filter.dateTo || ""} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
          </Field>
          <button className="v50-button" onClick={applyFilter} disabled={listLoading}>{listLoading ? "조회 중…" : "검색"}</button>
        </div>

        {groups.length === 0 && !listLoading && <p style={{ color: "#94a3b8" }}>발주 내역이 없습니다.</p>}

        {groups.map((g) => (
          <div key={g.key} style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{g.name}</strong>
              <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: g.unpaidTotal > 0 ? "#dc2626" : "#94a3b8" }}>미결제 {formatCurrency(g.unpaidTotal)}원</span>
                <span style={{ color: "#475569" }}>합계 {formatCurrency(g.grandTotal)}원</span>
              </div>
            </div>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>발주번호</th><th>발주일</th><th>품목수</th><th>공급가</th><th>부가세</th><th>총액</th>
                    <th>결제예정일</th><th>결제일</th><th>진행상태</th><th>결제상태</th><th style={{ width: 110 }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {g.orders.map((o) => (
                    <tr key={o.id} style={{ background: order?.id === o.id ? "#eff6ff" : undefined }}>
                      <td style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => selectOrder(o.id)}>{o.order_no}</td>
                      <td>{o.order_date}</td>
                      <td>{o.item_count}</td>
                      <td>{formatCurrency(o.supply_amount_sum)}</td>
                      <td>{formatCurrency(o.vat_amount_sum)}</td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(o.total_amount_sum)}</td>
                      <td>{o.payment_due_date || "-"}</td>
                      <td>{o.payment_date || "-"}</td>
                      <td><Badge text={o.status} color={STATUS_COLOR[o.status]} /></td>
                      <td><Badge text={o.payment_status} color={PAYMENT_STATUS_COLOR[o.payment_status]} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="v50-button-light" onClick={() => selectOrder(o.id)}>{canWrite ? "수정" : "보기"}</button>
                          {canWrite && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(o)}>삭제</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {order && (
        <section className="v50-panel">
          <h2>{order.id ? `발주 편집 · ${order.order_no}` : "새 발주 등록"}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
            <Field label="공급사*">
              <input ref={supplierInputRef} className="v50-input" value={supplierKeyword}
                onChange={(e) => onSupplierInputChange(e.target.value)}
                onFocus={() => setSupplierOpen(true)}
                placeholder="업체명 검색" disabled={!canWrite} />
              {supplierOpen && supplierHits.length > 0 && supplierAnchorPos &&
                createPortal(
                  <SearchDropdown hits={supplierHits} pos={supplierAnchorPos} onPick={pickSupplier}
                    keyExtractor={(c) => c.id!}
                    renderItem={(c) => <div><strong>{c.name_kr || c.name_en}</strong> {c.name_en && c.name_kr ? `(${c.name_en})` : ""}</div>} />,
                  document.body
                )}
            </Field>
            <Field label="발주일">
              <input className="v50-input" type="date" value={order.order_date} onChange={(e) => updateOrder({ order_date: e.target.value })} disabled={!canWrite} />
            </Field>
            <Field label="결제예정일">
              <input className="v50-input" type="date" value={order.payment_due_date || ""} onChange={(e) => updateOrder({ payment_due_date: e.target.value || null })} disabled={!canWrite} />
            </Field>
            <Field label="결제일 (입력하면 결제완료로 자동 전환)">
              <input className="v50-input" type="date" value={order.payment_date || ""}
                onChange={(e) => updateOrder({ payment_date: e.target.value || null, payment_status: e.target.value ? "결제완료" : "미결제" })}
                disabled={!canWrite} />
            </Field>
            <Field label="진행상태">
              <select className="v50-input" value={order.status} onChange={(e) => updateOrder({ status: e.target.value as PurchaseOrderStatus })} disabled={!canWrite}>
                {PURCHASE_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="결제상태">
              <select className="v50-input" value={order.payment_status} onChange={(e) => updateOrder({ payment_status: e.target.value as PurchaseOrderPaymentStatus })} disabled={!canWrite}>
                {PURCHASE_ORDER_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="비고">
                <textarea className="v50-textarea" rows={2} value={order.note || ""} onChange={(e) => updateOrder({ note: e.target.value })} disabled={!canWrite} />
              </Field>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>발주 품목</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>#</th><th style={{ minWidth: 200 }}>원료코드/원료명</th><th>단가</th><th>수량</th><th>단위</th><th>패킹</th>
                    <th>공급가</th><th>부가세율</th><th>부가세</th><th>총액</th><th>비고</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input ref={(el) => { rawInputRefs.current[i] = el; }} className="v50-input" style={{ minWidth: 180 }}
                          value={it.raw_code} onChange={(e) => searchRawForRow(i, e.target.value)} disabled={!canWrite} />
                        {(it.raw_name || it.trade_name) && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{it.raw_name}{it.trade_name ? ` (${it.trade_name})` : ""}</div>
                        )}
                        {activeRawRow === i && rawHits.length > 0 && rawAnchorPos &&
                          createPortal(
                            <SearchDropdown hits={rawHits} pos={rawAnchorPos} onPick={pickRawForRow}
                              keyExtractor={(r: any) => r.raw_code}
                              renderItem={(r: any) => <div><strong>{r.raw_code}</strong> {r.raw_name}{r.trade_name ? ` / ${r.trade_name}` : ""}</div>} />,
                            document.body
                          )}
                      </td>
                      <td><input className="v50-input" type="number" style={{ width: 90 }} value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" type="number" style={{ width: 80 }} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 60 }} value={it.unit || ""} onChange={(e) => updateItem(i, { unit: e.target.value })} placeholder="kg" disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 100 }} value={it.packing || ""} onChange={(e) => updateItem(i, { packing: e.target.value })} placeholder="20kg/drum" disabled={!canWrite} /></td>
                      <td><input className="v50-input" type="number" style={{ width: 100 }} value={it.supply_amount} onChange={(e) => updateItem(i, { supply_amount: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" type="number" step="0.01" style={{ width: 70 }} value={it.vat_rate} onChange={(e) => updateItem(i, { vat_rate: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" type="number" style={{ width: 90 }} value={it.vat_amount} onChange={(e) => updateItem(i, { vat_amount: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td style={{ fontWeight: 800 }}><input className="v50-input" type="number" style={{ width: 100 }} value={it.total_amount} onChange={(e) => updateItem(i, { total_amount: Number(e.target.value) || 0 })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 100 }} value={it.note || ""} onChange={(e) => updateItem(i, { note: e.target.value })} disabled={!canWrite} /></td>
                      <td>{canWrite && <button className="v50-button-light" onClick={() => removeItemRow(i)}>삭제</button>}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && <tr><td colSpan={12} style={{ color: "#94a3b8" }}>품목이 없습니다.</td></tr>}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                    <td colSpan={6} style={{ textAlign: "right" }}>합계</td>
                    <td>{formatCurrency(itemTotals.supply)}</td>
                    <td></td>
                    <td>{formatCurrency(itemTotals.vat)}</td>
                    <td>{formatCurrency(itemTotals.total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {canWrite && <button className="v50-button-light" style={{ marginTop: 8 }} onClick={addItemRow}>+ 품목 추가</button>}
          </div>

          {canWrite && (
            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <button className="v50-button" onClick={handleSave} disabled={saving}>{saving ? "저장 중…" : "발주 저장"}</button>
              <button className="v50-button-light" onClick={() => setOrder(null)}>닫기</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
