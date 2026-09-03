"use client";

import { useEffect, useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import RawMaterialManager from "@/components/sprint2/RawMaterialManager";
import MaterialManager from "@/components/sprint2/MaterialManager";
import CompanyManager from "@/components/sprint2/CompanyManager";
import IngredientDictionaryManager from "@/components/sprint2/IngredientDictionaryManager";
import DocumentPdfPanel from "@/components/sprint2/DocumentPdfPanel";
import ProductionManagementPanel from "@/components/sprint2/ProductionManagementPanel";
import QualityManagementPanel from "@/components/sprint2/QualityManagementPanel";
import ResearcherHomePanel from "@/components/sprint2/ResearcherHomePanel";
import RegulationEnginePanel from "@/components/sprint2/RegulationEnginePanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";
import "@/styles/enterprise-mobile.css";

type TabKey = "home" | "sprint0" | "ingredientDict" | "rawManager" | "materialManager" | "companyManager" | "formula" | "docs" | "production" | "quality" | "regulation" | "users";

// Production 역할은 부자재관리/원료관리/생산관리만 볼 수 있음
const PRODUCTION_ALLOWED_TABS: TabKey[] = ["materialManager", "rawManager", "production"];

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  const auth = useSprint1Auth();
  const isProduction = auth.isProductionRole;

  // Production 역할은 허용된 탭 밖에 있으면(초기값 home 포함) 접근 가능한 탭으로 이동
  useEffect(() => {
    if (isProduction && !PRODUCTION_ALLOWED_TABS.includes(active)) {
      setActive("materialManager");
    }
  }, [isProduction, active]);

  const effectiveActive: TabKey = isProduction && !PRODUCTION_ALLOWED_TABS.includes(active) ? "materialManager" : active;

  function renderActive() {
    if (effectiveActive === "sprint0") return <Sprint0Dashboard />;
    if (effectiveActive === "ingredientDict") return <IngredientDictionaryManager />;
    if (effectiveActive === "rawManager") return <RawMaterialManager />;
    if (effectiveActive === "materialManager") return <MaterialManager />;
    if (effectiveActive === "companyManager") return <CompanyManager />;
    if (effectiveActive === "formula") return <FormulaCoreWithAuthPanel />;
    if (effectiveActive === "docs") return <DocumentPdfPanel />;
    if (effectiveActive === "production") return <ProductionManagementPanel />;
    if (effectiveActive === "quality") return <QualityManagementPanel />;
    if (effectiveActive === "regulation") return <RegulationEnginePanel />;
    if (effectiveActive === "users") return <UserAdminPanel />;
    return <ResearcherHomePanel openRaw={() => setActive("rawManager")} openFormula={() => setActive("formula")} openDocs={() => setActive("docs")} openQuality={() => setActive("quality")} />;
  }

  return (
    <div className="v50-root"><div className="v50-shell">
      <aside className="v50-sidebar">
        <div className="v50-brand"><div className="v50-brand-title">화장품 PLM</div><div className="v50-brand-sub">실시간 연구원 Workspace</div></div>
        <nav className="v50-menu">
          <div>
            <div className="v50-menu-label">현재 사용 가능</div>
            {!isProduction && <button className={effectiveActive === "home" ? "active" : ""} onClick={() => setActive("home")}><span>연구원 홈</span></button>}
            {!isProduction && <button className={effectiveActive === "companyManager" ? "active" : ""} onClick={() => setActive("companyManager")}><span>업체관리</span></button>}
            <button className={effectiveActive === "materialManager" ? "active" : ""} onClick={() => setActive("materialManager")}><span>부자재관리</span></button>
            {!isProduction && <button className={effectiveActive === "ingredientDict" ? "active" : ""} onClick={() => setActive("ingredientDict")}><span>전성분관리</span></button>}
            <button className={effectiveActive === "rawManager" ? "active" : ""} onClick={() => setActive("rawManager")}><span>원료 관리</span></button>
            {!isProduction && <button className={effectiveActive === "formula" ? "active" : ""} onClick={() => setActive("formula")}><span>처방관리</span></button>}
            {!isProduction && <button className={effectiveActive === "docs" ? "active" : ""} onClick={() => setActive("docs")}><span>문서관리 PDF</span></button>}
            <button className={effectiveActive === "production" ? "active" : ""} onClick={() => setActive("production")}><span>생산관리</span></button>
            {!isProduction && <button className={effectiveActive === "quality" ? "active" : ""} onClick={() => setActive("quality")}><span>품질관리</span></button>}
            {!isProduction && <button className={effectiveActive === "regulation" ? "active" : ""} onClick={() => setActive("regulation")}><span>글로벌 규제검증</span></button>}
            {!isProduction && <a href="https://cosmocheck.cc/check" target="_blank" rel="noopener noreferrer"><span>성분 규제 체크(외부)</span></a>}
            {!isProduction && <button className={effectiveActive === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}><span>기반 안정화 점검</span></button>}
            {!isProduction && auth.canManageUsers && <button className={effectiveActive === "users" ? "active" : ""} onClick={() => setActive("users")}><span>사용자 권한관리</span></button>}
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
          {!isProduction && (
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => setActive("formula")}>처방관리</button>
              <button className="v50-button-light" onClick={() => setActive("docs")}>문서관리</button>
              <button className="v50-button" onClick={() => setActive("regulation")}>규제검증</button>
            </div>
          )}
        </header>
        <nav className="v50-tabs">
          {!isProduction && <div className={`v50-tab ${effectiveActive === "home" ? "active" : ""}`} onClick={() => setActive("home")}><span>연구원 홈</span></div>}
          {!isProduction && <div className={`v50-tab ${effectiveActive === "companyManager" ? "active" : ""}`} onClick={() => setActive("companyManager")}><span>업체관리</span></div>}
          <div className={`v50-tab ${effectiveActive === "materialManager" ? "active" : ""}`} onClick={() => setActive("materialManager")}><span>부자재관리</span></div>
          {!isProduction && <div className={`v50-tab ${effectiveActive === "ingredientDict" ? "active" : ""}`} onClick={() => setActive("ingredientDict")}><span>전성분관리</span></div>}
          <div className={`v50-tab ${effectiveActive === "rawManager" ? "active" : ""}`} onClick={() => setActive("rawManager")}><span>원료관리</span></div>
          {!isProduction && <div className={`v50-tab ${effectiveActive === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}><span>처방관리</span></div>}
          {!isProduction && <div className={`v50-tab ${effectiveActive === "docs" ? "active" : ""}`} onClick={() => setActive("docs")}><span>문서관리 PDF</span></div>}
          <div className={`v50-tab ${effectiveActive === "production" ? "active" : ""}`} onClick={() => setActive("production")}><span>생산관리</span></div>
          {!isProduction && <div className={`v50-tab ${effectiveActive === "quality" ? "active" : ""}`} onClick={() => setActive("quality")}><span>품질관리</span></div>}
          {!isProduction && <div className={`v50-tab ${effectiveActive === "regulation" ? "active" : ""}`} onClick={() => setActive("regulation")}><span>글로벌 규제검증</span></div>}
          {!isProduction && <div className={`v50-tab ${effectiveActive === "sprint0" ? "active" : ""}`} onClick={() => setActive("sprint0")}><span>기반 점검</span></div>}
          {!isProduction && auth.canManageUsers && <div className={`v50-tab ${effectiveActive === "users" ? "active" : ""}`} onClick={() => setActive("users")}><span>사용자 권한관리</span></div>}
        </nav>
        <section className="v50-content">{renderActive()}</section>
      </main>
    </div></div>
  );
}
