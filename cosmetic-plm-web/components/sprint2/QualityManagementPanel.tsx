"use client";

import { useState } from "react";
import StabilityHomePanel from "@/components/sprint2/StabilityHomePanel";
import StabilityTestPanel from "@/components/sprint2/StabilityTestPanel";
import TestCertificatePanel from "@/components/sprint2/TestCertificatePanel";
import ProductCoaPanel from "@/components/sprint2/ProductCoaPanel";
import ProductMsdsPanel from "@/components/sprint2/ProductMsdsPanel";
import ShipmentManagementPanel from "@/components/sprint2/ShipmentManagementPanel";
import "@/styles/enterprise-v50.css";

// 품질관리 최상위 화면 - "홈"(전체 시료 달력 + 지연/임박 알림), "시료 목록"(안정성시험 등록/조건 추가/결과
// 입력), "시험성적서"(반제품/완제품 시험성적서 작성 및 PDF/엑셀 출력), "제품 COA"(영문 Certificate of
// Analysis 작성 및 서명 기반 결재), "제품 MSDS"(영문 Material Safety Data Sheet 작성 및 서명 기반
// 결재), "출고관리"(원래 독립 메뉴였다가 "제품 MSDS 옆으로 옮겨달라" 요청에 따라 이쪽으로 이동)를
// 서브탭으로 묶는다. 홈에서 특정 시료의 "열기"를 누르면 시료 목록 탭으로 전환되면서 그 시료가 바로 선택된다.
type QualityTab = "home" | "list" | "certificate" | "coa" | "msds" | "shipment";

const TAB_LABELS: Record<QualityTab, string> = {
  home: "홈 (달력)", list: "시료 목록", certificate: "시험성적서",
  coa: "제품 COA", msds: "제품 MSDS", shipment: "출고관리",
};

export default function QualityManagementPanel() {
  const [tab, setTab] = useState<QualityTab>("home");
  const [focusTestId, setFocusTestId] = useState<string | null>(null);
  // 한 번이라도 연 탭은 계속 마운트 상태로 둔다(visitedTabs) - 생산관리와 동일한 패턴(참고:
  // ProductionManagementPanel.tsx). 탭을 넘나들어도 선택된 시료/검색어/작성 중인 폼 등이 날아가지 않는다.
  const [visitedTabs, setVisitedTabs] = useState<Set<QualityTab>>(() => new Set<QualityTab>(["home"]));
  // 탭별 독립 새로고침 값 - 상단 "새로고침" 버튼은 지금 보고 있는 탭의 값만 올려서, 숨겨진 채 마운트된
  // 다른 탭에는 영향을 주지 않는다(역시 생산관리와 동일한 패턴).
  const [refreshTicks, setRefreshTicks] = useState<Record<string, number>>({});

  function selectTab(key: QualityTab) {
    setTab(key);
    setVisitedTabs((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  function refreshCurrent() {
    setRefreshTicks((prev) => ({ ...prev, [tab]: (prev[tab] || 0) + 1 }));
  }

  function openTest(testId: string) {
    setFocusTestId(testId);
    selectTab("list");
  }

  const hidden = (key: QualityTab): React.CSSProperties => ({ display: key === tab ? "block" : "none" });

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">품질관리</h1>
          <p className="v50-desc">화장품 안정성시험(샘플/완제품) 일정과 결과를 관리합니다.</p>
        </div>
        <button className="v50-button" onClick={refreshCurrent}>새로고침 ({TAB_LABELS[tab]})</button>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(Object.keys(TAB_LABELS) as QualityTab[]).map((key) => (
          <button key={key} className={tab === key ? "v50-button" : "v50-button-light"} onClick={() => selectTab(key)}>
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {visitedTabs.has("home") && (
        <div style={hidden("home")}><StabilityHomePanel onOpenTest={openTest} refreshTick={refreshTicks.home} /></div>
      )}
      {visitedTabs.has("list") && (
        <div style={hidden("list")}>
          <StabilityTestPanel focusTestId={focusTestId} onFocusHandled={() => setFocusTestId(null)} refreshTick={refreshTicks.list} />
        </div>
      )}
      {visitedTabs.has("certificate") && (
        <div style={hidden("certificate")}><TestCertificatePanel refreshTick={refreshTicks.certificate} /></div>
      )}
      {visitedTabs.has("coa") && (
        <div style={hidden("coa")}><ProductCoaPanel refreshTick={refreshTicks.coa} /></div>
      )}
      {visitedTabs.has("msds") && (
        <div style={hidden("msds")}><ProductMsdsPanel refreshTick={refreshTicks.msds} /></div>
      )}
      {visitedTabs.has("shipment") && (
        <div style={hidden("shipment")}><ShipmentManagementPanel refreshTick={refreshTicks.shipment} /></div>
      )}
    </div>
  );
}
