"use client";

import { useState } from "react";
import { useSprint2DocumentPdf } from "@/hooks/useSprint2DocumentPdf";
import type { DocKind } from "@/services/sprint2/documentPdfService";
import "@/styles/enterprise-v50.css";

const docButtons: { kind: DocKind; label: string }[] = [
  { kind: "FORMULA_SHEET_PDF", label: "Formula Sheet" },
  { kind: "INCI_LIST", label: "전성분표" },
  { kind: "COMPLEX_COMPONENT_TABLE", label: "복합성분표" },
  { kind: "SINGLE_COMPONENT_TABLE", label: "단일성분표" },
];

function DocActions({ d, onPreview, onDownload, onPrint }: { d: any; onPreview: (d: any) => void; onDownload: (d: any) => void; onPrint: (d: any) => void }) {
  return (
    <>
      <button className="v50-button-light" onClick={() => onPreview(d)}>미리보기</button>{" "}
      <button className="v50-button-light" onClick={() => onDownload(d)}>HTML</button>{" "}
      <button className="v50-button" onClick={() => onPrint(d)}>PDF 저장</button>
    </>
  );
}

export default function DocumentPdfPanel() {
  const s = useSprint2DocumentPdf();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedOlder, setExpandedOlder] = useState<Set<string>>(new Set());

  function toggleGroup(code: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  function toggleOlder(code: string) {
    setExpandedOlder((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">문서관리 PDF</h1>
          <p className="v50-desc">Formula Sheet, 전성분표, 복합성분표, 단일성분표를 각각 생성하고 PDF로 저장합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load}>새로고침</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
          <button className="v50-button" onClick={s.load}>검색</button>
        </div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>총합</th><th>문서 생성</th></tr></thead>
            <tbody>
              {s.formulas.map((f) => (
                <tr key={`${f.formula_code}-${f.revision}`}>
                  <td>{f.formula_code}</td>
                  <td>{f.formula_name}</td>
                  <td>{f.revision}</td>
                  <td>{f.total_percent}%</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {docButtons.map((b) => {
                        const existing = s.existingDocByKey.get(`${f.formula_code}|${f.revision}|${b.kind}`);
                        return existing ? (
                          <span key={b.kind} style={{ display: "inline-flex", gap: 4 }}>
                            <button className="v50-button-light" disabled style={{ opacity: 0.55 }}>{b.label} (생성됨)</button>
                            <button className="v50-button" onClick={() => s.regenerateDoc(existing, f, b.kind)}>재생성</button>
                          </span>
                        ) : (
                          <button key={b.kind} className="v50-button-light" onClick={() => s.createDoc(f, b.kind)}>{b.label}</button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {s.formulas.length === 0 && <tr><td colSpan={5}>처방 데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>생성 문서 목록 (처방별)</h2>
        {s.groupedDocs.length === 0 && <p style={{ color: "#64748b" }}>생성된 문서가 없습니다.</p>}
        {s.groupedDocs.map((g) => {
          const collapsed = collapsedGroups.has(g.formula_code);
          const olderOpen = expandedOlder.has(g.formula_code);
          return (
            <div key={g.formula_code} className="v50-card" style={{ padding: 0, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => toggleGroup(g.formula_code)} style={{
                width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "#f8fafc", border: "none", cursor: "pointer", fontWeight: 800,
              }}>
                <span>{g.formula_name} ({g.formula_code}) · 바이어: {g.customer || "-"} · 최신 문서 {g.latestDocs.length}건{g.olderDocs.length > 0 ? `, 이전 버전 ${g.olderDocs.length}건` : ""}</span>
                <span>{collapsed ? "▼" : "▲"}</span>
              </button>
              {!collapsed && (
                <div style={{ padding: 12 }}>
                  <div className="v50-table-wrap">
                    <table className="v50-table">
                      <thead><tr><th>종류</th><th>제목</th><th>바이어</th><th>처방 버전</th><th>작업</th></tr></thead>
                      <tbody>
                        {g.latestDocs.map((d) => (
                          <tr key={d.document_code}>
                            <td>{d.document_type}</td><td>{d.title}</td><td>{d.customer}</td><td>{d.revision}</td>
                            <td><DocActions d={d} onPreview={s.preview} onDownload={s.download} onPrint={s.print} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {g.olderDocs.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <button className="v50-button-light" onClick={() => toggleOlder(g.formula_code)}>
                        이전 버전 보기 ({g.olderDocs.length}건) {olderOpen ? "▲" : "▼"}
                      </button>
                      {olderOpen && (
                        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
                          <table className="v50-table">
                            <thead><tr><th>종류</th><th>제목</th><th>바이어</th><th>처방 버전</th><th>작업</th></tr></thead>
                            <tbody>
                              {g.olderDocs.map((d) => (
                                <tr key={d.document_code} style={{ color: "#94a3b8" }}>
                                  <td>{d.document_type}</td><td>{d.title}</td><td>{d.customer}</td><td>{d.revision}</td>
                                  <td><DocActions d={d} onPreview={s.preview} onDownload={s.download} onPrint={s.print} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="v50-panel">
        <h2>문서 미리보기</h2>
        {s.selected ? (
          <iframe title="document-preview" style={{ width: "100%", minHeight: 760, border: "1px solid #e2e8f0", borderRadius: 14, background: "white" }} srcDoc={s.selected.html_content || ""} />
        ) : (
          <p style={{ color: "#64748b" }}>생성 문서를 선택하면 미리보기가 표시됩니다.</p>
        )}
      </section>
    </div>
  );
}
