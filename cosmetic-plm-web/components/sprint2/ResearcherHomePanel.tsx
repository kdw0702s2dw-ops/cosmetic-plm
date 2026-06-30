"use client";

import { useResearcherHome } from "@/hooks/useResearcherHome";
import "@/styles/enterprise-v50.css";

export default function ResearcherHomePanel({
  openRaw,
  openFormula,
  openDocs,
}: {
  openRaw: () => void;
  openFormula: () => void;
  openDocs: () => void;
}) {
  const h = useResearcherHome();
  const k = h.data.kpis;

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">
            원료, 처방, 문서 데이터를 실시간으로 불러와 오늘 해야 할 업무를 바로 확인합니다.
          </p>
          <p style={{ color: "#2563eb", fontWeight: 900 }}>{h.message}</p>
        </div>
        <div className="v50-flow">
          <button onClick={openRaw}>원료 등록</button>
          <button onClick={openFormula}>처방 작성</button>
          <button onClick={openDocs}>문서 생성</button>
          <button className="v50-button-light" onClick={h.load} disabled={h.loading}>새로고침</button>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="원료" value={String(k.rawMaterials)} hint="활성 원료" />
        <Kpi label="처방" value={String(k.formulas)} hint="활성 처방" />
        <Kpi label="BOM 라인" value={String(k.formulaLines)} hint="처방 원료" />
        <Kpi label="문서" value={String(k.documents)} hint="생성 문서" />
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="오늘 할 일" value={String(k.todayTasks)} hint="합계/문서 점검" />
        <Kpi label="확인 필요" value={String(k.warnings)} hint="100% 확인" />
        <Kpi label="문서 대기" value={String(h.data.recentFormulas.length)} hint="최근 처방 기준" />
        <Kpi label="실시간" value="ON" hint="DB 변경 감지" />
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>오늘 해야 할 업무</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {h.data.todayTasks.map((x, i) => (
              <div key={i} className="v50-card" style={{ padding: 14 }}>
                <strong>{x.type}</strong>
                <div style={{ marginTop: 6 }}>{x.title}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{x.detail}</div>
              </div>
            ))}
            {h.data.todayTasks.length === 0 && <p style={{ color: "#64748b" }}>현재 긴급 점검 업무가 없습니다.</p>}
          </div>
        </article>

        <article className="v50-panel">
          <h2>최근 수정 처방</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>코드</th><th>처방명</th><th>Rev</th><th>총합</th><th>상태</th></tr></thead>
              <tbody>
                {h.data.recentFormulas.map((x) => (
                  <tr key={`${x.formula_code}-${x.revision}`}>
                    <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.total_percent}%</td><td>{x.status}</td>
                  </tr>
                ))}
                {h.data.recentFormulas.length === 0 && <tr><td colSpan={5}>최근 처방이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>최근 등록/수정 원료</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>코드</th><th>원료명</th><th>공급사</th><th>단가</th></tr></thead>
              <tbody>
                {h.data.recentRawMaterials.map((x) => (
                  <tr key={x.raw_code}><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.supplier}</td><td>{Number(x.unit_price || 0).toLocaleString()}</td></tr>
                ))}
                {h.data.recentRawMaterials.length === 0 && <tr><td colSpan={4}>최근 원료가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>최근 생성 문서</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>문서</th><th>종류</th><th>처방</th></tr></thead>
              <tbody>
                {h.data.recentDocuments.map((x) => (
                  <tr key={x.document_code}><td>{x.title}</td><td>{x.document_type}</td><td>{x.formula_code}</td></tr>
                ))}
                {h.data.recentDocuments.length === 0 && <tr><td colSpan={3}>최근 문서가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>규제 알림</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {h.data.regulationWatch.map((x) => (
              <div className="v50-card" key={x.region} style={{ padding: 14 }}>
                <strong>{x.region}</strong> · {x.status}
                <div style={{ color: "#64748b", marginTop: 6 }}>{x.detail}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="v50-panel">
          <h2>AI 업무 추천</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {h.data.aiRecommendations.map((x) => (
              <div className="v50-card" key={x.title} style={{ padding: 14 }}>
                <strong>{x.title}</strong>
                <div style={{ color: "#64748b", marginTop: 6 }}>{x.desc}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
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
