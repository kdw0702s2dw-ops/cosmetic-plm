"use client";

import type { ReactNode } from "react";
import { useTestCertificate } from "@/hooks/useTestCertificate";
import type { CertificateProductType } from "@/services/sprint2/testCertificateService";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useTestCertificate>;

function verdictBadgeClass(v: string) {
  if (v === "적합") return "ok";
  if (v === "부적합") return "danger";
  return "";
}

const WORKFLOW_STATUS_LABEL: Record<string, string> = {
  draft: "작성중",
  pending_review: "검토대기",
  pending_approval: "승인대기",
  approved: "승인완료",
};

type StageState = "done" | "current" | "waiting" | "skipped";

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "";
  return v.slice(0, 16).replace("T", " ");
}

function StageCard({
  title, state, personName, confirmedAt, confirmedBy, onConfirm, confirming,
}: {
  title: string; state: StageState; personName: string; confirmedAt?: string | null; confirmedBy?: string | null;
  onConfirm: () => void; confirming: boolean;
}) {
  const colorByState: Record<StageState, string> = { done: "#059669", current: "#2563eb", waiting: "#94a3b8", skipped: "#cbd5e1" };
  const labelByState: Record<StageState, string> = { done: "확정됨", current: "확정 대기", waiting: "대기", skipped: "해당 없음" };
  return (
    <div className="v50-card" style={{ padding: 12, flex: 1, minWidth: 160, borderColor: colorByState[state] }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 13 }}>{title}</b>
        <span style={{ fontSize: 11, fontWeight: 800, color: colorByState[state] }}>{labelByState[state]}</span>
      </div>
      <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>{personName || "-"}</div>
      {state === "done" && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{confirmedBy || ""} {fmtDateTime(confirmedAt)}</div>
      )}
      {state === "skipped" && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>담당자 미지정 - 자동 건너뜀</div>}
      {state === "current" && (
        <button className="v50-button" style={{ marginTop: 8, width: "100%" }} onClick={onConfirm} disabled={confirming}>
          {confirming ? "처리 중…" : `${title} 확정`}
        </button>
      )}
    </div>
  );
}

function ApprovalWorkflow({ s }: { s: S }) {
  const hasReviewer = !!s.reviewerName.trim();
  const writerState: StageState = s.writerConfirmedAt ? "done" : "current";
  const reviewerState: StageState = !hasReviewer
    ? "skipped"
    : s.reviewerConfirmedAt
    ? "done"
    : s.workflowStatus === "pending_review"
    ? "current"
    : "waiting";
  const approverState: StageState = s.approverConfirmedAt
    ? "done"
    : s.workflowStatus === "pending_approval"
    ? "current"
    : "waiting";

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>결재 진행 상태</div>
        <span className="v50-badge">{WORKFLOW_STATUS_LABEL[s.workflowStatus] || s.workflowStatus}</span>
      </div>
      {!s.editingId && <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>저장한 뒤 작성/검토/승인을 단계적으로 확정할 수 있습니다.</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StageCard title="작성" state={writerState} personName={s.writerName} confirmedAt={s.writerConfirmedAt} confirmedBy={s.writerConfirmedBy} onConfirm={s.confirmWriter} confirming={s.confirming} />
        <StageCard title="검토" state={reviewerState} personName={s.reviewerName} confirmedAt={s.reviewerConfirmedAt} confirmedBy={s.reviewerConfirmedBy} onConfirm={s.confirmReviewer} confirming={s.confirming} />
        <StageCard title="승인" state={approverState} personName={s.approverName} confirmedAt={s.approverConfirmedAt} confirmedBy={s.approverConfirmedBy} onConfirm={s.confirmApprover} confirming={s.confirming} />
      </div>
    </div>
  );
}

function CertificateForm({ s }: { s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
        {s.editingId ? "성적서 수정" : `새 ${s.productType} 성적서`}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="v50-input" value={s.formulaKeyword} onChange={(e) => s.setFormulaKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.searchFormulas()}
          placeholder="처방코드/처방명/고객사 검색" style={{ maxWidth: 260 }}
        />
        <button className="v50-button-light" onClick={s.searchFormulas} disabled={s.formulaSearching}>{s.formulaSearching ? "검색 중…" : "처방 검색"}</button>
      </div>
      {s.formulaHits.length > 0 && (
        <div className="v50-table-wrap" style={{ marginTop: 8, maxHeight: 220, overflowY: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>고객사</th><th></th></tr></thead>
            <tbody>
              {s.formulaHits.map((f: any) => (
                <tr key={f.id}>
                  <td>{f.formula_code}</td><td>{f.formula_name || "-"}</td><td>{f.revision}</td><td>{f.customer || "-"}</td>
                  <td><button className="v50-button-light" onClick={() => s.pickFormula(f)}>선택</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {s.selectedFormula && (
        <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>
          연동된 처방: <b>{s.selectedFormula.formula_code}</b> ({s.selectedFormula.revision})
        </div>
      )}

      <div className="v50-grid-2" style={{ marginTop: 10 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          문서번호
          <input className="v50-input" value={s.docNo} onChange={(e) => s.setDocNo(e.target.value)} placeholder="예: QA-QS-COA-26P5065" />
          <span style={{ fontWeight: 400, fontSize: 11, color: "#94a3b8" }}>예: QA-QS-COA-26P5065</span>
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>품목코드<input className="v50-input" value={s.itemCode} onChange={(e) => s.setItemCode(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>제조번호<input className="v50-input" value={s.lotNo} onChange={(e) => s.setLotNo(e.target.value)} placeholder="예: 5065 EXP20290811" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, gridColumn: "1 / -1" }}>고객사/제품명<input className="v50-input" value={s.customerProduct} onChange={(e) => s.setCustomerProduct(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>시험부서<input className="v50-input" value={s.testDept} onChange={(e) => s.setTestDept(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          종합판정
          <select className="v50-input" value={s.overallVerdict} onChange={(e) => s.setOverallVerdict(e.target.value)}>
            <option value="적합">적합</option>
            <option value="부적합">부적합</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>작성<input className="v50-input" value={s.writerName} onChange={(e) => s.setWriterName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>검토<input className="v50-input" value={s.reviewerName} onChange={(e) => s.setReviewerName(e.target.value)} placeholder="해당자 없으면 비워두세요" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>승인<input className="v50-input" value={s.approverName} onChange={(e) => s.setApproverName(e.target.value)} /></label>
      </div>

      <ApprovalWorkflow s={s} />

      <div className="v50-table-wrap" style={{ marginTop: 14 }}>
        <table className="v50-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>No.</th>
              <th style={{ width: 130 }}>시험항목</th>
              <th style={{ width: 220 }}>시험기준</th>
              <th style={{ width: 150 }}>시험방법</th>
              <th style={{ width: 120 }}>시험일자</th>
              <th>시험결과 및 판정</th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((item) => {
              if (item.subGroups && item.subGroups.length > 0) {
                const totalRows = item.subGroups.reduce((sum, g) => sum + Math.max(1, g.results.length), 0);
                let printedHead = false;
                const rows: ReactNode[] = [];
                item.subGroups.forEach((g, gi) => {
                  g.results.forEach((val, ri) => {
                    rows.push(
                      <tr key={`${item.no}-${gi}-${ri}`}>
                        {!printedHead && (
                          <>
                            <td rowSpan={totalRows} style={{ verticalAlign: "middle", textAlign: "center" }}>{item.no}</td>
                            <td rowSpan={totalRows} style={{ verticalAlign: "middle", whiteSpace: "pre-line" }}>{item.label}</td>
                          </>
                        )}
                        {ri === 0 && (
                          <td rowSpan={g.results.length} style={{ verticalAlign: "top" }}>
                            <textarea className="v50-textarea" rows={2} style={{ minHeight: 40 }} value={g.spec}
                              onChange={(e) => s.updateSubGroup(item.no, gi, { spec: e.target.value })} />
                          </td>
                        )}
                        {!printedHead && (
                          <>
                            <td rowSpan={totalRows} style={{ verticalAlign: "middle", whiteSpace: "pre-line" }}>{item.method}</td>
                            <td rowSpan={totalRows} style={{ verticalAlign: "middle" }}>
                              <input className="v50-input" type="date" value={item.test_date} onChange={(e) => s.updateItem(item.no, { test_date: e.target.value })} />
                            </td>
                          </>
                        )}
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input className="v50-input" value={val} placeholder={`측정값 ${ri + 1}`}
                              onChange={(e) => s.updateSubGroupResult(item.no, gi, ri, e.target.value)} />
                            {ri === 0 && (
                              <select className="v50-input" style={{ minWidth: 90 }} value={g.verdict}
                                onChange={(e) => s.updateSubGroup(item.no, gi, { verdict: e.target.value })}>
                                <option value="">판정</option>
                                <option value="적합">적합</option>
                                <option value="부적합">부적합</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    printedHead = true;
                  });
                });
                return rows;
              }
              return (
                <tr key={item.no}>
                  <td style={{ textAlign: "center" }}>{item.no}</td>
                  <td style={{ whiteSpace: "pre-line" }}>{item.label}</td>
                  <td>
                    <textarea className="v50-textarea" rows={2} style={{ minHeight: 40 }} value={item.spec || ""}
                      onChange={(e) => s.updateItem(item.no, { spec: e.target.value })} />
                  </td>
                  <td style={{ whiteSpace: "pre-line" }}>{item.method}</td>
                  <td>
                    <input className="v50-input" type="date" value={item.test_date} onChange={(e) => s.updateItem(item.no, { test_date: e.target.value })} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="v50-input" value={item.result || ""} onChange={(e) => s.updateItem(item.no, { result: e.target.value })} />
                      {item.unit && <span style={{ alignSelf: "center", color: "#64748b", fontSize: 12 }}>{item.unit}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="v50-button" onClick={s.saveCertificate} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
        <button className="v50-button-light" onClick={s.printCurrentCertificate}>PDF로 인쇄/저장</button>
        <button className="v50-button-light" onClick={s.downloadCurrentExcel}>엑셀 다운로드</button>
        <button className="v50-button-light" onClick={s.downloadCurrentHtml}>HTML 다운로드</button>
        <button className="v50-button-light" onClick={s.closeForm}>목록으로</button>
      </div>
    </div>
  );
}

export default function TestCertificatePanel() {
  const s = useTestCertificate();

  if (s.showForm) {
    return (
      <div>
        {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}
        <CertificateForm s={s} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <button className={s.listProductFilter === "전체" ? "v50-button" : "v50-button-light"} onClick={() => s.setListProductFilter("전체")}>전체</button>
        {s.CERTIFICATE_PRODUCT_TYPES.map((t: CertificateProductType) => (
          <button key={t} className={s.listProductFilter === t ? "v50-button" : "v50-button-light"} onClick={() => s.setListProductFilter(t)}>{t}</button>
        ))}
        <input
          className="v50-input" value={s.listKeyword} onChange={(e) => s.setListKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.reloadList()}
          placeholder="품목코드/제조번호/고객사 검색" style={{ maxWidth: 220 }}
        />
        <button className="v50-button-light" onClick={s.reloadList}>검색</button>
        <div style={{ flex: 1 }} />
        <button className="v50-button" onClick={() => s.openNewCertificate("반제품")}>+ 반제품 성적서</button>
        <button className="v50-button" onClick={() => s.openNewCertificate("완제품")}>+ 완제품 성적서</button>
      </div>

      {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}

      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead>
            <tr><th>유형</th><th>문서번호</th><th>품목코드</th><th>제조번호</th><th>고객사/제품명</th><th>종합판정</th><th>작성일</th><th></th></tr>
          </thead>
          <tbody>
            {s.listLoading && <tr><td colSpan={8} style={{ color: "#94a3b8" }}>불러오는 중…</td></tr>}
            {!s.listLoading && s.list.length === 0 && <tr><td colSpan={8} style={{ color: "#94a3b8" }}>등록된 성적서가 없습니다.</td></tr>}
            {s.list.map((cert) => (
              <tr key={cert.id}>
                <td>{cert.product_type}</td>
                <td>{cert.doc_no || "-"}</td>
                <td>{cert.item_code || "-"}</td>
                <td>{cert.lot_no || "-"}</td>
                <td>{cert.customer_product || "-"}</td>
                <td><span className={`v50-badge ${verdictBadgeClass(cert.overall_verdict)}`}>{cert.overall_verdict}</span></td>
                <td>{cert.created_at ? cert.created_at.slice(0, 10) : "-"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="v50-button-light" onClick={() => cert.id && s.openExistingCertificate(cert.id)}>열기</button>
                  <button className="v50-button-light" onClick={() => cert.id && s.removeCertificate(cert.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
