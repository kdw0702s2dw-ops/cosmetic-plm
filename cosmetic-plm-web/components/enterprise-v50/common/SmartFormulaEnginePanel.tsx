"use client";

import { useV51SmartFormulaEngine } from "@/hooks/useV51SmartFormulaEngine";

export default function SmartFormulaEnginePanel() {
  const s = useV51SmartFormulaEngine();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">Smart Formula Engine</h1>
          <p className="v50-desc">함량을 수정하는 즉시 총합, 원가, pH, 점도, 전성분, Batch 소요량, 규제 리스크, 처방점수를 자동 계산합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={s.runNow} disabled={!s.selected || s.loading}>재계산</button>
          <button onClick={s.adjustWater} disabled={!s.selected || s.loading}>정제수 100% 자동보정</button>
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>상태</th><th>선택</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.status}</td>
                    <td><button className="v50-button-light" onClick={() => s.openFormula(f)}>열기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>실시간 계산 결과</h2>
          {!s.result ? <p>처방을 선택하면 자동 계산됩니다.</p> : (
            <>
              <div className="v50-grid-2" style={{ marginBottom: 12 }}>
                <Kpi label="총합" value={`${s.result.total_percent}%`} hint={s.result.total_percent === 100 ? "정상" : "보정 필요"} />
                <Kpi label="처방점수" value={`${s.result.formula_score}점`} hint="AI 종합 평가" />
                <Kpi label="예상원가" value={`${s.result.estimated_cost_per_kg.toLocaleString()}원`} hint="kg 기준" />
                <Kpi label="예상 pH" value={String(s.result.estimated_ph)} hint="예측값" />
                <Kpi label="예상 점도" value={`${s.result.estimated_viscosity_cps.toLocaleString()} cps`} hint="예측값" />
                <Kpi label="규제점수" value={`${s.result.regulation_score}점`} hint="KR/EU/CN/US/JP" />
              </div>
              <div className="v50-card">
                <strong>알림</strong>
                {(s.result.alerts.length ? s.result.alerts : ["중요 알림이 없습니다."]).map((a) => <p key={a} style={{ color: "#dc2626", marginBottom: 4 }}>{a}</p>)}
                <strong>추천</strong>
                {(s.result.recommendations.length ? s.result.recommendations : ["추가 추천사항이 없습니다."]).map((r) => <p key={r} style={{ color: "#059669", marginBottom: 4 }}>{r}</p>)}
              </div>
            </>
          )}
        </article>
      </section>

      {s.selected && (
        <>
          <section className="v50-panel">
            <h2>{s.selected.formula_code} / {s.selected.revision} 실시간 처방 편집</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>No</th><th>Phase</th><th>원료명</th><th>INCI</th><th>투입량(%)</th><th>기능</th></tr></thead>
                <tbody>
                  {s.lines.map((line) => (
                    <tr key={line.id || `${line.line_no}-${line.raw_code}`}>
                      <td>{line.line_no}</td>
                      <td>{line.phase}</td>
                      <td>{line.raw_name}</td>
                      <td>{line.inci_en}</td>
                      <td>
                        <input
                          className="v50-input"
                          type="number"
                          defaultValue={line.percentage}
                          onBlur={(e) => s.updatePercent(line, Number(e.target.value))}
                        />
                      </td>
                      <td>{line.function_en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {s.result && (
            <section className="v50-grid-2">
              <article className="v50-panel">
                <h2>자동 전성분</h2>
                <p style={{ lineHeight: 1.7 }}>{s.result.inci_list}</p>
              </article>

              <article className="v50-panel">
                <h2>100kg Batch 원료 소요량</h2>
                <div className="v50-table-wrap">
                  <table className="v50-table">
                    <thead><tr><th>원료코드</th><th>원료명</th><th>%</th><th>kg</th></tr></thead>
                    <tbody>
                      {s.result.batch_100kg.map((b) => (
                        <tr key={b.raw_code}><td>{b.raw_code}</td><td>{b.raw_name}</td><td>{b.percentage}</td><td>{b.required_kg}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
