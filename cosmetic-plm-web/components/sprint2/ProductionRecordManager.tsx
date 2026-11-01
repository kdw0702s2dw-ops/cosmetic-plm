"use client";

import { useState } from "react";
import ProductionRecordPanel from "@/components/sprint2/ProductionRecordPanel";
import ProductionRecordListPanel from "@/components/sprint2/ProductionRecordListPanel";
import ProductionRecordSummaryPanel from "@/components/sprint2/ProductionRecordSummaryPanel";
import "@/styles/enterprise-v50.css";

type View = "input" | "list" | "summary";

const VIEW_LABELS: Record<View, string> = {
  input: "입력",
  list: "전체 목록",
  summary: "월별·연도별 집계",
};

/**
 * 생산실적 관리 - 기존에 생산관리 하위 도구였던 "(생산) 생산실적 검토"를 독립 메뉴로 분리한 화면.
 * [입력] 처방 선택 후 제품(Lot No.)별 생산실적 입력(기존 화면) / [전체 목록] 처방 선택 없이 전체 조회 /
 * [월별·연도별 집계] 처방별 생산량 집계.
 */
export default function ProductionRecordManager() {
  const [view, setView] = useState<View>("input");
  // "새로고침" - 생산관리 화면(ProductionManagementPanel)과 동일한 패턴: 탭별로 따로 관리하는 값을
  // 증가시켜 해당 탭의 하위 컴포넌트에 refreshTick prop으로 전달한다. 지금 보고 있는 탭만 다시
  // 불러오고, 입력 중이던 값(선택한 처방, 검색어, 수정 폼 등)은 그대로 유지된다.
  const [refreshTicks, setRefreshTicks] = useState<Record<View, number>>({ input: 0, list: 0, summary: 0 });

  function refreshCurrent() {
    setRefreshTicks((prev) => ({ ...prev, [view]: prev[view] + 1 }));
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">생산실적 관리</h1>
          <p className="v50-desc">처방별 제품(Lot No.) 단위 생산실적을 기록하고, 전체 이력과 월별·연도별 생산량을 확인합니다.</p>
        </div>
        <button className="v50-button" onClick={refreshCurrent}>새로고침 ({VIEW_LABELS[view]})</button>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <button className={view === "input" ? "v50-button" : "v50-button-light"} onClick={() => setView("input")}>입력</button>
        <button className={view === "list" ? "v50-button" : "v50-button-light"} onClick={() => setView("list")}>전체 목록</button>
        <button className={view === "summary" ? "v50-button" : "v50-button-light"} onClick={() => setView("summary")}>월별·연도별 집계</button>
      </div>

      {view === "input" && <ProductionRecordPanel refreshTick={refreshTicks.input} />}
      {view === "list" && <ProductionRecordListPanel refreshTick={refreshTicks.list} />}
      {view === "summary" && <ProductionRecordSummaryPanel refreshTick={refreshTicks.summary} />}
    </div>
  );
}
