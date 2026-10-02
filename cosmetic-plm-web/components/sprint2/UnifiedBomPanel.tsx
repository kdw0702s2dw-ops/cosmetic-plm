"use client";

import { useUnifiedBomView } from "@/hooks/useUnifiedBomView";
import "@/styles/enterprise-v50.css";

function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 통합 BOM(조회 전용) - 처방 하나에 대해 원료 BOM/부자재(생산 BOM 전개)/필름·원단·칼선(연구_불용성·
// 수용성 HG 최신 계산서) 을 한 화면에 모아 보여준다. 입력/수정은 각자의 원래 화면(처방관리/생산관리)
// 에서 그대로 하고, 이 화면은 "누구나 한눈에 확인"하는 용도이므로 수정 버튼은 없다.
export default function UnifiedBomPanel() {
  const s = useUnifiedBomView();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">통합 BOM</h1>
          <p className="v50-desc">
            처방 하나를 고르면 원료 BOM, 부자재(생산 BOM 전개), 필름·원단·칼선 정보를 한 화면에 모아 보여줍니다.
            입력/수정은 처방관리·생산관리 화면에서 그대로 진행하세요.
          </p>
        </div>
      </section>

      {s.message && <p style={{ color: "#dc2626", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
          <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
        </div>
        {s.formula ? (
          <p style={{ color: "#16a34a", fontWeight: 800 }}>
            선택됨: {s.formula.formula_code} · {s.formula.formula_name} · Rev {s.formula.revision} · 확정코드 {s.formula.confirmed_code || "-"} · 고객사 {s.formula.customer || "-"} · 담당 연구원 {s.formula.assigned_researcher || "-"} · 진행상태 {s.formula.progress_status || "-"}
          </p>
        ) : (
          <p style={{ color: "#94a3b8" }}>처방을 검색해서 선택하세요.</p>
        )}
        {s.formulas.length > 0 && (
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th>고객사</th><th></th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td><td>{f.customer || "-"}</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {s.loading && <p style={{ color: "#2563eb", fontWeight: 800 }}>조회 중…</p>}

      {s.formula && !s.loading && (
        <>
          <section className="v50-panel" style={{ marginBottom: 18 }}>
            <h2>원료 BOM</h2>
            {s.rawLines.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>등록된 원료 BOM이 없습니다.</p>
            ) : (
              <div className="v50-table-wrap">
                <table className="v50-table">
                  <thead><tr><th>Phase</th><th>원료코드</th><th>원료명</th><th>함량(%)</th></tr></thead>
                  <tbody>
                    {s.rawLines.map((line) => (
                      <tr key={line.id || `${line.line_no}`}>
                        <td>{line.phase || "-"}</td><td>{line.raw_code || "-"}</td><td>{line.raw_name || "-"}</td><td>{line.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="v50-panel" style={{ marginBottom: 18 }}>
            <h2>부자재 (생산 BOM 전개)</h2>
            <p style={{ color: "#64748b", fontSize: 13 }}>단상자·파우치·스티커 등 - 처방관리의 &quot;생산 BOM 전개&quot; 표와 동일한 데이터입니다.</p>
            {s.productionBomRows.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>등록된 생산 BOM 전개가 없습니다.</p>
            ) : (
              <div className="v50-table-wrap">
                <table className="v50-table">
                  <thead><tr><th>생산코드</th><th>제품명</th><th>부자재명1</th><th>부자재명2</th><th>부자재명3</th><th>성형방식</th><th>비고</th></tr></thead>
                  <tbody>
                    {s.productionBomRows.map((row) => (
                      <tr key={row.id || row.production_code}>
                        <td>{row.production_code || "-"}</td><td>{row.product_name || "-"}</td>
                        <td>{row.material_name_1 || "-"}</td><td>{row.material_name_2 || "-"}</td><td>{row.material_name_3 || "-"}</td>
                        <td>{row.molding_type || "-"}</td><td>{row.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="v50-panel" style={{ marginBottom: 18 }}>
            <h2>필름·원단·칼선</h2>
            <p style={{ color: "#64748b", fontSize: 13 }}>
              연구_불용성 HG / 연구_수용성 HG 화면에서 가장 최근에 저장한 계산서 1건 기준입니다. 계산 과정은 생산관리 &gt; 해당 화면에서 확인하세요.
            </p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>연구_불용성 HG 최신 저장분</div>
              {s.latestInsoluble ? (
                <div className="v50-table-wrap">
                  <table className="v50-table">
                    <thead><tr><th>원단 관리기준</th><th>필름 관리기준</th><th>칼선(No.)</th><th>저장일시</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>{s.latestInsoluble.fabric_material_code || "-"}{s.materialName(s.latestInsoluble.fabric_material_code) ? ` (${s.materialName(s.latestInsoluble.fabric_material_code)})` : ""}</td>
                        <td>{s.latestInsoluble.film_material_code || "-"}{s.materialName(s.latestInsoluble.film_material_code) ? ` (${s.materialName(s.latestInsoluble.film_material_code)})` : ""}</td>
                        <td>{s.latestInsoluble.cutting_line_no || "-"}</td>
                        <td>{fmtDate(s.latestInsoluble.created_at)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>저장된 연구_불용성 HG 계산서가 없습니다.</p>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>연구_수용성 HG 최신 저장분</div>
              {s.latestSoluble ? (
                <div className="v50-table-wrap">
                  <table className="v50-table">
                    <thead><tr><th>관리기준1 (필름1)</th><th>관리기준2 (원단)</th><th>관리기준3 (필름2)</th><th>칼선(No.)</th><th>저장일시</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>{s.latestSoluble.component1_raw_code || "-"}{s.materialName(s.latestSoluble.component1_raw_code) ? ` (${s.materialName(s.latestSoluble.component1_raw_code)})` : ""}</td>
                        <td>{s.latestSoluble.component2_raw_code || "-"}{s.materialName(s.latestSoluble.component2_raw_code) ? ` (${s.materialName(s.latestSoluble.component2_raw_code)})` : ""}</td>
                        <td>{s.latestSoluble.component3_raw_code || "-"}{s.materialName(s.latestSoluble.component3_raw_code) ? ` (${s.materialName(s.latestSoluble.component3_raw_code)})` : ""}</td>
                        <td>{s.latestSoluble.cutting_line_no || "-"}</td>
                        <td>{fmtDate(s.latestSoluble.created_at)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>저장된 연구_수용성 HG 계산서가 없습니다.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
