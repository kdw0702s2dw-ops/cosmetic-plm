"use client";

import { useMemo, useState } from "react";
import "@/styles/enterprise-v50.css";
import { useV50DashboardLive, useV50DocsLive, useV50ManufacturingLive } from "@/hooks/useV50LiveData";
import FormulaWorkspaceProPanel from "@/components/enterprise-v50/common/FormulaWorkspaceProPanel";

type MenuItem = {
  key: string;
  title: string;
  group: string;
  href: string;
  description: string;
  internal?: "home" | "formula" | "ai" | "documents" | "manufacturing" | "knowledge" | "admin";
};

const menus: MenuItem[] = [
  { key: "home", title: "연구원 홈", group: "홈", href: "/enterprise", description: "오늘 할 일과 최근 업무", internal: "home" },
  { key: "formula", title: "처방관리", group: "핵심업무", href: "/enterprise-v5/formula", description: "처방 작성, 원료, 배합비, 원가, 전성분", internal: "formula" },
  { key: "ai", title: "AI 도우미", group: "핵심업무", href: "/enterprise-v5/ai", description: "AI 처방 생성과 원료 추천", internal: "ai" },
  { key: "docs", title: "문서관리", group: "핵심업무", href: "/enterprise-v5/documents", description: "처방서, 전성분, COA, Spec, 제조지시서", internal: "documents" },
  { key: "mfg", title: "제조관리", group: "핵심업무", href: "/enterprise-v5/manufacturing", description: "제조 Batch, 원료 소요량, 제조 단계", internal: "manufacturing" },
  { key: "knowledge", title: "지식DB", group: "데이터", href: "/enterprise-v5/knowledge", description: "원료, INCI, CAS, 규제, 상용성", internal: "knowledge" },
  { key: "admin", title: "관리자", group: "관리", href: "/enterprise-v5/admin", description: "사용자, 권한, 로그, 백업, 시스템", internal: "admin" },
  { key: "workflow", title: "업무흐름", group: "확장기능", href: "/enterprise-workflow", description: "AI부터 제조까지 전체 흐름" },
  { key: "release", title: "출시준비도", group: "확장기능", href: "/enterprise-launch-readiness", description: "출시 가능 상태 확인" },
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
    if (active.internal === "ai") return <AiAssistantRedesign openTab={openTab} />;
    if (active.internal === "documents") return <DocumentLiveRedesign />;
    if (active.internal === "manufacturing") return <ManufacturingLiveRedesign />;
    if (active.internal === "knowledge") return <KnowledgeRedesign />;
    if (active.internal === "admin") return <AdminRedesign />;
    return <iframe className="v50-iframe" src={active.href} title={active.title} />;
  }

  return (
    <div className="v50-root">
      <div className="v50-shell">
        <aside className="v50-sidebar">
          <div className="v50-brand">
            <div className="v50-brand-title">화장품 PLM</div>
            <div className="v50-brand-sub">v5.0 GOLD UX · PRO 활성화</div>
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
              <button className="v50-button-light" onClick={() => openTab(menus.find((x) => x.key === "docs")!)}>문서 생성</button>
              <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "formula")!)}>처방관리 PRO</button>
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
          <p className="v50-desc">실제 데이터를 기반으로 오늘 업무와 전체 현황을 확인합니다. 처방관리 PRO에서 검증·원가·평가·문서 생성을 한 번에 실행할 수 있습니다.</p>
        </div>
        <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "formula")!)}>처방관리 PRO 시작</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="처방" value={String(d?.formula_count ?? "-")} hint="등록된 처방" />
        <Kpi label="원료" value={String(d?.raw_count ?? "-")} hint="원료 마스터" />
        <Kpi label="문서" value={String(d?.document_count ?? "-")} hint="생성 문서" />
        <Kpi label="제조" value={String(d?.batch_count ?? "-")} hint="제조 Batch" />
      </section>
      <section className="v50-grid-3">
        {["formula", "ai", "docs", "mfg", "knowledge", "admin"].map((key) => {
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

function AiAssistantRedesign({ openTab }: { openTab: (item: MenuItem) => void }) {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div><h1 className="v50-title">AI 연구원</h1><p className="v50-desc">AI 처방 생성 후 처방관리 PRO에서 검증·원가·문서를 이어서 처리합니다.</p></div>
      </section>
      <section className="v50-chatbox">
        <textarea className="v50-textarea" defaultValue="민감성 피부용 약산성 장벽 크림을 만들어줘. 세라마이드와 판테놀을 포함하고 원가는 2,500원 이하로 맞춰줘." />
        <div className="v50-flow" style={{ marginTop: 12 }}>
          <a className="v50-button" href="/enterprise-ai-autopilot">AI 처방 생성 실행</a>
          <button onClick={() => openTab(menus.find((x) => x.key === "formula")!)}>처방관리 PRO 열기</button>
        </div>
      </section>
    </div>
  );
}

function DocumentLiveRedesign() {
  const s = useV50DocsLive();
  return (
    <div className="v50-page">
      <section className="v50-hero"><div><h1 className="v50-title">문서관리</h1><p className="v50-desc">생성된 문서 이력을 확인합니다.</p></div><a className="v50-button" href="/enterprise-gold-documents">문서 생성 화면 열기</a></section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
      <section className="v50-panel">
        <div className="v50-table-wrap"><table className="v50-table"><thead><tr><th>문서코드</th><th>처방</th><th>문서종류</th><th>제목</th><th>상태</th></tr></thead><tbody>
          {s.documents.map((doc) => <tr key={doc.document_code}><td>{doc.document_code}</td><td>{doc.formula_code}/{doc.revision}</td><td>{doc.document_type}</td><td>{doc.title}</td><td>{doc.status}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

function ManufacturingLiveRedesign() {
  const s = useV50ManufacturingLive();
  return (
    <div className="v50-page">
      <section className="v50-hero"><div><h1 className="v50-title">제조관리</h1><p className="v50-desc">실제 생성된 Batch와 제조 상태를 확인합니다.</p></div><a className="v50-button" href="/enterprise-gold-manufacturing">Batch 생성 화면 열기</a></section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
      <section className="v50-panel">
        <div className="v50-table-wrap"><table className="v50-table"><thead><tr><th>Batch</th><th>처방</th><th>수량 kg</th><th>상태</th><th>작업자</th></tr></thead><tbody>
          {s.batches.map((b) => <tr key={b.batch_no}><td>{b.batch_no}</td><td>{b.formula_code}/{b.revision}</td><td>{b.batch_size_kg}</td><td>{b.status}</td><td>{b.operator_name}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

function KnowledgeRedesign() {
  return <div className="v50-page"><section className="v50-hero"><div><h1 className="v50-title">지식DB</h1><p className="v50-desc">원료, INCI, CAS, 규제, 상용성 정보를 확인합니다.</p></div><a className="v50-button" href="/enterprise-knowledge-db">지식DB 열기</a></section></div>;
}

function AdminRedesign() {
  return <div className="v50-page"><section className="v50-hero"><div><h1 className="v50-title">관리자</h1><p className="v50-desc">전체 KPI, 시스템 상태, 감사 로그와 운영 현황을 확인합니다.</p></div><a className="v50-button" href="/enterprise-gold-command">관리자 상세 열기</a></section></div>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
