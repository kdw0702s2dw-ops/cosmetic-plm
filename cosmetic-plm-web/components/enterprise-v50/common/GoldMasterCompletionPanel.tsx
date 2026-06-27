"use client";

import { useV51GoldMasterCompletion } from "@/hooks/useV51GoldMasterCompletion";

export default function GoldMasterCompletionPanel() {
  const s = useV51GoldMasterCompletion();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">v5.1 GOLD MASTER 완성도 점검</h1>
          <p className="v50-desc">
            실제 운영 전 핵심 데이터와 주요 기능 실행 이력을 확인하고, 부족한 영역을 빠르게 파악합니다.
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
            <Kpi label="종합점수" value={`${s.summary.overall_score}점`} hint="GOLD MASTER 준비도" />
            <Kpi label="전체상태" value={s.summary.overall_status} hint="운영 전 판단" />
            <Kpi label="완료" value={`${s.summary.items.filter((x) => x.status === "완료").length}개`} hint="정상 영역" />
            <Kpi label="확인 필요" value={`${s.summary.items.filter((x) => x.status !== "완료").length}개`} hint="보완 영역" />
          </section>

          <section className="v50-panel">
            <h2>핵심 영역 점검</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr><th>영역</th><th>상태</th><th>점수</th><th>메시지</th></tr>
                </thead>
                <tbody>
                  {s.summary.items.map((item) => (
                    <tr key={item.area}>
                      <td>{item.area}</td>
                      <td>
                        <span className={`v50-badge ${item.status === "완료" ? "ok" : item.status === "확인필요" ? "warn" : "danger"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.score}점</td>
                      <td>{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="v50-panel">
            <h2>다음 추천 작업</h2>
            <ol style={{ lineHeight: 1.9, color: "#334155" }}>
              <li>미완료 항목이 있으면 해당 메뉴에서 기능을 1회 실행합니다.</li>
              <li>처방 1개를 기준으로 Smart Formula → 문서·Batch → 출시 준비도까지 전체 흐름을 테스트합니다.</li>
              <li>시스템 점검에서 오류 항목이 없는지 확인합니다.</li>
              <li>GOLD MASTER 점검 이력을 저장합니다.</li>
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
