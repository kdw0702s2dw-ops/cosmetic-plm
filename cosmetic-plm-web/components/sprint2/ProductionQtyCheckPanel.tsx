"use client";

import { useProductionQtyCheck } from "@/hooks/useProductionQtyCheck";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

// 계산 결과/시나리오별 샘플 수량 표는 화면 표시만 정수로 반올림한다 (저장/PDF/엑셀은 원본 정밀도 유지)
function fmtInt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return String(Math.round(v));
}

const HEADER_FIELDS: { key: "manufacture_qty_kg" | "loss_percent" | "coat_max_10x10" | "coating_length_cm" | "coating_width_cm" | "coating_loss_m"; label: string }[] = [
  { key: "manufacture_qty_kg", label: "제조량(kg)" },
  { key: "loss_percent", label: "로스(%)" },
  { key: "coat_max_10x10", label: "10x10(도포량 Max)" },
  { key: "coating_length_cm", label: "코팅길이(cm)" },
  { key: "coating_width_cm", label: "코팅폭(cm)" },
  { key: "coating_loss_m", label: "코팅 로스(m)" },
];

export default function ProductionQtyCheckPanel() {
  const s = useProductionQtyCheck();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 제조 조건을 입력하면 코팅원단 총 수, 이론적/실제 수량, 시나리오별 샘플 수량을 실시간으로 계산합니다.
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
        <h2>입력값</h2>
        <div className="v50-grid-2">
          {HEADER_FIELDS.map((f) => (
            <label key={f.key} style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              {f.label}
              <input
                className="v50-input" type="number"
                value={s.headerInput[f.key] || ""}
                onChange={(e) => s.updateHeaderField(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>계산 결과</h2>
        <div className="v50-grid-4">
          <Kpi label="순수 사용가능 중량(g)" value={fmtInt(s.headerResult.usable_weight_g)} />
          <Kpi label="(m)/1EA" value={fmtInt(s.headerResult.m_per_ea)} />
          <Kpi label="코팅원단 총 수(개)" value={fmtInt(s.headerResult.coating_fabric_count)} />
          <Kpi label="이론적 수량(m)" value={fmtInt(s.headerResult.theoretical_qty_m)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Kpi label="실제 수량(m)" value={fmtInt(s.headerResult.actual_qty_m)} />
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>시나리오별 샘플 수량</h2>
          <button className="v50-button-light" onClick={s.addScenarioRow}>+ 행 추가</button>
        </div>
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead><tr><th>성형품 사이즈(m)</th><th>칼선 수량</th><th>원단(m)</th><th>샘플 수량</th><th></th></tr></thead>
            <tbody>
              {s.scenarioResults.map((r, i) => (
                <tr key={i}>
                  <td><input className="v50-input" type="number" style={{ width: 100 }} value={s.scenarioRows[i].molded_size_m || ""} onChange={(e) => s.updateScenarioRow(i, { molded_size_m: e.target.value === "" ? 0 : Number(e.target.value) })} /></td>
                  <td><input className="v50-input" type="number" style={{ width: 90 }} value={s.scenarioRows[i].cutting_line_qty || ""} onChange={(e) => s.updateScenarioRow(i, { cutting_line_qty: e.target.value === "" ? 0 : Number(e.target.value) })} /></td>
                  <td>{fmtInt(s.headerResult.actual_qty_m)}</td>
                  <td style={{ fontWeight: 800 }}>{fmtInt(r.sample_qty)}</td>
                  <td><button className="v50-button-light" onClick={() => s.removeScenarioRow(i)}>삭제</button></td>
                </tr>
              ))}
              {s.scenarioResults.length === 0 && <tr><td colSpan={5}>행을 추가하세요.</td></tr>}
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
              <thead><tr><th>저장일시</th><th>제조량(kg)</th><th>실제 수량(m)</th><th>비고</th><th style={{ width: 220 }}>작업</th></tr></thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at || "").toLocaleString("ko-KR")}</td>
                    <td>{fmt(h.manufacture_qty_kg)}</td>
                    <td>{fmt(h.actual_qty_m)}</td>
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

function Kpi({ label, value }: { label: string; value: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div></article>;
}
