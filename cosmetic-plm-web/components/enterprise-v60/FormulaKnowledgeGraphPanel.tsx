"use client";

import { useV60FormulaKnowledgeGraph } from "@/hooks/useV60FormulaKnowledgeGraph";
import "@/styles/enterprise-v50.css";

const typeLabel: Record<string, string> = {
  formula: "처방",
  raw: "원료",
  inci: "INCI",
  supplier: "공급사",
  document: "문서",
  batch: "Batch",
  revision: "Revision",
  ai: "AI",
  risk: "Risk",
};

export default function FormulaKnowledgeGraphPanel() {
  const s = useV60FormulaKnowledgeGraph();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">v6.0 Formula Knowledge Graph</h1>
          <p className="v50-desc">
            처방, 원료, INCI, 공급사, 문서, Batch, AI 추천, 리스크를 하나의 지식 네트워크로 연결합니다.
          </p>
        </div>
        <button className="v50-button" onClick={s.load} disabled={s.loading}>새로고침</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>Graph</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.revision}</td>
                    <td>{f.total_percent}%</td>
                    <td><button className="v50-button-light" onClick={() => s.openFormula(f)}>생성</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>원료 영향도 검색</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.rawKeyword} onChange={(e) => s.setRawKeyword(e.target.value)} placeholder="원료명, INCI, CAS 검색" />
            <button className="v50-button" onClick={s.searchRaw}>검색</button>
          </div>
          <div style={{ display: "grid", gap: 8, maxHeight: 360, overflow: "auto" }}>
            {s.raws.map((raw) => (
              <article key={raw.raw_code} className="v50-card" style={{ padding: 12 }}>
                <strong>{raw.raw_name}</strong>
                <div style={{ color: "#64748b", fontSize: 13 }}>{raw.inci_en || "-"} · {raw.raw_code}</div>
                <button className="v50-button-light" style={{ marginTop: 8 }} onClick={() => s.openRaw(raw)}>영향도 분석</button>
              </article>
            ))}
          </div>
        </article>
      </section>

      {s.graph && (
        <>
          <section className="v50-grid-4" style={{ marginBottom: 18 }}>
            <Kpi label="Node" value={`${s.graph.summary.node_count}개`} hint="지식 노드" />
            <Kpi label="Edge" value={`${s.graph.summary.edge_count}개`} hint="연결 관계" />
            <Kpi label="원료" value={`${s.graph.summary.raw_count}개`} hint="처방 원료" />
            <Kpi label="Risk" value={`${s.graph.summary.risk_count}개`} hint="검토 필요" />
          </section>

          <section className="v50-panel">
            <h2>Knowledge Graph Nodes</h2>
            <div className="v50-grid-3">
              {s.graph.nodes.map((node: any) => (
                <article key={node.id} className="v50-card">
                  <span className={`v50-badge ${node.type === "risk" ? "danger" : node.type === "formula" ? "ok" : "warn"}`}>
                    {typeLabel[node.type] || node.type}
                  </span>
                  <h3>{node.label}</h3>
                  <p style={{ color: "#64748b" }}>{node.subLabel}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="v50-panel">
            <h2>Knowledge Graph Edges</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>Source</th><th>관계</th><th>Target</th><th>가중치</th></tr></thead>
                <tbody>
                  {s.graph.edges.map((edge: any) => (
                    <tr key={edge.id}>
                      <td>{edge.source}</td>
                      <td>{edge.label}</td>
                      <td>{edge.target}</td>
                      <td>{edge.weight || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {s.impact && (
        <section className="v50-panel">
          <h2>원료 영향도 분석</h2>
          <div className="v50-grid-4" style={{ marginBottom: 14 }}>
            <Kpi label="사용 처방" value={`${s.impact.used_formula_count}건`} hint="영향받는 처방" />
            <Kpi label="문서" value={`${s.impact.affected_documents}건`} hint="영향받는 문서" />
            <Kpi label="Batch" value={`${s.impact.affected_batches}건`} hint="영향받는 Batch" />
            <Kpi label="원료" value={s.impact.raw_name} hint={s.impact.raw_code} />
          </div>
          <p style={{ color: "#334155", fontWeight: 800 }}>{s.impact.ai_summary}</p>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>상태</th></tr></thead>
              <tbody>
                {s.impact.affected_formulas.map((f: any) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td><td>{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {s.similar.length > 0 && (
        <section className="v50-panel">
          <h2>유사 처방 Top 10</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>유사도</th><th>상태</th></tr></thead>
              <tbody>
                {s.similar.map((f: any) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.similarity}%</td><td>{f.status}</td>
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
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
