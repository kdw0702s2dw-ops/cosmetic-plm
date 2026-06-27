"use client";

import { useGoldReleaseCenter } from "@/hooks/useGoldReleaseCenter";
import ReleaseBadge from "./common/ReleaseBadge";

export default function GoldReleaseCenterDashboard() {
  const s = useGoldReleaseCenter();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 05-A Dashboard & Release Center</h1>
        <p style={{ color: "#6b7280" }}>
          Formula, Document, AI, Intelligence 상태를 통합해 Release 후보와 Go-Live 체크리스트를 관리합니다.
        </p>
        {s.kpi && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Kpi title="Formulas" value={s.kpi.total_formulas} />
            <Kpi title="Approved" value={s.kpi.approved_formulas} />
            <Kpi title="Locked" value={s.kpi.locked_formulas} />
            <Kpi title="Documents" value={s.kpi.generated_documents} />
            <Kpi title="Approved Docs" value={s.kpi.approved_documents} />
            <Kpi title="AI Runs" value={s.kpi.ai_runs} />
            <Kpi title="Open AI" value={s.kpi.open_ai_actions} />
            <Kpi title="Avg Score" value={s.kpi.avg_score} />
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button onClick={s.loadAll} disabled={s.loading}>Refresh Release Center</button>
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Release Candidates</h2>
        <table style={table()}>
          <thead>
            <tr><th>Code</th><th>Name</th><th>Rev</th><th>Formula Status</th><th>Score</th><th>Docs</th><th>Approved Docs</th><th>Open AI</th><th>Release</th><th>Open</th></tr>
          </thead>
          <tbody>
            {s.candidates.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td>
                <td>{x.formula_name}</td>
                <td>{x.revision}</td>
                <td>{x.formula_status}</td>
                <td>{x.overall_score ?? "-"}</td>
                <td>{x.document_count}</td>
                <td>{x.approved_document_count}</td>
                <td>{x.open_ai_actions}</td>
                <td><ReleaseBadge value={x.release_status} /></td>
                <td><button onClick={() => s.openCandidate(x)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Release Checklist</h2>
        <p>선택 후보: <strong>{s.selected ? `${s.selected.formula_code} / ${s.selected.revision}` : "없음"}</strong></p>
        <button onClick={s.generateChecklist} disabled={s.loading || !s.selected}>Generate Checklist</button>
        <table style={{ ...table(), marginTop: 12 }}>
          <thead><tr><th>Area</th><th>Item</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {s.checklist.map((x, idx) => (
              <tr key={x.id || idx}>
                <td>{x.area}</td>
                <td>{x.checklist_item}</td>
                <td><ReleaseBadge value={x.status} /></td>
                <td>{x.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string | number; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#059669" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
