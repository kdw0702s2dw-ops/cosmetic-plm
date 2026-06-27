"use client";

import type { ReactNode } from "react";

const modules = [
  ["Dashboard", "/enterprise"],
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
    <div style={page()}>
      <aside style={sidebar()}>
        <div style={{ padding: "22px 20px" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Cosmetic PLM</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Enterprise v4.1</div>
        </div>
        <nav style={{ padding: "0 12px 18px" }}>
          {modules.map(([title, href]) => (
            <a key={href} href={href} style={navItem()}>
              {title}
            </a>
          ))}
        </nav>
      </aside>
      <section style={content()}>
        {children}
      </section>
    </div>
  );
}

function page(): React.CSSProperties {
  return { display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" };
}
function sidebar(): React.CSSProperties {
  return {
    width: 252,
    background: "#0f172a",
    color: "white",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    flexShrink: 0,
  };
}
function navItem(): React.CSSProperties {
  return {
    display: "block",
    padding: "12px 14px",
    marginBottom: 6,
    borderRadius: 12,
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
  };
}
function content(): React.CSSProperties {
  return { flex: 1, minWidth: 0, background: "#f8fafc" };
}
