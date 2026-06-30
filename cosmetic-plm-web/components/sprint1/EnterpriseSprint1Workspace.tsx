"use client";

import { useState } from "react";
import FormulaCoreWithAuthPanel from "@/components/sprint1/FormulaCoreWithAuthPanel";
import Sprint0Dashboard from "@/components/platform/Sprint0Dashboard";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";
import RawMaterialCorePanel from "@/components/sprint2/RawMaterialCorePanel";
import DocumentPdfPanel from "@/components/sprint2/DocumentPdfPanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";
import "@/styles/enterprise-mobile.css";

type TabKey = "home" | "sprint0" | "raw" | "formula" | "docs" | "users";

export default function EnterpriseSprint1Workspace() {
  const [active, setActive] = useState<TabKey>("home");
  const auth = useSprint1Auth();

  function renderActive() {
    if (active === "sprint0") return <Sprint0Dashboard />;
    if (active === "raw") return <RawMaterialCorePanel />;
    if (active === "formula") return <FormulaCoreWithAuthPanel />;
    if (active === "docs") return <DocumentPdfPanel />;
    if (active === "users") return <UserAdminPanel />;
    return <EnterpriseHome openRaw={() => setActive("raw")} openFormula={() => setActive("formula")} openDocs={() => setActive("docs")} />;
  }

  return <div className="v50-root"><div className="v50-shell"><aside className="v50-sidebar"><div className="v50-brand"><div className="v50-brand-title">화장품 PLM</div><div className="v50-brand-sub">운영 Core Workspace</div></div><nav className="v50-menu"><div><div className="v50-menu-label">현재 사용 가능</div><button className={active==="home"?"active":""} onClick={()=>setActive("home")}><span>연구원 홈</span></button><button className={active==="raw"?"active":""} onClick={()=>setActive("raw")}><span>원료관리 Core</span></button><button className={active==="formula"?"active":""} onClick={()=>setActive("formula")}><span>처방관리 Core</span></button><button className={active==="docs"?"active":""} onClick={()=>setActive("docs")}><span>문서관리 PDF</span></button><button className={active==="sprint0"?"active":""} onClick={()=>setActive("sprint0")}><span>기반 안정화 점검</span></button>{auth.canManageUsers&&<button className={active==="users"?"active":""} onClick={()=>setActive("users")}><span>사용자 권한관리</span></button>}</div><div><div className="v50-menu-label">내 계정</div><div style={{padding:"10px 12px",color:"#475569",fontSize:13,lineHeight:1.6}}><strong>{auth.profile?.email}</strong><br/>역할: {auth.profile?.role}</div><button onClick={auth.logout}><span>로그아웃</span></button></div></nav></aside><main className="v50-main"><header className="v50-topbar"><input className="v50-search" placeholder="원료·처방·문서 PDF를 실제 DB 기준으로 사용합니다." readOnly/><div className="v50-top-actions"><button className="v50-button-light" onClick={()=>setActive("raw")}>원료관리</button><button className="v50-button-light" onClick={()=>setActive("formula")}>처방관리</button><button className="v50-button" onClick={()=>setActive("docs")}>문서관리</button></div></header><nav className="v50-tabs"><div className={`v50-tab ${active==="home"?"active":""}`} onClick={()=>setActive("home")}><span>연구원 홈</span></div><div className={`v50-tab ${active==="raw"?"active":""}`} onClick={()=>setActive("raw")}><span>원료관리</span></div><div className={`v50-tab ${active==="formula"?"active":""}`} onClick={()=>setActive("formula")}><span>처방관리</span></div><div className={`v50-tab ${active==="docs"?"active":""}`} onClick={()=>setActive("docs")}><span>문서관리 PDF</span></div><div className={`v50-tab ${active==="sprint0"?"active":""}`} onClick={()=>setActive("sprint0")}><span>기반 점검</span></div>{auth.canManageUsers&&<div className={`v50-tab ${active==="users"?"active":""}`} onClick={()=>setActive("users")}><span>사용자 권한관리</span></div>}</nav><section className="v50-content">{renderActive()}</section></main></div></div>;
}

function EnterpriseHome({ openRaw, openFormula, openDocs }: { openRaw: () => void; openFormula: () => void; openDocs: () => void }) {
  return <div className="v50-page"><section className="v50-hero"><div><h1 className="v50-title">연구원 홈</h1><p className="v50-desc">원료관리, 처방관리, 문서관리 PDF가 /enterprise에서 바로 연결되었습니다. 모바일에서도 기본 업무가 가능하도록 최적화했습니다.</p></div><div className="v50-flow"><button onClick={openRaw}>원료관리</button><button onClick={openFormula}>처방관리</button><button onClick={openDocs}>문서관리</button></div></section><section className="v50-grid-4" style={{ marginBottom: 18 }}><Kpi label="원료관리" value="연결완료" hint="CRUD/복합원료"/><Kpi label="처방관리" value="연결완료" hint="BOM/원가"/><Kpi label="문서관리" value="PDF 1종" hint="Formula Sheet"/><Kpi label="모바일" value="기본지원" hint="반응형 UI"/></section><section className="v50-grid-3"><article className="v50-card"><span className="v50-badge ok">사용 가능</span><h3>원료관리 Core</h3><p style={{color:"#64748b",lineHeight:1.6}}>원료와 복합 구성성분을 관리합니다.</p><button className="v50-button-light" onClick={openRaw}>열기</button></article><article className="v50-card"><span className="v50-badge ok">사용 가능</span><h3>처방관리 Core</h3><p style={{color:"#64748b",lineHeight:1.6}}>BOM, 함량, 원가, 전성분을 관리합니다.</p><button className="v50-button-light" onClick={openFormula}>열기</button></article><article className="v50-card"><span className="v50-badge ok">사용 가능</span><h3>문서관리 PDF</h3><p style={{color:"#64748b",lineHeight:1.6}}>Formula Sheet를 생성하고 PDF로 저장합니다.</p><button className="v50-button" onClick={openDocs}>열기</button></article></section></div>;
}
function Kpi({label,value,hint}:{label:string;value:string;hint:string}){return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{color:"#64748b",fontSize:13,marginTop:6}}>{hint}</div></article>}
