"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useEnterpriseUx } from "@/hooks/useEnterpriseUx";
import UxBadge from "./common/UxBadge";

const roleLinks = [
  ["연구원", "AI 처방 생성", "/enterprise-ai-autopilot"],
  ["연구원", "처방관리", "/enterprise-gold-formula-live"],
  ["품질", "처방 검증", "/enterprise-gold-formula-validation"],
  ["규제", "규제 검토", "/enterprise-gold-intelligence"],
  ["생산", "제조관리", "/enterprise-gold-manufacturing"],
  ["관리자", "전체 현황", "/enterprise-gold-command"],
];

export default function EnterpriseProfessionalUxDashboard() {
  const s = useEnterpriseUx();

  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">화장품 PLM 업무 대시보드</h1>
          <p className="enterprise-v41-subtitle">
            연구, 품질, 규제, 문서, 제조, 출시 업무를 한 화면에서 확인하는 메인 화면입니다.
          </p>
        </div>
        <button onClick={s.load} disabled={s.loading} className="enterprise-v41-button">새로고침</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>

      <section className="enterprise-v41-grid-4" style={{ marginBottom: 16 }}>
        {s.kpis.map((k) => (
          <article key={k.label} className="enterprise-v41-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{k.label}</strong>
              <UxBadge value={k.status} />
            </div>
            <div className="enterprise-v41-kpi-value">{k.value}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{k.hint}</div>
          </article>
        ))}
      </section>

      <section className="enterprise-v41-grid-2" style={{ marginBottom: 16 }}>
        <article className="enterprise-v41-panel">
          <h2>오늘 먼저 할 일</h2>
          {s.workItems.map((item) => (
            <a key={item.title} href={item.href} style={workItem()}>
              <div>
                <div style={{ fontWeight: 800 }}>{item.title}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{item.area}</div>
              </div>
              <div style={{ color: item.priority === "P0" ? "#dc2626" : "#d97706", fontWeight: 900 }}>{item.priority}</div>
            </a>
          ))}
        </article>

        <article className="enterprise-v41-panel">
          <h2>역할별 빠른 시작</h2>
          <div className="enterprise-v41-grid-2">
            {roleLinks.map(([role, title, href]) => (
              <a key={`${role}-${title}`} href={href} style={quickCard()}>
                <div style={{ color: "#64748b", fontSize: 13 }}>{role}</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{title}</div>
              </a>
            ))}
          </div>
        </article>
      </section>

      <section className="enterprise-v41-panel">
        <h2>업무 메뉴</h2>
        <div className="enterprise-v41-grid-3">
          {s.modules.filter((m) => m.href !== "/enterprise").map((m) => (
            <a key={m.title} href={m.href} className="enterprise-v41-card" style={{ textDecoration: "none", color: "#0f172a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{m.title}</strong>
                <UxBadge value={m.status} />
              </div>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>{m.description}</p>
              <div style={{ color: "#2563eb", fontWeight: 800 }}>열기 →</div>
            </a>
          ))}
        </div>
      </section>
    </EnterpriseShell>
  );
}

function workItem(): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: "1px solid #e5e7eb", borderRadius: 14, textDecoration: "none", color: "#0f172a", marginBottom: 10, background: "#fff" };
}
function quickCard(): React.CSSProperties {
  return { padding: 14, borderRadius: 14, border: "1px solid #e5e7eb", background: "#f8fafc", textDecoration: "none", color: "#0f172a" };
}
