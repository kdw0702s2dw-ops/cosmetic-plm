"use client";

import { useCommandCenter } from "@/hooks/useEnterpriseProductionFinalSeries";
import FinalBadge from "../common/FinalBadge";

export default function ExecutiveCommandCenter() {
  const s = useCommandCenter();
  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1>GOLD MASTER Pack 06 Executive Command Center</h1>
        <p style={{ color: "#6b7280" }}>PLM 전체 KPI와 모듈 Health를 경영 대시보드 형태로 통합합니다.</p>
        <button onClick={s.load}>Refresh</button>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
        {s.kpi && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {Object.entries(s.kpi).map(([k,v]) => <Kpi key={k} title={k} value={String(v)} />)}
        </div>}
      </section>

      <section style={section()}>
        <h2>Module Health</h2>
        <table style={table()}><thead><tr><th>Module</th><th>Table</th><th>Count</th><th>Status</th><th>Message</th></tr></thead><tbody>
          {s.health.map((x) => <tr key={x.table}><td>{x.module}</td><td>{x.table}</td><td>{x.count}</td><td><FinalBadge value={x.status} /></td><td>{x.message}</td></tr>)}
        </tbody></table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string }) { return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#059669" }}>{value}</div></div>; }
function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
