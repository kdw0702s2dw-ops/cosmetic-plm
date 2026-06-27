"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useRoleWorkspace } from "@/hooks/useEnterpriseV42";
import type { EnterpriseRole } from "@/types/enterpriseV42";
import V42Badge from "../common/V42Badge";

const roles: EnterpriseRole[] = ["R&D", "QA/QC", "RA", "Production", "Sales", "Admin"];

export default function RoleWorkspaceDashboard() {
  const s = useRoleWorkspace();

  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">Role-Based Workspace</h1>
          <p className="enterprise-v41-subtitle">역할별로 필요한 업무 화면만 보여주는 실제 운영용 Workspace입니다.</p>
        </div>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>
      <section className="enterprise-v41-panel">
        <h2>Role 선택</h2>
        <div className="enterprise-v41-workflow">
          {roles.map((role) => <a key={role} onClick={() => s.changeRole(role)} style={{ cursor: "pointer" }}>{role}</a>)}
        </div>
      </section>
      <section className="enterprise-v41-grid-3">
        {s.cards.map((card) => (
          <a key={card.title} href={card.href} className="enterprise-v41-card" style={{ textDecoration: "none", color: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{card.title}</strong>
              <V42Badge value={card.priority} />
            </div>
            <p style={{ color: "#64748b" }}>{card.description}</p>
            <div className="enterprise-v41-kpi-value">{card.count}</div>
          </a>
        ))}
      </section>
    </EnterpriseShell>
  );
}
