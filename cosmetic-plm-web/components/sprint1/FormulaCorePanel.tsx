"use client";

import { useSprint1FormulaCore } from "@/hooks/useSprint1FormulaCore";
import "@/styles/enterprise-v50.css";

export default function FormulaCorePanel() {
  const s = useSprint1FormulaCore();

  function updateFormula(key: string, value: any) {
    s.setFormula({ ...s.formula, [key]: value });
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">Sprint 1 처방관리 Core</h1>
          <p className="v50-desc">표준 plm_* DB 기반으로 처방 등록·수정·삭제, BOM 편집, 자동합계, 자동원가, 자동전성분을 먼저 완성합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={s.newFormula}>신규 처방</button>
          <button onClick={s.saveFormula} disabled={s.loading}>저장</button>
          <button onClick={s.removeFormula} disabled={!s.formula.formula_code || s.loading}>삭제</button>
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="총합" value={`${s.total}%`} hint={s.total === 100 ? "정상" : "100% 보정 필요"} />
        <Kpi label="예상원가" value={`${s.cost.toLocaleString()}원`} hint="kg 기준" />
        <Kpi label="원료수" value={`${s.lines.length}개`} hint="BOM Line" />
        <Kpi label="상태" value={s.formula.status || "DRAFT"} hint="처방 상태" />
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 목록</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
            <button className="v50-button" onClick={() => s.loadFormulas()}>검색</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>원가</th><th>열기</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td><td>{Number(f.estimated_cost_per_kg || 0).toLocaleString()}</td>
                    <td><button className="v50-button-light" onClick={() => s.openFormula(f)}>열기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>처방 기본정보</h2>
          <div className="v50-grid-2">
            <Input label="처방코드" value={s.formula.formula_code} onChange={(v) => updateFormula("formula_code", v)} />
            <Input label="Revision" value={s.formula.revision} onChange={(v) => updateFormula("revision", v)} />
            <Input label="처방명" value={s.formula.formula_name} onChange={(v) => updateFormula("formula_name", v)} />
            <Input label="제품유형" value={s.formula.product_type} onChange={(v) => updateFormula("product_type", v)} />
            <Input label="고객사" value={s.formula.customer} onChange={(v) => updateFormula("customer", v)} />
            <Input label="출시국가" value={s.formula.target_country} onChange={(v) => updateFormula("target_country", v)} />
          </div>
          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>컨셉/클레임
            <textarea className="v50-textarea" value={s.formula.claim || ""} onChange={(e) => updateFormula("claim", e.target.value)} />
          </label>
        </article>
      </section>

      <section className="v50-panel">
        <h2>자동 전성분</h2>
        <p style={{ lineHeight: 1.8 }}>{s.inciList || "BOM 원료를 추가하면 자동 생성됩니다."}</p>
      </section>

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>BOM 편집</h2>
          <button className="v50-button-light" onClick={s.addLine}>+ 라인 추가</button>
        </div>
        <p style={{ color: "#64748b", fontSize: 13 }}>원료명 칸에 입력하면 검색 결과가 뜨고, 선택하면 INCI·단가가 자동으로 채워집니다. 최종 반영은 "저장" 버튼을 눌러야 합니다.</p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>No</th><th>Phase</th><th>원료명</th><th>INCI</th><th>함량%</th><th>단가</th><th>원가</th><th>기능</th><th>삭제</th></tr></thead>
            <tbody>
              {s.lines.map((line) => (
                <tr key={line.line_no}>
                  <td>{line.line_no}</td>
                  <td><input className="v50-input" style={{ width: 56 }} value={line.phase || "A"} onChange={(e) => s.updateLine(line.line_no, { phase: e.target.value })} /></td>
                  <td style={{ position: "relative" }}>
                    <input className="v50-input" value={line.raw_name || ""} placeholder="원료명 검색"
                      onChange={(e) => s.searchRawForLine(line.line_no, e.target.value)} />
                    {s.activeRawRow === line.line_no && s.rawHits.length > 0 && (
                      <RawDropdown hits={s.rawHits} onPick={s.pickRawForLine} />
                    )}
                  </td>
                  <td>{line.inci_kr || line.inci_en}</td>
                  <td><input className="v50-input" style={{ width: 72 }} type="number" value={line.percentage || 0} onChange={(e) => s.updateLine(line.line_no, { percentage: Number(e.target.value) })} /></td>
                  <td>{Number(line.unit_price || 0).toLocaleString()}</td>
                  <td>{Number(line.cost_per_kg || 0).toLocaleString()}</td>
                  <td>{line.function_kr || line.function_en}</td>
                  <td><button className="v50-button-light" onClick={() => s.removeLine(line.line_no)}>삭제</button></td>
                </tr>
              ))}
              {s.lines.length === 0 && <tr><td colSpan={9}>"+ 라인 추가"로 원료 라인을 만들고 원료명을 검색하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RawDropdown({ hits, onPick }: { hits: any[]; onPick: (raw: any) => void }) {
  return (
    <div style={{
      position: "absolute", zIndex: 30, top: "100%", left: 0, right: 0,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflow: "auto", textAlign: "left",
    }}>
      {hits.map((raw) => (
        <div key={raw.raw_code} onClick={() => onPick(raw)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          <b>{raw.raw_name}</b> <span style={{ color: "#64748b" }}>{raw.trade_name || raw.inci_en || raw.inci_kr || "-"}</span>
          <span style={{ color: "#16a34a", marginLeft: 8 }}>{Number(raw.unit_price || 0).toLocaleString()}원/kg</span>
        </div>
      ))}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>{label}<input className="v50-input" value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
