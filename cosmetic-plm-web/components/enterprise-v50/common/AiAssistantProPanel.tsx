"use client";

import { useV50AiAssistantPro } from "@/hooks/useV50AiAssistantPro";

export default function AiAssistantProPanel({ openFormula }: { openFormula?: () => void }) {
  const s = useV50AiAssistantPro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">AI 연구원 PRO</h1>
          <p className="v50-desc">한글로 제품 컨셉을 입력하면 AI가 처방 초안을 만들고, 실제 처방 데이터로 저장합니다.</p>
        </div>
        <button className="v50-button" onClick={s.generatePreview} disabled={s.loading}>AI 초안 생성</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-chatbox">
        <h2>무엇을 개발할까요?</h2>
        <textarea className="v50-textarea" value={s.prompt} onChange={(e) => s.setPrompt(e.target.value)} />
        <div className="v50-flow" style={{ marginTop: 12 }}>
          <button onClick={s.generatePreview} disabled={s.loading}>초안 보기</button>
          <button onClick={s.saveFormula} disabled={s.loading}>처방으로 저장</button>
          {openFormula && <button onClick={openFormula}>처방관리 PRO 열기</button>}
        </div>
      </section>

      <section className="v50-grid-3" style={{ marginTop: 16 }}>
        {[
          "민감성 피부용 장벽 크림",
          "미백 앰플",
          "수분 진정 세럼",
          "약산성 토너",
          "저자극 수분크림",
          "판테놀 진정 크림",
        ].map((x) => (
          <button key={x} className="v50-button-light" onClick={() => s.setPrompt(`${x}을 만들어줘. 원가는 2,500원 이하로 맞춰줘.`)}>{x}</button>
        ))}
      </section>

      {s.preview && (
        <section className="v50-panel" style={{ marginTop: 16 }}>
          <h2>AI 처방 초안</h2>
          <div className="v50-grid-4" style={{ marginBottom: 14 }}>
            <Kpi label="처방명" value={s.preview.formula_name} hint={s.preview.product_type} />
            <Kpi label="컨셉" value={s.preview.claim} hint="AI 추천" />
            <Kpi label="총합" value={`${s.preview.total}%`} hint={s.preview.total === 100 ? "정상" : "확인 필요"} />
            <Kpi label="국가" value={s.preview.target_country} hint="출시 검토" />
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>No</th><th>Phase</th><th>원료명</th><th>INCI</th><th>투입량(%)</th><th>기능</th><th>추천 이유</th></tr></thead>
              <tbody>
                {s.preview.lines.map((line: any, idx: number) => (
                  <tr key={`${line.raw_code}-${idx}`}>
                    <td>{idx + 1}</td><td>{line.phase}</td><td>{line.raw_name}</td><td>{line.inci_en}</td><td>{line.percentage}</td><td>{line.function_en}</td><td>{line.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div style={{ fontSize: 20, fontWeight: 950, marginTop: 8 }}>{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
