"use client";

import { useV50AdminPro } from "@/hooks/useV50KnowledgeAdminPro";

export default function AdminProPanel() {
  const s = useV50AdminPro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">관리자 PRO</h1>
          <p className="v50-desc">시스템 상태, 데이터 수량, 릴리즈 기록, 활동 이력을 한글 화면에서 관리합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load}>새로고침</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="처방" value={String(s.summary?.formulas ?? "-")} hint="처방 데이터" />
        <Kpi label="원료" value={String(s.summary?.raws ?? "-")} hint="원료 마스터" />
        <Kpi label="문서" value={String(s.summary?.docs ?? "-")} hint="문서 데이터" />
        <Kpi label="제조" value={String(s.summary?.batches ?? "-")} hint="Batch 데이터" />
        <Kpi label="사용자" value={String(s.summary?.users ?? "-")} hint="사용자 프로필" />
        <Kpi label="릴리즈" value={String(s.summary?.markers ?? "-")} hint="적용 패키지" />
        <Kpi label="알림" value={String(s.summary?.notifications ?? "-")} hint="운영 알림" />
        <Kpi label="활동" value={String(s.summary?.activities ?? "-")} hint="활동 이력" />
      </section>

      <section className="v50-grid-2">
        <article className="v50-panel">
          <h2>릴리즈 기록</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>릴리즈 코드</th><th>제목</th><th>설명</th><th>적용일</th></tr></thead>
              <tbody>
                {s.markers.map((m) => (
                  <tr key={m.release_code}>
                    <td>{m.release_code}</td><td>{m.title}</td><td>{m.description}</td><td>{m.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>최근 활동</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {s.activities.map((a) => (
              <article key={a.event_code || a.id} className="v50-card" style={{ padding: 12 }}>
                <strong>{a.title}</strong>
                <p style={{ color: "#64748b", marginBottom: 0 }}>{a.area} · {a.action} · {a.created_at}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
