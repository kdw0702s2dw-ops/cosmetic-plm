"use client";

import type { ReactNode } from "react";
import "@/styles/enterprise-v41.css";

const modules = [
  ["Dashboard", "/enterprise"],
  ["Role Workspace", "/enterprise-role-workspace"],
  ["Workflow", "/enterprise-workflow"],
  ["Launch Readiness", "/enterprise-launch-readiness"],
  ["Global Search", "/enterprise-global-search"],
  ["Notifications", "/enterprise-notifications"],
  ["Activity", "/enterprise-activity"],
  ["Formula", "/enterprise-gold-formula-live"],
  ["AI Assistant", "/enterprise-ai-autopilot"],
  ["Documents", "/enterprise-gold-documents"],
  ["Manufacturing", "/enterprise-gold-manufacturing"],
  ["Knowledge DB", "/enterprise-knowledge-db"],
  ["Administration", "/enterprise-gold-command"],
];

export default function EnterpriseShell({ children }: { children: ReactNode }) {
  return (
    <div className="enterprise-v41-root">
      <div className="enterprise-v41-shell">
        <aside className="enterprise-v41-sidebar">
          <div className="enterprise-v41-brand">
            <div className="enterprise-v41-brand-title">Cosmetic PLM</div>
            <div className="enterprise-v41-brand-sub">Enterprise v4.2</div>
          </div>
          <nav className="enterprise-v41-nav">
            {modules.map(([title, href]) => (
              <a key={href} href={href}>{title}</a>
            ))}
          </nav>
        </aside>
        <main className="enterprise-v41-main">{children}</main>
      </div>
    </div>
  );
}
