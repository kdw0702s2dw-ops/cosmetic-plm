"use client";

import { useState } from "react";
import { useSprint2DocumentPdf } from "@/hooks/useSprint2DocumentPdf";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { pct, type DocBasis, type DocKind } from "@/services/sprint2/documentPdfService";
import "@/styles/enterprise-v50.css";

const docButtons: { kind: DocKind; label: string }[] = [
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

// 처방 1건 펼침 영역 안에서 문서 종류(전성분표/복합성분표/단일성분표) 한 줄.
// "PDF 보기/생성" 버튼은 상태에 따라 라벨/동작이 바뀐다: 미생성 -> 생성(createDoc), 생성됨 -> 보기(preview).
function DocKindRow({
  label, kind, formula, existing, s, canExportData, basis,
}: {
  label: string;
  kind: DocKind;
  formula: any;
  existing: any;
  s: ReturnType<typeof useSprint2DocumentPdf>;
  canExportData: boolean;
  basis: DocBasis;
}) {
  const statusText = existing
    ? `생성됨 (${new Date(existing.updated_at || existing.created_at).toLocaleDateString("ko-KR")})`
    : "미생성";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ width: 100, fontWeight: 800 }}>{label}</span>
      <span style={{ width: 170, fontSize: 13, color: existing ? "#16a34a" : "#94a3b8" }}>{statusText}</span>
      <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
        {existing ? (
          <>
            <button className="v50-button-light" onClick={() => s.preview(existing)}>PDF 보기</button>
            <button className="v50-button-light" onClick={() => s.regenerateDoc(existing, formula, kind, basis)}>재생성</button>
          </>
        ) : (
          <button className="v50-button-light" onClick={() => s.createDoc(formula, kind, basis)}>PDF 생성</button>
        )}
        {canExportData && <button className="v50-button" onClick={() => s.downloadDocExcel(formula, kind, label, basis)}>엑셀 다운로드</button>}
      </div>
    </div>
  );
}

// 원료발주가처방 행: 다른 3종과 달리 버튼 클릭 시 바로 생성하지 않고 미리보기 팝업(신규 체크/담당자 확인)을 먼저 연다.
function OrderSheetDocRow({ formula, existing, s, canExportData }: { formula: any; existing: any; s: ReturnType<typeof useSprint2DocumentPdf>; canExportData: boolean }) {
  const statusText = existing
    ? `생성됨 (${new Date(existing.updated_at || existing.created_at).toLocaleDateString("ko-KR")})`
    : "미생성";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ width: 100, fontWeight: 800 }}>원료발주가처방</span>
      <span style={{ width: 170, fontSize: 13, color: existing ? "#16a34a" : "#94a3b8" }}>{statusText}</span>
      <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
        {existing ? (
          <>
            <button className="v50-button-light" onClick={() => s.preview(existing)}>PDF 보기</button>
            <button className="v50-button-light" onClick={() => s.openOrderSheetModal(formula, existing, "pdf")}>재생성</button>
          </>
        ) : (
          <button className="v50-button-light" onClick={() => s.openOrderSheetModal(formula, null, "pdf")}>PDF 생성</button>
        )}
        {canExportData && <button className="v50-button" onClick={() => s.openOrderSheetModal(formula, existing, "excel")}>엑셀 다운로드</button>}
      </div>
    </div>
  );
}

// 신규 체크(자동판정, 개별 수정 가능) + 담당자 입력 후 확인해야 실제 PDF/엑셀이 생성된다.
function OrderSheetModal({ s }: { s: ReturnType<typeof useSprint2DocumentPdf> }) {
  const m = s.orderSheetModal;
  if (!m.open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="v50-card" style={{ width: "min(760px, 100%)", maxHeight: "85vh", overflow: "auto", padding: 20, background: "white" }}>
        <h2 style={{ marginTop: 0 }}>원료발주가처방 {m.mode === "excel" ? "엑셀 다운로드" : "PDF 생성"} 확인</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {m.formula?.formula_name} ({m.formula?.formula_code}) · Rev {m.formula?.revision}
        </p>
        {m.loading ? (
          <p>불러오는 중...</p>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 4 }}>연구 담당자</label>
              <input
                className="v50-input"
                style={{ width: 240 }}
                value={m.personInCharge}
                onChange={(e) => s.setOrderSheetPersonInCharge(e.target.value)}
                placeholder="연구 담당자 이름 입력"
              />
            </div>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr><th>원료코드</th><th>원료명</th><th>함량(%)</th><th>신규 체크</th><th>공급사</th></tr>
                </thead>
                <tbody>
                  {m.rows.length === 0 ? (
                    <tr><td colSpan={5}>BOM 데이터가 없습니다.</td></tr>
                  ) : (
                    m.rows.map((r, i) => (
                      <tr key={r.raw_code}>
                        <td>{r.raw_code}</td>
                        <td>{r.raw_name}</td>
                        <td>{pct(r.percent)}</td>
                        <td style={{ textAlign: "center" }}>
                          <input type="checkbox" checked={r.isNew} onChange={(e) => s.updateOrderSheetRowIsNew(i, e.target.checked)} />
                        </td>
                        <td>{r.supplier || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="v50-button-light" onClick={s.closeOrderSheetModal}>취소</button>
          <button className="v50-button" disabled={m.loading} onClick={s.confirmOrderSheet}>
            {m.mode === "excel" ? "엑셀 다운로드" : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentPdfPanel() {
  const s = useSprint2DocumentPdf();
  const auth = useSprint1Auth();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedOlder, setExpandedOlder] = useState<Set<string>>(new Set());
  const [expandedFormulas, setExpandedFormulas] = useState<Set<string>>(new Set());
  // 처방 카드별 배합시/건조후 기준 - 전성분표/복합성분표/단일성분표 3종에 공통 적용 (원료발주가처방은 대상 아님)
  const [basisByFormula, setBasisByFormula] = useState<Map<string, DocBasis>>(new Map());

  function getBasis(f: any): DocBasis {
    return basisByFormula.get(`${f.formula_code}|${f.revision}`) || "MIX";
  }
  function setBasis(f: any, basis: DocBasis) {
    setBasisByFormula((prev) => new Map(prev).set(`${f.formula_code}|${f.revision}`, basis));
  }

  function toggleFormula(key: string) {
    setExpandedFormulas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

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

  // "처방 선택"에서 펼친(formula_code, revision) 조합만 정확히 추려서 "생성 문서 목록"을 그 범위로 필터링한다.
  // expandedFormulas는 "formula_code-revision" 문자열 키라 역파싱이 애매하므로, 이미 갖고 있는 s.formulas와
  // 대조해서 정확한 (formula_code, revision) 집합을 구한다. 새 state는 추가하지 않는다.
  const expandedFormulaKeys = new Set(
    s.formulas
      .filter((f) => expandedFormulas.has(`${f.formula_code}-${f.revision}`))
      .map((f) => `${f.formula_code}|${f.revision}`)
  );
  const visibleGroupedDocs = s.groupedDocs
    .map((g) => ({
      ...g,
      latestDocs: g.latestDocs.filter((d) => expandedFormulaKeys.has(`${d.formula_code}|${d.revision}`)),
      olderDocs: g.olderDocs.filter((d) => expandedFormulaKeys.has(`${d.formula_code}|${d.revision}`)),
    }))
    .filter((g) => g.latestDocs.length > 0 || g.olderDocs.length > 0);

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">문서관리 PDF</h1>
          <p className="v50-desc">실험일지(엑셀)를 다운로드하고, 전성분표/복합성분표/단일성분표를 각각 생성하여 PDF로 저장합니다.</p>
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
        {s.formulas.length === 0 && <p style={{ color: "#64748b" }}>처방 데이터가 없습니다.</p>}
        {s.formulas.map((f) => {
          const key = `${f.formula_code}-${f.revision}`;
          const expanded = expandedFormulas.has(key);
          return (
            <div key={key} className="v50-card" style={{ padding: 0, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => toggleFormula(key)} style={{
                width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "#f8fafc", border: "none", cursor: "pointer", fontWeight: 800,
              }}>
                <span>{f.formula_name} ({f.formula_code}) · Rev {f.revision} · 총합 {f.total_percent}%</span>
                <span>{expanded ? "▲" : "▼"}</span>
              </button>
              {expanded && (
                <div style={{ padding: "2px 16px 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ width: 100, fontWeight: 800 }}>기준</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className={getBasis(f) === "MIX" ? "v50-button" : "v50-button-light"}
                        onClick={() => setBasis(f, "MIX")}
                      >
                        배합 시
                      </button>
                      <button
                        className={getBasis(f) === "DRY" ? "v50-button" : "v50-button-light"}
                        onClick={() => setBasis(f, "DRY")}
                      >
                        건조 후
                      </button>
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      (전성분표/복합성분표/단일성분표에 공통 적용 · 원료발주가처방은 배합시 고정)
                    </span>
                  </div>
                  {docButtons.map((b) => (
                    <DocKindRow
                      key={b.kind}
                      label={b.label}
                      kind={b.kind}
                      formula={f}
                      existing={s.existingDocByKey.get(`${f.formula_code}|${f.revision}|${b.kind}|${getBasis(f)}`)}
                      s={s}
                      canExportData={auth.canExportData}
                      basis={getBasis(f)}
                    />
                  ))}
                  <OrderSheetDocRow
                    formula={f}
                    existing={s.existingDocByKey.get(`${f.formula_code}|${f.revision}|RAW_MATERIAL_ORDER_SHEET|MIX`)}
                    s={s}
                    canExportData={auth.canExportData}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
                    <span style={{ width: 100, fontWeight: 800 }}>실험일지</span>
                    <span style={{ width: 170 }} />
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      {auth.canExportData && <button className="v50-button" onClick={() => s.downloadLabJournal(f)}>엑셀 다운로드</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>생성 문서 목록 (처방별)</h2>
        {expandedFormulas.size === 0 ? (
          <p style={{ color: "#64748b" }}>처방을 선택하면 이력이 표시됩니다.</p>
        ) : visibleGroupedDocs.length === 0 ? (
          <p style={{ color: "#64748b" }}>생성된 문서가 없습니다.</p>
        ) : null}
        {visibleGroupedDocs.map((g) => {
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
      <OrderSheetModal s={s} />
    </div>
  );
}
