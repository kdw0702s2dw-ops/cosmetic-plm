"use client";

import { useV51ReleaseReadinessPro } from "@/hooks/useV51ReleaseReadinessPro";

export default function ReleaseReadinessProPanel() {
  const s = useV51ReleaseReadinessPro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">출시 준비도 PRO</h1>
          <p className="v50-desc">처방, 검증, 원가, 문서, 스마트 문서, Batch, 리스크를 종합해 출시 Go/No-Go 상태를 계산합니다.</p>
        </div>
        <button className="v50-button" onClick={s.runReadiness} disabled={!s.selected || s.loading}>출시 준비도 계산</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>선택</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.revision}</td>
                    <td>{f.total_percent}%</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>Go / No-Go 결과</h2>
          {!s.result ? <p>처방을 선택하고 출시 준비도 계산을 실행하세요.</p> : (
            <>
              <div className="v50-grid-2" style={{ marginBottom: 12 }}>
                <Kpi label="출시 준비도" value={`${s.result.release_score}%`} hint="종합 점수" />
                <Kpi label="상태" value={s.result.status} hint={s.result.status === "READY" ? "출시 가능" : s.result.status === "WATCH" ? "검토 필요" : "차단 항목 있음"} />
              </div>
              <div className="v50-card">
                <strong>판정</strong>
                <p style={{ color: s.result.status === "READY" ? "#059669" : s.result.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: 900 }}>
                  {s.result.status === "READY" ? "GO: 출시 진행 가능" : s.result.status === "WATCH" ? "WATCH: 일부 항목 검토 후 진행" : "NO-GO: 차단 항목 해결 필요"}
                </p>
              </div>
            </>
          )}
        </article>
      </section>

      {s.result && (
        <section className="v50-panel">
          <h2>부서별 준비 상태</h2>
          <div className="v50-grid-4">
            {s.result.items.map((item: any) => (
              <article key={item.area} className="v50-card">
                <div className={`v50-badge ${item.status === "READY" ? "ok" : item.status === "WATCH" ? "warn" : "danger"}`}>{item.status}</div>
                <h3>{item.area}</h3>
                <div style={{ fontSize: 24, fontWeight: 950 }}>{item.score}점</div>
                <p style={{ color: "#64748b" }}>{item.message}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="v50-panel">
        <h2>최근 계산 이력</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>처방</th><th>버전</th><th>점수</th><th>상태</th><th>계산일</th></tr></thead>
            <tbody>
              {s.history.map((h) => (
                <tr key={h.id}>
                  <td>{h.formula_code}</td><td>{h.revision}</td><td>{h.release_score}%</td><td>{h.status}</td><td>{h.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div style={{ fontSize: 28, fontWeight: 950, marginTop: 8 }}>{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
