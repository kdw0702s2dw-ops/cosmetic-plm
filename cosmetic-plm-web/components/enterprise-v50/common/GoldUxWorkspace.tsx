"use client";

import { useMemo, useState } from "react";
import "@/styles/enterprise-v50.css";

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
  { key: "search", title: "통합검색", group: "확장기능", href: "/enterprise-global-search", description: "처방, 원료, 문서 검색" },
  { key: "activity", title: "활동이력", group: "확장기능", href: "/enterprise-activity", description: "최근 작업 이력" },
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
    if (active.internal === "formula") return <FormulaRedesign openTab={openTab} />;
    if (active.internal === "ai") return <AiAssistantRedesign openTab={openTab} />;
    if (active.internal === "documents") return <DocumentRedesign />;
    if (active.internal === "manufacturing") return <ManufacturingRedesign />;
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
            <div className="v50-brand-sub">v5.0 GOLD UX</div>
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
            <input className="v50-search" placeholder="처방명, 원료명, INCI, 문서를 검색하세요" onKeyDown={(e) => {
              if (e.key === "Enter") openTab(menus.find((x) => x.key === "search")!);
            }} />
            <div className="v50-top-actions">
              <button className="v50-button-light" onClick={() => openTab(menus.find((x) => x.key === "docs")!)}>문서 생성</button>
              <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "ai")!)}>AI에게 요청</button>
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
  const quick = ["formula", "ai", "docs", "mfg", "knowledge", "admin"].map((key) => menus.find((x) => x.key === key)!);
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">연구원 홈</h1>
          <p className="v50-desc">오늘 해야 할 일, 최근 처방, AI 요청, 문서 생성, 제조 현황을 한 화면에서 확인합니다.</p>
        </div>
        <button className="v50-button" onClick={() => openTab(menus.find((x) => x.key === "ai")!)}>AI로 처방 시작</button>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="개발중 처방" value="12" hint="진행 중인 처방" />
        <Kpi label="검증 대기" value="4" hint="확인 필요" />
        <Kpi label="문서 대기" value="7" hint="생성/승인 필요" />
        <Kpi label="출시 준비" value="3" hint="Go/No-Go 검토" />
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>빠른 업무 시작</h2>
          <div className="v50-grid-3">
            {quick.map((item) => (
              <div key={item.key} className="v50-card">
                <strong>{item.title}</strong>
                <p style={{ color: "#64748b", lineHeight: 1.55 }}>{item.description}</p>
                <button className="v50-button-light" onClick={() => openTab(item)}>탭으로 열기</button>
              </div>
            ))}
          </div>
        </article>

        <article className="v50-panel">
          <h2>오늘 먼저 할 일</h2>
          {["신규 수분크림 처방 검토", "COA 문서 승인", "AI 추천 원료 확인", "제조 Batch 준비"].map((x, i) => (
            <div key={x} className="v50-card" style={{ marginBottom: 10 }}>
              <span className={`v50-badge ${i === 0 ? "danger" : "warn"}`}>{i === 0 ? "중요" : "확인"}</span>
              <div style={{ fontWeight: 900, marginTop: 8 }}>{x}</div>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}

function FormulaRedesign({ openTab }: { openTab: (item: MenuItem) => void }) {
  const rows = [
    ["A", "정제수", "Water", "68.50", "용제", "₩0"],
    ["A", "글리세린", "Glycerin", "5.00", "보습", "₩120"],
    ["B", "스쿠알란", "Squalane", "8.00", "유연화", "₩820"],
    ["C", "판테놀", "Panthenol", "2.00", "진정", "₩350"],
    ["C", "세라마이드NP", "Ceramide NP", "0.50", "장벽", "₩680"],
  ];
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">처방관리</h1>
          <p className="v50-desc">처방 기본정보, 원료, 배합비, Phase, 원가, 전성분, 문서 생성을 한 화면에서 처리합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={() => openTab(menus.find((x) => x.key === "ai")!)}>AI 추천</button>
          <button onClick={() => openTab(menus.find((x) => x.key === "docs")!)}>문서 생성</button>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="총합" value="100%" hint="배합비 정상" />
        <Kpi label="예상 원가" value="2,480원" hint="kg 기준" />
        <Kpi label="pH" value="5.8" hint="약산성" />
        <Kpi label="상태" value="개발중" hint="연구원 검토" />
      </section>

      <section className="v50-panel">
        <h2>처방 기본정보</h2>
        <div className="v50-grid-3">
          <input className="v50-input" defaultValue="민감성 장벽 크림" />
          <input className="v50-input" defaultValue="R0" />
          <select className="v50-select" defaultValue="개발중"><option>개발중</option><option>검증대기</option><option>승인완료</option></select>
        </div>
      </section>

      <section className="v50-panel">
        <h2>원료 배합표</h2>
        <div className="v50-flow" style={{ marginBottom: 12 }}>
          <button>원료 추가</button><button>Phase 추가</button><button>100% 자동보정</button><button>전성분 생성</button>
        </div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>Phase</th><th>원료명</th><th>INCI</th><th>투입량(%)</th><th>기능</th><th>예상원가</th></tr></thead>
            <tbody>{rows.map((r, idx) => <tr key={idx}>{r.map((c) => <td key={c}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AiAssistantRedesign({ openTab }: { openTab: (item: MenuItem) => void }) {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">AI 연구원</h1>
          <p className="v50-desc">만들고 싶은 제품을 한글로 입력하면 처방, 원료, 원가, 규제, 문서 흐름을 제안합니다.</p>
        </div>
      </section>
      <section className="v50-chatbox">
        <h2>무엇을 개발할까요?</h2>
        <textarea className="v50-textarea" defaultValue="민감성 피부용 약산성 장벽 크림을 만들어줘. 세라마이드와 판테놀을 포함하고 원가는 2,500원 이하로 맞춰줘." />
        <div className="v50-flow" style={{ marginTop: 12 }}>
          <button onClick={() => openTab(menus.find((x) => x.key === "formula")!)}>처방으로 적용</button>
          <button>원료 추천</button>
          <button>원가 최적화</button>
          <button>규제 검토</button>
        </div>
      </section>
      <section className="v50-grid-3" style={{ marginTop: 16 }}>
        {["진정크림", "미백앰플", "약산성 토너", "선크림", "헤어세럼", "수분크림"].map((x) => (
          <button key={x} className="v50-button-light">{x} 만들기</button>
        ))}
      </section>
    </div>
  );
}

function DocumentRedesign() {
  const docs = ["처방서", "전성분표", "원료조성표", "제품규격서", "COA", "BOM", "제조지시서"];
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">문서관리</h1>
          <p className="v50-desc">제품 하나를 선택하고 필요한 문서를 한 번에 생성·검토·승인합니다.</p>
        </div>
        <button className="v50-button">전체 문서 생성</button>
      </section>
      <section className="v50-grid-3">
        {docs.map((doc, idx) => (
          <article key={doc} className="v50-card">
            <span className={`v50-badge ${idx < 3 ? "ok" : "warn"}`}>{idx < 3 ? "생성완료" : "생성대기"}</span>
            <h3>{doc}</h3>
            <p style={{ color: "#64748b" }}>{doc} 문서를 생성하고 승인 상태를 관리합니다.</p>
            <button className="v50-button-light">열기</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function ManufacturingRedesign() {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">제조관리</h1>
          <p className="v50-desc">오늘 제조, 제조예정, 원료 소요량, 제조 단계와 완료 상태를 관리합니다.</p>
        </div>
        <button className="v50-button">Batch 생성</button>
      </section>
      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="오늘 제조" value="3" hint="진행 예정" />
        <Kpi label="진행중" value="1" hint="Batch" />
        <Kpi label="완료" value="8" hint="이번 주" />
        <Kpi label="보류" value="0" hint="문제 없음" />
      </section>
      <section className="v50-panel">
        <h2>제조 일정</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>Batch</th><th>제품</th><th>수량</th><th>상태</th><th>담당</th></tr></thead>
            <tbody>
              <tr><td>BATCH-25001</td><td>민감성 장벽 크림</td><td>100kg</td><td><span className="v50-badge warn">진행중</span></td><td>생산1팀</td></tr>
              <tr><td>BATCH-25002</td><td>수분 앰플</td><td>30kg</td><td><span className="v50-badge">예정</span></td><td>생산2팀</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KnowledgeRedesign() {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">지식DB</h1>
          <p className="v50-desc">원료명, INCI, CAS, 기능, 권장함량, 국가 규제, 상용성 정보를 한 번에 확인합니다.</p>
        </div>
      </section>
      <section className="v50-panel">
        <input className="v50-input" placeholder="원료명, INCI, CAS 번호를 검색하세요" />
      </section>
      <section className="v50-grid-3">
        {["글리세린", "판테놀", "나이아신아마이드", "세라마이드NP", "카보머", "페녹시에탄올"].map((x) => (
          <article key={x} className="v50-card">
            <span className="v50-badge ok">사용가능</span>
            <h3>{x}</h3>
            <p style={{ color: "#64748b" }}>기능, 권장함량, 규제, 상용성 정보를 확인합니다.</p>
            <button className="v50-button-light">상세보기</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function AdminRedesign() {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">관리자</h1>
          <p className="v50-desc">사용자, 권한, 시스템 상태, 감사 로그, 백업, AI 사용량을 관리합니다.</p>
        </div>
      </section>
      <section className="v50-grid-3">
        {["사용자 관리", "권한 설정", "감사 로그", "DB 상태", "백업", "AI 사용량", "시스템 설정", "릴리즈 기록"].map((x) => (
          <article key={x} className="v50-card">
            <h3>{x}</h3>
            <p style={{ color: "#64748b" }}>{x} 기능을 확인하고 관리합니다.</p>
            <button className="v50-button-light">열기</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
