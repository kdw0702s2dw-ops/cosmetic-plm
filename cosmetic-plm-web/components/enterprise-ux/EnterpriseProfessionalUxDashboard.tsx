"use client";

import { useEnterpriseUx } from "@/hooks/useEnterpriseUx";
import UxBadge from "./common/UxBadge";

const roleLinks = [
  ["R&D", "AI Autopilot", "/enterprise-ai-autopilot"],
  ["R&D", "Formula", "/enterprise-gold-formula-live"],
  ["QA/QC", "Validation", "/enterprise-gold-formula-validation"],
  ["RA", "Regulation", "/enterprise-gold-intelligence"],
  ["Production", "Manufacturing", "/enterprise-gold-manufacturing"],
  ["Admin", "Command Center", "/enterprise-gold-command"],
];

export default function EnterpriseProfessionalUxDashboard() {
  const s = useEnterpriseUx();

  return (
    <main style={page()}>
      <aside style={sidebar()}>
        <div style={{ padding: "22px 20px" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Cosmetic PLM</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Enterprise v4.1</div>
        </div>

        <nav style={{ padding: "0 12px 18px" }}>
          {s.modules.map((m) => (
            <a key={m.title} href={m.href} style={navItem(m.href === "/enterprise")}>
              <span>{m.title}</span>
              {m.count > 0 && <small style={count()}>{m.count.toLocaleString()}</small>}
            </a>
          ))}
        </nav>
      </aside>

      <section style={content()}>
        <header style={hero()}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Enterprise PLM Professional Dashboard</h1>
            <p style={{ color: "#64748b", marginTop: 8 }}>
              개발용 테스트 메뉴를 숨기고, 실제 연구소 업무 흐름 중심으로 재구성한 메인 화면입니다.
            </p>
          </div>
          <button onClick={s.load} disabled={s.loading} style={primaryButton()}>Refresh</button>
        </header>

        <p style={{ color: "#2563eb", fontWeight: 700 }}>{s.message}</p>

        <section style={grid(4)}>
          {s.kpis.map((k) => (
            <article key={k.label} style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{k.label}</strong>
                <UxBadge value={k.status} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{k.value}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{k.hint}</div>
            </article>
          ))}
        </section>

        <section style={twoCol()}>
          <article style={panel()}>
            <h2 style={h2()}>오늘 먼저 할 일</h2>
            {s.workItems.map((item) => (
              <a key={item.title} href={item.href} style={workItem()}>
                <div>
                  <div style={{ fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{item.area}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <UxBadge value={item.status} />
                  <span style={{ color: item.priority === "P0" ? "#dc2626" : "#d97706", fontWeight: 800 }}>{item.priority}</span>
                </div>
              </a>
            ))}
          </article>

          <article style={panel()}>
            <h2 style={h2()}>역할별 빠른 시작</h2>
            <div style={grid(2)}>
              {roleLinks.map(([role, title, href]) => (
                <a key={`${role}-${title}`} href={href} style={quickCard()}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{role}</div>
                  <div style={{ fontWeight: 800, marginTop: 6 }}>{title}</div>
                </a>
              ))}
            </div>
          </article>
        </section>

        <section style={panel()}>
          <h2 style={h2()}>업무 모듈</h2>
          <div style={grid(3)}>
            {s.modules.filter((m) => m.href !== "/enterprise").map((m) => (
              <a key={m.title} href={m.href} style={moduleCard()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{m.title}</strong>
                  <UxBadge value={m.status} />
                </div>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>{m.description}</p>
                <div style={{ color: "#2563eb", fontWeight: 700 }}>Open →</div>
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function page(): React.CSSProperties {
  return { display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" };
}
function sidebar(): React.CSSProperties {
  return { width: 260, background: "#0f172a", color: "white", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 };
}
function navItem(active: boolean): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", marginBottom: 6, borderRadius: 12, color: "white", textDecoration: "none", background: active ? "#2563eb" : "transparent", fontWeight: 700 };
}
function count(): React.CSSProperties {
  return { color: "#cbd5e1", fontSize: 12 };
}
function content(): React.CSSProperties {
  return { flex: 1, padding: 28, maxWidth: 1440, margin: "0 auto" };
}
function hero(): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 24, marginBottom: 16 };
}
function primaryButton(): React.CSSProperties {
  return { padding: "11px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "white", fontWeight: 800, cursor: "pointer" };
}
function grid(cols: number): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? 190 : cols === 3 ? 240 : 200}px, 1fr))`, gap: 14 };
}
function card(): React.CSSProperties {
  return { background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18 };
}
function panel(): React.CSSProperties {
  return { background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20 };
}
function twoCol(): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, .85fr)", gap: 16, marginTop: 16, marginBottom: 16 };
}
function h2(): React.CSSProperties {
  return { marginTop: 0, fontSize: 19 };
}
function workItem(): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: "1px solid #e5e7eb", borderRadius: 14, textDecoration: "none", color: "#0f172a", marginBottom: 10, background: "#fff" };
}
function quickCard(): React.CSSProperties {
  return { padding: 14, borderRadius: 14, border: "1px solid #e5e7eb", background: "#f8fafc", textDecoration: "none", color: "#0f172a" };
}
function moduleCard(): React.CSSProperties {
  return { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a", minHeight: 128 };
}
