"use client";

import { useV60CosmeticIntelligence } from "@/hooks/useV60CosmeticIntelligence";
import "@/styles/enterprise-v50.css";

export default function CosmeticIntelligenceSuitePanel() {
  const s = useV60CosmeticIntelligence();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">v6.0 Cosmetic Intelligence Suite</h1>
          <p className="v50-desc">처방 분석, 비교, 상용성, 원가 시뮬레이션, AI 추천을 하나의 Intelligence 화면에서 실행합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load} disabled={s.loading}>새로고침</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>분석</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.revision}</td>
                    <td>{f.total_percent}%</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>분석</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>Intelligence Summary</h2>
          {!s.insight ? <p>처방을 선택하면 분석 결과가 표시됩니다.</p> : (
            <>
              <div className="v50-grid-2" style={{ marginBottom: 12 }}>
                <Kpi label="지능점수" value={`${s.insight.intelligence_score}점`} hint="종합 분석" />
                <Kpi label="원가" value={`${s.insight.estimated_cost_per_kg.toLocaleString()}원`} hint="kg 기준" />
                <Kpi label="안정성" value={`${s.insight.stability_score}점`} hint="예측 점수" />
                <Kpi label="상용성" value={`${s.insight.compatibility_score}점`} hint="조합 점수" />
              </div>
              <div className="v50-card">
                <strong>알림</strong>
                {(s.insight.alerts.length ? s.insight.alerts : ["중요 알림이 없습니다."]).map((x: string) => <p key={x} style={{ color: "#dc2626" }}>{x}</p>)}
                <strong>추천</strong>
                {(s.insight.recommendations.length ? s.insight.recommendations : ["추가 추천사항이 없습니다."]).map((x: string) => <p key={x} style={{ color: "#059669" }}>{x}</p>)}
              </div>
            </>
          )}
        </article>
      </section>

      {s.insight && (
        <section className="v50-grid-2">
          <article className="v50-panel">
            <h2>전성분 자동 분석</h2>
            <p style={{ lineHeight: 1.8 }}>{s.insight.inci_list}</p>
          </article>

          <article className="v50-panel">
            <h2>상용성 분석</h2>
            {s.compatibility && (
              <>
                <div className={`v50-badge ${s.compatibility.status === "Compatible" ? "ok" : s.compatibility.status === "Warning" ? "warn" : "danger"}`}>
                  {s.compatibility.status}
                </div>
                <div style={{ fontSize: 28, fontWeight: 950, marginTop: 10 }}>{s.compatibility.score}점</div>
                {s.compatibility.messages.map((x: string) => <p key={x} style={{ color: "#64748b" }}>{x}</p>)}
              </>
            )}
          </article>
        </section>
      )}

      <section className="v50-grid-2">
        <article className="v50-panel">
          <h2>처방 비교</h2>
          <select className="v50-select" onChange={(e) => {
            const f = s.formulas.find((x) => `${x.formula_code}__${x.revision}` === e.target.value);
            s.setTarget(f || null);
          }}>
            <option value="">비교 대상 처방 선택</option>
            {s.formulas.map((f) => <option key={`${f.formula_code}-${f.revision}`} value={`${f.formula_code}__${f.revision}`}>{f.formula_code} / {f.revision} / {f.formula_name}</option>)}
          </select>
          <button className="v50-button" style={{ marginTop: 12 }} onClick={s.runCompare}>비교 실행</button>
          {s.compare && (
            <div className="v50-card" style={{ marginTop: 12 }}>
              <strong>{s.compare.summary}</strong>
              <p>추가 {s.compare.added.length}개 / 삭제 {s.compare.removed.length}개 / 변경 {s.compare.changed.length}개</p>
            </div>
          )}
        </article>

        <article className="v50-panel">
          <h2>원가 시뮬레이션</h2>
          <input className="v50-input" type="number" value={s.sellingPrice} onChange={(e) => s.setSellingPrice(Number(e.target.value))} placeholder="판매가" />
          <input className="v50-input" type="number" value={s.priceRate} onChange={(e) => s.setPriceRate(Number(e.target.value))} placeholder="원료가 상승률 %" style={{ marginTop: 8 }} />
          <button className="v50-button" style={{ marginTop: 12 }} onClick={s.runCost}>원가 시뮬레이션</button>
          {s.cost && (
            <div className="v50-card" style={{ marginTop: 12 }}>
              <p>기준 원가: {s.cost.base_cost.toLocaleString()}원</p>
              <p>예상 원가: {s.cost.simulated_cost.toLocaleString()}원</p>
              <p>마진율: {s.cost.margin_rate}%</p>
            </div>
          )}
        </article>
      </section>

      <section className="v50-panel">
        <h2>AI 처방 추천</h2>
        <textarea className="v50-textarea" value={s.prompt} onChange={(e) => s.setPrompt(e.target.value)} />
        <button className="v50-button" style={{ marginTop: 12 }} onClick={s.runAiRecommendation}>AI 추천 실행</button>
        {s.ai && (
          <div className="v50-grid-3" style={{ marginTop: 12 }}>
            {s.ai.recommendations.map((x: string) => <article key={x} className="v50-card">{x}</article>)}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div style={{ fontSize: 24, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
