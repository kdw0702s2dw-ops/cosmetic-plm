"use client";

import { useState } from "react";
import FormulaCorePanel from "@/components/sprint1/FormulaCorePanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import "@/styles/enterprise-v50.css";

type TabKey = "home" | "sprint0" | "formula";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");

  function renderActive() {
    if (active === "sprint0") return <Sprint0Dashboard />;
    if (active === "formula") return <FormulaCorePanel />;
    return <Sprint1Home openSprint0={() => setActive("sprint0")} openFormula={() => setActive("formula")} />;
  }

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">Sprint 1 운영 Workspace</div>
          </div>

          <nav className="v50-menu">
            <div>
              <div className="v50-menu-label">현재 사용 가능</div>
              <button className={active === "home" ? "active" : ""} onClick={() => setActive("home")}>
                <span>연구원 홈</span>
              </button>
              <button className={active === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}>
                <span>기반 안정화 점검</span>
              </button>
              <button className={active === "formula" ? "active" : ""} onClick={() => setActive("formula")}>
                <span>처방관리 Core</span>
              </button>
            </div>

            <div>
              <div className="v50-menu-label">직접 접속 주소</div>
              <a href="/platform/sprint0" style={linkStyle}>/platform/sprint0</a>
              <a href="/sprint1/formula-core" style={linkStyle}>/sprint1/formula-core</a>
            </div>

            <div>
              <div className="v50-menu-label">다음 Sprint 예정</div>
              <button disabled title="Sprint 2에서 정식 연결 예정">
                <span>원료관리 CRUD</span>
              </button>
              <button disabled title="Sprint 2에서 PDF 중심으로 정식 연결 예정">
                <span>문서관리 PDF</span>
              </button>
              <button disabled title="Sprint 3 이후 진행 예정">
                <span>모바일/승인/공유</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="v50-main">
          <header className="v50-topbar">
            <input className="v50-search" placeholder="Sprint 1: 기반 안정화 + 처방관리 Core를 /enterprise에서 바로 사용합니다." readOnly />
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => setActive("sprint0")}>기반 점검</button>
              <button className="v50-button" onClick={() => setActive("formula")}>처방관리 Core</button>
            </div>
          </header>

          <nav className="v50-tabs">
            <div className={`v50-tab ${active === "home" ? "active" : ""}`} onClick={() => setActive("home")}>
              <span>연구원 홈</span>
            </div>
            <div className={`v50-tab ${active === "sprint0" ? "active" : ""}`} onClick={() => setActive("sprint0")}>
              <span>기반 안정화 점검</span>
            </div>
            <div className={`v50-tab ${active === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}>
              <span>처방관리 Core</span>
            </div>
          </nav>

          <section className="v50-content">{renderActive()}</section>
        </main>
      </div>
    </div>
  );
}

const linkStyle = {
  display: "block",
  padding: "9px 12px",
  margin: "4px 0",
  borderRadius: 10,
  color: "#475569",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 800,
  background: "#f8fafc",
};

function Sprint1Home({
  openSprint0,
  openFormula,
}: {
  openSprint0: () => void;
  openFormula: () => void;
}) {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">
            Sprint 0과 Sprint 1에서 실제 적용한 항목을 /enterprise에 연결했습니다.
            현재는 기반 안정화 점검과 처방관리 Core만 사용 가능한 상태로 고정합니다.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={openSprint0}>기반 안정화 점검</button>
          <button onClick={openFormula}>처방관리 시작</button>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="Sprint 0" value="연결완료" hint="표준 DB/RLS 점검" />
        <Kpi label="Sprint 1" value="연결완료" hint="처방관리 Core" />
        <Kpi label="DB 기준" value="plm_*" hint="표준 테이블만 사용" />
        <Kpi label="다음 단계" value="검증 후 진행" hint="원료 CRUD/PDF" />
      </section>

      <section className="v50-grid-3">
        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>기반 안정화 점검</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            표준 원료, 표준 처방, 표준 BOM, 표준 문서, Archive Registry 상태를 확인합니다.
          </p>
          <button className="v50-button-light" onClick={openSprint0}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>처방관리 Core</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            처방 등록, 수정, 삭제, 원료 검색, BOM 추가/수정/삭제, 자동합계, 자동원가, 자동전성분을 사용합니다.
          </p>
          <button className="v50-button" onClick={openFormula}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">아직 비활성</span>
          <h3>원료관리 / 문서관리</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Sprint 2에서 표준 DB 기준으로 하나씩 연결합니다. 지금은 혼란 방지를 위해 숨김/비활성 상태입니다.
          </p>
        </article>
      </section>

      <section className="v50-panel" style={{ marginTop: 18 }}>
        <h2>검증 순서</h2>
        <ol style={{ lineHeight: 1.9, color: "#334155" }}>
          <li>기반 안정화 점검에서 `plm_raw_materials`, `plm_formulas`, `plm_formula_lines` 데이터 수를 확인합니다.</li>
          <li>처방관리 Core에서 신규 처방을 하나 생성합니다.</li>
          <li>원료 검색 후 BOM에 추가합니다.</li>
          <li>Phase와 함량을 수정하고 총합/원가/전성분이 바뀌는지 확인합니다.</li>
          <li>라인 삭제와 처방 삭제 처리가 되는지 확인합니다.</li>
        </ol>
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
