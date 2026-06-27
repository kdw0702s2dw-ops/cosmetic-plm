"use client";

export default function GoldMasterFinalHome() {
  const links = [
    ["/enterprise-gold-master", "Gold Master Live Core"],
    ["/enterprise-gold-formula-live", "Formula Live CRUD"],
    ["/enterprise-gold-formula-validation", "Formula Validation"],
    ["/enterprise-gold-formula-cost", "Formula Cost"],
    ["/enterprise-gold-intelligence", "Formula Intelligence"],
    ["/enterprise-gold-documents", "Document Automation"],
    ["/enterprise-gold-document-workflow", "Document Workflow"],
    ["/enterprise-gold-ai-copilot", "AI Copilot"],
    ["/enterprise-gold-release", "Release Center"],
    ["/enterprise-gold-manufacturing", "Manufacturing"],
    ["/enterprise-gold-samples", "Sample & Pilot"],
    ["/enterprise-gold-command", "Executive Command"],
  ];
  return (
    <main style={{ padding: 24, background: "#fffbeb", minHeight: "100vh" }}>
      <section style={{ border: "1px solid #fde68a", borderRadius: 14, padding: 24, background: "white" }}>
        <h1>Enterprise PLM v3.0 GOLD MASTER Final Hub</h1>
        <p style={{ color: "#6b7280" }}>전체 Gold Master 모듈을 하나의 시작 화면으로 연결합니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {links.map(([href, title]) => (
            <a key={href} href={href} style={{ display: "block", padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc", textDecoration: "none", color: "#111827", fontWeight: "bold" }}>
              {title}<br/><span style={{ color: "#2563eb", fontWeight: "normal" }}>{href}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
