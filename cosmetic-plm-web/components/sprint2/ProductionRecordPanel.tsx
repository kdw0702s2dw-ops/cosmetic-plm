"use client";

import { useProductionRecord } from "@/hooks/useProductionRecord";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export default function ProductionRecordPanel() {
  const s = useProductionRecord();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 Lot No.별로 목표 제조량, 코팅량, 성형품 수량 등 생산실적을 기록으로 남깁니다.
        Lot No.는 같은 처방(같은 Revision) 내에서만 유일해야 합니다.
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
        <h2>생산실적 입력</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            목표 제조량(kg)
            <input className="v50-input" type="number" value={s.targetQtyKg || ""} onChange={(e) => s.updateTargetQtyKg(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            Lot No.
            <input className="v50-input" value={s.lotNo} onChange={(e) => s.setLotNo(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            생산일자
            <input className="v50-input" type="date" value={s.productionDate} onChange={(e) => s.setProductionDate(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            코팅량 (실측)
            <input className="v50-input" type="number" value={s.coatingQty} onChange={(e) => s.setCoatingQty(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            성형품 수량 (실측)
            <input className="v50-input" type="number" value={s.moldedQty} onChange={(e) => s.setMoldedQty(e.target.value)} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 12 }}>
          비고
          <textarea className="v50-textarea" rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || !s.formula}>{s.saving ? "저장 중…" : "저장"}</button>
          {s.auth.canExportData && (
            <button className="v50-button-light" onClick={s.downloadExcel} disabled={!s.formula}>엑셀 다운로드</button>
          )}
        </div>
      </section>

      <section className="v50-panel">
        <h2>저장 이력 (Lot No.별)</h2>
        {!s.formula ? (
          <p style={{ color: "#64748b" }}>처방을 선택하면 이력이 표시됩니다.</p>
        ) : (
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead>
                <tr>
                  <th>생산일자</th><th>Lot No.</th><th>목표 제조량(kg)</th><th>코팅량</th><th>성형품 수량</th><th>등록자</th><th>비고</th><th style={{ width: 90 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.production_date}</td>
                    <td>{h.lot_no}</td>
                    <td>{fmt(h.target_qty_kg)}</td>
                    <td>{fmt(h.coating_qty)}</td>
                    <td>{fmt(h.molded_qty)}</td>
                    <td>{h.created_by || "-"}</td>
                    <td>{h.note || "-"}</td>
                    <td>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                    </td>
                  </tr>
                ))}
                {s.history.length === 0 && <tr><td colSpan={8}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
