"use client";

import { useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import RawMaterialCorePanel from "@/components/sprint2/RawMaterialCorePanel";
import RawMaterialManager from "@/components/sprint2/RawMaterialManager";
import DocumentPdfPanel from "@/components/sprint2/DocumentPdfPanel";
import ResearcherHomePanel from "@/components/sprint2/ResearcherHomePanel";
import RegulationEnginePanel from "@/components/sprint2/RegulationEnginePanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";
import "@/styles/enterprise-mobile.css";

type TabKey = "home" | "sprint0" | "raw" | "rawManager" | "formula" | "docs" | "regulation" | "users";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  const auth = useSprint1Auth();

  function renderActive() {
    if (active === "sprint0") return <Sprint0Dashboard />;
    if (active === "raw") return <RawMaterialCorePanel />;
    if (active === "rawManager") return <RawMaterialManager />;
    if (active === "formula") return <FormulaCoreWithAuthPanel />;
    if (active === "docs") return <DocumentPdfPanel />;
    if (active === "regulation") return <RegulationEnginePanel />;
    if (active === "users") return <UserAdminPanel />;
    return <ResearcherHomePanel openRaw={() => setActive("raw")} openFormula={() => setActive("formula")} openDocs={() => setActive("docs")} />;
  }

  return (
    <div className="v50-root"><div className="v50-shell">
      <aside className="v50-sidebar">
        <div className="v50-brand"><div className="v50-brand-title">화장품 PLM</div><div className="v50-brand-sub">실시간 연구원 Workspace</div></div>
        <nav className="v50-menu">
          <div>
            <div className="v50-menu-label">현재 사용 가능</div>
            <button className={active === "home" ? "active" : ""} onClick={() => setActive("home")}><span>연구원 홈</span></button>
            <button className={active === "raw" ? "active" : ""} onClick={() => setActive("raw")}><span>원료관리 Core</span></button>
            <button className={active === "rawManager" ? "active" : ""} onClick={() => setActive("rawManager")}><span>원료 관리</span></button>
            <button className={active === "formula" ? "active" : ""} onClick={() => setActive("formula")}><span>처방관리 Core</span></button>
            <button className={active === "docs" ? "active" : ""} onClick={() => setActive("docs")}><span>문서관리 PDF</span></button>
            <button className={active === "regulation" ? "active" : ""} onClick={() => setActive("regulation")}><span>글로벌 규제검증</span></button>
            <button className={active === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}><span>기반 안정화 점검</span></button>
            {auth.canManageUsers && <button className={active === "users" ? "active" : ""} onClick={() => setActive("users")}><span>사용자 권한관리</span></button>}
          </div>
          <div>
            <div className="v50-menu-label">내 계정</div>
            <div style={{ padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.6 }}><strong>{auth.profile?.email}</strong><br />역할: {auth.profile?.role}</div>
            <button onClick={auth.logout}><span>로그아웃</span></button>
          </div>
        </nav>
      </aside>

      <main className="v50-main">
        <header className="v50-topbar">
          <input className="v50-search" placeholder="원료, 처방, 문서, 글로벌 규제검증을 DB 기준으로 사용합니다." readOnly />
          <div className="v50-top-actions">
            <button className="v50-button-light" onClick={() => setActive("formula")}>처방관리</button>
            <button className="v50-button-light" onClick={() => setActive("docs")}>문서관리</button>
            <button className="v50-button" onClick={() => setActive("regulation")}>규제검증</button>
          </div>
        </header>
        <nav className="v50-tabs">
          <div className={`v50-tab ${active === "home" ? "active" : ""}`} onClick={() => setActive("home")}><span>연구원 홈</span></div>
          <div className={`v50-tab ${active === "raw" ? "active" : ""}`} onClick={() => setActive("raw")}><span>원료관리</span></div>
          <div className={`v50-tab ${active === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}><span>처방관리</span></div>
          <div className={`v50-tab ${active === "docs" ? "active" : ""}`} onClick={() => setActive("docs")}><span>문서관리 PDF</span></div>
          <div className={`v50-tab ${active === "regulation" ? "active" : ""}`} onClick={() => setActive("regulation")}><span>글로벌 규제검증</span></div>
          <div className={`v50-tab ${active === "sprint0" ? "active" : ""}`} onClick={() => setActive("sprint0")}><span>기반 점검</span></div>
          {auth.canManageUsers && <div className={`v50-tab ${active === "users" ? "active" : ""}`} onClick={() => setActive("users")}><span>사용자 권한관리</span></div>}
        </nav>
        <section className="v50-content">{renderActive()}</section>
      </main>
    </div></div>
  );
}
