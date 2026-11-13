"use client";

import { useEffect, useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import RawMaterialManager from "@/components/sprint2/RawMaterialManager";
import RawMaterialPurchaseOrderManager from "@/components/sprint2/RawMaterialPurchaseOrderManager";
import MaterialManager from "@/components/sprint2/MaterialManager";
import CompanyManager from "@/components/sprint2/CompanyManager";
import IngredientDictionaryManager from "@/components/sprint2/IngredientDictionaryManager";
import DocumentPdfPanel from "@/components/sprint2/DocumentPdfPanel";
import ProductionManagementPanel from "@/components/sprint2/ProductionManagementPanel";
import ProductionRecordManager from "@/components/sprint2/ProductionRecordManager";
import QualityManagementPanel from "@/components/sprint2/QualityManagementPanel";
import ResearcherHomePanel from "@/components/sprint2/ResearcherHomePanel";
import RegulationEnginePanel from "@/components/sprint2/RegulationEnginePanel";
import UnifiedBomPanel from "@/components/sprint2/UnifiedBomPanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import MySignatureWidget from "@/components/sprint1/MySignatureWidget";
import type { PurchaseOrderDraftResult } from "@/services/sprint2/manufacturingQtyReviewService";
import "@/styles/enterprise-v50.css";
import "@/styles/enterprise-mobile.css";

type TabKey = "home" | "sprint0" | "ingredientDict" | "rawManager" | "purchaseOrder" | "materialManager" | "companyManager" | "formula" | "docs" | "unifiedBom" | "production" | "productionRecords" | "quality" | "regulation" | "users";

// 역할별로 어떤 탭(사이드바/상단)을 볼 수 있는지는 더 이상 여기 하드코딩하지 않고, 사용자 권한관리
// 화면에서 Admin이 설정하는 plm_role_page_access 기반 auth.isPageVisible()로 판단한다(Admin은 설정
// 대상에서 제외되어 항상 전체 메뉴). 예전에는 Production 역할만 PRODUCTION_ALLOWED_TABS로 하드코딩되어
// 있었는데, 배포 시 그 제한과 정확히 동일한 결과가 나오도록 DB에 시드해뒀다(마이그레이션 참고).

// 탭을 전환해도 화면에 입력한 내용 등 상태가 유지되도록, 방문한 적이 있으면 마운트 상태를 유지하는 탭 목록
const KEEP_ALIVE_TABS: TabKey[] = ["ingredientDict", "rawManager", "formula", "docs", "unifiedBom", "production", "productionRecords", "quality"];

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  // 모바일 폭(<=900px)에서는 사이드바 전체 메뉴가 화면 높이를 거의 다 채워서 실제 콘텐츠가 한참
  // 아래로 밀리는 문제가 있었다("모바일 최적화 검토" 요청, 1단계: 사이드바/내비게이션). 그래서
  // 모바일에서는 메뉴를 기본적으로 숨기고, 햄버거 버튼으로 전체화면 드로어로 열고 닫게 한다.
  // 데스크톱에서는 이 state와 무관하게 CSS 미디어쿼리(<=900px 바깥)에서 사이드바가 항상 보이므로
  // 기존 동작이 그대로 유지된다.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const auth = useSprint1Auth();

  // 생산관리(제조량 확인)의 "합산 부족 원료 목록" -> 원료 발주관리 연동용. "발주서 만들기"를 누르면
  // 결과(공급사별 초안 + 공급사 미등록 원료 목록)를 여기 담아두고 원료 발주관리 탭으로 전환한다.
  // requestId는 매 요청마다 새로 발급해서, 원료 발주관리 화면이 같은 요청을 중복 처리하지 않게 한다.
  // 원료 발주관리는 KEEP_ALIVE_TABS에 없어 탭을 벗어났다 돌아오면 매번 재마운트되므로, 처리가 끝나면
  // onDraftHandled로 여기 값을 null로 비워야 한다 - 안 비우면 재마운트 시 같은 요청이 다시 전달되어
  // 이미 저장을 끝낸 발주 초안이 되살아나는 버그가 있었다.
  // (render 중에 ref를 "소비"해서 비우는 방식도 검토했으나, 이 프로젝트의 eslint 설정에 "Cannot access
  // refs during render" 규칙이 걸려 있어 새로운 유형의 에러가 생겨 폐기 - state + 콜백 방식을 유지한다.)
  const [poDraftRequest, setPoDraftRequest] = useState<{ requestId: number; result: PurchaseOrderDraftResult } | null>(null);
  function handleCreatePurchaseOrders(result: PurchaseOrderDraftResult) {
    setPoDraftRequest({ requestId: Date.now(), result });
    setActive("purchaseOrder");
  }

  // 현재 역할에게 숨겨진 탭 밖에 있으면(초기값 home 포함) 보이는 탭으로 이동. "materialManager"는
  // 모든 역할에 기본으로 열어두길 권장하는 폴백 탭 - 이것까지 숨기면 그 역할은 갈 곳이 없어진다.
  useEffect(() => {
    // pageAccessLoaded가 false인 동안(숨김 목록을 아직 불러오는 중)에는 리다이렉트를 보류한다.
    // 그렇지 않으면 로딩 창 동안 모든 역할이 일시적으로 materialManager로 튕겨나갔다가 되돌아온다.
    if (!auth.pageAccessLoaded) return;
    if (!auth.isPageVisible(active)) {
      setActive("materialManager");
    }
  }, [auth, active]);

  const effectiveActive: TabKey =
    !auth.pageAccessLoaded || auth.isPageVisible(active) ? active : "materialManager";

  // 방문한 keep-alive 탭 목록 — 한 번 열었던 탭은 언마운트하지 않고 숨김 처리만 해서 상태를 보존
  const [visitedKeepAliveTabs, setVisitedKeepAliveTabs] = useState<TabKey[]>([]);
  useEffect(() => {
    if (KEEP_ALIVE_TABS.includes(effectiveActive) && !visitedKeepAliveTabs.includes(effectiveActive)) {
      setVisitedKeepAliveTabs((prev) => [...prev, effectiveActive]);
    }
  }, [effectiveActive, visitedKeepAliveTabs]);

  const isKeepAliveActive = KEEP_ALIVE_TABS.includes(effectiveActive);

  function renderKeepAliveTab(tab: TabKey) {
    if (tab === "ingredientDict") return <IngredientDictionaryManager />;
    if (tab === "rawManager") return <RawMaterialManager />;
    if (tab === "formula") return <FormulaCoreWithAuthPanel />;
    if (tab === "docs") return <DocumentPdfPanel />;
    if (tab === "unifiedBom") return <UnifiedBomPanel />;
    if (tab === "production") return <ProductionManagementPanel onCreatePurchaseOrders={handleCreatePurchaseOrders} />;
    if (tab === "productionRecords") return <ProductionRecordManager />;
    if (tab === "quality") return <QualityManagementPanel />;
    return null;
  }

  function renderActive() {
    if (effectiveActive === "sprint0") return <Sprint0Dashboard />;
    if (effectiveActive === "materialManager") return <MaterialManager />;
    if (effectiveActive === "purchaseOrder") {
      return <RawMaterialPurchaseOrderManager initialDraftRequest={poDraftRequest} onDraftHandled={() => setPoDraftRequest(null)} />;
    }
    if (effectiveActive === "companyManager") return <CompanyManager />;
    if (effectiveActive === "regulation") return <RegulationEnginePanel />;
    if (effectiveActive === "users") return <UserAdminPanel />;
    return <ResearcherHomePanel openRaw={() => setActive("rawManager")} openFormula={() => setActive("formula")} openDocs={() => setActive("docs")} openQuality={() => setActive("quality")} />;
  }

  return (
    <div className="v50-root"><div className="v50-shell">
      {/* 모바일 전용 햄버거 버튼 - enterprise-mobile.css에서 900px 이하일 때만 보이게 되어 있고,
          position:fixed라 사이드바가 display:none이어도 항상 눌러서 열 수 있다. */}
      <button type="button" className="v50-hamburger-btn" aria-label="메뉴 열기" onClick={() => setMobileNavOpen(true)}>☰</button>
      <aside className={`v50-sidebar${mobileNavOpen ? " v50-mobile-open" : ""}`}>
        <div className="v50-brand">
          <div className="v50-brand-title">화장품 PLM</div><div className="v50-brand-sub">실시간 연구원 Workspace</div>
          {/* 모바일에서 전체화면 드로어로 열렸을 때만 CSS로 보이는 닫기 버튼 */}
          <button type="button" className="v50-drawer-close" aria-label="메뉴 닫기" onClick={() => setMobileNavOpen(false)}>✕</button>
        </div>
        <nav
          className="v50-menu"
          onClick={(e) => {
            // 모바일에서 메뉴 항목(버튼/링크)을 고르면 드로어를 자동으로 닫는다. 데스크톱에서는
            // 사이드바가 항상 보이는 상태라 이 state가 CSS에 영향을 주지 않으므로 무해하다.
            if ((e.target as HTMLElement).closest(".v50-menu > div > button")) setMobileNavOpen(false);
          }}
        >
          <div>
            <div className="v50-menu-label">현재 사용 가능</div>
            {auth.isPageVisible("home") && <button className={effectiveActive === "home" ? "active" : ""} onClick={() => setActive("home")}><span>연구원 홈</span></button>}
            {auth.isPageVisible("unifiedBom") && <button className={effectiveActive === "unifiedBom" ? "active" : ""} onClick={() => setActive("unifiedBom")}><span>통합 BOM</span></button>}
            {auth.isPageVisible("companyManager") && <button className={effectiveActive === "companyManager" ? "active" : ""} onClick={() => setActive("companyManager")}><span>업체관리</span></button>}
            {auth.isPageVisible("materialManager") && <button className={effectiveActive === "materialManager" ? "active" : ""} onClick={() => setActive("materialManager")}><span>부자재관리</span></button>}
            {auth.isPageVisible("ingredientDict") && <button className={effectiveActive === "ingredientDict" ? "active" : ""} onClick={() => setActive("ingredientDict")}><span>전성분관리</span></button>}
            {auth.isPageVisible("rawManager") && <button className={effectiveActive === "rawManager" ? "active" : ""} onClick={() => setActive("rawManager")}><span>원료 관리</span></button>}
            {auth.isPageVisible("purchaseOrder") && <button className={effectiveActive === "purchaseOrder" ? "active" : ""} onClick={() => setActive("purchaseOrder")}><span>원료 발주관리</span></button>}
            {auth.isPageVisible("formula") && <button className={effectiveActive === "formula" ? "active" : ""} onClick={() => setActive("formula")}><span>처방관리</span></button>}
            {auth.isPageVisible("docs") && <button className={effectiveActive === "docs" ? "active" : ""} onClick={() => setActive("docs")}><span>문서관리</span></button>}
            {auth.isPageVisible("quality") && <button className={effectiveActive === "quality" ? "active" : ""} onClick={() => setActive("quality")}><span>품질관리</span></button>}
            {auth.isPageVisible("production") && <button className={effectiveActive === "production" ? "active" : ""} onClick={() => setActive("production")}><span>생산관리</span></button>}
            {auth.isPageVisible("productionRecords") && <button className={effectiveActive === "productionRecords" ? "active" : ""} onClick={() => setActive("productionRecords")}><span>생산실적 관리</span></button>}
            {auth.isPageVisible("regulation") && <button className={effectiveActive === "regulation" ? "active" : ""} onClick={() => setActive("regulation")}><span>글로벌 규제검증</span></button>}
            {auth.isPageVisible("externalRegCheck") && <a href="https://cosmocheck.cc/check" target="_blank" rel="noopener noreferrer"><span>성분 규제 체크(외부)</span></a>}
            {auth.isPageVisible("sprint0") && <button className={effectiveActive === "sprint0" ? "active" : ""} onClick={() => setActive("sprint0")}><span>기반 안정화 점검</span></button>}
            {auth.canManageUsers && <button className={effectiveActive === "users" ? "active" : ""} onClick={() => setActive("users")}><span>사용자 권한관리</span></button>}
          </div>
          <div>
            <div className="v50-menu-label">내 계정</div>
            <div style={{ padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.6 }}><strong>{auth.profile?.email}</strong><br />역할: {auth.profile?.role}</div>
            <MySignatureWidget auth={auth} />
            <button onClick={auth.logout}><span>로그아웃</span></button>
          </div>
        </nav>
      </aside>

      <main className="v50-main">
        <header className="v50-topbar">
          <input className="v50-search" placeholder="원료, 처방, 문서, 글로벌 규제검증을 DB 기준으로 사용합니다." readOnly />
          {(auth.isPageVisible("formula") || auth.isPageVisible("docs") || auth.isPageVisible("regulation")) && (
            <div className="v50-top-actions">
              {auth.isPageVisible("formula") && <button className="v50-button-light" onClick={() => setActive("formula")}>처방관리</button>}
              {auth.isPageVisible("docs") && <button className="v50-button-light" onClick={() => setActive("docs")}>문서관리</button>}
              {auth.isPageVisible("regulation") && <button className="v50-button" onClick={() => setActive("regulation")}>규제검증</button>}
            </div>
          )}
        </header>
        <nav className="v50-tabs">
          {/* 사이드바와 동일하게 auth.isPageVisible()로 역할별 숨김을 적용 - 업체관리 앞(맨 앞)에 배치해달라는 요청. */}
          {auth.isPageVisible("unifiedBom") && <div className={`v50-tab ${effectiveActive === "unifiedBom" ? "active" : ""}`} onClick={() => setActive("unifiedBom")}><span>통합 BOM</span></div>}
          {auth.isPageVisible("companyManager") && <div className={`v50-tab ${effectiveActive === "companyManager" ? "active" : ""}`} onClick={() => setActive("companyManager")}><span>업체관리</span></div>}
          {auth.isPageVisible("materialManager") && <div className={`v50-tab ${effectiveActive === "materialManager" ? "active" : ""}`} onClick={() => setActive("materialManager")}><span>부자재관리</span></div>}
          {auth.isPageVisible("ingredientDict") && <div className={`v50-tab ${effectiveActive === "ingredientDict" ? "active" : ""}`} onClick={() => setActive("ingredientDict")}><span>전성분관리</span></div>}
          {auth.isPageVisible("rawManager") && <div className={`v50-tab ${effectiveActive === "rawManager" ? "active" : ""}`} onClick={() => setActive("rawManager")}><span>원료관리</span></div>}
          {auth.isPageVisible("purchaseOrder") && <div className={`v50-tab ${effectiveActive === "purchaseOrder" ? "active" : ""}`} onClick={() => setActive("purchaseOrder")}><span>원료 발주관리</span></div>}
          {auth.isPageVisible("formula") && <div className={`v50-tab ${effectiveActive === "formula" ? "active" : ""}`} onClick={() => setActive("formula")}><span>처방관리</span></div>}
          {auth.isPageVisible("docs") && <div className={`v50-tab ${effectiveActive === "docs" ? "active" : ""}`} onClick={() => setActive("docs")}><span>문서관리</span></div>}
          {auth.isPageVisible("production") && <div className={`v50-tab ${effectiveActive === "production" ? "active" : ""}`} onClick={() => setActive("production")}><span>생산관리</span></div>}
          {auth.isPageVisible("productionRecords") && <div className={`v50-tab ${effectiveActive === "productionRecords" ? "active" : ""}`} onClick={() => setActive("productionRecords")}><span>생산실적 관리</span></div>}
          {auth.isPageVisible("quality") && <div className={`v50-tab ${effectiveActive === "quality" ? "active" : ""}`} onClick={() => setActive("quality")}><span>품질관리</span></div>}
        </nav>
        <section className="v50-content">
          {/* pageAccessLoaded가 false인 동안은 아무 것도 그리지 않는다 - active의 기본값(home)이
              해당 역할에게 숨겨진 페이지일 수 있어서, 로딩 중 컨텐츠까지 잠깐 노출되는 걸 막는다. */}
          {auth.pageAccessLoaded && !isKeepAliveActive && renderActive()}
          {visitedKeepAliveTabs.map((tab) => (
            <div key={tab} style={{ display: effectiveActive === tab ? "block" : "none" }}>
              {renderKeepAliveTab(tab)}
            </div>
          ))}
        </section>
      </main>
    </div></div>
  );
}
