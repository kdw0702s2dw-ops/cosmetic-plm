"use client";

import { useEnterpriseAiResearch } from "@/hooks/useEnterpriseAiResearch";
import AiResearchBadge from "./common/AiResearchBadge";

export default function EnterpriseAiResearchDashboard() {
  const s = useEnterpriseAiResearch();
  const lines = s.selected?.result_json?.generated_formula_lines || [];
  const strategy = s.selected?.result_json?.strategy || [];

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise PLM v4.0 AI Research Platform - Pack 01</h1>
        <p style={{ color: "#6b7280" }}>
          자연어 요청을 기반으로 AI 연구 프로젝트, 1차 처방, Action Plan을 생성하고 Gold Formula로 전환합니다.
        </p>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. AI Research Request</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          <input style={input()} value={s.title} onChange={(e) => s.setTitle(e.target.value)} placeholder="Project Title" />
          <select style={input()} value={s.mode} onChange={(e) => s.setMode(e.target.value as any)}>
            <option value="NEW_FORMULA">NEW_FORMULA</option>
            <option value="OPTIMIZE_COST">OPTIMIZE_COST</option>
            <option value="SUBSTITUTE_RAW">SUBSTITUTE_RAW</option>
            <option value="REGULATION_CHECK">REGULATION_CHECK</option>
            <option value="STABILITY_REVIEW">STABILITY_REVIEW</option>
            <option value="DOCUMENT_PLAN">DOCUMENT_PLAN</option>
            <option value="LAUNCH_PLAN">LAUNCH_PLAN</option>
          </select>
          <select style={input()} value={s.productType} onChange={(e) => s.setProductType(e.target.value)}>
            <option value="Cream">Cream</option>
            <option value="Serum">Serum</option>
          </select>
          <input style={input()} value={s.claim} onChange={(e) => s.setClaim(e.target.value)} placeholder="Claim" />
          <input style={input()} type="number" value={s.targetCost ?? ""} onChange={(e) => s.setTargetCost(e.target.value ? Number(e.target.value) : null)} placeholder="Target Cost/kg" />
          <input style={input()} value={s.targetCountry} onChange={(e) => s.setTargetCountry(e.target.value)} placeholder="Country" />
        </div>
        <textarea style={{ ...input(), width: "100%", minHeight: 100, marginTop: 10 }} value={s.prompt} onChange={(e) => s.setPrompt(e.target.value)} />
        <button style={{ marginTop: 10 }} onClick={s.generateProject} disabled={s.loading}>Generate AI Research Project</button>
      </section>

      <section style={section()}>
        <h2>2. AI Research Projects</h2>
        <table style={table()}>
          <thead><tr><th>Project</th><th>Title</th><th>Mode</th><th>Product</th><th>Claim</th><th>Status</th><th>Open</th></tr></thead>
          <tbody>
            {s.projects.map((p) => (
              <tr key={p.project_code}>
                <td>{p.project_code}</td><td>{p.title}</td><td>{p.mode}</td><td>{p.target_product_type}</td><td>{p.target_claim}</td>
                <td><AiResearchBadge value={p.status} /></td>
                <td><button onClick={() => s.openProject(p)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {s.selected && (
        <>
          <section style={section()}>
            <h2>3. Generated Formula - {s.selected.project_code}</h2>
            <div style={{ marginBottom: 10 }}>
              <button onClick={s.applyFormula}>Apply to Gold Formula</button>
            </div>
            <h3>Strategy</h3>
            <ul>{strategy.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
            <table style={table()}>
              <thead><tr><th>No</th><th>Phase</th><th>Raw</th><th>Name</th><th>INCI</th><th>%</th><th>Function</th><th>Reason</th></tr></thead>
              <tbody>
                {lines.map((x: any) => (
                  <tr key={x.line_no}>
                    <td>{x.line_no}</td><td>{x.phase}</td><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.inci_en}</td><td>{x.percentage}</td><td>{x.function_en}</td><td>{x.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={section()}>
            <h2>4. AI Research Actions</h2>
            <table style={table()}>
              <thead><tr><th>Priority</th><th>Category</th><th>Message</th><th>Action</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {s.actions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.priority}</td><td>{a.category}</td><td>{a.message}</td><td>{a.action}</td><td><AiResearchBadge value={a.status} /></td>
                    <td><button onClick={() => s.changeAction(a, "DONE")}>Done</button> <button onClick={() => s.changeAction(a, "HOLD")}>Hold</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
