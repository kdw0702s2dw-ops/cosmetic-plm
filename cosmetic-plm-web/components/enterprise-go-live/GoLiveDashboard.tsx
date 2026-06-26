"use client";

import { useGoLiveFinal } from "@/hooks/useGoLiveFinal";
import GoLiveBadge from "./common/GoLiveBadge";

export default function GoLiveDashboard() {
  const { checklist, quickStart, dataSeeds, issues, stats, message, passItem, markSeedReady, closeIssue } = useGoLiveFinal();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise Go-Live Final Check</h1>
        <p style={{ color: "#6b7280" }}>출근 전 최종 점검 화면입니다. PASS가 충분하면 실제 업무 시작이 가능합니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Kpi title="Decision" value={stats.decision} />
          <Kpi title="PASS" value={`${stats.pass}/${stats.total}`} />
          <Kpi title="WATCH" value={stats.watch} />
          <Kpi title="BLOCK" value={stats.block} />
          <Kpi title="Data Ready" value={`${stats.seedReady}/${stats.seedTotal}`} />
          <Kpi title="Open Issues" value={stats.openIssues} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{message}</p>
      </section>

      <section style={section()}>
        <h2>1. Quick Start</h2>
        <table style={tableStyle()}><thead><tr><th>Order</th><th>Title</th><th>Description</th><th>URL</th></tr></thead><tbody>
          {quickStart.map((x) => <tr key={x.id}><td>{x.order}</td><td>{x.title}</td><td>{x.description}</td><td>{x.url}</td></tr>)}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>2. Go-Live Checklist</h2>
        <table style={tableStyle()}><thead><tr><th>Area</th><th>Task</th><th>Status</th><th>Owner</th><th>Action</th><th>Pass</th></tr></thead><tbody>
          {checklist.map((x) => (
            <tr key={x.id}>
              <td>{x.area}</td><td>{x.task}</td><td><GoLiveBadge value={x.status} /></td><td>{x.owner}</td><td>{x.action}</td>
              <td>{x.status !== "PASS" ? <button onClick={() => passItem(x.id)}>PASS</button> : "-"}</td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>3. Minimum Data Seed</h2>
        <table style={tableStyle()}><thead><tr><th>Domain</th><th>Priority</th><th>Minimum Rows</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {dataSeeds.map((x) => (
            <tr key={x.id}>
              <td>{x.dataDomain}</td><td>{x.priority}</td><td>{x.minimumRows}</td><td><GoLiveBadge value={x.status} /></td>
              <td>{x.status !== "READY" ? <button onClick={() => markSeedReady(x.id)}>READY</button> : "-"}</td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>4. Known Issues / Workaround</h2>
        <table style={tableStyle()}><thead><tr><th>Issue</th><th>Severity</th><th>Workaround</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {issues.map((x) => (
            <tr key={x.id}>
              <td>{x.issue}</td><td>{x.severity}</td><td>{x.workaround}</td><td><GoLiveBadge value={x.status} /></td>
              <td>{x.status !== "CLOSED" ? <button onClick={() => closeIssue(x.id)}>CLOSE</button> : "-"}</td>
            </tr>
          ))}
        </tbody></table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white" }}>
      <strong>{title}</strong>
      <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 6 }}><GoLiveBadge value={String(value)} /></div>
    </div>
  );
}

function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}

function tableStyle(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
