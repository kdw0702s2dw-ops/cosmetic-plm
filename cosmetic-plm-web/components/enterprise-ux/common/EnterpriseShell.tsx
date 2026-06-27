"use client";

import type { ReactNode } from "react";
import "@/styles/enterprise-v41.css";

const modules = [
  ["Dashboard", "/enterprise"],
  ["Workflow", "/enterprise-workflow"],
  ["Projects", "/enterprise-gold-release"],
  ["Formula", "/enterprise-gold-formula-live"],
  ["Raw Materials", "/enterprise-db-live"],
  ["AI Assistant", "/enterprise-ai-autopilot"],
  ["AI Research", "/enterprise-ai-research"],
  ["AI Recommendation", "/enterprise-ai-recommendation"],
  ["Documents", "/enterprise-gold-documents"],
  ["Quality", "/enterprise-gold-formula-validation"],
  ["Regulation", "/enterprise-gold-intelligence"],
  ["Samples", "/enterprise-gold-samples"],
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
            <div className="enterprise-v41-brand-sub">Enterprise v4.1</div>
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
