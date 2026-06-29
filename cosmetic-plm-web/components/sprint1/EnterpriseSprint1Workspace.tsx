"use client";

import { useState } from "react";
import FormulaCorePanel from "@/components/sprint1/FormulaCorePanel";
import "@/styles/enterprise-v50.css";

type TabKey = "home" | "formula";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">Sprint 1 실사용 전환</div>
          </div>

          <nav className="v50-menu">
            <div>
              <div className="v50-menu-label">실사용 메뉴</div>
              <button className={active === "home" ? "active" : ""} onClick={() => setActive("home")}>
                <span>연구원 홈</span>
              </button>
              <button className={active === "formula" ? "active" : ""} onClick={() => setActive("formula")}>
                <span>처방관리 Core</span>
              </button>
            </div>

            <div>
              <div className="v50-menu-label">다음 Sprint 예정</div>
              <button disabled title="Sprint 2에서 정식 연결 예정">
                <span>원료관리</span>
              </button>
              <button disabled title="Sprint 2에서 PDF 중심으로 정식 연결 예정">
                <span>문서관리</span>
              </button>
              <button disabled title="Sprint 3 이후 진행 예정">
                <span>모바일/승인/공유</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="v50-main">
          <header className="v50-topbar">
            <input className="v50-search" placeholder="현재 Sprint 1에서는 처방관리 Core를 우선 안정화합니다." readOnly />
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => setActive("home")}>홈</button>
              <button className="v50-button" onClick={() => setActive("formula")}>처방관리 Core</button>
            </div>
          </header>

          <nav className="v50-tabs">
            <div className={`v50-tab ${active === "home" ? "active" : ""}`} onClick={() => setActive("home")}>
              <span>연구원 홈</span>
            </div>
            <div className={`v50-tab ${active === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}>
              <span>처방관리 Core</span>
            </div>
          </nav>

          <section className="v50-content">
            {active === "home" ? <Sprint1Home openFormula={() => setActive("formula")} /> : <FormulaCorePanel />}
          </section>
        </main>
      </div>
    </div>
  );
}

function Sprint1Home({ openFormula }: { openFormula: () => void }) {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">
            지금은 기능 확장이 아니라 실제 업무가 되는 최소 기능을 안정화하는 단계입니다.
            Sprint 1에서는 처방관리 Core만 사용 대상으로 열어두었습니다.
          </p>
        </div>
        <button className="v50-button" onClick={openFormula}>처방관리 시작</button>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="현재 단계" value="Sprint 1" hint="처방관리 Core" />
        <Kpi label="DB 기준" value="plm_*" hint="표준 테이블만 사용" />
        <Kpi label="원료 방식" value="검색/선택" hint="10,000건 마스터 활용" />
        <Kpi label="문서/모바일" value="보류" hint="Sprint 2 이후" />
      </section>

      <section className="v50-grid-3">
        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>처방관리 Core</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            처방 등록, 수정, 삭제, 원료 검색, BOM 추가, Phase 수정, 함량 수정, 자동합계, 자동원가, 자동전성분을 확인합니다.
          </p>
          <button className="v50-button" onClick={openFormula}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">진행 예정</span>
          <h3>원료관리 정식 CRUD</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Sprint 2에서 복합원료, 구성성분, 자동 INCI를 표준 DB 기준으로 연결합니다.
          </p>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">진행 예정</span>
          <h3>문서관리 PDF</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Sprint 2에서 PDF 1종부터 실제 다운로드 가능한 양식으로 연결합니다.
          </p>
        </article>
      </section>

      <section className="v50-panel" style={{ marginTop: 18 }}>
        <h2>이번 화면의 목적</h2>
        <ol style={{ lineHeight: 1.9, color: "#334155" }}>
          <li>기존 /enterprise에서 동작하지 않는 복잡한 메뉴를 숨깁니다.</li>
          <li>실제로 검증해야 할 처방관리 Core만 메인 Workspace에 연결합니다.</li>
          <li>검증 완료 후 Sprint 2 기능을 하나씩 추가합니다.</li>
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
