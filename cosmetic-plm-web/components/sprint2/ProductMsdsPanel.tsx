"use client";

import { useProductMsds } from "@/hooks/useProductMsds";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useProductMsds>;

const WORKFLOW_STATUS_LABEL: Record<string, string> = {
  draft: "승인대기",
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
  const approverState: StageState = s.approverConfirmedAt ? "done" : "current";

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>결재 진행 상태</div>
        <span className="v50-badge">{WORKFLOW_STATUS_LABEL[s.workflowStatus] || s.workflowStatus}</span>
      </div>
      {!s.editingId && <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>저장한 뒤 Approved By를 확정할 수 있습니다. 확정하면 본인이 등록한 서명 이미지가 문서에 삽입됩니다.</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StageCard title="Approved By" state={approverState} personName={s.approverName} confirmedAt={s.approverConfirmedAt} confirmedBy={s.approverConfirmedBy} onConfirm={s.confirmApprover} confirming={s.confirming} />
      </div>
    </div>
  );
}

function SectionCard({ s, sectionNo }: { s: S; sectionNo: number }) {
  const section = s.sections.find((sec) => sec.no === sectionNo);
  if (!section) return null;
  return (
    <div className="v50-card" style={{ padding: 12, marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
        {section.no}. {section.title}
      </div>

      {section.introNote !== undefined && (
        <label style={{ display: "grid", gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>도입 설명</span>
          <textarea
            className="v50-textarea" rows={2} style={{ fontSize: 12, lineHeight: 1.5 }}
            value={section.introNote || ""}
            onChange={(e) => s.updateSectionNote(section.no, "introNote", e.target.value)}
          />
        </label>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        {section.rows.map((row, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input
              className="v50-input" value={row.label} placeholder="항목명"
              style={{ maxWidth: 190, fontWeight: 700, fontSize: 12.5 }}
              onChange={(e) => s.updateSectionRow(section.no, idx, { label: e.target.value })}
            />
            <textarea
              className="v50-textarea" rows={2} style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, minHeight: 40 }}
              value={row.value}
              onChange={(e) => s.updateSectionRow(section.no, idx, { value: e.target.value })}
            />
            <button className="v50-button-light" style={{ fontSize: 11, padding: "2px 8px", color: "#dc2626" }} onClick={() => s.removeSectionRow(section.no, idx)}>삭제</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="v50-button-light" style={{ fontSize: 12 }} onClick={() => s.addSectionRow(section.no)}>+ 항목 추가</button>
      </div>

      {section.outroNote !== undefined && (
        <label style={{ display: "grid", gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>마무리 설명</span>
          <textarea
            className="v50-textarea" rows={2} style={{ fontSize: 12, lineHeight: 1.5 }}
            value={section.outroNote || ""}
            onChange={(e) => s.updateSectionNote(section.no, "outroNote", e.target.value)}
          />
        </label>
      )}
    </div>
  );
}

function MsdsForm({ s }: { s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
        {s.editingId ? "MSDS 수정" : "새 제품 MSDS"}
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

      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 14, marginBottom: 4 }}>1. Identification</div>
      <div className="v50-grid-2">
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          <span>문서번호 <span style={{ fontWeight: 400, fontSize: 11, color: "#94a3b8" }}>(예: QA-MSDS-26P5065)</span></span>
          <input className="v50-input" value={s.docNo} onChange={(e) => s.setDocNo(e.target.value)} placeholder="예: QA-MSDS-26P5065" />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Name (제품명)<input className="v50-input" value={s.productName} onChange={(e) => s.setProductName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Code (제품코드)<input className="v50-input" value={s.productCode} onChange={(e) => s.setProductCode(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Product Type (제품유형)<input className="v50-input" value={s.productType} onChange={(e) => s.setProductType(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Revision<input className="v50-input" value={s.revision} onChange={(e) => s.setRevision(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, gridColumn: "1 / -1" }}>Manufacturer (제조사)<input className="v50-input" value={s.manufacturer} onChange={(e) => s.setManufacturer(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, gridColumn: "1 / -1" }}>Address (주소)<input className="v50-input" value={s.address} onChange={(e) => s.setAddress(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Tel / Emergency<input className="v50-input" value={s.telEmergency} onChange={(e) => s.setTelEmergency(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Approved By (승인)<input className="v50-input" value={s.approverName} onChange={(e) => s.setApproverName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Issue Date (발행일)<input className="v50-input" type="date" value={s.issueDate} onChange={(e) => s.setIssueDate(e.target.value)} /></label>
      </div>

      <ApprovalWorkflow s={s} />

      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 18, marginBottom: 4, borderTop: "2px solid #dbe3ef", paddingTop: 12 }}>
        2~16. 세부 섹션
      </div>
      {s.sections.map((section) => (
        <SectionCard key={section.no} s={s} sectionNo={section.no} />
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="v50-button" onClick={s.saveMsds} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
        <button className="v50-button-light" onClick={s.downloadCurrentExcel}>엑셀 다운로드</button>
        <button className="v50-button-light" onClick={s.downloadCurrentHtml}>HTML 다운로드</button>
        <button className="v50-button-light" onClick={s.closeForm}>목록으로</button>
      </div>
    </div>
  );
}

export default function ProductMsdsPanel() {
  const s = useProductMsds();

  if (s.showForm) {
    return (
      <div>
        {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}
        <MsdsForm s={s} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <input
          className="v50-input" value={s.listKeyword} onChange={(e) => s.setListKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.reloadList()}
          placeholder="제품명/제품코드 검색" style={{ maxWidth: 240 }}
        />
        <button className="v50-button-light" onClick={s.reloadList}>검색</button>
        <div style={{ flex: 1 }} />
        <button className="v50-button" onClick={s.openNewMsds}>+ 제품 MSDS 작성</button>
      </div>

      {s.message && <div style={{ marginBottom: 8, color: "#2563eb", fontSize: 13 }}>{s.message}</div>}

      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead>
            <tr><th>문서번호</th><th>Product Name</th><th>Product Code</th><th>결재상태</th><th>작성일</th><th></th></tr>
          </thead>
          <tbody>
            {s.listLoading && <tr><td colSpan={6} style={{ color: "#94a3b8" }}>불러오는 중…</td></tr>}
            {!s.listLoading && s.list.length === 0 && <tr><td colSpan={6} style={{ color: "#94a3b8" }}>등록된 MSDS가 없습니다.</td></tr>}
            {s.list.map((msds) => (
              <tr key={msds.id}>
                <td>{msds.doc_no || "-"}</td>
                <td>{msds.product_name || "-"}</td>
                <td>{msds.product_code || "-"}</td>
                <td><span className="v50-badge">{WORKFLOW_STATUS_LABEL[msds.workflow_status || "draft"]}</span></td>
                <td>{msds.created_at ? msds.created_at.slice(0, 10) : "-"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="v50-button-light" onClick={() => msds.id && s.openExistingMsds(msds.id)}>열기</button>
                  <button className="v50-button-light" onClick={() => msds.id && s.removeMsds(msds.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
