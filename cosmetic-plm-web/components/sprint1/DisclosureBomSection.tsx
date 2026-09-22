"use client";

import type { DisclosureVariant } from "@/services/sprint2/formulaDisclosureService";
import { VARIANT_LABEL } from "@/services/sprint2/formulaDisclosureService";

// 공개처방(일반)/공개처방(건조) 전용 BOM 편집 - 원처방 BOM 편집(원료명 자동완성, 규제 배지, 순번
// 이동 등)과는 별개의 훨씬 단순한 화면이다. 원료코드/원료명/INCI/함량%만 손으로 입력·수정하고,
// "처방 불러오기"로 다른 처방(또는 원처방)에서 시작 BOM을 가져오는 것을 주된 작성 방법으로 삼는다.
// (v1 범위: 원료명 자동완성/실시간 규제판정은 원처방 전용 기능으로 남겨둠 - 공개처방은 원처방을
// 불러온 뒤 표시용으로 다듬는 용도이므로 원료 마스터 자동완성이 필수는 아니라고 판단)
type Line = {
  line_no: number;
  phase?: string;
  raw_code?: string;
  raw_name?: string;
  inci_kr?: string;
  inci_en?: string;
  percentage?: number | string;
};

export default function DisclosureBomSection({
  variant,
  lines,
  customized,
  loading,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onSave,
  onReset,
  onOpenLoadModal,
}: {
  variant: DisclosureVariant;
  lines: Line[] | null;
  customized: boolean;
  loading: boolean;
  onAddLine: () => void;
  onUpdateLine: (lineNo: number, patch: Partial<Line>) => void;
  onRemoveLine: (lineNo: number) => void;
  onSave: () => void;
  onReset: () => void;
  onOpenLoadModal: () => void;
}) {
  const rows = lines || [];
  const total = Number(rows.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const label = VARIANT_LABEL[variant];
  const fallbackHint = variant === "PUBLIC" ? "원처방과 동일" : "실측 수분율 기반 자동계산";

  return (
    <section className="v50-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>{label} BOM 편집</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: Math.abs(total - 100) < 0.01 ? "#16a34a" : "#dc2626" }}>
            합계 {total}%
          </span>
          <button type="button" className="v50-button-light" onClick={onOpenLoadModal}>처방 불러오기</button>
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
              <th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>INCI(국문)</th><th>INCI(영문)</th><th>함량%</th><th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line) => (
              <tr key={line.line_no}>
                <td>{line.line_no}</td>
                <td>
                  <input className="v50-input" style={{ width: 56 }} value={line.phase || "A"}
                    onChange={(e) => onUpdateLine(line.line_no, { phase: e.target.value })} />
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
                  <input className="v50-input" style={{ width: 96 }} type="number" step="0.0001" value={line.percentage ?? 0}
                    onChange={(e) => onUpdateLine(line.line_no, { percentage: Number(e.target.value) })} />
                </td>
                <td><button type="button" className="v50-button-light" onClick={() => onRemoveLine(line.line_no)}>삭제</button></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8}>"처방 불러오기" 또는 "+ 라인 추가"로 시작하세요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
