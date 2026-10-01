"use client";

import { useState } from "react";
import ShipmentInputPanel from "@/components/sprint2/ShipmentInputPanel";
import ShipmentListPanel from "@/components/sprint2/ShipmentListPanel";
import ShipmentCustomerViewPanel from "@/components/sprint2/ShipmentCustomerViewPanel";
import "@/styles/enterprise-v50.css";

type View = "input" | "list" | "customer";

/**
 * 출고관리 - 생산관리 하위 도구였던 "출고관리"를 독립 메뉴로 분리한 화면(생산실적 관리와 동일한 구조).
 * [입력] 출고 등록 폼 / [전체 목록] 전체 출고 기록 검색·조회·편집 / [업체별 보기] 고객사별 묶음 조회.
 */
export default function ShipmentManagementPanel() {
  const [view, setView] = useState<View>("input");

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">출고관리</h1>
          <p className="v50-desc">출고 건을 등록하고, 전체 이력과 고객사별 출고 현황을 확인합니다.</p>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <button className={view === "input" ? "v50-button" : "v50-button-light"} onClick={() => setView("input")}>입력</button>
        <button className={view === "list" ? "v50-button" : "v50-button-light"} onClick={() => setView("list")}>전체 목록</button>
        <button className={view === "customer" ? "v50-button" : "v50-button-light"} onClick={() => setView("customer")}>업체별 보기</button>
      </div>

      {view === "input" && <ShipmentInputPanel />}
      {view === "list" && <ShipmentListPanel />}
      {view === "customer" && <ShipmentCustomerViewPanel />}
    </div>
  );
}
