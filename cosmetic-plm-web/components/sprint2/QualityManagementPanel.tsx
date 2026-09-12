"use client";

import { useState } from "react";
import StabilityHomePanel from "@/components/sprint2/StabilityHomePanel";
import StabilityTestPanel from "@/components/sprint2/StabilityTestPanel";
import TestCertificatePanel from "@/components/sprint2/TestCertificatePanel";
import ProductCoaPanel from "@/components/sprint2/ProductCoaPanel";
import ProductMsdsPanel from "@/components/sprint2/ProductMsdsPanel";
import "@/styles/enterprise-v50.css";

// 품질관리 최상위 화면 - "홈"(전체 시료 달력 + 지연/임박 알림), "시료 목록"(안정성시험 등록/조건 추가/결과
// 입력), "시험성적서"(반제품/완제품 시험성적서 작성 및 PDF/엑셀 출력), "제품 COA"(영문 Certificate of
// Analysis 작성 및 서명 기반 결재), "제품 MSDS"(영문 Material Safety Data Sheet 작성 및 서명 기반
// 결재)를 서브탭으로 묶는다. 홈에서 특정 시료의 "열기"를 누르면 시료 목록 탭으로 전환되면서 그 시료가
// 바로 선택된다.
export default function QualityManagementPanel() {
  const [tab, setTab] = useState<"home" | "list" | "certificate" | "coa" | "msds">("home");
  const [focusTestId, setFocusTestId] = useState<string | null>(null);

  function openTest(testId: string) {
    setFocusTestId(testId);
    setTab("list");
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">품질관리</h1>
          <p className="v50-desc">화장품 안정성시험(샘플/완제품) 일정과 결과를 관리합니다.</p>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className={tab === "home" ? "v50-button" : "v50-button-light"} onClick={() => setTab("home")}>홈 (달력)</button>
        <button className={tab === "list" ? "v50-button" : "v50-button-light"} onClick={() => setTab("list")}>시료 목록</button>
        <button className={tab === "certificate" ? "v50-button" : "v50-button-light"} onClick={() => setTab("certificate")}>시험성적서</button>
        <button className={tab === "coa" ? "v50-button" : "v50-button-light"} onClick={() => setTab("coa")}>제품 COA</button>
        <button className={tab === "msds" ? "v50-button" : "v50-button-light"} onClick={() => setTab("msds")}>제품 MSDS</button>
      </div>

      {tab === "home" && <StabilityHomePanel onOpenTest={openTest} />}
      {tab === "list" && <StabilityTestPanel focusTestId={focusTestId} onFocusHandled={() => setFocusTestId(null)} />}
      {tab === "certificate" && <TestCertificatePanel />}
      {tab === "coa" && <ProductCoaPanel />}
      {tab === "msds" && <ProductMsdsPanel />}
    </div>
  );
}
