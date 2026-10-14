"use client";

import { useManufacturingQtyReview } from "@/hooks/useManufacturingQtyReview";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import type { PurchaseOrderDraftResult } from "@/services/sprint2/manufacturingQtyReviewService";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

// 단가/발주 금액 표시 - 원료관리(RawMaterialManager)와 동일한 형식("220,000 KRW").
function fmtMoney(v: number | null | undefined, currency?: string) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${Number(v).toLocaleString()}${currency ? " " + currency : ""}`;
}

export default function ManufacturingQtyReviewPanel({
  refreshTick,
  onCreatePurchaseOrders,
}: { refreshTick?: number; onCreatePurchaseOrders?: (result: PurchaseOrderDraftResult) => void } = {}) {
  const s = useManufacturingQtyReview(refreshTick);
  const auth = useSprint1Auth();

  function handleCreatePurchaseOrders() {
    const result = s.buildPurchaseOrderDrafts();
    onCreatePurchaseOrders?.(result);
  }

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        오늘 함께 제조할 처방들을 하나씩 검색해서 목표 제조량과 함께 &ldquo;제조 목록&rdquo;에 담으세요.
        목록에 담긴 처방 전체를 기준으로 BOM 중 재고 관리 대상 원료(1ACA, 1BSA, 1CLA, 1FRA, 1OLA, 1LQA, 1WXA)의
        필요량을 합산해서 현재 재고와 비교하고, 부족한 원료만 모아서 보여줍니다(같은 원료가 여러 처방에 쓰였으면 자동으로 합산됩니다).
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 검색 · 목록에 추가</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사, 확정코드 검색" />
          <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
        </div>
        {s.formulas.length > 0 && (
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                    <td><button className="v50-button-light" onClick={() => s.stageFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {s.staged && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 800 }}>
              선택됨: {s.staged.formula_code} · {s.staged.formula_name} · Rev {s.staged.revision}
            </div>
            <label style={{ display: "grid", gap: 6, fontWeight: 800, maxWidth: 180 }}>
              목표 제조량(kg)
              <input
                className="v50-input" type="number" value={s.stagedQtyKg}
                onChange={(e) => s.updateStagedQtyKg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && s.addStagedToList()}
              />
            </label>
            <button className="v50-button" onClick={s.addStagedToList} disabled={s.adding}>{s.adding ? "추가 중…" : "+ 목록에 추가"}</button>
          </div>
        )}
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>제조 목록 ({s.list.length}건)</h2>
          {s.list.length > 0 && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={s.clearList}>전체 비우기</button>}
        </div>
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th>목표 제조량(kg)</th><th></th></tr></thead>
            <tbody>
              {s.list.map((item, idx) => (
                <tr key={`${item.formula_code}-${item.revision}`}>
                  <td>{item.formula_code}</td>
                  <td>{item.formula_name || "-"}</td>
                  <td>{item.revision}</td>
                  <td>{item.confirmed_code || "-"}</td>
                  <td>
                    <input
                      className="v50-input" type="number" style={{ width: 120 }}
                      value={item.target_qty_kg || ""}
                      onChange={(e) => s.updateListQty(idx, e.target.value)}
                    />
                  </td>
                  <td><button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeFromList(idx)}>삭제</button></td>
                </tr>
              ))}
              {s.list.length === 0 && (
                <tr><td colSpan={6} style={{ color: "#94a3b8", textAlign: "center" }}>처방을 검색해서 목록에 담으세요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>합산 부족 원료 목록</h2>
          {onCreatePurchaseOrders && (
            <button className="v50-button" onClick={handleCreatePurchaseOrders} disabled={s.shortageRows.length === 0}>
              발주서 만들기
            </button>
          )}
        </div>
        <p className="v50-desc" style={{ marginBottom: 8 }}>
          단가·MOQ는 원료관리에 등록된 값을 그대로 가져옵니다. 단가가 비어있는 원료는 발주 금액을 계산할 수 없어 &ldquo;-&rdquo;로 표시됩니다.
          MOQ는 원료가 포장되어 나오는 단위(예: 15kg들이 포장)이므로, <b>발주량</b>은 부족량을 그 포장단위의 배수로 올림한 값으로
          자동 계산되고(예: 부족량 40kg·MOQ 15kg → 포장 3개 = 45kg) 발주 금액도 그 발주량 기준으로 계산됩니다(MOQ가 숫자가 아닌 값이면
          올림 없이 부족량 그대로 씁니다).
          &ldquo;발주서 만들기&rdquo;를 누르면 원료관리에 등록된 공급사 기준으로 공급사별 발주 초안을 만들어 원료 발주관리 화면으로 보냅니다
          (자동 저장되지 않으며, 내용을 확인한 뒤 직접 저장해야 합니다. 공급사가 등록 안 된 원료는 초안에 포함되지 않습니다).
        </p>
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead>
              <tr>
                <th>원료코드</th><th>원료명</th><th>필요량(kg)</th><th>현재재고량(kg)</th><th>부족량(kg)</th>
                <th>단가</th><th>MOQ</th><th>발주량(kg)</th><th>발주 금액</th>
              </tr>
            </thead>
            <tbody>
              {s.shortageRows.map((r) => {
                const orderQty = r.order_qty ?? r.shortage_qty;
                const moqApplied = orderQty > r.shortage_qty;
                return (
                  <tr key={r.raw_code}>
                    <td>{r.raw_code}</td>
                    <td style={{ color: "#dc2626", fontWeight: 700 }}>{r.raw_name}</td>
                    <td>{fmt(r.required_qty)}</td>
                    <td>{fmt(r.current_stock)}</td>
                    <td style={{ color: "#dc2626", fontWeight: 800 }}>{fmt(r.shortage_qty)}</td>
                    <td>{fmtMoney(r.unit_price, r.currency)}</td>
                    <td>{r.moq || "-"}</td>
                    <td style={{ fontWeight: 800, color: moqApplied ? "#b45309" : undefined }} title={moqApplied ? "MOQ 적용 - 부족량보다 MOQ만큼 더 발주합니다." : undefined}>
                      {fmt(orderQty)}{moqApplied && " (MOQ)"}
                    </td>
                    <td style={{ fontWeight: 800 }}>{r.unit_price != null ? fmtMoney(r.order_amount, r.currency) : "-"}</td>
                  </tr>
                );
              })}
              {s.shortageRows.length === 0 && (
                <tr><td colSpan={9}>{s.loading ? "불러오는 중..." : s.list.length === 0 ? "제조 목록에 처방을 담으세요." : "부족 원료가 없습니다."}</td></tr>
              )}
            </tbody>
            {s.shortageRows.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={8} style={{ textAlign: "right" }}>총 발주 금액</td>
                  <td>{fmtMoney(s.totalOrderAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          비고
          <textarea className="v50-textarea" rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || s.list.length === 0}>{s.saving ? "저장 중…" : "저장"}</button>
          <button className="v50-button-light" onClick={s.printCurrent} disabled={s.list.length === 0}>PDF 저장</button>
          {auth.canExportData && <button className="v50-button-light" onClick={s.downloadExcelCurrent} disabled={s.list.length === 0}>엑셀 다운로드</button>}
        </div>
      </section>

      <section className="v50-panel">
        <h2>저장 이력</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>저장일시</th><th>대상 처방</th><th>목표 제조량 합계(kg)</th><th>부족 원료 수</th><th>비고</th><th style={{ width: 220 }}>작업</th></tr></thead>
            <tbody>
              {s.history.map((h) => {
                const totalQty = h.formulas.reduce((sum, f) => sum + (f.target_qty_kg || 0), 0);
                const formulaLabel = h.formulas.length === 0
                  ? "-"
                  : h.formulas.length === 1
                    ? h.formulas[0].formula_code
                    : `${h.formulas[0].formula_code} 외 ${h.formulas.length - 1}건`;
                return (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at || "").toLocaleString("ko-KR")}</td>
                    <td title={h.formulas.map((f) => f.formula_code).join(", ")}>{formulaLabel}</td>
                    <td>{fmt(totalQty)}</td>
                    <td>{h.shortage_rows.length}</td>
                    <td>{h.note || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="v50-button-light" onClick={() => s.loadFromHistory(h)}>불러오기</button>
                        <button className="v50-button-light" onClick={() => s.printHistoryItem(h)}>PDF</button>
                        {auth.canExportData && <button className="v50-button-light" onClick={() => s.downloadExcelHistoryItem(h)}>엑셀</button>}
                        <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {s.history.length === 0 && <tr><td colSpan={6}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
