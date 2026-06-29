"use client";

import { useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

type TabKey = "home" | "sprint0" | "formula" | "users";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  const auth = useSprint1Auth();

  function renderActive() {
    if (active === "sprint0") return <Sprint0Dashboard />;
    if (active === "formula") return <FormulaCoreWithAuthPanel />;
    if (active === "users") return <UserAdminPanel />;
    return <Sprint1Home openSprint0={() => setActive("sprint0")} openFormula={() => setActive("formula")} openUsers={() => setActive("users")} canManageUsers={auth.canManageUsers} />;
  }

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">Sprint 1-3 로그인/권한</div>
          </div>

          <nav className="v50-menu">
            <div>
              <div className="v50-menu-label">현재 사용 가능</div>
              <button className={active === "home" ? "active" : ""} onClick={() => setActive("home")}><span>연구원 홈</span></button>
              <button className={active === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}><span>기반 안정화 점검</span></button>
              <button className={active === "formula" ? "active" : ""} onClick={() => setActive("formula")}><span>처방관리 Core</span></button>
              {auth.canManageUsers && <button className={active === "users" ? "active" : ""} onClick={() => setActive("users")}><span>사용자 권한관리</span></button>}
            </div>

            <div>
              <div className="v50-menu-label">내 계정</div>
              <div style={{ padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                <strong>{auth.profile?.email}</strong><br />
                역할: {auth.profile?.role}
              </div>
              <button onClick={auth.logout}><span>로그아웃</span></button>
            </div>

            <div>
              <div className="v50-menu-label">다음 Sprint 예정</div>
              <button disabled><span>원료관리 CRUD</span></button>
              <button disabled><span>문서관리 PDF</span></button>
              <button disabled><span>모바일/승인/공유</span></button>
            </div>
          </nav>
        </aside>

        <main className="v50-main">
          <header className="v50-topbar">
            <input className="v50-search" placeholder="로그인/권한 적용 완료: Admin/Researcher/QA/Viewer 기준으로 접근합니다." readOnly />
            <div className="v50-top-actions">
              {auth.canManageUsers && <button className="v50-button-light" onClick={() => setActive("users")}>사용자 관리</button>}
              <button className="v50-button" onClick={() => setActive("formula")}>처방관리 Core</button>
            </div>
          </header>

          <nav className="v50-tabs">
            <div className={`v50-tab ${active === "home" ? "active" : ""}`} onClick={() => setActive("home")}><span>연구원 홈</span></div>
            <div className={`v50-tab ${active === "sprint0" ? "active" : ""}`} onClick={() => setActive("sprint0")}><span>기반 안정화 점검</span></div>
            <div className={`v50-tab ${active === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}><span>처방관리 Core</span></div>
            {auth.canManageUsers && <div className={`v50-tab ${active === "users" ? "active" : ""}`} onClick={() => setActive("users")}><span>사용자 권한관리</span></div>}
          </nav>

          <section className="v50-content">{renderActive()}</section>
        </main>
      </div>
    </div>
  );
}

function Sprint1Home({
  openSprint0,
  openFormula,
  openUsers,
  canManageUsers,
}: {
  openSprint0: () => void;
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
            Sprint 1-3 로그인/권한 적용 단계입니다. 외부 접근을 막고, 관리자/연구원 권한을 기준으로 운영합니다.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={openSprint0}>기반 안정화 점검</button>
          <button onClick={openFormula}>처방관리 시작</button>
          {canManageUsers && <button onClick={openUsers}>사용자 관리</button>}
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="로그인" value="적용" hint="Supabase Auth" />
        <Kpi label="권한" value="4단계" hint="Admin/Researcher/QA/Viewer" />
        <Kpi label="DB 기준" value="plm_*" hint="RLS 적용" />
        <Kpi label="다음 단계" value="UX 보정" hint="Sprint 1-4" />
      </section>

      <section className="v50-grid-3">
        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>처방관리 Core</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>로그인 후 표준 DB 기반 처방관리 기능을 사용합니다.</p>
          <button className="v50-button" onClick={openFormula}>열기</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge ok">사용 가능</span>
          <h3>사용자 권한관리</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>Admin이 사용자 역할과 활성 상태를 관리합니다.</p>
          {canManageUsers ? <button className="v50-button-light" onClick={openUsers}>열기</button> : <p style={{ color: "#64748b" }}>Admin 전용</p>}
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">중요</span>
          <h3>최초 Admin 설정</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            최초 로그인 계정은 Researcher로 생성됩니다. SQL로 1회 Admin 승격이 필요합니다.
          </p>
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
