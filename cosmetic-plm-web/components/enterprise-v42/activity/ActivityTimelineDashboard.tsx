"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useActivityTimeline } from "@/hooks/useEnterpriseV42";

export default function ActivityTimelineDashboard() {
  const s = useActivityTimeline();
  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">Activity Timeline</h1>
          <p className="enterprise-v41-subtitle">PLM 주요 활동과 감사 추적용 이벤트를 시간순으로 확인합니다.</p>
        </div>
        <button className="enterprise-v41-button" onClick={s.snapshot}>Create Snapshot</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>
      <section className="enterprise-v41-panel">
        {s.rows.map((event) => (
          <article key={event.id} className="enterprise-v41-card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{event.title}</strong>
              <span style={{ color: "#64748b" }}>{event.created_at}</span>
            </div>
            <p style={{ color: "#64748b" }}>{event.area} · {event.action} · {event.description}</p>
            {event.href && <a href={event.href} style={{ color: "#2563eb", fontWeight: 800 }}>Open →</a>}
          </article>
        ))}
      </section>
    </EnterpriseShell>
  );
}
