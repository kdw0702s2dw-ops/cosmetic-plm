"use client";

import { useResearcherHome } from "@/hooks/useResearcherHome";
import "@/styles/enterprise-v50.css";
import FormulaProgressSection from "@/components/home/FormulaProgressSection";
import AIChatSection from "@/components/home/AIChatSection";

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

      {/* AI 업무 어시스턴트 - 최상단으로 이동 */}
      <section style={{ marginBottom: 18 }}>
        <AIChatSection />
      </section>

      {/* 처방 진행 현황 (컨펌 전) */}
      <section style={{ marginBottom: 18 }}>
        <FormulaProgressSection />
      </section>

      {/* 최근 등록/수정 원료 - 전체 너비, 가로 스크롤 없이 세로 카드 배치 */}
      <section style={{ marginBottom: 18 }}>
        <article className="v50-panel">
          <h2>최근 등록/수정 원료</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {h.data.recentRawMaterials.map((x) => (
              <div key={x.raw_code} className="v50-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <strong>{x.raw_name}</strong>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{x.raw_code}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                  공급사 {x.supplier || "-"} · 단가 {Number(x.unit_price || 0).toLocaleString()}
                </div>
              </div>
            ))}
            {h.data.recentRawMaterials.length === 0 && <p style={{ color: "#64748b" }}>최근 원료가 없습니다.</p>}
          </div>
        </article>
      </section>

      {/* 최근 생성 문서 - 전체 너비, 가로 스크롤 없이 세로 카드 배치 */}
      <section style={{ marginBottom: 18 }}>
        <article className="v50-panel">
          <h2>최근 생성 문서</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {h.data.recentDocuments.map((x) => (
              <div key={x.document_code} className="v50-card" style={{ padding: 14 }}>
                <strong>{x.title}</strong>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                  {x.document_type} · 처방 {x.formula_code}
                </div>
              </div>
            ))}
            {h.data.recentDocuments.length === 0 && <p style={{ color: "#64748b" }}>최근 문서가 없습니다.</p>}
          </div>
        </article>
      </section>

      {/* 규제 알림 - 위치만 유지, 기능 변경 없음 */}
      <section>
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
      </section>
    </div>
  );
}
