"use client";

import { useV51SystemHealth } from "@/hooks/useV51SystemHealth";

export default function SystemHealthPanel() {
  const s = useV51SystemHealth();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">시스템 점검</h1>
          <p className="v50-desc">
            v5.1 운영에 필요한 핵심 DB, Smart Formula, 출시 준비도, 문서, 제조, 릴리즈 기록을 한 번에 점검합니다.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={s.load} disabled={s.loading}>다시 점검</button>
          <button onClick={s.snapshot} disabled={s.loading || !s.summary}>점검 이력 저장</button>
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      {s.summary && (
        <>
          <section className="v50-grid-4" style={{ marginBottom: 18 }}>
            <Kpi label="전체 상태" value={s.summary.overall_status} hint="운영 준비도" />
            <Kpi label="정상" value={`${s.summary.ready_count}개`} hint="정상 항목" />
            <Kpi label="주의" value={`${s.summary.watch_count}개`} hint="확인 필요" />
            <Kpi label="오류" value={`${s.summary.error_count}개`} hint="조치 필요" />
          </section>

          <section className="v50-panel">
            <h2>핵심 테이블 점검</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr><th>영역</th><th>테이블</th><th>데이터 수</th><th>상태</th><th>메시지</th></tr>
                </thead>
                <tbody>
                  {s.summary.items.map((item) => (
                    <tr key={item.table_name}>
                      <td>{item.area}</td>
                      <td>{item.table_name}</td>
                      <td>{item.count.toLocaleString()}</td>
                      <td><span className={`v50-badge ${item.status === "정상" ? "ok" : item.status === "주의" ? "warn" : "danger"}`}>{item.status}</span></td>
                      <td>{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="v50-panel">
        <h2>최근 적용 패키지</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>릴리즈 코드</th><th>제목</th><th>설명</th><th>적용일</th></tr></thead>
            <tbody>
              {s.markers.map((m) => (
                <tr key={m.release_code}>
                  <td>{m.release_code}</td>
                  <td>{m.title}</td>
                  <td>{m.description}</td>
                  <td>{m.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
