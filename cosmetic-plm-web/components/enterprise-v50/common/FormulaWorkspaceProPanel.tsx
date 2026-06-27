"use client";

import { useV50FormulaLive } from "@/hooks/useV50LiveData";
import { useV50FormulaWorkspacePro } from "@/hooks/useV50FormulaWorkspacePro";
import { useV51SmartFormulaEngine } from "@/hooks/useV51SmartFormulaEngine";

export default function FormulaWorkspaceProPanel() {
  const s = useV50FormulaLive();
  const pro = useV50FormulaWorkspacePro();
  const smart = useV51SmartFormulaEngine();

  async function openFormula(f: any) {
    await s.openFormula(f);
    await pro.loadStatus(f.formula_code, f.revision);
    await smart.openFormula(f);
  }

  async function updatePercentSmart(line: any, value: number) {
    await s.updatePercent(line, value);
    if (s.selected) {
      await smart.openFormula(s.selected);
      await pro.loadStatus(s.selected.formula_code, s.selected.revision);
    }
  }

  const selected = s.selected;
  const result = smart.result;

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">처방관리 PRO + 스마트 계산</h1>
          <p className="v50-desc">
            처방 선택, 원료 추가, 함량 수정, 검증, 원가, 평가, 문서 생성, 스마트 계산을 한 화면에서 처리합니다.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={s.createFormula}>신규 처방</button>
          {selected && <button onClick={() => pro.runAll(selected.formula_code, selected.revision)}>검증·원가·문서 전체 실행</button>}
          {selected && <button onClick={() => smart.adjustWater()}>정제수 100% 자동보정</button>}
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>
        {s.message} / {pro.message} / {smart.message}
      </p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 목록</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="처방명 또는 코드 검색" />
            <button className="v50-button" onClick={() => s.loadFormulas(s.search)}>검색</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>상태</th><th>선택</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.revision}</td>
                    <td>{f.status}</td>
                    <td><button className="v50-button-light" onClick={() => openFormula(f)}>열기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>실시간 스마트 계산</h2>
          {!selected || !result ? <p>처방을 선택하면 자동 계산됩니다.</p> : (
            <>
              <div className="v50-grid-2" style={{ marginBottom: 12 }}>
                <Kpi label="총합" value={`${result.total_percent}%`} hint={result.total_percent === 100 ? "정상" : "보정 필요"} />
                <Kpi label="처방점수" value={`${result.formula_score}점`} hint="스마트 평가" />
                <Kpi label="예상원가" value={`${result.estimated_cost_per_kg.toLocaleString()}원`} hint="kg 기준" />
                <Kpi label="예상 pH" value={String(result.estimated_ph)} hint="예측값" />
                <Kpi label="예상 점도" value={`${result.estimated_viscosity_cps.toLocaleString()} cps`} hint="예측값" />
                <Kpi label="문서" value={`${pro.status?.documents?.length || 0}건`} hint="생성 문서" />
              </div>

              <div className="v50-card" style={{ marginBottom: 12 }}>
                <strong>알림</strong>
                {(result.alerts.length ? result.alerts : ["중요 알림이 없습니다."]).map((a) => (
                  <p key={a} style={{ color: "#dc2626", marginBottom: 4 }}>{a}</p>
                ))}
                <strong>추천</strong>
                {(result.recommendations.length ? result.recommendations : ["추가 추천사항이 없습니다."]).map((r) => (
                  <p key={r} style={{ color: "#059669", marginBottom: 4 }}>{r}</p>
                ))}
              </div>

              <div className="v50-flow">
                <button onClick={() => pro.runValidation(selected.formula_code, selected.revision)}>처방 검증</button>
                <button onClick={() => pro.runCost(selected.formula_code, selected.revision)}>원가 계산</button>
                <button onClick={() => pro.runScore(selected.formula_code, selected.revision)}>처방 평가</button>
                <button onClick={() => pro.createDocs(selected.formula_code, selected.revision)}>문서 생성</button>
              </div>
            </>
          )}

          <h2 style={{ marginTop: 20 }}>원료 검색</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.rawSearch} onChange={(e) => s.setRawSearch(e.target.value)} placeholder="원료명, INCI 검색" />
            <button className="v50-button" onClick={() => s.loadRaws(s.rawSearch)}>검색</button>
          </div>
          <div style={{ display: "grid", gap: 8, maxHeight: 260, overflow: "auto" }}>
            {s.raws.map((raw) => (
              <div key={raw.raw_code} className="v50-card" style={{ padding: 12 }}>
                <strong>{raw.raw_name}</strong>
                <div style={{ color: "#64748b", fontSize: 13 }}>{raw.inci_en || "-"} · {raw.raw_code}</div>
                <button className="v50-button-light" style={{ marginTop: 8 }} onClick={() => s.addRaw(raw)}>처방에 추가</button>
              </div>
            ))}
          </div>
        </article>
      </section>

      {selected && (
        <section className="v50-panel">
          <h2>{selected.formula_code} / {selected.revision} 실시간 처방 편집</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>No</th><th>Phase</th><th>원료명</th><th>INCI</th><th>투입량(%)</th><th>기능</th><th>삭제</th></tr></thead>
              <tbody>
                {s.lines.map((line) => (
                  <tr key={line.id || `${line.line_no}-${line.raw_code}`}>
                    <td>{line.line_no}</td>
                    <td>{line.phase}</td>
                    <td>{line.raw_name}</td>
                    <td>{line.inci_en}</td>
                    <td>
                      <input className="v50-input" type="number" defaultValue={line.percentage} onBlur={(e) => updatePercentSmart(line, Number(e.target.value))} />
                    </td>
                    <td>{line.function_en}</td>
                    <td><button className="v50-button-light" onClick={() => s.removeLine(line)}>삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && result && (
        <section className="v50-grid-2">
          <article className="v50-panel">
            <h2>자동 전성분</h2>
            <p style={{ lineHeight: 1.7 }}>{result.inci_list}</p>
          </article>
          <article className="v50-panel">
            <h2>100kg Batch 소요량</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>원료코드</th><th>원료명</th><th>%</th><th>kg</th></tr></thead>
                <tbody>
                  {result.batch_100kg.map((b) => (
                    <tr key={b.raw_code}><td>{b.raw_code}</td><td>{b.raw_name}</td><td>{b.percentage}</td><td>{b.required_kg}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
