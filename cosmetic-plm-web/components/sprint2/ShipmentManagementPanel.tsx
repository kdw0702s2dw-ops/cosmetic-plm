"use client";

import { useState } from "react";
import ShipmentInputPanel from "@/components/sprint2/ShipmentInputPanel";
import ShipmentListPanel from "@/components/sprint2/ShipmentListPanel";
import ShipmentCustomerViewPanel from "@/components/sprint2/ShipmentCustomerViewPanel";
import "@/styles/enterprise-v50.css";

type View = "input" | "list" | "customer";

/**
 * 출고관리 - 원래 독립 메뉴였다가 품질관리 하위 탭("제품 MSDS" 옆)으로 이동됨. 품질관리 화면이 이미
 * 상단 타이틀/탭 틀(v50-page/v50-hero)을 갖고 있으므로 여기서는 중복되지 않게 내부 콘텐츠만 렌더링한다.
 * [입력] 출고 등록 폼 / [전체 목록] 전체 출고 기록 검색·조회·편집 / [업체별 보기] 고객사별 묶음 조회.
 */
export default function ShipmentManagementPanel() {
  const [view, setView] = useState<View>("input");

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        출고 건을 등록하고, 전체 이력과 고객사별 출고 현황을 확인합니다.
      </p>

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
