"use client";

import type { DisclosureVariant, DisclosureLine } from "@/services/sprint2/formulaDisclosureService";
import { VARIANT_LABEL } from "@/services/sprint2/formulaDisclosureService";
import { sortLinesForDisplay, type Sprint1FormulaLine } from "@/services/sprint1/formulaCoreService";
import { evaluateLineAgainstRules, type RegulationHit } from "@/services/sprint2/regulationEngineService";
import { WATER_CAS_NO } from "@/services/sprint2/documentPdfService";

// 공개처방(일반)/공개처방(건조) 전용 BOM 편집 - 원처방 BOM 편집(components/sprint1/FormulaCorePanel.tsx의
// "BOM 편집" 섹션)과 화면 구성(컬럼/정렬/정제수 보정/합계 표시)을 동일하게 맞춘다. 다만 원료명 자동완성
// (검색 드롭다운)만은 v1 범위에서 제외한다 - 공개처방은 "처방 불러오기"로 시작 BOM을 가져온 뒤 다듬는
// 용도라 원료 마스터 자동완성이 필수는 아니라고 판단했고, 자동완성까지 필요하면 별도로 추가할 예정.
type Line = DisclosureLine;

const STATUS_PRIORITY: Record<string, number> = { BANNED: 3, LIMITED: 2, REVIEW_REQUIRED: 1 };
const STATUS_LABEL: Record<string, string> = { BANNED: "금지", LIMITED: "제한", REVIEW_REQUIRED: "검토필요" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  BANNED: { bg: "#fee2e2", fg: "#dc2626" },
  LIMITED: { bg: "#fef3c7", fg: "#b45309" },
  REVIEW_REQUIRED: { bg: "#dbeafe", fg: "#1d4ed8" },
};

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

export default function DisclosureBomSection({
  variant,
  lines,
  customized,
  loading,
  regulationRules,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onMoveLine,
  onSave,
  onReset,
  onOpenLoadModal,
}: {
  variant: DisclosureVariant;
  lines: Line[] | null;
  customized: boolean;
  loading: boolean;
  regulationRules: any[];
  onAddLine: () => void;
  onUpdateLine: (lineNo: number, patch: Partial<Line>) => void;
  onRemoveLine: (lineNo: number) => void;
  onMoveLine: (lineNo: number, direction: "up" | "down") => void;
  onSave: () => void;
  onReset: () => void;
  onOpenLoadModal: () => void;
}) {
  const rawRows = lines || [];
  // BOM 표시 순서를 원처방과 동일하게 Phase -> Phase 내 순번(phase_seq) 기준으로 정렬한다 - "처방
  // 불러오기"로 다른 처방을 불러왔을 때 순서가 뒤섞여 보이던 문제가 정렬을 안 하고 배열 순서 그대로
  // 그리던 게 원인이었음. sortLinesForDisplay()는 원처방 표에서 쓰는 것과 동일한 함수를 그대로 재사용
  // (정렬 기준이 두 화면에서 갈라지지 않게 하기 위함).
  const rows = sortLinesForDisplay(rawRows as unknown as Sprint1FormulaLine[]) as unknown as Line[];
  const total = Number(rows.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(rows.reduce((sum, x) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));
  const label = VARIANT_LABEL[variant];
  const fallbackHint = variant === "PUBLIC" ? "원처방과 동일" : "실측 수분율 기반 자동계산";

  // 정제수 to 100 자동 보정 - 원처방 BOM 편집과 동일한 계산(CAS 7732-18-5로 정제수 라인을 찾아
  // 나머지 합계를 100에서 뺀 값을 보여준다).
  const waterLine = rows.find((l) => (l.cas_no || "").trim() === WATER_CAS_NO) || null;
  const otherLinesTotal = waterLine ? Number((total - Number(waterLine.percentage || 0)).toFixed(4)) : null;
  const waterFillPercentage = waterLine != null && otherLinesTotal != null ? Number((100 - otherLinesTotal).toFixed(4)) : null;
  function applyWaterFillPercentage() {
    if (waterLine == null || waterFillPercentage == null || waterLine.line_no == null) return;
    onUpdateLine(waterLine.line_no, { percentage: waterFillPercentage });
  }

  return (
    <section className="v50-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>{label} BOM 편집</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: Math.abs(total - 100) < 0.01 ? "#16a34a" : "#dc2626" }}>
            합계 {total}%
          </span>
          <button type="button" className="v50-button-light" onClick={onOpenLoadModal}>처방 불러오기</button>
          {waterLine && waterFillPercentage != null && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "#eff6ff", padding: "4px 8px", borderRadius: 8 }}>
              <span style={{ color: "#1d4ed8" }}>
                정제수 to 100: <b>{waterFillPercentage}%</b>
              </span>
              <button type="button" className="v50-button-light" style={{ padding: "2px 8px", fontSize: 11 }}
                onClick={applyWaterFillPercentage} title="정제수 라인 함량을 이 값으로 채웁니다">
                적용
              </button>
            </span>
          )}
          {customized && (
            <button type="button" className="v50-button-light" onClick={onReset} disabled={loading}
              style={{ color: "#b45309" }} title={`저장된 별도 BOM을 지우고 ${fallbackHint} 값으로 되돌립니다`}>
              초기화
            </button>
          )}
          <button type="button" className="v50-button-light" onClick={onAddLine}>+ 라인 추가</button>
          <button type="button" className="v50-button" onClick={onSave} disabled={loading}>저장</button>
        </div>
      </div>

      <p style={{ fontSize: 13, marginTop: 4 }}>
        {customized ? (
          <span style={{ color: "#16a34a", fontWeight: 700 }}>
            별도로 저장된 BOM을 사용 중입니다 (원처방과 독립적으로 관리됨).
          </span>
        ) : (
          <span style={{ color: "#1d4ed8" }}>
            아직 별도로 저장한 적이 없어 {fallbackHint} 값을 보여주는 중입니다. 이대로 저장하면 그 시점부터 독립적으로 관리됩니다.
          </span>
        )}
      </p>

      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead>
            <tr>
              <th>No</th><th>Phase</th><th>순번</th><th>원료코드</th><th>원료명</th><th>INCI(국문)</th><th>INCI(영문)</th>
              <th>함량%</th><th>단가</th><th>원가</th><th>MOQ</th><th>신규</th><th>규제</th><th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line, idx) => {
              const phase = line.phase || "A";
              const isFirstInPhase = idx === 0 || (rows[idx - 1].phase || "A") !== phase;
              const isLastInPhase = idx === rows.length - 1 || (rows[idx + 1].phase || "A") !== phase;
              const hits = evaluateLineAgainstRules(line, regulationRules);
              const worst = worstHit(hits);
              const color = worst ? STATUS_COLOR[worst.allowed_status] : null;
              return (
                <tr key={line.line_no}>
                  <td>{line.line_no}</td>
                  <td>
                    <input className="v50-input" style={{ width: 56 }} value={line.phase || "A"}
                      onChange={(e) => onUpdateLine(line.line_no, { phase: e.target.value })} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#64748b", minWidth: 14, textAlign: "center" }}>{line.phase_seq ?? "-"}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <button type="button" className="v50-button-light" style={{ padding: "0 5px", fontSize: 10, lineHeight: "14px" }}
                          disabled={isFirstInPhase} onClick={() => onMoveLine(line.line_no, "up")}>▲</button>
                        <button type="button" className="v50-button-light" style={{ padding: "0 5px", fontSize: 10, lineHeight: "14px" }}
                          disabled={isLastInPhase} onClick={() => onMoveLine(line.line_no, "down")}>▼</button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <input className="v50-input" style={{ width: 110 }} value={line.raw_code || ""}
                      onChange={(e) => onUpdateLine(line.line_no, { raw_code: e.target.value })} />
                  </td>
                  <td>
                    <input className="v50-input" value={line.raw_name || ""}
                      onChange={(e) => onUpdateLine(line.line_no, { raw_name: e.target.value })} />
                  </td>
                  <td>
                    <input className="v50-input" value={line.inci_kr || ""}
                      onChange={(e) => onUpdateLine(line.line_no, { inci_kr: e.target.value })} />
                  </td>
                  <td>
                    <input className="v50-input" value={line.inci_en || ""}
                      onChange={(e) => onUpdateLine(line.line_no, { inci_en: e.target.value })} />
                  </td>
                  <td>
                    <input className="v50-input bom-percent-input" style={{ width: 96 }} type="number" step="0.0001" value={line.percentage ?? 0}
                      onChange={(e) => onUpdateLine(line.line_no, { percentage: e.target.value })} />
                  </td>
                  <td>
                    <input className="v50-input" style={{ width: 90 }} type="number" step="0.01" value={line.unit_price ?? 0}
                      onChange={(e) => onUpdateLine(line.line_no, { unit_price: Number(e.target.value) })} />
                  </td>
                  <td>{Number(line.cost_per_kg || 0).toLocaleString()}</td>
                  <td>
                    <input className="v50-input" style={{ width: 80 }} value={line.moq || ""}
                      onChange={(e) => onUpdateLine(line.line_no, { moq: e.target.value })} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!line.is_new_material}
                      onChange={(e) => onUpdateLine(line.line_no, { is_new_material: e.target.checked })}
                      title="원료발주가처방 생성 시 이 원료의 신규 체크가 자동으로 켜집니다"
                    />
                  </td>
                  <td>
                    {worst && color && (
                      <span title={buildTooltip(hits)} style={{
                        display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                        background: color.bg, color: color.fg, whiteSpace: "nowrap", cursor: "default",
                      }}>
                        {STATUS_LABEL[worst.allowed_status]}
                      </span>
                    )}
                  </td>
                  <td><button type="button" className="v50-button-light" onClick={() => onRemoveLine(line.line_no)}>삭제</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={14}>"처방 불러오기" 또는 "+ 라인 추가"로 시작하세요.</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                <td colSpan={7}>합계</td>
                <td>{total}%</td>
                <td></td>
                <td>{cost.toLocaleString()}원</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
