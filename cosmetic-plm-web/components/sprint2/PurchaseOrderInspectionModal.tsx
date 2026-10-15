"use client";

import { useRef, useState } from "react";
import type { PurchaseOrder, PurchaseOrderItem } from "@/services/sprint2/purchaseOrderService";
import { updatePurchaseOrderItemInspection, uploadPurchaseOrderInspectionPhoto } from "@/services/sprint2/purchaseOrderService";
import { convertImageToJpeg } from "@/lib/imageJpegConvert";
import { buildInspectionReportHtml, inspectionReportFileName, printInspectionReport } from "@/services/sprint2/purchaseOrderDocService";
import { downloadHtmlDocument } from "@/services/sprint2/documentPdfService";
import Toast, { type ToastState } from "@/components/common/Toast";
import "@/styles/enterprise-v50.css";

export type PurchaseOrderInspectionTarget = { order: PurchaseOrder; item: PurchaseOrderItem };

function itemLabel(item: PurchaseOrderItem): string {
  return item.trade_name || item.raw_name || item.raw_code || "-";
}

/**
 * 원료 발주관리 품목 1건의 "검수조서"(원료 입고정보) 입력/출력 모달 - 원료를 발주하고 입고되면 사용자가
 * 올려준 회사 양식(제목 "원료 입고정보", "1. 원료 사진" + "2. 발주 정보" 표 + 비고)에 맞춰 내용을 기입해야
 * 하는 작업을 발주관리에 이미 있는 데이터(원료명/발주일/단가/수량/공급가/부가세/총액)를 그대로 재사용해
 * 효율화한다. 여기서 직접 입력하는 건 입고일/사진/비고뿐이고, 발주 자체(단가/수량 등)는 발주 편집 폼에서
 * 고친다 - savePurchaseOrderItems(발주 품목 전체 교체 저장)와 겹치지 않도록 이 품목 1건만
 * updatePurchaseOrderItemInspection()으로 직접 업데이트한다.
 *
 * 사진은 올리기 전에 convertImageToJpeg()로 자동 압축(긴 변 1600px, JPEG 82%)해서 Storage 용량을 아낀다.
 * 삭제는 기존 StabilityTestPanel의 사진 초안 패턴과 동일하게 목록에서만 제거한다(저장을 눌러야 실제 반영).
 */
export default function PurchaseOrderInspectionModal({
  target,
  onClose,
  onSaved,
}: {
  target: PurchaseOrderInspectionTarget | null;
  onClose: () => void;
  onSaved: (updated: PurchaseOrderItem) => void;
}) {
  const [receivedDate, setReceivedDate] = useState(target?.item.received_date || "");
  const [note, setNote] = useState(target?.item.note || "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(target?.item.photo_urls || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!target) return null;
  const { order, item } = target;
  // 품목이 아직 저장 전(id 없음)이면 검수조서를 쓸 수 없다 - 발주 편집 폼에서 먼저 "발주 저장"을 해야
  // 품목에 id가 생기고, 그 id 밑에 사진을 업로드/보관할 수 있다(부모에서도 id 있는 행에만 버튼을 보여줌 -
  // 여기서는 혹시 모를 직접 호출에 대한 방어로만 한 번 더 막아둔다).
  if (!item.id) return null;

  async function handleAddPhoto(file: File) {
    setUploading(true);
    try {
      const jpeg = await convertImageToJpeg(file);
      const url = await uploadPurchaseOrderInspectionPhoto(item.id!, jpeg);
      setPhotoUrls((prev) => [...prev, url]);
    } catch (e) {
      setToast({ type: "error", text: e instanceof Error ? e.message : "사진 업로드 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  // 발주/엑셀 등 저장 대상이 아닌 필드(원료명/단가/수량 등)는 조회된 item 그대로 쓰고, 지금 화면에서
  // 입력 중인 입고일/비고/사진만 덮어써서 출력·저장에 쓸 최신 상태를 만든다.
  function currentDraftItem(): PurchaseOrderItem {
    return { ...item, received_date: receivedDate || null, note, photo_urls: photoUrls };
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePurchaseOrderItemInspection(item.id!, { received_date: receivedDate || null, note, photo_urls: photoUrls });
      onSaved(currentDraftItem());
      setToast({ type: "success", text: "검수조서 내용이 저장되었습니다." });
    } catch (e) {
      setToast({ type: "error", text: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    printInspectionReport(currentDraftItem(), order);
  }

  function handleDownload() {
    const html = buildInspectionReportHtml(currentDraftItem(), order);
    downloadHtmlDocument({ html_content: html, document_code: inspectionReportFileName(item) });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="v50-card" style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflow: "auto", padding: 20, background: "white" }}>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <h2 style={{ marginTop: 0 }}>검수조서(원료 입고정보) · {itemLabel(item)}</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          발주 {order.order_no} · 발주일 {order.order_date} · 단가 {(item.unit_price || 0).toLocaleString("ko-KR")}원 · 수량 {(item.quantity || 0).toLocaleString("ko-KR")}kg
        </p>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: -8 }}>
          공급가 {(item.supply_amount || 0).toLocaleString("ko-KR")}원 · 부가세 {(item.vat_amount || 0).toLocaleString("ko-KR")}원 · 총액 {(item.total_amount || 0).toLocaleString("ko-KR")}원
        </p>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>입고일</label>
          <input type="date" className="v50-input" style={{ width: "100%" }} value={receivedDate || ""} onChange={(e) => setReceivedDate(e.target.value)} />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>
            원료 사진 (업로드 시 용량을 줄인 JPG로 자동 변환되어 저장됩니다)
          </label>
          {photoUrls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              {photoUrls.map((url) => (
                <div key={url} style={{ position: "relative", width: 110, height: 110, border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="원료 사진" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => removePhoto(url)}
                    style={{ position: "absolute", top: 2, right: 2, background: "rgba(15,23,42,0.7)", color: "white", border: "none", borderRadius: 4, width: 20, height: 20, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddPhoto(f); e.target.value = ""; }} />
          <button type="button" className="v50-button-light" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "업로드 중…" : "+ 사진 추가"}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>비고</label>
          <textarea className="v50-input" style={{ width: "100%", minHeight: 70 }} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
          <button className="v50-button-light" onClick={onClose}>닫기</button>
          <button className="v50-button-light" onClick={handleDownload}>HTML 다운로드</button>
          <button className="v50-button-light" onClick={handlePrint}>인쇄/PDF</button>
          <button className="v50-button" disabled={saving} onClick={handleSave}>{saving ? "저장 중…" : "저장"}</button>
        </div>
      </div>
    </div>
  );
}
