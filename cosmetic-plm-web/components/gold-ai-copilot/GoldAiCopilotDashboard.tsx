"use client";

import { useGoldAiCopilot } from "@/hooks/useGoldAiCopilot";
import AiBadge from "./common/AiBadge";

export default function GoldAiCopilotDashboard() {
  const s = useGoldAiCopilot();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 04-A AI Copilot Complete</h1>
        <p style={{ color: "#6b7280" }}>Validation, Cost, Intelligence, Document 결과를 통합하여 AI Copilot Action Plan을 생성합니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.formulas.length} />
          <Kpi title="AI Runs" value={s.runs.length} />
          <Kpi title="Actions" value={s.actions.length} />
          <Kpi title="Selected" value={s.selected ? `${s.selected.formula_code}/${s.selected.revision}` : "-"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Selection</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="처방코드, 처방명 검색" />
          <button onClick={() => s.loadFormulas(s.search)} disabled={s.loading}>Search</button>
        </div>
        <table style={table()}><thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Open</th></tr></thead><tbody>
          {s.formulas.map((x) => (
            <tr key={`${x.formula_code}-${x.revision}`}>
              <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.status}</td><td>{x.total_percent}</td>
              <td><button onClick={() => s.openFormula(x)}>Open</button></td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>2. Run AI Copilot</h2>
        <p>선택 처방: <strong>{s.selected ? `${s.selected.formula_code} / ${s.selected.revision}` : "없음"}</strong></p>
        <div style={{ display: "grid", gap: 8 }}>
          <select style={input()} value={s.commandType} onChange={(e) => s.setCommandType(e.target.value as any)}>
            <option value="FORMULA_REVIEW">FORMULA_REVIEW</option>
            <option value="COST_OPTIMIZATION">COST_OPTIMIZATION</option>
            <option value="STABILITY_REVIEW">STABILITY_REVIEW</option>
            <option value="REGULATION_REVIEW">REGULATION_REVIEW</option>
            <option value="DOCUMENT_PACKAGE">DOCUMENT_PACKAGE</option>
            <option value="LAUNCH_READINESS">LAUNCH_READINESS</option>
          </select>
          <textarea style={{ ...input(), minHeight: 90 }} value={s.prompt} onChange={(e) => s.setPrompt(e.target.value)} />
          <button onClick={s.runCopilot} disabled={s.loading || !s.selected}>Run AI Copilot</button>
        </div>
      </section>

      <section style={section()}>
        <h2>3. AI Run History</h2>
        <table style={table()}><thead><tr><th>Run</th><th>Command</th><th>Status</th><th>Prompt</th><th>Created</th><th>Open</th></tr></thead><tbody>
          {s.runs.map((run) => (
            <tr key={run.run_code}>
              <td>{run.run_code}</td><td>{run.command_type}</td><td><AiBadge value={run.status} /></td><td>{run.user_prompt}</td><td>{run.created_at}</td>
              <td><button onClick={() => s.openRun(run)}>Open Actions</button></td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>4. AI Action Plan</h2>
        <table style={table()}><thead><tr><th>Priority</th><th>Category</th><th>Message</th><th>Suggested Action</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {s.actions.map((action) => (
            <tr key={action.id || `${action.run_code}-${action.message}`}>
              <td><AiBadge value={action.priority} /></td><td>{action.action_category}</td><td>{action.message}</td><td>{action.suggested_action}</td><td><AiBadge value={action.status} /></td>
              <td>{action.id ? <><button onClick={() => s.changeActionStatus(action, "DONE")} style={{ marginRight: 6 }}>Done</button><button onClick={() => s.changeActionStatus(action, "HOLD")}>Hold</button></> : "-"}</td>
            </tr>
          ))}
        </tbody></table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string | number; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#7c3aed" }}>{value}</div></div>;
}
function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 260 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
