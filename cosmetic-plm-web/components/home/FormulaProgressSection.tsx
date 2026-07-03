"use client";

import { useFormulaProgress, FormulaProgressRow } from "@/hooks/useFormulaProgress";

const STAGES: FormulaProgressRow["current_stage"][] = [
  "처방등록",
  "견본제작",
  "샘플발송",
  "추가요청",
  "컨펌완료",
];

function StageBar({ stage }: { stage: FormulaProgressRow["current_stage"] }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {STAGES.map((s, i) => (
        <div
          key={s}
          title={s}
          style={{
            width: 20,
            height: 6,
            borderRadius: 3,
            background: i <= idx ? "#2563eb" : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

export default function FormulaProgressSection() {
  const { data, loading, load } = useFormulaProgress();

  return (
    <article className="v50-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>처방 진행 현황 (컨펌 전) · {data.length}건</h2>
        <button className="v50-button-light" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>
      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead>
            <tr>
              <th>처방명</th>
              <th>담당 연구원</th>
              <th>고객사</th>
              <th>진행 단계</th>
              <th>문서 출력</th>
              <th>최근 업데이트</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={`${p.formula_code}-${p.revision}`}>
                <td>
                  <div>{p.formula_name ?? p.formula_code}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    {p.formula_code} / {p.revision}
                  </div>
                  {p.current_stage === "추가요청" && p.additional_request_note && (
                    <div style={{ color: "#d97706", fontSize: 12, marginTop: 2 }}>
                      ↳ {p.additional_request_note}
                    </div>
                  )}
                </td>
                <td>{p.researcher ?? "-"}</td>
                <td>{p.customer ?? "-"}</td>
                <td>
                  <StageBar stage={p.current_stage} />
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{p.current_stage}</div>
                </td>
                <td>
                  {p.document_issued ? (
                    <span style={{ color: "#059669", fontWeight: 700 }}>완료</span>
                  ) : (
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>미출력</span>
                  )}
                </td>
                <td style={{ color: "#64748b", fontSize: 12 }}>
                  {new Date(p.updated_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6}>진행 중인 처방이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
