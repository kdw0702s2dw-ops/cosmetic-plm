"use client";

import { useEnterpriseAiAutopilot } from "@/hooks/useEnterpriseAiAutopilot";
import AutopilotBadge from "./common/AutopilotBadge";

export default function EnterpriseAiAutopilotDashboard() {
  const s = useEnterpriseAiAutopilot();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise PLM v4.0 AI Research Platform Pack 03</h1>
        <p style={{ color: "#6b7280" }}>
          자연어 요청 → AI 처방 생성 → Gold Formula 등록 → Validation/Cost/Intelligence/Document/Manufacturing 후속 흐름을 자동 생성합니다.
        </p>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. AI Autopilot Request</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          <input style={input()} value={s.title} onChange={(e) => s.setTitle(e.target.value)} placeholder="Title" />
          <select style={input()} value={s.productType} onChange={(e) => s.setProductType(e.target.value)}>
            <option value="Cream">Cream</option>
            <option value="Serum">Serum</option>
          </select>
          <input style={input()} value={s.claim} onChange={(e) => s.setClaim(e.target.value)} placeholder="Claim" />
          <input style={input()} type="number" value={s.targetCost ?? ""} onChange={(e) => s.setTargetCost(e.target.value ? Number(e.target.value) : null)} placeholder="Target Cost/kg" />
          <input style={input()} value={s.targetCountry} onChange={(e) => s.setTargetCountry(e.target.value)} placeholder="Country" />
        </div>
        <textarea style={{ ...input(), width: "100%", minHeight: 100, marginTop: 10 }} value={s.requestText} onChange={(e) => s.setRequestText(e.target.value)} />
        <button style={{ marginTop: 10 }} onClick={s.run} disabled={s.loading}>Run AI Autopilot</button>
      </section>

      <section style={section()}>
        <h2>2. Autopilot Runs</h2>
        <table style={table()}>
          <thead><tr><th>Run</th><th>Title</th><th>Formula</th><th>Status</th><th>Created</th><th>Open</th></tr></thead>
          <tbody>
            {s.runs.map((r) => (
              <tr key={r.run_code}>
                <td>{r.run_code}</td><td>{r.title}</td><td>{r.generated_formula_code}/{r.generated_revision}</td>
                <td><AutopilotBadge value={r.status} /></td><td>{r.created_at}</td>
                <td><button onClick={() => s.open(r)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {s.selected && (
        <section style={section()}>
          <h2>3. Workflow Steps</h2>
          <p>생성 처방: <strong>{s.selected.generated_formula_code}/{s.selected.generated_revision}</strong></p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <a href="/enterprise-gold-formula-validation">Validation</a>
            <a href="/enterprise-gold-formula-cost">Cost</a>
            <a href="/enterprise-gold-intelligence">Intelligence</a>
            <a href="/enterprise-gold-documents">Documents</a>
            <a href="/enterprise-gold-release">Release</a>
            <a href="/enterprise-gold-manufacturing">Manufacturing</a>
          </div>
          <table style={table()}>
            <thead><tr><th>No</th><th>Key</th><th>Name</th><th>Status</th><th>Message</th><th>Output</th></tr></thead>
            <tbody>
              {s.steps.map((step) => (
                <tr key={step.id}>
                  <td>{step.step_no}</td><td>{step.step_key}</td><td>{step.step_name}</td>
                  <td><AutopilotBadge value={step.status} /></td><td>{step.message}</td>
                  <td><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(step.output_json || {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
