"use client";

import { useResearcherHome } from "@/hooks/useResearcherHome";
import { useSourcingSchedule } from "@/hooks/useSourcingSchedule";
import "@/styles/enterprise-v50.css";
import AIChatSection from "@/components/home/AIChatSection";
import SourcingScheduleSection from "@/components/home/SourcingScheduleSection";

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
  const sourcing = useSourcingSchedule();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">
            원료, 처방, 문서 데이터를 실시간으로 불러와 오늘 해야 할 업무를 바로 확인합니다.
          </p>
          <p style={{ color: "#2563eb", fontWeight: 900 }}>{h.message}</p>
          {sourcing.alertCount > 0 && (
            <a href="#sourcing-schedule" style={{
              display: "inline-block", marginTop: 6, color: "#dc2626", fontWeight: 800,
              background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 999, padding: "4px 12px", fontSize: 13,
            }}>
              ⚠ 원료 소싱 {sourcing.alertCount}건 입고 지연/임박 확인 필요
            </a>
          )}
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

      {/* 개발/생산 일정관리 - 개발 착수 전 원료 소싱 진행 상황을 처방 단위로 칸반 추적 */}
      <section style={{ marginBottom: 18 }}>
        <SourcingScheduleSection s={sourcing} />
      </section>

      {/* 최근 등록/수정 원료 - 전체 너비, 가로 스크롤 없이 세로 카드 배치 */}
      <section style={{ marginBottom: 18 }}>
        <article className="v50-panel">
          <h2>최근 등록/수정 원료</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {h.data.recentRawMaterials.map((x) => (
              <div key={x.raw_code} className="v50-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <strong
                    style={x.is_caution ? { color: "#dc2626" } : undefined}
                    title={x.is_caution ? (x.caution_note || "주의 원료") : undefined}
                  >
                    {x.raw_name}{x.is_caution && " ⚠"}
                  </strong>
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

      {/* 최근 등록/수정 부자재 - 최근 등록/수정 원료와 동일한 카드 레이아웃 */}
      <section style={{ marginBottom: 18 }}>
        <article className="v50-panel">
          <h2>최근 등록/수정 부자재</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {h.data.recentMaterials.map((x) => (
              <div key={x.material_code} className="v50-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <strong>{x.material_name}</strong>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{x.material_code}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                  규격 {x.spec || "-"} · 공급사 {x.supplier || "-"}
                </div>
              </div>
            ))}
            {h.data.recentMaterials.length === 0 && <p style={{ color: "#64748b" }}>최근 부자재가 없습니다.</p>}
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
