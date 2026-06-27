"use client";

import { useMemo, useState } from "react";
import "@/styles/enterprise-v50.css";
import { useV50DashboardLive } from "@/hooks/useV50LiveData";
import FormulaWorkspaceProPanel from "@/components/enterprise-v50/common/FormulaWorkspaceProPanel";
import DocumentProPanel from "@/components/enterprise-v50/common/DocumentProPanel";
import ManufacturingProPanel from "@/components/enterprise-v50/common/ManufacturingProPanel";
import KnowledgeProPanel from "@/components/enterprise-v50/common/KnowledgeProPanel";
import AdminProPanel from "@/components/enterprise-v50/common/AdminProPanel";
import AiAssistantProPanel from "@/components/enterprise-v50/common/AiAssistantProPanel";
import SmartFormulaEnginePanel from "@/components/enterprise-v50/common/SmartFormulaEnginePanel";
import SmartDocumentBatchBridgePanel from "@/components/enterprise-v50/common/SmartDocumentBatchBridgePanel";
import ReleaseReadinessProPanel from "@/components/enterprise-v50/common/ReleaseReadinessProPanel";
import SystemHealthPanel from "@/components/enterprise-v50/common/SystemHealthPanel";

type MenuItem = {
  key: string;
  title: string;
  group: string;
  href: string;
  description: string;
  internal?:
    | "home"
    | "formula"
    | "smart"
    | "smartBridge"
    | "releasePro"
    | "health"
    | "ai"
    | "documents"
    | "manufacturing"
    | "knowledge"
    | "admin";
};

const menus: MenuItem[] = [
  { key: "home", title: "연구원 홈", group: "홈", href: "/enterprise", description: "오늘 할 일과 최근 업무", internal: "home" },
  { key: "formula", title: "처방관리", group: "핵심업무", href: "/enterprise-v5/formula", description: "처방 작성, 원료, 배합비, 원가, 전성분", internal: "formula" },
  { key: "smart", title: "스마트 처방엔진", group: "핵심업무", href: "/enterprise-v5/smart-formula", description: "총합, 원가, pH, 점도, 전성분 자동 계산", internal: "smart" },
  { key: "smartBridge", title: "스마트 문서·Batch", group: "핵심업무", href: "/enterprise-v5/smart-bridge", description: "스마트 계산 결과를 문서와 Batch로 연결", internal: "smartBridge" },
  { key: "releasePro", title: "출시 준비도 PRO", group: "핵심업무", href: "/enterprise-v5/release-readiness", description: "출시 Go/No-Go 판단", internal: "releasePro" },
  { key: "ai", title: "AI 도우미", group: "핵심업무", href: "/enterprise-v5/ai", description: "AI 처방 생성과 원료 추천", internal: "ai" },
  { key: "docs", title: "문서관리", group: "핵심업무", href: "/enterprise-v5/documents", description: "처방서, 전성분, COA, Spec, 제조지시서", internal: "documents" },
  { key: "mfg", title: "제조관리", group: "핵심업무", href: "/enterprise-v5/manufacturing", description: "제조 Batch, 원료 소요량, 제조 단계", internal: "manufacturing" },
  { key: "knowledge", title: "지식DB", group: "데이터", href: "/enterprise-v5/knowledge", description: "원료, INCI, CAS, 규제, 상용성", internal: "knowledge" },
  { key: "admin", title: "관리자", group: "관리", href: "/enterprise-v5/admin", description: "사용자, 권한, 로그, 백업, 시스템", internal: "admin" },
  { key: "health", title: "시스템 점검", group: "관리", href: "/enterprise-v5/system-health", description: "DB와 운영 상태 점검", internal: "health" },
  { key: "workflow", title: "업무흐름", group: "확장기능", href: "/enterprise-workflow", description: "AI부터 제조까지 전체 흐름" },
];

export default function GoldUxWorkspace() {
  const [tabs, setTabs] = useState<MenuItem[]>([menus[0]]);
  const [activeKey, setActiveKey] = useState("home");
  const active = useMemo(() => tabs.find((x) => x.key === activeKey) || tabs[0], [tabs, activeKey]);
  const groups = Array.from(new Set(menus.map((x) => x.group)));

  function openTab(item: MenuItem) {
    setTabs((prev) => prev.some((x) => x.key === item.key) ? prev : [...prev, item]);
    setActiveKey(item.key);
  }

  function closeTab(key: string) {
    setTabs((prev) => {
      const next = prev.filter((x) => x.key !== key);
      if (activeKey === key) setActiveKey(next[next.length - 1]?.key || "home");
      return next.length ? next : [menus[0]];
    });
  }

  function renderActive() {
    if (active.internal === "home") return <ResearcherHome openTab={openTab} />;
    if (active.internal === "formula") return <FormulaWorkspaceProPanel />;
    if (active.internal === "smart") return <SmartFormulaEnginePanel />;
    if (active.internal === "smartBridge") return <SmartDocumentBatchBridgePanel />;
    if (active.internal === "releasePro") return <ReleaseReadinessProPanel />;
    if (active.internal === "documents") return <DocumentProPanel />;
    if (active.internal === "manufacturing") return <ManufacturingProPanel />;
    if (active.internal === "knowledge") return <KnowledgeProPanel />;
    if (active.internal === "admin") return <AdminProPanel />;
    if (active.internal === "health") return <SystemHealthPanel />;
    if (active.internal === "ai") return <AiAssistantProPanel openFormula={() => openTab(menus.find((x) => x.key === "formula")!)} />;
    return <iframe className="v50-iframe" src={active.href} title={active.title} />;
  }

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">v5.1 System QA</div>
          </div>
          <nav className="v50-menu">
            {groups.map((group) => (
              <div key={group}>
                <div className="v50-menu-label">{group}</div>
                {menus.filter((x) => x.group === group).map((item) => (
                  <button key={item.key} onClick={() => openTab(item)} className={activeKey === item.key ? "active" : ""}>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="v50-main">
          <header className="v50-topbar">
            <input className="v50-search" placeholder="처방명, 원료명, INCI, 문서를 검색하세요" />
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => openTab(menus.find((x) => x.key === "health")!)}>시스템 점검</button>
              <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "releasePro")!)}>출시 준비도 PRO</button>
            </div>
          </header>

          <nav className="v50-tabs">
            {tabs.map((tab) => (
              <div key={tab.key} className={`v50-tab ${tab.key === activeKey ? "active" : ""}`} onClick={() => setActiveKey(tab.key)}>
                <span>{tab.title}</span>
                {tab.key !== "home" && <button className="v50-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.key); }}>×</button>}
              </div>
            ))}
          </nav>

          <section className="v50-content">{renderActive()}</section>
        </main>
      </div>
    </div>
  );
}

function ResearcherHome({ openTab }: { openTab: (item: MenuItem) => void }) {
  const s = useV50DashboardLive();
  const d = s.dashboard;
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">시스템 점검 기능이 추가되었습니다. v5.1 운영에 필요한 DB와 릴리즈 적용 상태를 바로 확인할 수 있습니다.</p>
        </div>
        <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "health")!)}>시스템 점검 시작</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="처방" value={String(d?.formula_count ?? "-")} hint="등록된 처방" />
        <Kpi label="원료" value={String(d?.raw_count ?? "-")} hint="원료 마스터" />
        <Kpi label="문서" value={String(d?.document_count ?? "-")} hint="생성 문서" />
        <Kpi label="제조" value={String(d?.batch_count ?? "-")} hint="제조 Batch" />
      </section>
      <section className="v50-grid-3">
        {["health", "releasePro", "smartBridge", "smart", "formula", "docs", "mfg", "knowledge", "admin"].map((key) => {
          const item = menus.find((x) => x.key === key)!;
          return (
            <article key={item.key} className="v50-card">
              <strong>{item.title}</strong>
              <p style={{ color: "#64748b", lineHeight: 1.55 }}>{item.description}</p>
              <button className="v50-button-light" onClick={() => openTab(item)}>탭으로 열기</button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
