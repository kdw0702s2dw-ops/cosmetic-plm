"use client";

import { useEffect, useState } from "react";
import { companyDisplayName, type Company } from "@/services/sprint2/companyService";
import {
  COMPANY_DOC_TYPES, COMPANY_DOC_TYPE_LABEL, downloadCompanyDocumentFile, getCompanyDocuments,
  type CompanyDocument,
} from "@/services/sprint2/companyDocumentService";
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
// (결제조건만은 예외 - 공급사별로 plm_companies.payment_terms에 저장된 값이 있으면 그게 최우선
// 기본값이고, 브라우저 기억값은 그게 없을 때만 쓰는 2순위 fallback이다. 아래 컴포넌트 본문 참고.)
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
// 비고/납품장소는 이 브라우저에 마지막으로 저장해둔 값, 결제조건은 공급사 저장값 우선 + 그 다음 브라우저
// 기억값).
export default function PurchaseOrderPrintModal({ target, onClose }: { target: PurchaseOrderPrintTarget | null; onClose: () => void }) {
  // 결제조건 기본값: 1순위는 해당 발주의 실제 공급사에 저장된 업체별 결제조건(plm_companies.payment_terms) -
  // 담당자가 바뀌어도 공급사마다 다른 조건이 섞이지 않도록 한다. 공급사에 아직 결제조건이 입력돼 있지
  // 않으면(과거처럼) 이 브라우저에서 마지막으로 쓴 값을 기본값으로 보여준다.
  const [extra, setExtra] = useState<PurchaseOrderDocExtra>(() => ({
    delivery_place: readStoredDefault(PO_DELIVERY_PLACE_STORAGE_KEY, DEFAULT_DELIVERY_PLACE),
    payment_terms: target?.supplier?.payment_terms || readStoredDefault(PO_PAYMENT_TERMS_STORAGE_KEY, ""),
    note: readStoredDefault(PO_NOTE_STORAGE_KEY, DEFAULT_PO_NOTE),
  }));
  const [busy, setBusy] = useState(false);

  const supplierId = target?.supplier?.id;
  const [supplierDocs, setSupplierDocs] = useState<CompanyDocument[]>([]);
  useEffect(() => {
    if (!supplierId) return;
    let cancelled = false;
    getCompanyDocuments(supplierId).then((docs) => { if (!cancelled) setSupplierDocs(docs); }).catch(() => { if (!cancelled) setSupplierDocs([]); });
    return () => { cancelled = true; };
  }, [supplierId]);

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

        {/* 내부 승인 보고용 - 이 공급사의 통장사본/사업자등록증이 업체관리에 등록돼 있으면 바로 다운로드,
            없으면 "미등록"으로 표시해서 아직 공급사에 요청해야 한다는 걸 바로 알 수 있게 한다. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4, marginBottom: 4 }}>
          {COMPANY_DOC_TYPES.map((docType) => {
            const doc = supplierDocs.find((d) => d.doc_type === docType);
            return (
              <button key={docType} className="v50-button-light" disabled={!doc}
                style={!doc ? { color: "#94a3b8", cursor: "default" } : undefined}
                onClick={() => doc && downloadCompanyDocumentFile(doc).catch((e) => alert(e instanceof Error ? e.message : String(e)))}>
                {COMPANY_DOC_TYPE_LABEL[docType]}{doc ? " 다운로드" : " 미등록"}
              </button>
            );
          })}
        </div>

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
