"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSprint1FormulaCore } from "@/hooks/useSprint1FormulaCore";
import type { RegulationHit } from "@/services/sprint2/regulationEngineService";
import Toast, { type ToastState } from "@/components/common/Toast";
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
  const [anchorPos, setAnchorPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleSaveClick() {
    const result = await s.saveFormula();
    if (!result) return; // 사용자가 BANNED 확인창에서 취소한 경우 - 토스트 없음
    setToast({ type: result.ok ? "success" : "error", text: result.ok ? "저장되었습니다" : `저장 실패: ${result.message}` });
  }

  useEffect(() => {
    if (s.activeRawRow == null) {
      setAnchorPos(null);
      return;
    }
    const el = rawInputRefs.current[s.activeRawRow];
    if (!el) {
      setAnchorPos(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const estimatedHeight = Math.min(s.rawHits.length * 40 + 8, 240);
    const spaceBelow = window.innerHeight - r.bottom;
    // 아래쪽 공간이 부족하고 위쪽 공간이 더 넓으면 입력창 위로 뒤집어서 연다
    if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
      setAnchorPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
    } else {
      setAnchorPos({ left: r.left, width: r.width, top: r.bottom });
    }
  }, [s.activeRawRow, s.rawHits]);

  function updateFormula(key: string, value: any) {
    s.setFormula({ ...s.formula, [key]: value });
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">Sprint 1 처방관리 Core</h1>
          <p className="v50-desc">표준 plm_* DB 기반으로 처방 등록·수정·삭제, BOM 편집, 자동합계, 자동원가, 자동전성분을 먼저 완성합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={s.newFormula}>신규 처방</button>
          <button onClick={handleSaveClick} disabled={s.loading}>저장</button>
          <button onClick={s.removeFormula} disabled={!s.formula.formula_code || s.loading}>삭제</button>
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
        <h2>처방 목록</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
          <button className="v50-button" onClick={() => s.loadFormulas()}>검색</button>
        </div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>원가</th><th>열기</th></tr></thead>
            <tbody>
              {s.formulas.map((f) => (
                <tr key={`${f.formula_code}-${f.revision}`}>
                  <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td><td>{Number(f.estimated_cost_per_kg || 0).toLocaleString()}</td>
                  <td><button className="v50-button-light" onClick={() => s.openFormula(f)}>열기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>처방 기본정보</h2>
        <div className="v50-grid-2">
          <Input label="처방코드" value={s.formula.formula_code} onChange={(v) => updateFormula("formula_code", v)} />
          <Input label="Revision" value={s.formula.revision} onChange={(v) => updateFormula("revision", v)} />
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
        </div>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>컨셉/클레임
          <textarea className="v50-textarea" value={s.formula.claim || ""} onChange={(e) => updateFormula("claim", e.target.value)} />
        </label>
      </section>

      <section className="v50-panel">
        <h2>자동 전성분</h2>
        <p style={{ lineHeight: 1.8 }}>
          {(() => {
            const entries = [...s.lines]
              .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
              .map((line) => ({ line, name: line.inci_kr || line.inci_en || line.raw_name }))
              .filter((x) => x.name);
            if (entries.length === 0) return "BOM 원료를 추가하면 자동 생성됩니다.";
            return entries.map(({ line, name }, i) => {
              const worst = worstHit(s.lineWarnings[line.line_no] || []);
              const color = worst?.allowed_status === "BANNED" ? "#dc2626" : worst?.allowed_status === "LIMITED" ? "#b45309" : undefined;
              return (
                <span key={line.line_no} style={color ? { color, fontWeight: 700 } : undefined}>
                  {name}{i < entries.length - 1 ? ", " : ""}
                </span>
              );
            });
          })()}
        </p>
      </section>

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>BOM 편집</h2>
          <button className="v50-button-light" onClick={s.addLine}>+ 라인 추가</button>
        </div>
        <p style={{ color: "#64748b", fontSize: 13 }}>원료명 칸에 입력하면 검색 결과가 뜨고, 선택하면 INCI·단가가 자동으로 채워집니다. 최종 반영은 "저장" 버튼을 눌러야 합니다.</p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>함량%</th><th>단가</th><th>원가</th><th>규제</th><th>삭제</th></tr></thead>
            <tbody>
              {s.lines.map((line) => (
                <tr key={line.line_no}>
                  <td>{line.line_no}</td>
                  <td><input className="v50-input" style={{ width: 56 }} value={line.phase || "A"} onChange={(e) => s.updateLine(line.line_no, { phase: e.target.value })} /></td>
                  <td>{line.raw_code || "-"}</td>
                  <td>
                    <input className="v50-input" ref={(el) => { rawInputRefs.current[line.line_no] = el; }}
                      value={line.raw_name || ""} placeholder="원료명 검색"
                      onChange={(e) => s.searchRawForLine(line.line_no, e.target.value)} />
                    {s.activeRawRow === line.line_no && s.rawSearchLoading && (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
                    )}
                    {s.activeRawRow === line.line_no && s.rawHits.length > 0 && anchorPos &&
                      createPortal(<RawDropdown hits={s.rawHits} onPick={s.pickRawForLine} pos={anchorPos} />, document.body)}
                  </td>
                  <td><input className="v50-input" style={{ width: 72 }} type="number" step="0.0001" value={line.percentage ?? 0} onChange={(e) => s.updateLine(line.line_no, { percentage: e.target.value })} /></td>
                  <td>{Number(line.unit_price || 0).toLocaleString()}</td>
                  <td>{Number(line.cost_per_kg || 0).toLocaleString()}</td>
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
              ))}
              {s.lines.length === 0 && <tr><td colSpan={9}>"+ 라인 추가"로 원료 라인을 만들고 원료명을 검색하세요.</td></tr>}
            </tbody>
            {s.lines.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={4}>합계</td>
                  <td>{s.total}%</td>
                  <td></td>
                  <td>{s.cost.toLocaleString()}원</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
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
                  <td><input className="v50-input" value={row.material_name_1 || ""} onChange={(e) => s.updateProductionBomRow(i, { material_name_1: e.target.value })} /></td>
                  <td><input className="v50-input" value={row.material_name_2 || ""} onChange={(e) => s.updateProductionBomRow(i, { material_name_2: e.target.value })} /></td>
                  <td><input className="v50-input" value={row.material_name_3 || ""} onChange={(e) => s.updateProductionBomRow(i, { material_name_3: e.target.value })} /></td>
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
    </div>
  );
}

function RawDropdown({ hits, onPick, pos }: { hits: any[]; onPick: (raw: any) => void; pos: { left: number; width: number; top?: number; bottom?: number } }) {
  return (
    <div style={{
      position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflow: "auto", textAlign: "left",
    }}>
      {hits.map((raw) => (
        <div key={raw.raw_code} onClick={() => onPick(raw)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          <b>{raw.raw_name}</b> <span style={{ color: "#64748b" }}>{raw.trade_name || raw.inci_en || raw.inci_kr || "-"}</span>
          <span style={{ color: "#16a34a", marginLeft: 8 }}>{Number(raw.unit_price || 0).toLocaleString()}원/kg</span>
        </div>
      ))}
    </div>
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
