"use client";

import { useGoldIntelligenceCenter } from "@/hooks/useGoldIntelligenceCenter";
import IntelligenceBadge from "./common/IntelligenceBadge";

export default function FormulaIntelligenceCenter() {
  const s = useGoldIntelligenceCenter();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 02-C3 Formula Intelligence Center</h1>
        <p style={{ color: "#6b7280" }}>
          Validation, Cost, Stability, Regulation, Recommendation을 하나의 연구원 작업 화면으로 통합합니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.formulas.length} />
          <Kpi title="Overall" value={s.score ? s.score.overall_score : "-"} />
          <Kpi title="Status" value={s.score ? s.score.status : "-"} />
          <Kpi title="Stability Risks" value={s.stabilityRisks.length} />
          <Kpi title="Regulation Risks" value={s.regulationRisks.length} />
          <Kpi title="Recommendations" value={s.recommendations.length} />
        </div>

        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Selection</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="처방코드, 처방명 검색" />
          <button onClick={() => s.loadFormulas(s.search)} disabled={s.loading}>Search</button>
        </div>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Valid</th><th>Open</th></tr></thead>
          <tbody>
            {s.formulas.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.status}</td><td>{x.total_percent}</td>
                <td><IntelligenceBadge value={x.validation_status} /></td>
                <td><button onClick={() => s.openFormula(x)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Run Intelligence</h2>
        <p>선택 처방: <strong>{s.selected ? `${s.selected.formula_code} / ${s.selected.revision}` : "없음"}</strong></p>
        <button onClick={s.runIntelligence} disabled={s.loading || !s.selected}>Run Intelligence Center</button>
      </section>

      {s.score && (
        <section style={section()}>
          <h2>3. Formula Score</h2>
          <table style={table()}>
            <thead><tr><th>Validation</th><th>Cost</th><th>Stability</th><th>Regulation</th><th>Document</th><th>Overall</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td>{s.score.validation_score}</td>
                <td>{s.score.cost_score}</td>
                <td>{s.score.stability_score}</td>
                <td>{s.score.regulation_score}</td>
                <td>{s.score.document_score}</td>
                <td><strong>{s.score.overall_score}</strong></td>
                <td><IntelligenceBadge value={s.score.status} /></td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section style={section()}>
        <h2>4. Stability Risks</h2>
        <table style={table()}>
          <thead><tr><th>Area</th><th>Risk</th><th>Message</th><th>Recommendation</th></tr></thead>
          <tbody>
            {s.stabilityRisks.map((x, idx) => (
              <tr key={x.id || idx}>
                <td>{x.area}</td><td><IntelligenceBadge value={x.risk_level} /></td><td>{x.message}</td><td>{x.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>5. Regulation Risks</h2>
        <table style={table()}>
          <thead><tr><th>Country</th><th>Raw</th><th>Risk</th><th>Message</th><th>Recommendation</th></tr></thead>
          <tbody>
            {s.regulationRisks.map((x, idx) => (
              <tr key={x.id || idx}>
                <td>{x.country}</td><td>{x.raw_code}</td><td><IntelligenceBadge value={x.risk_level} /></td><td>{x.message}</td><td>{x.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>6. Recommendations</h2>
        <table style={table()}>
          <thead><tr><th>Priority</th><th>Category</th><th>Message</th><th>Action</th></tr></thead>
          <tbody>
            {s.recommendations.map((x, idx) => (
              <tr key={x.id || idx}>
                <td>{x.priority}</td><td>{x.category}</td><td>{x.message}</td><td>{x.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#7c3aed" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 280 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
