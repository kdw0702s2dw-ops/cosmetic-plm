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

      <section className="v50-split">
        <article className="v50-panel">
          <h2>원료 검색/선택</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.rawKeyword} onChange={(e) => s.setRawKeyword(e.target.value)} placeholder="원료명, INCI, Trade Name 검색" />
            <button className="v50-button" onClick={() => s.loadRaws()}>검색</button>
          </div>
          <div style={{ display: "grid", gap: 8, maxHeight: 420, overflow: "auto" }}>
            {s.raws.map((raw) => (
              <article key={raw.raw_code} className="v50-card" style={{ padding: 12 }}>
                <strong>{raw.raw_name}</strong>
                <div style={{ color: "#64748b", fontSize: 13 }}>{raw.trade_name || "-"} · {raw.inci_en || raw.inci_kr || "-"} · {Number(raw.unit_price || 0).toLocaleString()}원/kg</div>
                <button className="v50-button-light" style={{ marginTop: 8 }} onClick={() => s.addRaw(raw)}>BOM에 추가</button>
              </article>
            ))}
          </div>
        </article>

        <article className="v50-panel">
          <h2>자동 전성분</h2>
          <p style={{ lineHeight: 1.8 }}>{s.inciList || "BOM 원료를 추가하면 자동 생성됩니다."}</p>
        </article>
      </section>

      <section className="v50-panel">
        <h2>BOM 편집</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>No</th><th>Phase</th><th>원료명</th><th>INCI</th><th>함량%</th><th>단가</th><th>원가</th><th>기능</th><th>삭제</th></tr></thead>
            <tbody>
              {s.lines.map((line) => (
                <tr key={`${line.formula_code}-${line.revision}-${line.line_no}`}>
                  <td>{line.line_no}</td>
                  <td><input className="v50-input" value={line.phase || "A"} onChange={(e) => s.updateLine(line, { phase: e.target.value })} /></td>
                  <td>{line.raw_name}</td>
                  <td>{line.inci_kr || line.inci_en}</td>
                  <td><input className="v50-input" type="number" value={line.percentage || 0} onChange={(e) => s.updateLine(line, { percentage: Number(e.target.value) })} /></td>
                  <td>{Number(line.unit_price || 0).toLocaleString()}</td>
                  <td>{Number(line.cost_per_kg || 0).toLocaleString()}</td>
                  <td>{line.function_kr || line.function_en}</td>
                  <td><button className="v50-button-light" onClick={() => s.removeLine(line)}>삭제</button></td>
                </tr>
              ))}
              {s.lines.length === 0 && <tr><td colSpan={9}>원료를 검색해서 BOM에 추가하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
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
