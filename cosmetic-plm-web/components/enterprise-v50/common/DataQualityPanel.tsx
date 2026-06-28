"use client";

import { useV51DataQuality } from "@/hooks/useV51DataQuality";

export default function DataQualityPanel() {
  const s = useV51DataQuality();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">데이터 품질 점검</h1>
          <p className="v50-desc">원료, INCI, CAS, 단가, 처방 총합, 원료 참조 오류를 점검합니다.</p>
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
            <Kpi label="품질점수" value={`${s.summary.score}점`} hint="데이터 품질" />
            <Kpi label="전체상태" value={s.summary.status} hint="운영 판단" />
            <Kpi label="오류" value={`${s.summary.issues.filter((x) => x.status === "오류").length}개`} hint="우선 조치" />
            <Kpi label="주의" value={`${s.summary.issues.filter((x) => x.status === "주의").length}개`} hint="보완 권장" />
          </section>

          <section className="v50-panel">
            <h2>점검 결과</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>점검 영역</th><th>상태</th><th>건수</th><th>설명</th></tr></thead>
                <tbody>
                  {s.summary.issues.map((issue) => (
                    <tr key={issue.area}>
                      <td>{issue.area}</td>
                      <td><span className={`v50-badge ${issue.status === "정상" ? "ok" : issue.status === "주의" ? "warn" : "danger"}`}>{issue.status}</span></td>
                      <td>{issue.count.toLocaleString()}</td>
                      <td>{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="v50-panel">
            <h2>권장 조치</h2>
            <ol style={{ lineHeight: 1.9, color: "#334155" }}>
              <li>오류 항목은 운영 전 반드시 해결하세요.</li>
              <li>INCI, CAS, 단가 누락은 원료 마스터에서 순차적으로 보완하세요.</li>
              <li>총합 100% 오류 처방은 스마트 처방엔진의 정제수 자동보정을 사용하세요.</li>
              <li>점검 완료 후 이력을 저장해 운영 기록을 남기세요.</li>
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
