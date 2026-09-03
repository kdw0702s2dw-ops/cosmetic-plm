"use client";

import { useState } from "react";
import StabilityHomePanel from "@/components/sprint2/StabilityHomePanel";
import StabilityTestPanel from "@/components/sprint2/StabilityTestPanel";
import "@/styles/enterprise-v50.css";

// 품질관리 최상위 화면 - "홈"(전체 시료 달력 + 지연/임박 알림)과 "시료 목록"(등록/조건 추가/결과 입력)을
// 서브탭으로 묶는다. 홈에서 특정 시료의 "열기"를 누르면 시료 목록 탭으로 전환되면서 그 시료가 바로 선택된다.
export default function QualityManagementPanel() {
  const [tab, setTab] = useState<"home" | "list">("home");
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
      </div>

      {tab === "home" && <StabilityHomePanel onOpenTest={openTest} />}
      {tab === "list" && <StabilityTestPanel focusTestId={focusTestId} onFocusHandled={() => setFocusTestId(null)} />}
    </div>
  );
}
