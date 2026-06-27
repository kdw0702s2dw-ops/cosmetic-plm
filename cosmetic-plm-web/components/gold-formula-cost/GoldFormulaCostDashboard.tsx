"use client";

import { useGoldFormulaCost } from "@/hooks/useGoldFormulaCost";
import CostBadge from "./common/CostBadge";

export default function GoldFormulaCostDashboard() {
  const s = useGoldFormulaCost();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 02-C2 Formula Cost Engine</h1>
        <p style={{ color: "#6b7280" }}>
          실제 처방 라인과 원료마스터 단가를 연결하여 kg당 원가, 제조 규모별 원가, 원가 기여도, 절감 추천을 계산합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.formulas.length} />
          <Kpi title="Cost/kg" value={s.summary ? `${Number(s.summary.total_cost_per_kg).toLocaleString()}원` : "-"} />
          <Kpi title="100kg" value={s.summary ? `${Number(s.summary.cost_100kg).toLocaleString()}원` : "-"} />
          <Kpi title="Status" value={s.summary ? s.summary.status : "-"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Selection</h2>
        <button onClick={s.loadFormulas} disabled={s.loading}>Refresh</button>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Open</th></tr></thead>
          <tbody>
            {s.formulas.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.status}</td><td>{x.total_percent}</td>
                <td><button onClick={() => s.openFormula(x)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Cost Run</h2>
        <p>선택 처방: <strong>{s.selected ? `${s.selected.formula_code} / ${s.selected.revision}` : "없음"}</strong></p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input style={input()} type="number" value={s.targetCost ?? ""} onChange={(e) => s.setTargetCost(e.target.value ? Number(e.target.value) : null)} placeholder="목표 kg당 원가" />
          <button onClick={s.runCost} disabled={s.loading || !s.selected}>Run Cost Engine</button>
        </div>
      </section>

      {s.summary && (
        <section style={section()}>
          <h2>3. Cost Summary</h2>
          <table style={table()}>
            <thead><tr><th>Cost/kg</th><th>10kg</th><th>100kg</th><th>500kg</th><th>1000kg</th><th>Target</th><th>Gap/kg</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td>{Number(s.summary.total_cost_per_kg).toLocaleString()}</td>
                <td>{Number(s.summary.cost_10kg).toLocaleString()}</td>
                <td>{Number(s.summary.cost_100kg).toLocaleString()}</td>
                <td>{Number(s.summary.cost_500kg).toLocaleString()}</td>
                <td>{Number(s.summary.cost_1000kg).toLocaleString()}</td>
                <td>{s.summary.target_cost_per_kg ? Number(s.summary.target_cost_per_kg).toLocaleString() : "-"}</td>
                <td>{s.summary.gap_per_kg !== null ? Number(s.summary.gap_per_kg).toLocaleString() : "-"}</td>
                <td><CostBadge value={s.summary.status} /></td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section style={section()}>
        <h2>4. Cost Contribution</h2>
        <table style={table()}>
          <thead><tr><th>Line</th><th>Phase</th><th>Raw</th><th>Name</th><th>%</th><th>Unit Price</th><th>Cost/kg</th><th>Contribution</th><th>Status</th></tr></thead>
          <tbody>
            {s.lines.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}-${x.line_no}`}>
                <td>{x.line_no}</td><td>{x.phase}</td><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.percentage}</td>
                <td>{x.unit_price ? Number(x.unit_price).toLocaleString() : "-"}</td>
                <td>{Number(x.cost_per_kg).toLocaleString()}</td>
                <td>{x.cost_contribution_percent}%</td>
                <td><CostBadge value={x.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>5. Cost Optimization</h2>
        <table style={table()}>
          <thead><tr><th>Priority</th><th>Raw</th><th>Name</th><th>Current Cost/kg</th><th>Expected Saving/kg</th><th>Recommendation</th></tr></thead>
          <tbody>
            {s.recommendations.map((x, idx) => (
              <tr key={x.id || idx}>
                <td>{x.priority}</td><td>{x.raw_code}</td><td>{x.raw_name}</td>
                <td>{Number(x.current_cost_per_kg).toLocaleString()}</td>
                <td>{Number(x.expected_saving_per_kg).toLocaleString()}</td>
                <td>{x.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#059669" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
