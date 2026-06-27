"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useLaunchReadiness } from "@/hooks/useEnterpriseV42";
import V42Badge from "../common/V42Badge";

export default function LaunchReadinessDashboard() {
  const s = useLaunchReadiness();

  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">Launch Readiness Center</h1>
          <p className="enterprise-v41-subtitle">제품별 출시 준비도와 Go/No-Go 리스크를 한 화면에서 확인합니다.</p>
        </div>
        <button className="enterprise-v41-button" onClick={s.load}>Refresh</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>

      <section className="enterprise-v41-panel">
        <h2>Launch Candidates</h2>
        <div className="enterprise-v41-table-wrap">
          <table className="enterprise-v41-table">
            <thead><tr><th>Formula</th><th>Name</th><th>Score</th><th>Status</th><th>Open</th></tr></thead>
            <tbody>
              {s.rows.map((row) => (
                <tr key={`${row.formula_code}-${row.revision}`}>
                  <td>{row.formula_code}/{row.revision}</td>
                  <td>{row.formula_name}</td>
                  <td>{row.readiness_score}%</td>
                  <td><V42Badge value={row.status} /></td>
                  <td><button className="enterprise-v41-button-secondary" onClick={() => s.setSelected(row)}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {s.selected && (
        <section className="enterprise-v41-panel">
          <h2>{s.selected.formula_code} Readiness Detail</h2>
          <div className="enterprise-v41-grid-3">
            {s.selected.items.map((item: any) => (
              <a key={item.area} href={item.href} className="enterprise-v41-card" style={{ textDecoration: "none", color: "#0f172a" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{item.area}</strong>
                  <V42Badge value={item.status} />
                </div>
                <div className="enterprise-v41-kpi-value">{item.score}%</div>
                <p style={{ color: "#64748b" }}>{item.message}</p>
              </a>
            ))}
          </div>
        </section>
      )}
    </EnterpriseShell>
  );
}
