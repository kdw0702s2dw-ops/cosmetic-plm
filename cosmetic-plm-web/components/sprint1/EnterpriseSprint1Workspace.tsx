"use client";

import { useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import RawMaterialCorePanel from "@/components/sprint2/RawMaterialCorePanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

type TabKey = "home" | "sprint0" | "raw" | "formula" | "users";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  const auth = useSprint1Auth();

  function renderActive() {
    if (active === "sprint0") return <Sprint0Dashboard />;
    if (active === "raw") return <RawMaterialCorePanel />;
    if (active === "formula") return <FormulaCoreWithAuthPanel />;
    if (active === "users") return <UserAdminPanel />;
    return (
      <EnterpriseHome
        openSprint0={() => setActive("sprint0")}
        openRaw={() => setActive("raw")}
        openFormula={() => setActive("formula")}
        openUsers={() => setActive("users")}
        canManageUsers={auth.canManageUsers}
      />
    );
  }

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">운영 Core Workspace</div>
          </div>

          <nav className="v50-menu">
            <div>
              <div className="v50-menu-label">현재 사용 가능</div>
              <button className={active === "home" ? "active" : ""} onClick={() => setActive("home")}>
                <span>연구원 홈</span>
              </button>
              <button className={active === "raw" ? "active" : ""} onClick={() => setActive("raw")}>
                <span>원료관리 Core</span>
              </button>
              <button className={active === "formula" ? "active" : ""} onClick={() => setActive("formula")}>
                <span>처방관리 Core</span>
              </button>
              <button className={active === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}>
                <span>기반 안정화 점검</span>
              </button>
              {auth.canManageUsers && (
                <button className={active === "users" ? "active" : ""} onClick={() => setActive("users")}>
                  <span>사용자 권한관리</span>
                </button>
              )}
            </div>

            <div>
              <div className="v50-menu-label">내 계정</div>
              <div style={{ padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                <strong>{auth.profile?.email}</strong><br />
                역할: {auth.profile?.role}
              </div>
              <button onClick={auth.logout}>
                <span>로그아웃</span>
              </button>
            </div>

            <div>
              <div className="v50-menu-label">다음 개발 예정</div>
              <button disabled><span>문서관리 PDF</span></button>
              <button disabled><span>모바일 최적화</span></button>
            </div>
          </nav>
        </aside>

        <main className="v50-main">
          <header className="v50-topbar">
            <input className="v50-search" placeholder="원료관리 Core와 처방관리 Core를 실제 DB 기준으로 사용합니다." readOnly />
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => setActive("raw")}>원료관리</button>
              <button className="v50-button" onClick={() => setActive("formula")}>처방관리</button>
            </div>
          </header>

          <nav className="v50-tabs">
            <div className={`v50-tab ${active === "home" ? "active" : ""}`} onClick={() => setActive("home")}>
              <span>연구원 홈</span>
            </div>
            <div className={`v50-tab ${active === "raw" ? "active" : ""}`} onClick={() => setActive("raw")}>
              <span>원료관리 Core</span>
            </div>
            <div className={`v50-tab ${active === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}>
              <span>처방관리 Core</span>
            </div>
            <div className={`v50-tab ${active === "sprint0" ? "active" : ""}`} onClick={() => setActive("sprint0")}>
              <span>기반 점검</span>
            </div>
            {auth.canManageUsers && (
              <div className={`v50-tab ${active === "users" ? "active" : ""}`} onClick={() => setActive("users")}>
                <span>사용자 권한관리</span>
              </div>
            )}
          </nav>

          <section className="v50-content">{renderActive()}</section>
        </main>
      </div>
    </div>
  );
}

function EnterpriseHome({
  openSprint0,
  openRaw,
  openFormula,
  openUsers,
  canManageUsers,
}: {
  openSprint0: () => void;
  openRaw: () => void;
  openFormula: () => void;
  openUsers: () => void;
  canManageUsers: boolean;
}) {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">
            이제 /enterprise에서 원료관리 Core와 처방관리 Core를 바로 사용합니다. 새 기능은 항상 이 Workspace에 연결합니다.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={openRaw}>원료관리 시작</button>
          <button onClick={openFormula}>처방관리 시작</button>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="로그인" value="완료" hint="Supabase Auth" />
        <Kpi label="원료관리" value="연결완료" hint="Sprint 2-1" />
        <Kpi label="처방관리" value="연결완료" hint="Sprint 1 Core" />
        <Kpi label="DB" value="plm_*" hint="표준 테이블" />
      </section>

      <section className="v50-grid-3">
        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>원료관리 Core</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            원료 등록, 수정, 삭제, 복사, 복합 구성성분 등록, INCI 자동 반영을 사용합니다.
          </p>
          <button className="v50-button" onClick={openRaw}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>처방관리 Core</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            원료 검색, BOM 추가, 함량/Phase 수정, 자동합계, 자동원가를 사용합니다.
          </p>
          <button className="v50-button-light" onClick={openFormula}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">다음 단계</span>
          <h3>문서관리 PDF</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            원료/처방 Core 검증 후 처방서 PDF 1종부터 실제 다운로드로 연결합니다.
          </p>
        </article>
      </section>

      <section className="v50-panel" style={{ marginTop: 18 }}>
        <h2>운영 검증 순서</h2>
        <ol style={{ lineHeight: 1.9, color: "#334155" }}>
          <li>원료관리에서 신규 원료를 저장합니다.</li>
          <li>복합원료 구성성분을 등록하고 구성합계 100%를 확인합니다.</li>
          <li>구성성분 기준 자동 반영으로 INCI/CAS/기능이 원료마스터에 반영되는지 확인합니다.</li>
          <li>처방관리에서 해당 원료를 검색해 BOM에 추가합니다.</li>
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
