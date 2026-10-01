"use client";

import { useState } from "react";
import ProductionQtyCheckPanel from "@/components/sprint2/ProductionQtyCheckPanel";
import InsolubleHgPanel from "@/components/sprint2/InsolubleHgPanel";
import SolubleHgPanel from "@/components/sprint2/SolubleHgPanel";
import RawMaterialStockPanel from "@/components/sprint2/RawMaterialStockPanel";
import ManufacturingQtyReviewPanel from "@/components/sprint2/ManufacturingQtyReviewPanel";
import ProductionSchedulePanel from "@/components/sprint2/ProductionSchedulePanel";
import "@/styles/enterprise-v50.css";

// 생산관리 하위 도구 목록 - 새 도구는 이 배열에 항목만 추가하면 좌측 목록에 자동으로 나타난다.
// 순서/명칭은 사용자 요청에 따라 지정됨: 생산_일정관리 -> 칭량_원료재고 -> 생산량 확인 -> 제조량 확인
// -> 연구_불용성 HG -> 연구_수용성 HG (key/description/render는 기존 그대로, label과 배열 순서만 변경).
const TOOLS: { key: string; label: string; description: string; render: () => React.ReactNode }[] = [
  {
    key: "schedule",
    label: "생산_일정관리",
    description: "처방별 칭량·제조·도포·타공·포장·출고 일정을 달력으로 등록하고 관리합니다.",
    render: () => <ProductionSchedulePanel />,
  },
  {
    key: "rawMaterialStock",
    label: "칭량_원료재고",
    description: "재고 관리 대상 원료의 날짜별 현재재고량/금일사용량/최종재고량을 원장으로 관리합니다.",
    render: () => <RawMaterialStockPanel />,
  },
  {
    key: "qtyCheck",
    label: "생산량 확인",
    description: "제조량/로스/코팅 조건으로 코팅원단 총 수·실제 수량·샘플 수량을 계산합니다.",
    render: () => <ProductionQtyCheckPanel />,
  },
  {
    key: "manufacturingQtyReview",
    label: "제조량 확인",
    description: "목표 제조량 대비 재고 관리 대상 원료의 부족량을 계산해 부족 원료를 확인합니다.",
    render: () => <ManufacturingQtyReviewPanel />,
  },
  {
    key: "insolubleHg",
    label: "연구_불용성 HG",
    description: "원단/필름 관리기준과 칼선 조건으로 도포량·면적비·DCAP중량을 계산합니다.",
    render: () => <InsolubleHgPanel />,
  },
  {
    key: "solubleHg",
    label: "연구_수용성 HG",
    description: "관리기준 3개(필름1/원단/필름2)와 칼선 조건으로 도포량·부자재중량을 계산합니다.",
    render: () => <SolubleHgPanel />,
  },
];
// 생산실적 관리("(생산) 생산실적 검토")와 출고관리는 사이드바의 독립 메뉴 "생산실적 관리"/"출고관리"로
// 각각 분리됨(components/sprint2/ProductionRecordManager.tsx, ShipmentManagementPanel.tsx) - 여기
// 도구 목록에서는 중복 노출하지 않는다.

export default function ProductionManagementPanel() {
  const [activeTool, setActiveTool] = useState(TOOLS[0].key);
  const current = TOOLS.find((t) => t.key === activeTool) || TOOLS[0];

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">생산관리</h1>
          <p className="v50-desc">생산과 관련된 계산·확인 도구를 모아둔 화면입니다.</p>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={activeTool === t.key ? "v50-button" : "v50-button-light"}
            title={t.description}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginTop: 0, marginBottom: 14 }}>{current.description}</p>

      <div>{current.render()}</div>
    </div>
  );
}
