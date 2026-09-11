"use client";

import type { CSSProperties } from "react";
import { useProductCoa } from "@/hooks/useProductCoa";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useProductCoa>;

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
      {!s.editingId && <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>저장한 뒤 작성/검토/승인을 단계적으로 확정할 수 있습니다. 확정하면 본인이 등록한 서명 이미지가 문서에 삽입됩니다.</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StageCard title="작성" state={writerState} personName={s.writerName} confirmedAt={s.writerConfirmedAt} confirmedBy={s.writerConfirmedBy} onConfirm={s.confirmWriter} confirming={s.confirming} />
        <StageCard title="검토" state={reviewerState} personName={s.reviewerName} confirmedAt={s.reviewerConfirmedAt} confirmedBy={s.reviewerConfirmedBy} onConfirm={s.confirmReviewer} confirming={s.confirming} />
        <StageCard title="승인" state={approverState} personName={s.approverName} confirmedAt={s.approverConfirmedAt} confirmedBy={s.approverConfirmedBy} onConfirm={s.confirmApprover} confirming={s.confirming} />
      </div>
    </div>
  );
}

const ITEM_DIVIDER = "2px solid #dbe3ef";
function itemBg(no: number) {
  return no % 2 === 0 ? "#f8fafc" : "#ffffff";
}

function NoBadge({ no }: { no: number }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: "50%", background: "#eef2ff",
        color: "#4338ca", fontWeight: 800, fontSize: 12,
      }}
    >
      {no}
    </span>
  );
}

const ITEM_TABLE_TH: CSSProperties = {
  background: "#eef1f6", color: "#1e293b", fontWeight: 800, borderBottom: "2px solid #cbd5e1",
};

function ItemActions({
  isFirst, isLast, onUp, onDown, onDelete,
}: {
  isFirst: boolean; isLast: boolean; onUp: () => void; onDown: () => void; onDelete: () => void;
}) {
  const btnStyle: CSSProperties = { fontSize: 11, padding: "2px 6px", lineHeight: 1.4, width: "100%" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "stretch" }}>
      <button className="v50-button-light" style={btnStyle} onClick={onUp} disabled={isFirst} title="위로 이동">▲</button>
      <button className="v50-button-light" style={btnStyle} onClick={onDown} disabled={isLast} title="아래로 이동">▼</button>
      <button className="v50-button-light" style={{ ...btnStyle, color: "#dc2626" }} onClick={onDelete}>삭제</button>
    </div>
  );
}

function CoaForm({ s }: { s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
        {s.editingId ? "COA 수정" : "새 제품 COA"}
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
          <span>문서번호 <span style={{ fontWeight: 400, fontSize: 11, color: "#94a3b8" }}>(예: QA-COA-26P5065)</span></span>
          <input className="v50-input" value={s.docNo} onChange={(e) => s.setDocNo(e.target.value)} placeholder="예: QA-COA-26P5065" />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Name (제품명)<input className="v50-input" value={s.productName} onChange={(e) => s.setProductName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Code (제품코드)<input className="v50-input" value={s.productCode} onChange={(e) => s.setProductCode(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Batch No. (제조번호)<input className="v50-input" value={s.batchNo} onChange={(e) => s.setBatchNo(e.target.value)} placeholder="예: 5053 EXP 20290504" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Category (제품구분)<input className="v50-input" value={s.productCategory} onChange={(e) => s.setProductCategory(e.target.value)} placeholder="예: Cosmetic – Skin Care Face Mask" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, gridColumn: "1 / -1" }}>Manufacturer (제조사)<input className="v50-input" value={s.manufacturer} onChange={(e) => s.setManufacturer(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, gridColumn: "1 / -1" }}>Address (주소)<input className="v50-input" value={s.address} onChange={(e) => s.setAddress(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Test Date From<input className="v50-input" type="date" value={s.testDateFrom} onChange={(e) => s.setTestDateFrom(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Test Date To<input className="v50-input" type="date" value={s.testDateTo} onChange={(e) => s.setTestDateTo(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>작성<input className="v50-input" value={s.writerName} onChange={(e) => s.setWriterName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>검토<input className="v50-input" value={s.reviewerName} onChange={(e) => s.setReviewerName(e.target.value)} placeholder="해당자 없으면 비워두세요" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>승인<input className="v50-input" value={s.approverName} onChange={(e) => s.setApproverName(e.target.value)} /></label>
      </div>

      <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 12 }}>
        Conclusion (결론) <span style={{ fontWeight: 400, fontSize: 11, color: "#94a3b8" }}>([Product Name]은 출력 시 제품명으로 자동 치환됩니다)</span>
        <textarea className="v50-textarea" rows={3} style={{ minHeight: 70, fontSize: 13 }} value={s.conclusion} onChange={(e) => s.setConclusion(e.target.value)} />
      </label>

      <ApprovalWorkflow s={s} />

      <div className="v50-table-wrap" style={{ marginTop: 14 }}>
        <table className="v50-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ ...ITEM_TABLE_TH, width: 44, textAlign: "center" }}>No.</th>
              <th style={{ ...ITEM_TABLE_TH, width: 190 }}>Test Item</th>
              <th style={{ ...ITEM_TABLE_TH, width: 260 }}>Test Standard</th>
              <th style={{ ...ITEM_TABLE_TH, width: 190 }}>Test Method</th>
              <th style={{ ...ITEM_TABLE_TH, width: 130, textAlign: "center" }}>Test Date</th>
              <th style={ITEM_TABLE_TH}>Result</th>
              <th style={{ ...ITEM_TABLE_TH, width: 56, textAlign: "center" }}></th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((item) => {
              const bg = itemBg(item.no);
              return (
                <tr key={item.no}>
                  <td style={{ textAlign: "center", background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "middle" }}>
                    <NoBadge no={item.no} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "top" }}>
                    <textarea className="v50-textarea" rows={2} style={{ minHeight: 50, fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }} value={item.test_item}
                      onChange={(e) => s.updateItem(item.no, { test_item: e.target.value })} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "top" }}>
                    <textarea className="v50-textarea" rows={2} style={{ minHeight: 50, fontSize: 12.5, lineHeight: 1.5 }} value={item.test_standard}
                      onChange={(e) => s.updateItem(item.no, { test_standard: e.target.value })} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "top" }}>
                    <textarea className="v50-textarea" rows={2} style={{ minHeight: 50, fontSize: 12.5, lineHeight: 1.5 }} value={item.test_method}
                      onChange={(e) => s.updateItem(item.no, { test_method: e.target.value })} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, textAlign: "center", verticalAlign: "middle" }}>
                    <input className="v50-input" type="date" value={item.test_date} onChange={(e) => s.updateItem(item.no, { test_date: e.target.value })} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "middle" }}>
                    <input className="v50-input" value={item.result || ""} placeholder="예: 5.97* / ND" onChange={(e) => s.updateItem(item.no, { result: e.target.value })} />
                  </td>
                  <td style={{ background: bg, borderTop: ITEM_DIVIDER, verticalAlign: "middle" }}>
                    <ItemActions
                      isFirst={item.no === 1} isLast={item.no === s.items.length}
                      onUp={() => s.moveItemUp(item.no)} onDown={() => s.moveItemDown(item.no)} onDelete={() => s.removeItem(item.no)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8 }}>
        <button className="v50-button-light" onClick={s.addItem}>+ 시험항목 추가</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="v50-button" onClick={s.saveCoa} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
        <button className="v50-button-light" onClick={s.downloadCurrentExcel}>엑셀 다운로드</button>
        <button className="v50-button-light" onClick={s.downloadCurrentHtml}>HTML 다운로드</button>
        <button className="v50-button-light" onClick={s.closeForm}>목록으로</button>
      </div>
    </div>
  );
}

export default function ProductCoaPanel() {
  const s = useProductCoa();

  if (s.showForm) {
    return (
      <div>
        {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}
        <CoaForm s={s} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <input
          className="v50-input" value={s.listKeyword} onChange={(e) => s.setListKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.reloadList()}
          placeholder="제품명/제품코드/제조번호 검색" style={{ maxWidth: 240 }}
        />
        <button className="v50-button-light" onClick={s.reloadList}>검색</button>
        <div style={{ flex: 1 }} />
        <button className="v50-button" onClick={s.openNewCoa}>+ 제품 COA 작성</button>
      </div>

      {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}

      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead>
            <tr><th>문서번호</th><th>Product Name</th><th>Product Code</th><th>Batch No.</th><th>결재상태</th><th>작성일</th><th></th></tr>
          </thead>
          <tbody>
            {s.listLoading && <tr><td colSpan={7} style={{ color: "#94a3b8" }}>불러오는 중…</td></tr>}
            {!s.listLoading && s.list.length === 0 && <tr><td colSpan={7} style={{ color: "#94a3b8" }}>등록된 COA가 없습니다.</td></tr>}
            {s.list.map((coa) => (
              <tr key={coa.id}>
                <td>{coa.doc_no || "-"}</td>
                <td>{coa.product_name || "-"}</td>
                <td>{coa.product_code || "-"}</td>
                <td>{coa.batch_no || "-"}</td>
                <td><span className="v50-badge">{WORKFLOW_STATUS_LABEL[coa.workflow_status || "draft"]}</span></td>
                <td>{coa.created_at ? coa.created_at.slice(0, 10) : "-"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="v50-button-light" onClick={() => coa.id && s.openExistingCoa(coa.id)}>열기</button>
                  <button className="v50-button-light" onClick={() => coa.id && s.removeCoa(coa.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
