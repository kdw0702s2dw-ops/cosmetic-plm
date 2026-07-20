"use client";

import { useState } from "react";
import ProductionQtyCheckPanel from "@/components/sprint2/ProductionQtyCheckPanel";
import "@/styles/enterprise-v50.css";

// 생산관리 하위 도구 목록 - 새 도구는 이 배열에 항목만 추가하면 좌측 목록에 자동으로 나타난다.
const TOOLS: { key: string; label: string; description: string; render: () => React.ReactNode }[] = [
  {
    key: "qtyCheck",
    label: "제조량 확인",
    description: "제조량/로스/코팅 조건으로 코팅원단 총 수·실제 수량·샘플 수량을 계산합니다.",
    render: () => <ProductionQtyCheckPanel />,
  },
];

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

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18, alignItems: "start" }}>
        <section className="v50-panel" style={{ padding: 10 }}>
          <h2 style={{ fontSize: 14, margin: "4px 8px 10px" }}>도구</h2>
          <div style={{ display: "grid", gap: 6 }}>
            {TOOLS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTool(t.key)}
                className={activeTool === t.key ? "v50-button" : "v50-button-light"}
                style={{ textAlign: "left", justifyContent: "flex-start" }}
                title={t.description}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <div>{current.render()}</div>
      </div>
    </div>
  );
}
