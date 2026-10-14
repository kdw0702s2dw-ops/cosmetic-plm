"use client";

import { useState } from "react";
import { companyDisplayName, type Company } from "@/services/sprint2/companyService";
import type { PurchaseOrder } from "@/services/sprint2/purchaseOrderService";
import {
  DEFAULT_DELIVERY_PLACE, DEFAULT_PO_NOTE, downloadPurchaseOrderExcel,
  numberToKoreanWon, printPurchaseOrder, type PurchaseOrderDocExtra,
} from "@/services/sprint2/purchaseOrderDocService";
import "@/styles/enterprise-v50.css";

export type PurchaseOrderPrintTarget = { order: PurchaseOrder; supplier: Company | null };

// 비고/결제조건/납품장소는 발주마다 거의 안 바뀌는 "고정 문구" 성격이라, 매번 똑같은 내용을 다시 입력하지
// 않도록 이 브라우저에 마지막으로 쓴 값을 기억해뒀다가 다음 번 기본값으로 띄운다(요청사항: "비고에 새
// 내용을 기입하면 다음에도 유지되는지" -> 그렇게 되도록 변경). 납기일자/유효일자는 발주마다 실제로 달라
// 지는 날짜라 여기 포함하지 않고 항상 빈칸에서 시작한다.
const PO_NOTE_STORAGE_KEY = "po_print_note_v1";
const PO_PAYMENT_TERMS_STORAGE_KEY = "po_print_payment_terms_v1";
const PO_DELIVERY_PLACE_STORAGE_KEY = "po_print_delivery_place_v1";

function readStoredDefault(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored !== null ? stored : fallback;
  } catch {
    return fallback;
  }
}
function writeStoredDefault(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 프라이빗 브라우징 등으로 저장이 막혀 있어도 이번 출력 자체는 그대로 진행한다 - 다음 번에 기본값이
    // 기억되지 않을 뿐 기능 자체가 막히면 안 되므로 조용히 무시.
  }
}

// 원료 발주관리의 저장된 발주를 회사 공식 "발주서" 양식(PDF/엑셀)으로 출력하기 전, 저장된 발주 데이터에는
// 없는 항목(납기일자/유효일자/결제조건/납품장소/비고)을 한 번 확인·수정하게 하는 모달. 부모에서
// key={target.order.id}를 넣어 다른 발주를 열 때마다 입력값이 리셋되게 한다(날짜 2종은 항상 빈칸,
// 비고/결제조건/납품장소는 이 브라우저에 마지막으로 저장해둔 값).
export default function PurchaseOrderPrintModal({ target, onClose }: { target: PurchaseOrderPrintTarget | null; onClose: () => void }) {
  const [extra, setExtra] = useState<PurchaseOrderDocExtra>(() => ({
    delivery_place: readStoredDefault(PO_DELIVERY_PLACE_STORAGE_KEY, DEFAULT_DELIVERY_PLACE),
    payment_terms: readStoredDefault(PO_PAYMENT_TERMS_STORAGE_KEY, ""),
    note: readStoredDefault(PO_NOTE_STORAGE_KEY, DEFAULT_PO_NOTE),
  }));
  const [busy, setBusy] = useState(false);

  if (!target) return null;
  const { order, supplier } = target;
  const supplyTotal = order.items.reduce((s, i) => s + (i.supply_amount || 0), 0);
  const vatTotal = order.items.reduce((s, i) => s + (i.vat_amount || 0), 0);
  const grandTotal = supplyTotal + vatTotal;

  // PDF/엑셀을 실제로 만들 때만(입력 중 매 타이핑마다가 아니라) 다음 기본값으로 저장한다.
  function persistDefaults() {
    writeStoredDefault(PO_DELIVERY_PLACE_STORAGE_KEY, extra.delivery_place || "");
    writeStoredDefault(PO_PAYMENT_TERMS_STORAGE_KEY, extra.payment_terms || "");
    writeStoredDefault(PO_NOTE_STORAGE_KEY, extra.note || "");
  }

  function handlePdf() {
    setBusy(true);
    try {
      persistDefaults();
      printPurchaseOrder(order, supplier, extra);
    } finally {
      setBusy(false);
    }
  }
  async function handleExcel() {
    setBusy(true);
    try {
      persistDefaults();
      await downloadPurchaseOrderExcel(order, supplier, extra);
    } catch (e) {
      alert("엑셀 생성 실패: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="v50-card" style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflow: "auto", padding: 20, background: "white" }}>
        <h2 style={{ marginTop: 0 }}>발주서 출력 · {order.order_no}</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          공급사: {companyDisplayName(supplier) || "-"} · 발주일 {order.order_date} · 합계 {grandTotal.toLocaleString("ko-KR")}원
        </p>
        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: -6 }}>일금 {numberToKoreanWon(grandTotal)}</p>

        {/* 아래 항목은 저장된 발주 데이터에 없어 생성할 때마다 직접 입력/수정한다 - 비워두면 발주서에도 빈칸으로 나간다.
            납기일자/유효일자는 매번 빈칸에서 시작하고, 결제조건/납품장소/비고는 이 브라우저에서 마지막으로
            PDF/엑셀을 만들 때 쓴 값이 다음 기본값으로 자동으로 채워진다. */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>납기일자</label>
            <input type="date" className="v50-input" style={{ width: "100%" }} value={extra.delivery_date || ""} onChange={(e) => setExtra({ ...extra, delivery_date: e.target.value })} />
          </div>
          <div>
            <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>유효일자</label>
            <input type="date" className="v50-input" style={{ width: "100%" }} value={extra.valid_date || ""} onChange={(e) => setExtra({ ...extra, valid_date: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>결제조건</label>
          <input className="v50-input" style={{ width: "100%" }} value={extra.payment_terms || ""} onChange={(e) => setExtra({ ...extra, payment_terms: e.target.value })} placeholder="예: 월말 결제, 선입금 등" />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>납품장소</label>
          <input className="v50-input" style={{ width: "100%" }} value={extra.delivery_place || ""} onChange={(e) => setExtra({ ...extra, delivery_place: e.target.value })} />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>비고</label>
          <textarea className="v50-input" style={{ width: "100%", minHeight: 70 }} value={extra.note || ""} onChange={(e) => setExtra({ ...extra, note: e.target.value })} />
        </div>

        {!supplier && (
          <p style={{ color: "#b45309", fontSize: 12, marginTop: 10 }}>
            ⚠ 이 발주의 공급사 정보를 불러오지 못했습니다. 공급받는자 상호/TEL이 빈칸으로 출력됩니다.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="v50-button-light" onClick={onClose}>취소</button>
          <button className="v50-button-light" disabled={busy} onClick={handleExcel}>엑셀 다운로드</button>
          <button className="v50-button" disabled={busy} onClick={handlePdf}>PDF 생성(인쇄)</button>
        </div>
      </div>
    </div>
  );
}
