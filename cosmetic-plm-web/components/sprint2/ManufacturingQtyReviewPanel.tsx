"use client";

import { useManufacturingQtyReview } from "@/hooks/useManufacturingQtyReview";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export default function ManufacturingQtyReviewPanel() {
  const s = useManufacturingQtyReview();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 목표 제조량을 입력하면, BOM 중 재고 관리 대상 원료(1ACA, 1BSA, 1CLA, 1FRA, 1OLA, 1LQA, 1WXA)의
        필요량을 현재 재고와 비교해 부족한 원료만 보여줍니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
          <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
        </div>
        {s.formula ? (
          <p style={{ color: "#16a34a", fontWeight: 800 }}>
            선택됨: {s.formula.formula_code} · {s.formula.formula_name} · Rev {s.formula.revision} · 확정코드 {s.formula.confirmed_code || "-"}
          </p>
        ) : (
          <p style={{ color: "#94a3b8" }}>처방을 검색해서 선택하세요.</p>
        )}
        {s.formulas.length > 0 && (
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>목표 제조량</h2>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, maxWidth: 220 }}>
          목표 제조량(kg)
          <input className="v50-input" type="number" value={s.targetQtyKg || ""} onChange={(e) => s.updateTargetQtyKg(e.target.value)} />
        </label>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>부족 원료 목록</h2>
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead><tr><th>원료코드</th><th>원료명</th><th>필요량</th><th>현재재고량</th><th>부족량</th></tr></thead>
            <tbody>
              {s.shortageRows.map((r) => (
                <tr key={r.raw_code}>
                  <td>{r.raw_code}</td>
                  <td style={{ color: "#dc2626", fontWeight: 700 }}>{r.raw_name}</td>
                  <td>{fmt(r.required_qty)}</td>
                  <td>{fmt(r.current_stock)}</td>
                  <td style={{ color: "#dc2626", fontWeight: 800 }}>{fmt(r.shortage_qty)}</td>
                </tr>
              ))}
              {s.shortageRows.length === 0 && (
                <tr><td colSpan={5}>{s.loading ? "불러오는 중..." : !s.formula ? "처방을 선택하세요." : "부족 원료가 없습니다."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          비고
          <textarea className="v50-textarea" rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || !s.formula}>{s.saving ? "저장 중…" : "저장"}</button>
          <button className="v50-button-light" onClick={s.printCurrent} disabled={!s.formula}>PDF 저장</button>
          <button className="v50-button-light" onClick={s.downloadExcelCurrent} disabled={!s.formula}>엑셀 다운로드</button>
        </div>
      </section>

      <section className="v50-panel">
        <h2>저장 이력</h2>
        {!s.formula ? (
          <p style={{ color: "#64748b" }}>처방을 선택하면 이력이 표시됩니다.</p>
        ) : (
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>저장일시</th><th>목표 제조량(kg)</th><th>부족 원료 수</th><th>비고</th><th style={{ width: 220 }}>작업</th></tr></thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at || "").toLocaleString("ko-KR")}</td>
                    <td>{fmt(h.target_qty_kg)}</td>
                    <td>{h.shortage_rows.length}</td>
                    <td>{h.note || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="v50-button-light" onClick={() => s.loadFromHistory(h)}>불러오기</button>
                        <button className="v50-button-light" onClick={() => s.printHistoryItem(h)}>PDF</button>
                        <button className="v50-button-light" onClick={() => s.downloadExcelHistoryItem(h)}>엑셀</button>
                        <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {s.history.length === 0 && <tr><td colSpan={5}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
