"use client";

import { useSolubleHgCheck } from "@/hooks/useSolubleHgCheck";
import { LOSS_RATE_PRESETS } from "@/services/sprint2/insolubleHgService";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

const COMPONENTS: { codeKey: "component1_raw_code" | "component2_raw_code" | "component3_raw_code"; weightKey: "component1_weight" | "component2_weight" | "component3_weight"; label: string }[] = [
  { codeKey: "component1_raw_code", weightKey: "component1_weight", label: "관리기준1 (필름1)" },
  { codeKey: "component2_raw_code", weightKey: "component2_weight", label: "관리기준2 (원단)" },
  { codeKey: "component3_raw_code", weightKey: "component3_weight", label: "관리기준3 (필름2)" },
];

export default function SolubleHgPanel() {
  const s = useSolubleHgCheck();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 관리기준 3개(필름1/원단/필름2)와 칼선 조건을 입력하면 도포량·부자재중량을 실시간으로 계산합니다.
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
        <h2>입력값 - 관리기준 3개</h2>
        <div className="v50-grid-2">
          {COMPONENTS.map((c) => (
            <div key={c.codeKey} style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 800 }}>{c.label}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="v50-input" placeholder="원료코드" style={{ flex: 1 }} value={s.headerInput[c.codeKey]} onChange={(e) => s.updateTextField(c.codeKey, e.target.value)} />
                <input className="v50-input" type="number" placeholder="중량" style={{ width: 100 }} value={s.headerInput[c.weightKey] || ""} onChange={(e) => s.updateNumericField(c.weightKey, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>입력값 - 나머지</h2>
        <div className="v50-grid-2">
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            총중량
            <input className="v50-input" type="number" value={s.headerInput.total_weight || ""} onChange={(e) => s.updateNumericField("total_weight", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            칼선(No.)
            <input className="v50-input" value={s.headerInput.cutting_line_no} onChange={(e) => s.updateTextField("cutting_line_no", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            칼선면적 A4(종이) 중량
            <input className="v50-input" type="number" value={s.headerInput.cutting_area_a4_weight || ""} onChange={(e) => s.updateNumericField("cutting_area_a4_weight", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            10x10cm A4(종이) 중량
            <input className="v50-input" type="number" value={s.headerInput.a4_10x10_weight || ""} onChange={(e) => s.updateNumericField("a4_10x10_weight", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            로스율
            <select className="v50-input" value={s.headerInput.loss_rate_preset_key ?? "custom"} onChange={(e) => s.selectLossRatePreset(e.target.value)}>
              {LOSS_RATE_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label} ({(p.rate * 100).toFixed(0)}%)</option>)}
              <option value="custom">직접 입력</option>
            </select>
          </label>
          {s.headerInput.loss_rate_preset_key === null && (
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              로스율 직접 입력(%)
              <input className="v50-input" type="number" value={s.headerInput.loss_rate * 100 || ""} onChange={(e) => s.updateCustomLossRate(e.target.value)} />
            </label>
          )}
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            문안용 도포량 (수동)
            <input className="v50-input" type="number" value={s.headerInput.manual_notice_coat_amount ?? ""} onChange={(e) => s.updateManualNoticeCoatAmount(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>계산 결과</h2>
        <div className="v50-grid-4">
          <Kpi label="총중량 상한" value={fmt(s.headerResult.total_weight_max)} />
          <Kpi label="도포량" value={fmt(s.headerResult.coat_amount)} />
          <Kpi label="도포량 상한" value={fmt(s.headerResult.coat_amount_max)} />
          <Kpi label="면적비(R)" value={fmt(s.headerResult.area_ratio)} />
          <Kpi label="칼선도포량" value={fmt(s.headerResult.cutting_line_coat_amount)} />
          <Kpi label="로스반영 도포량(필름제외)" value={fmt(s.headerResult.loss_adjusted_coat_amount)} />
          <Kpi label="제조표준서 코팅기준(필름제외)" value={fmt(s.headerResult.standard_coating_amount)} />
          <Kpi label="부자재중량1" value={fmt(s.headerResult.component1_material_weight)} />
          <Kpi label="부자재중량2" value={fmt(s.headerResult.component2_material_weight)} />
          <Kpi label="부자재중량3" value={fmt(s.headerResult.component3_material_weight)} />
          <Kpi label="부자재 중량" value={fmt(s.headerResult.total_material_weight)} />
          <Kpi label="부자재+겔 중량" value={fmt(s.headerResult.material_plus_gel_weight)} />
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
              <thead><tr><th>저장일시</th><th>총중량</th><th>부자재+겔 중량</th><th>비고</th><th style={{ width: 220 }}>작업</th></tr></thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at || "").toLocaleString("ko-KR")}</td>
                    <td>{fmt(h.total_weight)}</td>
                    <td>{fmt(h.material_plus_gel_weight)}</td>
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
