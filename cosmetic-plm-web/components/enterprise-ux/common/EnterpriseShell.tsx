"use client";

import type { ReactNode } from "react";
import "@/styles/enterprise-v41.css";

const modules = [
  ["대시보드", "/enterprise"],
  ["역할별 업무공간", "/enterprise-role-workspace"],
  ["업무흐름", "/enterprise-workflow"],
  ["출시 준비도", "/enterprise-launch-readiness"],
  ["통합검색", "/enterprise-global-search"],
  ["알림센터", "/enterprise-notifications"],
  ["활동이력", "/enterprise-activity"],
  ["처방관리", "/enterprise-gold-formula-live"],
  ["AI 도우미", "/enterprise-ai-autopilot"],
  ["문서관리", "/enterprise-gold-documents"],
  ["제조관리", "/enterprise-gold-manufacturing"],
  ["지식DB", "/enterprise-knowledge-db"],
  ["관리자", "/enterprise-gold-command"],
];

export default function EnterpriseShell({ children }: { children: ReactNode }) {
  return (
    <div className="enterprise-v41-root">
      <div className="enterprise-v41-shell">
        <aside className="enterprise-v41-sidebar">
          <div className="enterprise-v41-brand">
            <div className="enterprise-v41-brand-title">화장품 PLM</div>
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
