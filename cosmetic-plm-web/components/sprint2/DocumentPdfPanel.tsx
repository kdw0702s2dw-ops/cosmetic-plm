"use client";

import { useSprint2DocumentPdf } from "@/hooks/useSprint2DocumentPdf";
import type { DocKind } from "@/services/sprint2/documentPdfService";
import "@/styles/enterprise-v50.css";

const docButtons:{kind:DocKind;label:string}[]=[
  {kind:"FORMULA_SHEET_PDF",label:"Formula Sheet"},
  {kind:"INCI_LIST",label:"전성분표"},
  {kind:"COMPLEX_COMPONENT_TABLE",label:"복합성분표"},
  {kind:"SINGLE_COMPONENT_TABLE",label:"단일성분표"},
];

export default function DocumentPdfPanel(){
  const s=useSprint2DocumentPdf();
  return <div className="v50-page">
    <section className="v50-hero"><div><h1 className="v50-title">문서관리 PDF</h1><p className="v50-desc">Formula Sheet, 전성분표, 복합성분표, 단일성분표를 각각 생성하고 PDF로 저장합니다.</p></div><button className="v50-button" onClick={s.load}>새로고침</button></section>
    <p style={{color:"#2563eb",fontWeight:900}}>{s.message}</p>
    <section className="v50-split">
      <article className="v50-panel"><h2>처방 선택</h2><div style={{display:"flex",gap:8,marginBottom:12}}><input className="v50-input" value={s.keyword} onChange={(e)=>s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색"/><button className="v50-button" onClick={s.load}>검색</button></div><div className="v50-table-wrap"><table className="v50-table"><thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>총합</th><th>문서 생성</th></tr></thead><tbody>{s.formulas.map((f)=><tr key={`${f.formula_code}-${f.revision}`}><td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{docButtons.map((b)=><button key={b.kind} className="v50-button-light" onClick={()=>s.createDoc(f,b.kind)}>{b.label}</button>)}</div></td></tr>)}{s.formulas.length===0&&<tr><td colSpan={5}>처방 데이터가 없습니다.</td></tr>}</tbody></table></div></article>
      <article className="v50-panel"><h2>생성 문서 목록</h2><div className="v50-table-wrap"><table className="v50-table"><thead><tr><th>문서코드</th><th>종류</th><th>제목</th><th>작업</th></tr></thead><tbody>{s.documents.map((d)=><tr key={d.document_code}><td>{d.document_code}</td><td>{d.document_type}</td><td>{d.title}</td><td><button className="v50-button-light" onClick={()=>s.preview(d)}>미리보기</button>{" "}<button className="v50-button-light" onClick={()=>s.download(d)}>HTML</button>{" "}<button className="v50-button" onClick={()=>s.print(d)}>PDF 저장</button></td></tr>)}{s.documents.length===0&&<tr><td colSpan={4}>생성된 문서가 없습니다.</td></tr>}</tbody></table></div></article>
    </section>
    <section className="v50-panel"><h2>문서 미리보기</h2>{s.selected?<iframe title="document-preview" style={{width:"100%",minHeight:760,border:"1px solid #e2e8f0",borderRadius:14,background:"white"}} srcDoc={s.selected.html_content||""}/>:<p style={{color:"#64748b"}}>생성 문서를 선택하면 미리보기가 표시됩니다.</p>}</section>
  </div>;
}
