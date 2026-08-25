"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSprint1FormulaCore } from "@/hooks/useSprint1FormulaCore";
import { computeRawMaterialDiff, sortLinesForDisplay, type RawMaterialDiffField } from "@/services/sprint1/formulaCoreService";
import type { RegulationHit } from "@/services/sprint2/regulationEngineService";
import Toast, { type ToastState } from "@/components/common/Toast";
import SearchDropdown from "@/components/common/SearchDropdown";
import { useAnchorPosition } from "@/hooks/useAnchorPosition";
import "@/styles/enterprise-v50.css";

const DEVELOPMENT_TYPES = ["신제품", "리뉴얼", "OEM", "ODM"];
const PROGRESS_STATUSES = ["개발중", "컨펌", "생산완료", "보류"];

const STATUS_PRIORITY: Record<string, number> = { BANNED: 3, LIMITED: 2, REVIEW_REQUIRED: 1 };
const STATUS_LABEL: Record<string, string> = { BANNED: "금지", LIMITED: "제한", REVIEW_REQUIRED: "검토필요" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  BANNED: { bg: "#fee2e2", fg: "#dc2626" },
  LIMITED: { bg: "#fef3c7", fg: "#b45309" },
  REVIEW_REQUIRED: { bg: "#dbeafe", fg: "#1d4ed8" },
};

// 여러 국가에서 규제 대상이면 가장 심각한 것(금지 > 제한 > 검토필요) 기준으로 배지를 정한다
function worstHit(hits: RegulationHit[]): RegulationHit | null {
  let worst: RegulationHit | null = null;
  for (const h of hits) {
    if (!STATUS_PRIORITY[h.allowed_status]) continue;
    if (!worst || STATUS_PRIORITY[h.allowed_status] > STATUS_PRIORITY[worst.allowed_status]) worst = h;
  }
  return worst;
}

function buildTooltip(hits: RegulationHit[]) {
  return hits
    .map((h) => `${h.region}: ${STATUS_LABEL[h.allowed_status] || h.allowed_status}${h.max_percent != null ? ` (기준 ${h.max_percent}%)` : ""} - ${h.issue}`)
    .join("\n");
}

export default function FormulaCorePanel() {
  const s = useSprint1FormulaCore();
  const rawInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const materialInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const anchorPos = useAnchorPosition(s.activeRawRow, () => (s.activeRawRow != null ? rawInputRefs.current[s.activeRawRow] : null), s.rawHits);
  const activeMaterialKey = s.activeMaterialCell ? `${s.activeMaterialCell.rowIndex}-${s.activeMaterialCell.field}` : null;
  const materialAnchorPos = useAnchorPosition(activeMaterialKey, () => (activeMaterialKey ? materialInputRefs.current[activeMaterialKey] : null), s.materialHits);

  // "원료 정보 변경됨" 배지 클릭 시 뜨는 저장값 vs 최신값 비교 팝오버 - 자동 반영 없음, 확인만 가능
  const [diffPopover, setDiffPopover] = useState<{ lineNo: number; diffs: RawMaterialDiffField[] } | null>(null);
  const diffBadgeRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const diffAnchorPos = useAnchorPosition(
    diffPopover?.lineNo ?? null,
    () => (diffPopover ? diffBadgeRefs.current[diffPopover.lineNo] : null),
    diffPopover?.diffs ?? []
  );

  async function handleSaveClick() {
    const result = await s.saveFormula();
    if (!result) return; // 사용자가 BANNED 확인창에서 취소한 경우 - 토스트 없음
    setToast({ type: result.ok ? "success" : "error", text: result.ok ? "저장되었습니다" : `저장 실패: ${result.message}` });
  }

  // "새 Revision 생성" 인라인 입력 - 처방코드가 바뀔 때만 새 처방이 생기는 것과 동일한 원칙으로,
  // Revision은 이 흐름을 통해서만 새로 만들어지고 직접 수정 저장으로는 새 행이 생기지 않는다.
  const [showNewRevision, setShowNewRevision] = useState(false);
  const [newRevisionDraft, setNewRevisionDraft] = useState("");

  async function handleCreateRevision() {
    const result = await s.createNewRevision(newRevisionDraft);
    setToast({ type: result.ok ? "success" : "error", text: result.ok ? result.message : `Revision 생성 실패: ${result.message}` });
    if (result.ok) {
      setShowNewRevision(false);
      setNewRevisionDraft("");
    }
  }

  function updateFormula(key: string, value: any) {
    s.setFormula({ ...s.formula, [key]: value });
  }

  // BOM 표시 순서: Phase 오름차순 -> 그 안에서 phase_seq 오름차순(없으면 line_no로 대체).
  // s.lines 자체는 건드리지 않고(저장 로직/line_no와 무관), 화면 표시용으로만 정렬한다.
  const sortedLines = sortLinesForDisplay(s.lines);

  // 처방 목록: 처방코드 1개당 1행으로 묶어서 목록이 Revision마다 계속 쌓여 지저분해지는 것을 막는다.
  // s.formulas는 updated_at 내림차순으로 오므로, 각 처방코드의 revisions 배열도 최신순이다.
  // 단, 확정코드가 부여된 Revision은 처방코드가 같아도 서로 다른 개발 건(다른 고객/제품)일 수 있으므로
  // 한 그룹으로 묶지 않고 각각 독립된 행으로 노출한다 - 아직 확정되지 않은(확정코드 없는) Revision들만
  // 기존처럼 하나의 행에 모아서 Revision 선택 드롭다운으로 보여준다. 같은 처방코드 아래 여러 확정 건이
  // 생기는 패턴이 다시 나와도 이 규칙이 자동으로 분리해준다.
  const groupedFormulas = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const f of s.formulas) {
      const g = map.get(f.formula_code);
      if (g) g.push(f);
      else map.set(f.formula_code, [f]);
    }
    const rows: { key: string; rep: any; revisions: any[] }[] = [];
    for (const [code, revisions] of map.entries()) {
      const confirmedRevisions = revisions.filter((r) => r.confirmed_code);
      const draftRevisions = revisions.filter((r) => !r.confirmed_code);
      for (const r of confirmedRevisions) {
        rows.push({ key: `${code}::${r.revision}`, rep: r, revisions: [r] });
      }
      if (draftRevisions.length > 0) {
        rows.push({ key: `${code}::__DRAFT__`, rep: draftRevisions[0], revisions: draftRevisions });
      }
    }
    return rows;
  }, [s.formulas]);
  const [revisionPick, setRevisionPick] = useState<Record<string, string>>({});

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">처방관리</h1>
          <p className="v50-desc">처방을 등록·수정하고 BOM을 편집하면 합계·원가·전성분이 자동으로 계산됩니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={() => { setShowNewRevision(false); setNewRevisionDraft(""); s.newFormula(); }}>신규 처방</button>
          <button onClick={handleSaveClick} disabled={s.loading}>저장</button>
          <button onClick={s.removeFormula} disabled={!s.formula.formula_code || s.loading}>삭제</button>
          {/* 처방 목록이 길어져 스크롤이 길어지는 문제 대응 - 처방 기본정보 섹션으로 바로 이동 */}
          <a href="#formula-basic-info">처방 기본정보로 이동</a>
        </div>
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="총합" value={`${s.total}%`} hint={s.total === 100 ? "정상" : "100% 보정 필요"} />
        <Kpi label="예상원가" value={`${s.cost.toLocaleString()}원`} hint="kg 기준" />
        <Kpi label="원료수" value={`${s.lines.length}개`} hint="BOM Line" />
        <Kpi label="상태" value={s.formula.status || "DRAFT"} hint="처방 상태" />
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>처방 목록</h2>
          <button className="v50-button-light" onClick={() => s.loadFormulas()} disabled={s.loading}>
            {s.loading ? "새로고침 중…" : "새로고침"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사, 확정코드 검색" />
          <button className="v50-button" onClick={() => s.loadFormulas()}>검색</button>
        </div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>확정코드</th><th>처방명</th><th>담당 연구원</th><th>Revision</th><th>총합</th><th>원가</th><th>열기</th></tr></thead>
            <tbody>
              {groupedFormulas.map(({ key, rep, revisions }) => {
                const pickedRevision = revisionPick[key] ?? rep.revision;
                const pickedRow = revisions.find((r) => r.revision === pickedRevision) || rep;
                return (
                <tr key={key}>
                  <td>{rep.formula_code}</td><td>{rep.confirmed_code || "-"}</td><td>{rep.formula_name}</td>
                  {/* 담당 연구원은 처방 기본정보(assigned_researcher)에서 그대로 가져온다 - 현재 선택된
                      Revision 기준으로 보여준다(Revision마다 담당자가 다를 수 있음) */}
                  <td>{pickedRow.assigned_researcher || "-"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <select
                        className="v50-input"
                        style={{ width: "auto" }}
                        value={pickedRevision}
                        onChange={(e) => setRevisionPick((prev) => ({ ...prev, [key]: e.target.value }))}
                      >
                        {revisions.map((r) => <option key={r.revision} value={r.revision}>{r.revision}</option>)}
                      </select>
                      {revisions.length > 1 && <span style={{ color: "#64748b", fontSize: 12 }}>({revisions.length}개)</span>}
                    </div>
                  </td>
                  <td>{pickedRow.total_percent}%</td><td>{Number(pickedRow.estimated_cost_per_kg || 0).toLocaleString()}</td>
                  <td><button className="v50-button-light" onClick={() => { setShowNewRevision(false); setNewRevisionDraft(""); s.openFormula(pickedRow); }}>열기</button></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" id="formula-basic-info">
        <h2>처방 기본정보</h2>
        <div className="v50-grid-2">
          <Input label="처방코드" value={s.formula.formula_code} onChange={(v) => updateFormula("formula_code", v)} />
          <Input label="확정코드" value={s.formula.confirmed_code} onChange={(v) => updateFormula("confirmed_code", v)} />
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            Revision
            {s.selected ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input className="v50-input" value={s.formula.revision || ""} disabled style={{ background: "#f1f5f9", color: "#64748b" }} />
                <button type="button" className="v50-button-light" onClick={() => setShowNewRevision((v) => !v)}>새 Revision 생성</button>
              </div>
            ) : (
              <input className="v50-input" value={s.formula.revision || ""} onChange={(e) => updateFormula("revision", e.target.value)} />
            )}
          </label>
          <Input label="처방명" value={s.formula.formula_name} onChange={(v) => updateFormula("formula_name", v)} />
          <Input label="제품유형" value={s.formula.product_type} onChange={(v) => updateFormula("product_type", v)} />
          <Input label="고객사" value={s.formula.customer} onChange={(v) => updateFormula("customer", v)} />
          <Input label="담당 연구원" value={s.formula.assigned_researcher} onChange={(v) => updateFormula("assigned_researcher", v)} />
          <Input label="출시국가" value={s.formula.target_country} onChange={(v) => updateFormula("target_country", v)} />
          <Select label="개발형태" value={s.formula.development_type} options={DEVELOPMENT_TYPES} onChange={(v) => updateFormula("development_type", v)} placeholder="선택 안 함" />
          <Select label="진행상태" value={s.formula.progress_status} options={PROGRESS_STATUSES} onChange={(v) => updateFormula("progress_status", v)} />
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            제품 사용유형
            <select className="v50-input" value={s.formula.exposure_type || ""} onChange={(e) => updateFormula("exposure_type", e.target.value)}>
              <option value="">선택 안 함</option>
              <option value="LEAVE_ON">Leave-on</option>
              <option value="RINSE_OFF">Rinse-off</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            대상 시장
            <select className="v50-input" value={s.formula.target_market || ""} onChange={(e) => updateFormula("target_market", e.target.value)}>
              <option value="">선택 안 함 (기본 KR)</option>
              <option value="KR">한국</option>
              <option value="EU">EU</option>
              <option value="UK">영국</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            실측 수분율(%) (건조 후 전성분 계산용)
            <input className="v50-input" type="number" value={s.formula.measured_moisture_percent ?? ""}
              onChange={(e) => updateFormula("measured_moisture_percent", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>
        {showNewRevision && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, padding: 10, background: "#eff6ff", borderRadius: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>새 Revision 값</span>
            <input className="v50-input" style={{ maxWidth: 200 }} placeholder="예: V2" value={newRevisionDraft} onChange={(e) => setNewRevisionDraft(e.target.value)} />
            <button className="v50-button" onClick={handleCreateRevision} disabled={s.loading}>생성</button>
            <button className="v50-button-light" onClick={() => { setShowNewRevision(false); setNewRevisionDraft(""); }}>취소</button>
            <span style={{ color: "#64748b", fontSize: 12 }}>현재 화면의 처방 정보와 BOM을 그대로 복사해 새 Revision으로 저장합니다.</span>
          </div>
        )}
        <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>컨셉/클레임
          <textarea className="v50-textarea" value={s.formula.claim || ""} onChange={(e) => updateFormula("claim", e.target.value)} />
        </label>
      </section>

      <section className="v50-panel">
        <h2>자동 전성분</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: -8, marginBottom: 10 }}>
          복합원료(premix)는 구성성분으로 전개하고, 동일 INCI는 합산하여 함량 내림차순으로 표시합니다. (문서관리 전성분표와 동일한 로직)
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button className={s.inciBasis === "MIX" ? "v50-button" : "v50-button-light"} onClick={() => s.setInciBasis("MIX")}>원처방</button>
          <button className={s.inciBasis === "DRY" ? "v50-button" : "v50-button-light"} onClick={() => s.setInciBasis("DRY")}>공개처방</button>
        </div>
        {s.dryInciError && <p style={{ color: "#b45309", fontWeight: 700 }}>{s.dryInciError}</p>}
        <p style={{ lineHeight: 1.8 }}>
          {(() => {
            if (s.dryInciError) return null;
            const entries = s.mergedInciRows.filter((row) => row.inci_kr || row.inci_en);
            if (entries.length === 0) return "BOM 원료를 추가하면 자동 생성됩니다.";
            return entries.map((row, i) => {
              const name = row.inci_kr || row.inci_en;
              const hits = (row.sourceLineNos || []).flatMap((ln) => s.lineWarnings[ln] || []);
              const worst = worstHit(hits);
              const color = worst?.allowed_status === "BANNED" ? "#dc2626" : worst?.allowed_status === "LIMITED" ? "#b45309" : undefined;
              return (
                <span key={`${row.inci_en}|${row.inci_kr}|${row.cas_no}|${i}`} style={color ? { color, fontWeight: 700 } : undefined}>
                  {name}{i < entries.length - 1 ? ", " : ""}
                </span>
              );
            });
          })()}
        </p>
      </section>

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0 }}>BOM 편집</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: Math.abs(s.total - 100) < 0.01 ? "#16a34a" : "#dc2626" }}>
              합계 {s.total}%
            </span>
            {s.waterLine && s.waterFillPercentage != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "#eff6ff", padding: "4px 8px", borderRadius: 8 }}>
                <span style={{ color: "#1d4ed8" }}>
                  정제수 to 100: <b>{s.waterFillPercentage}%</b>
                </span>
                <button type="button" className="v50-button-light" style={{ padding: "2px 8px", fontSize: 11 }}
                  onClick={s.applyWaterFillPercentage} title="정제수 라인 함량을 이 값으로 채웁니다">
                  적용
                </button>
              </span>
            )}
            <button className="v50-button-light" onClick={s.addLine}>+ 라인 추가</button>
          </div>
        </div>
        <p style={{ color: "#64748b", fontSize: 13 }}>원료명 칸에 입력하면 검색 결과가 뜨고, 선택하면 INCI·단가가 자동으로 채워집니다. 최종 반영은 "저장" 버튼을 눌러야 합니다.</p>
        <div className="v50-table-wrap">
          <table className="v50-table bom-lines-table">
            <colgroup>
              <col className="col-no" /><col className="col-phase" /><col className="col-seq" />
              <col className="col-rawcode" /><col className="col-rawname" /><col className="col-percent" />
              <col className="col-price" /><col className="col-cost" /><col className="col-moq" /><col className="col-reg" /><col className="col-del" />
            </colgroup>
            <thead><tr><th>No</th><th>Phase</th><th>순번</th><th>원료코드</th><th>원료명</th><th>함량%</th><th>단가</th><th>원가</th><th>MOQ</th><th>규제</th><th>삭제</th></tr></thead>
            <tbody>
              {sortedLines.map((line, idx) => {
                const phase = line.phase || "A";
                const isFirstInPhase = idx === 0 || (sortedLines[idx - 1].phase || "A") !== phase;
                const isLastInPhase = idx === sortedLines.length - 1 || (sortedLines[idx + 1].phase || "A") !== phase;
                return (
                <tr key={line.line_no}>
                  <td>{line.line_no}</td>
                  <td><input className="v50-input" style={{ width: 56 }} value={line.phase || "A"} onChange={(e) => s.updateLine(line.line_no, { phase: e.target.value })} /></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#64748b", minWidth: 14, textAlign: "center" }}>{line.phase_seq ?? "-"}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <button type="button" className="v50-button-light" style={{ padding: "0 5px", fontSize: 10, lineHeight: "14px" }}
                          disabled={isFirstInPhase} onClick={() => s.moveLinePhaseSeq(line.line_no, "up")}>▲</button>
                        <button type="button" className="v50-button-light" style={{ padding: "0 5px", fontSize: 10, lineHeight: "14px" }}
                          disabled={isLastInPhase} onClick={() => s.moveLinePhaseSeq(line.line_no, "down")}>▼</button>
                      </div>
                    </div>
                  </td>
                  <td>{line.raw_code || "-"}</td>
                  <td>
                    {(() => {
                      const latest = line.raw_code ? s.latestRawDataMap.get(line.raw_code) : undefined;
                      const diffs = computeRawMaterialDiff(line, latest);
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input className="v50-input" ref={(el) => { rawInputRefs.current[line.line_no] = el; }}
                            value={line.raw_name || ""} placeholder="원료명 검색"
                            onChange={(e) => s.searchRawForLine(line.line_no, e.target.value)}
                            style={{ flex: 1, ...(latest?.is_caution ? { color: "#dc2626", fontWeight: 700 } : undefined) }}
                            title={latest?.is_caution ? (latest.caution_note || "주의 원료") : undefined} />
                          {diffs.length > 0 && (
                            <button
                              type="button"
                              ref={(el) => { diffBadgeRefs.current[line.line_no] = el; }}
                              onClick={() => setDiffPopover({ lineNo: line.line_no, diffs })}
                              title={`원료 정보 변경됨: ${diffs.map((d) => d.label).join(", ")}`}
                              style={{
                                border: "none", background: "#fef3c7", color: "#d97706", fontWeight: 700,
                                fontSize: 11, borderRadius: 6, padding: "3px 6px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                              }}
                            >
                              ⚠ 원료 정보 변경됨
                            </button>
                          )}
                        </div>
                      );
                    })()}
                    {s.activeRawRow === line.line_no && s.rawSearchLoading && (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
                    )}
                    {s.activeRawRow === line.line_no && s.rawHits.length > 0 && anchorPos &&
                      createPortal(
                        <SearchDropdown
                          hits={s.rawHits}
                          onPick={s.pickRawForLine}
                          pos={anchorPos}
                          keyExtractor={(raw: any) => raw.raw_code}
                          renderItem={(raw: any) => (
                            <div title={raw.is_caution ? (raw.caution_note || "주의 원료") : undefined}>
                              <b style={raw.is_caution ? { color: "#dc2626" } : undefined}>{raw.raw_name}{raw.is_caution && " ⚠"}</b>{" "}
                              <span style={{ color: "#64748b" }}>{raw.trade_name || raw.inci_en || raw.inci_kr || "-"}</span>
                              <span style={{ color: "#16a34a", marginLeft: 8 }}>{Number(raw.unit_price || 0).toLocaleString()}원/kg</span>
                            </div>
                          )}
                        />,
                        document.body
                      )}
                    {/* 복합원료(구성성분이 등록된 원료)를 선택하면 그 안의 전성분을 텍스트로 바로 보여준다 -
                        문서를 따로 열지 않아도 BOM 편집 화면에서 바로 내용물을 확인할 수 있게 하기 위함. */}
                    {line.raw_code && (() => {
                      const comps = s.rawComponentsMap.get(line.raw_code) || [];
                      if (comps.length === 0) return null;
                      const text = [...comps]
                        .sort((a, b) => Number(b.composition_percent || 0) - Number(a.composition_percent || 0))
                        .map((c) => {
                          const name = c.inci_kr || c.inci_en || c.component_name_kr || c.component_name_en || "";
                          if (!name) return null;
                          const pct = c.composition_percent != null && c.composition_percent !== "" ? `${Number(c.composition_percent)}%` : "";
                          return pct ? `${name}(${pct})` : name;
                        })
                        .filter(Boolean)
                        .join(", ");
                      return text ? (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                          전성분: {text}
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td><input className="v50-input bom-percent-input" style={{ width: 96 }} type="number" step="0.0001" value={line.percentage ?? 0} onChange={(e) => s.updateLine(line.line_no, { percentage: e.target.value })} /></td>
                  <td>{Number(line.unit_price || 0).toLocaleString()}</td>
                  <td>{Number(line.cost_per_kg || 0).toLocaleString()}</td>
                  <td>{line.moq || "-"}</td>
                  <td>
                    {(() => {
                      const hits = s.lineWarnings[line.line_no] || [];
                      const worst = worstHit(hits);
                      if (!worst) return null;
                      const color = STATUS_COLOR[worst.allowed_status];
                      return (
                        <span title={buildTooltip(hits)} style={{
                          display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          background: color.bg, color: color.fg, whiteSpace: "nowrap", cursor: "default",
                        }}>
                          {STATUS_LABEL[worst.allowed_status]}
                        </span>
                      );
                    })()}
                  </td>
                  <td><button className="v50-button-light" onClick={() => s.removeLine(line.line_no)}>삭제</button></td>
                </tr>
                );
              })}
              {s.lines.length === 0 && <tr><td colSpan={11}>"+ 라인 추가"로 원료 라인을 만들고 원료명을 검색하세요.</td></tr>}
            </tbody>
            {s.lines.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={5}>합계</td>
                  <td>{s.total}%</td>
                  <td></td>
                  <td>{s.cost.toLocaleString()}원</td>
                  <td></td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="v50-button" onClick={handleSaveClick} disabled={s.loading}>저장</button>
        </div>
      </section>

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>생산 BOM 전개</h2>
          <button className="v50-button-light" onClick={s.addProductionBomRow}>+ 행 추가</button>
        </div>
        <p style={{ color: "#64748b", fontSize: 13 }}>현재 열려있는 처방({s.formula.formula_code || "-"} / {s.formula.revision || "-"})에 자동으로 연결되어 저장됩니다.</p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>코드</th><th>제품명</th><th>부자재명1</th><th>부자재명2</th><th>부자재명3</th><th>성형</th><th>비고</th><th>삭제</th></tr></thead>
            <tbody>
              {s.productionBomRows.map((row, i) => (
                <tr key={row.id || i}>
                  <td><input className="v50-input" value={row.production_code || ""} onChange={(e) => s.updateProductionBomRow(i, { production_code: e.target.value })} /></td>
                  <td><input className="v50-input" value={row.product_name || ""} onChange={(e) => s.updateProductionBomRow(i, { product_name: e.target.value })} /></td>
                  {(["material_name_1", "material_name_2", "material_name_3"] as const).map((field) => (
                    <MaterialCell
                      key={field}
                      rowIndex={i}
                      field={field}
                      row={row}
                      s={s}
                      inputRefs={materialInputRefs}
                      activeMaterialKey={activeMaterialKey}
                      materialAnchorPos={materialAnchorPos}
                    />
                  ))}
                  <td><input className="v50-input" value={row.molding_type || ""} onChange={(e) => s.updateProductionBomRow(i, { molding_type: e.target.value })} /></td>
                  <td><input className="v50-input" value={row.remarks || ""} onChange={(e) => s.updateProductionBomRow(i, { remarks: e.target.value })} /></td>
                  <td><button className="v50-button-light" onClick={() => s.removeProductionBomRow(i)}>삭제</button></td>
                </tr>
              ))}
              {s.productionBomRows.length === 0 && <tr><td colSpan={8}>"+ 행 추가"로 생산 BOM 행을 추가하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {diffPopover && diffAnchorPos &&
        createPortal(
          <RawMaterialDiffPopover diffs={diffPopover.diffs} pos={diffAnchorPos} onClose={() => setDiffPopover(null)} />,
          document.body
        )}
    </div>
  );
}

// "원료 정보 변경됨" 배지 클릭 시 뜨는 저장값 vs 최신값 비교 팝오버. 자동 반영 버튼 없음 - 확인만 가능.
function RawMaterialDiffPopover({
  diffs, pos, onClose,
}: {
  diffs: RawMaterialDiffField[];
  pos: { left: number; width: number; top?: number; bottom?: number };
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", zIndex: 1000, left: pos.left, width: Math.max(pos.width, 340), top: pos.top, bottom: pos.bottom,
        background: "white", border: "1px solid #cbd5e1", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.16)", padding: 14,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, color: "#d97706" }}>⚠ 원료 정보 변경됨</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>항목</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>저장값</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>최신값</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map((d) => (
            <tr key={d.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "4px 6px", fontWeight: 700 }}>{d.label}</td>
              <td style={{ padding: "4px 6px", color: "#64748b" }}>{d.saved}</td>
              <td style={{ padding: "4px 6px", color: "#d97706", fontWeight: 700 }}>{d.latest}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: "right", marginTop: 10 }}>
        <button type="button" className="v50-button-light" onClick={onClose}>확인</button>
      </div>
    </div>
  );
}

type MaterialSlot = "material_name_1" | "material_name_2" | "material_name_3";
const MATERIAL_CODE_FIELD: Record<MaterialSlot, "material_code_1" | "material_code_2" | "material_code_3"> = {
  material_name_1: "material_code_1",
  material_name_2: "material_code_2",
  material_name_3: "material_code_3",
};

// 생산 BOM 전개의 부자재명1/2/3 칸 - 원료명 검색과 동일한 자동완성 패턴(SearchDropdown 재사용) +
// 선택된 부자재의 명칭·규격·공급사를 입력칸 바로 아래에 작게 표시.
function MaterialCell({
  rowIndex, field, row, s, inputRefs, activeMaterialKey, materialAnchorPos,
}: {
  rowIndex: number;
  field: MaterialSlot;
  row: any;
  s: ReturnType<typeof useSprint1FormulaCore>;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  activeMaterialKey: string | null;
  materialAnchorPos: { left: number; width: number; top?: number; bottom?: number } | null;
}) {
  const key = `${rowIndex}-${field}`;
  const isActive = activeMaterialKey === key;
  const code = row[MATERIAL_CODE_FIELD[field]] as string | undefined;
  const info = code ? s.materialsByCode.get(code) : undefined;

  return (
    <td>
      <input className="v50-input" ref={(el) => { inputRefs.current[key] = el; }}
        value={row[field] || ""} placeholder="부자재 검색"
        onChange={(e) => s.searchMaterialForBomCell(rowIndex, field, e.target.value)} />
      {isActive && s.materialSearchLoading && (
        <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
      )}
      {isActive && s.materialHits.length > 0 && materialAnchorPos &&
        createPortal(
          <SearchDropdown
            hits={s.materialHits}
            onPick={s.pickMaterialForBomCell}
            pos={materialAnchorPos}
            keyExtractor={(m: any) => m.material_code}
            renderItem={(m: any) => (
              <>
                <b>{m.material_code}</b> {m.material_name}
                {m.spec && <span style={{ color: "#64748b", marginLeft: 8 }}>{m.spec}</span>}
              </>
            )}
          />,
          document.body
        )}
      {info && (
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {info.material_name}{info.spec ? ` · ${info.spec}` : ""}{info.supplier ? ` · ${info.supplier}` : ""}
        </div>
      )}
    </td>
  );
}

function Input({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>{label}<input className="v50-input" value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange, placeholder }: { label: string; value?: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
      {label}
      <select className="v50-input" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
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
