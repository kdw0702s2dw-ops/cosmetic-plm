"use client";

import { ReactNode, useMemo, useState } from "react";
import "@/styles/enterprise-v43.css";

type MenuItem = {
  key: string;
  title: string;
  group: string;
  href: string;
  description: string;
  internal?: boolean;
};

const menuItems: MenuItem[] = [
  { key: "dashboard", title: "대시보드", group: "홈", href: "/enterprise-workspace", description: "전체 현황과 오늘 할 일", internal: true },
  { key: "role", title: "역할별 업무공간", group: "홈", href: "/enterprise-role-workspace", description: "부서별로 필요한 업무만 보기" },
  { key: "workflow", title: "업무흐름", group: "홈", href: "/enterprise-workflow", description: "AI부터 제조까지 순서대로 진행" },
  { key: "search", title: "통합검색", group: "홈", href: "/enterprise-global-search", description: "처방, 원료, 문서 검색" },
  { key: "notifications", title: "알림센터", group: "홈", href: "/enterprise-notifications", description: "확인해야 할 업무 알림" },
  { key: "activity", title: "활동이력", group: "홈", href: "/enterprise-activity", description: "최근 작업 이력" },

  { key: "formula", title: "처방관리", group: "연구개발", href: "/enterprise-gold-formula-live", description: "처방 작성과 수정" },
  { key: "validation", title: "처방검증", group: "연구개발", href: "/enterprise-gold-formula-validation", description: "100% 합계, 중복, 누락 검증" },
  { key: "cost", title: "원가계산", group: "연구개발", href: "/enterprise-gold-formula-cost", description: "kg당 원가와 목표 원가 확인" },
  { key: "intelligence", title: "처방평가", group: "연구개발", href: "/enterprise-gold-intelligence", description: "안정성, 규제, 점수 평가" },

  { key: "ai_auto", title: "AI 처방생성", group: "AI", href: "/enterprise-ai-autopilot", description: "자연어로 처방 생성" },
  { key: "ai_research", title: "AI 연구", group: "AI", href: "/enterprise-ai-research", description: "AI 연구 프로젝트" },
  { key: "ai_recommend", title: "AI 추천", group: "AI", href: "/enterprise-ai-recommendation", description: "원료와 처방 추천" },

  { key: "docs", title: "문서관리", group: "문서/출시", href: "/enterprise-gold-documents", description: "처방서, COA, Spec 생성" },
  { key: "docflow", title: "문서승인", group: "문서/출시", href: "/enterprise-gold-document-workflow", description: "문서 검토, 승인, 잠금" },
  { key: "release", title: "출시준비", group: "문서/출시", href: "/enterprise-launch-readiness", description: "출시 가능 여부 확인" },

  { key: "samples", title: "샘플관리", group: "생산", href: "/enterprise-gold-samples", description: "샘플 요청과 승인" },
  { key: "mfg", title: "제조관리", group: "생산", href: "/enterprise-gold-manufacturing", description: "Batch와 제조지시" },

  { key: "knowledge", title: "지식DB", group: "관리", href: "/enterprise-knowledge-db", description: "INCI, 규제, 상용성 DB" },
  { key: "admin", title: "관리자", group: "관리", href: "/enterprise-gold-command", description: "전체 KPI와 시스템 점검" },
];

const defaultTab = menuItems[0];

export default function TabbedEnterpriseShell({ children }: { children?: ReactNode }) {
  const [tabs, setTabs] = useState<MenuItem[]>([defaultTab]);
  const [activeKey, setActiveKey] = useState(defaultTab.key);
  const active = useMemo(() => tabs.find((x) => x.key === activeKey) || defaultTab, [tabs, activeKey]);
  const groups = Array.from(new Set(menuItems.map((x) => x.group)));

  function openTab(item: MenuItem) {
    setTabs((prev) => prev.some((x) => x.key === item.key) ? prev : [...prev, item]);
    setActiveKey(item.key);
  }

  function closeTab(key: string) {
    setTabs((prev) => {
      const next = prev.filter((x) => x.key !== key);
      if (activeKey === key) {
        setActiveKey(next[next.length - 1]?.key || defaultTab.key);
      }
      return next.length ? next : [defaultTab];
    });
  }

  return (
    <div className="plm43-root">
      <div className="plm43-shell">
        <aside className="plm43-sidebar">
          <div className="plm43-brand">
            <div className="plm43-brand-title">화장품 PLM</div>
            <div className="plm43-brand-sub">Enterprise v4.3 업무형 화면</div>
          </div>
          <div className="plm43-menu">
            {groups.map((group) => (
              <div key={group}>
                <div className="plm43-menu-group">{group}</div>
                {menuItems.filter((x) => x.group === group).map((item) => (
                  <button key={item.key} onClick={() => openTab(item)} className={activeKey === item.key ? "active" : ""}>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <main className="plm43-main">
          <header className="plm43-topbar">
            <input className="plm43-search" placeholder="처방, 원료, 문서, 고객명을 검색하세요" onKeyDown={(e) => {
              if (e.key === "Enter") openTab(menuItems.find((x) => x.key === "search")!);
            }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="plm43-button-light" onClick={() => openTab(menuItems.find((x) => x.key === "notifications")!)}>알림</button>
              <button className="plm43-button" onClick={() => openTab(menuItems.find((x) => x.key === "ai_auto")!)}>AI 처방 생성</button>
            </div>
          </header>

          <nav className="plm43-tabs">
            {tabs.map((tab) => (
              <div key={tab.key} className={`plm43-tab ${tab.key === activeKey ? "active" : ""}`} onClick={() => setActiveKey(tab.key)}>
                <span>{tab.title}</span>
                {tab.key !== "dashboard" && (
                  <button className="plm43-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.key); }}>×</button>
                )}
              </div>
            ))}
          </nav>

          <section className="plm43-content">
            {active.internal ? <WorkspaceHome openTab={openTab} /> : <iframe className="plm43-iframe" src={active.href} title={active.title} />}
          </section>
        </main>
      </div>
    </div>
  );
}

function WorkspaceHome({ openTab }: { openTab: (item: MenuItem) => void }) {
  const quick = ["ai_auto", "formula", "validation", "cost", "intelligence", "docs", "release", "mfg"]
    .map((key) => menuItems.find((x) => x.key === key)!);

  return (
    <div className="plm43-page">
      <section className="plm43-hero">
        <div>
          <h1 className="plm43-title">업무형 PLM 대시보드</h1>
          <p className="plm43-desc">
            좌측 메뉴를 누르면 페이지가 이동하지 않고, 인터넷 브라우저처럼 상단 탭으로 열립니다.
            여러 업무를 동시에 열어두고 빠르게 전환할 수 있습니다.
          </p>
        </div>
        <button className="plm43-button" onClick={() => openTab(menuItems.find((x) => x.key === "ai_auto")!)}>AI로 처방 만들기</button>
      </section>

      <section className="plm43-grid-4" style={{ marginBottom: 16 }}>
        <Kpi label="오늘 할 일" value="5" hint="확인 필요 업무" />
        <Kpi label="처방" value="진행중" hint="개발 처방 관리" />
        <Kpi label="출시 준비" value="검토" hint="Go/No-Go 확인" />
        <Kpi label="AI 도우미" value="사용 가능" hint="처방 생성/추천" />
      </section>

      <section className="plm43-panel">
        <h2 style={{ marginTop: 0 }}>추천 업무 순서</h2>
        <div className="plm43-flow">
          {quick.map((item) => (
            <button key={item.key} onClick={() => openTab(item)}>{item.title}</button>
          ))}
        </div>
      </section>

      <section className="plm43-grid-3">
        {quick.map((item) => (
          <article key={item.key} className="plm43-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{item.title}</strong>
              <span className="plm43-badge">열기</span>
            </div>
            <p style={{ color: "#64748b", lineHeight: 1.55 }}>{item.description}</p>
            <button className="plm43-button-light" onClick={() => openTab(item)}>탭으로 열기</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="plm43-card">
      <div className="plm43-kpi-label">{label}</div>
      <div className="plm43-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
