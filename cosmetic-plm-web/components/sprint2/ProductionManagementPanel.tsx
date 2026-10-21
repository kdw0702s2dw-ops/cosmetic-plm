"use client";

import { useState } from "react";
import ProductionQtyCheckPanel from "@/components/sprint2/ProductionQtyCheckPanel";
import InsolubleHgPanel from "@/components/sprint2/InsolubleHgPanel";
import SolubleHgPanel from "@/components/sprint2/SolubleHgPanel";
import RawMaterialStockPanel from "@/components/sprint2/RawMaterialStockPanel";
import RawMaterialUsageStatsPanel from "@/components/sprint2/RawMaterialUsageStatsPanel";
import ManufacturingQtyReviewPanel from "@/components/sprint2/ManufacturingQtyReviewPanel";
import ProductionSchedulePanel from "@/components/sprint2/ProductionSchedulePanel";
import type { PurchaseOrderDraftResult } from "@/services/sprint2/manufacturingQtyReviewService";
import "@/styles/enterprise-v50.css";

// 하위 도구 render에 공통으로 넘겨주는 컨텍스트 - 지금은 "제조량 확인"의 발주서 연동(원료 발주관리로
// 전환)에만 쓰이지만, 다른 도구도 상위(워크스페이스) 동작이 필요해지면 여기에 추가하면 된다.
type ToolRenderContext = {
  onCreatePurchaseOrders?: (result: PurchaseOrderDraftResult) => void;
};

// 생산관리 하위 도구 목록 - 새 도구는 이 배열에 항목만 추가하면 좌측 목록에 자동으로 나타난다.
// 순서/명칭은 사용자 요청에 따라 지정됨: 생산_일정관리 -> 칭량_원료재고 -> 사용량 통계 -> 생산량 확인
// -> 제조량 확인 -> 연구_불용성 HG -> 연구_수용성 HG ("사용량 통계"는 칭량_원료재고 바로 다음에 추가됨 -
// 같은 원장 데이터를 보는 화면이라 가까이 배치).
const TOOLS: { key: string; label: string; description: string; render: (refreshTick: number, ctx: ToolRenderContext) => React.ReactNode }[] = [
  {
    key: "schedule",
    label: "생산_일정관리",
    description: "처방별 칭량·제조·도포·타공·포장·출고 일정을 달력으로 등록하고 관리합니다.",
    render: (refreshTick) => <ProductionSchedulePanel refreshTick={refreshTick} />,
  },
  {
    key: "rawMaterialStock",
    label: "칭량_원료재고",
    description: "재고 관리 대상 원료의 날짜별 현재재고량/금일사용량/최종재고량을 원장으로 관리합니다.",
    render: (refreshTick) => <RawMaterialStockPanel refreshTick={refreshTick} />,
  },
  {
    key: "usageStats",
    label: "사용량 통계",
    description: "원료를 선택해서 일별/월별/년별 사용량 추이를 그래프와 표로 확인합니다.",
    render: (refreshTick) => <RawMaterialUsageStatsPanel refreshTick={refreshTick} />,
  },
  {
    key: "qtyCheck",
    label: "생산량 확인",
    description: "제조량/로스/코팅 조건으로 코팅원단 총 수·실제 수량·샘플 수량을 계산합니다.",
    render: (refreshTick) => <ProductionQtyCheckPanel refreshTick={refreshTick} />,
  },
  {
    key: "manufacturingQtyReview",
    label: "제조량 확인",
    description: "목표 제조량 대비 재고 관리 대상 원료의 부족량을 계산해 부족 원료를 확인합니다.",
    render: (refreshTick, ctx) => <ManufacturingQtyReviewPanel refreshTick={refreshTick} onCreatePurchaseOrders={ctx.onCreatePurchaseOrders} />,
  },
  {
    key: "insolubleHg",
    label: "연구_불용성 HG",
    description: "원단/필름 관리기준과 칼선 조건으로 도포량·면적비·DCAP중량을 계산합니다.",
    render: (refreshTick) => <InsolubleHgPanel refreshTick={refreshTick} />,
  },
  {
    key: "solubleHg",
    label: "연구_수용성 HG",
    description: "관리기준 3개(필름1/원단/필름2)와 칼선 조건으로 도포량·부자재중량을 계산합니다.",
    render: (refreshTick) => <SolubleHgPanel refreshTick={refreshTick} />,
  },
];
// 생산실적 관리("(생산) 생산실적 검토")와 출고관리는 사이드바의 독립 메뉴 "생산실적 관리"/"출고관리"로
// 각각 분리됨(components/sprint2/ProductionRecordManager.tsx, ShipmentManagementPanel.tsx) - 여기
// 도구 목록에서는 중복 노출하지 않는다.

export default function ProductionManagementPanel({
  onCreatePurchaseOrders,
}: { onCreatePurchaseOrders?: (result: PurchaseOrderDraftResult) => void } = {}) {
  const [activeTool, setActiveTool] = useState(TOOLS[0].key);
  // 한 번이라도 연 도구는 계속 마운트 상태로 둔다(visitedTools) - 탭을 넘나들어도 선택된 처방·검색어·
  // 달력 월 등 작업 중이던 값이 날아가지 않게 하기 위해서다. 안 본 도구까지 전부 처음부터 마운트해
  // 불필요하게 API를 호출하지 않도록, 실제로 한 번 눌러서 연 도구만 visitedTools에 추가한다.
  const [visitedTools, setVisitedTools] = useState<Set<string>>(() => new Set([TOOLS[0].key]));
  // "새로고침" - 화면을 강제로 재마운트시키는 대신(그러면 선택된 처방/검색어 등 입력 중이던 값이
  // 전부 날아가 버림), 도구별로 따로 관리하는 이 값을 증가시켜 해당 하위 도구의 훅(useProductionSchedule
  // 등)에 refreshToken prop으로 전달한다. 각 훅은 refreshToken이 바뀌면 화면에 보이는 데이터(이력/원장/
  // 일정 등)만 다시 불러오고, 선택된 처방·입력 중인 값은 그대로 유지한다. 도구별로 독립된 값이라 "지금
  // 보고 있는 도구"만 새로고침되고, 뒤에 마운트된 채로 숨겨진 다른 도구는 영향받지 않는다.
  const [refreshTicks, setRefreshTicks] = useState<Record<string, number>>({});
  const current = TOOLS.find((t) => t.key === activeTool) || TOOLS[0];

  function selectTool(key: string) {
    setActiveTool(key);
    setVisitedTools((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  function refreshCurrent() {
    setRefreshTicks((prev) => ({ ...prev, [activeTool]: (prev[activeTool] || 0) + 1 }));
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">생산관리</h1>
          <p className="v50-desc">생산과 관련된 계산·확인 도구를 모아둔 화면입니다.</p>
        </div>
        <button className="v50-button" onClick={refreshCurrent}>새로고침 ({current.label})</button>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTool(t.key)}
            className={activeTool === t.key ? "v50-button" : "v50-button-light"}
            title={t.description}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginTop: 0, marginBottom: 14 }}>{current.description}</p>

      {TOOLS.filter((t) => visitedTools.has(t.key)).map((t) => (
        <div key={t.key} style={{ display: t.key === activeTool ? "block" : "none" }}>
          {t.render(refreshTicks[t.key] || 0, { onCreatePurchaseOrders })}
        </div>
      ))}
    </div>
  );
}
