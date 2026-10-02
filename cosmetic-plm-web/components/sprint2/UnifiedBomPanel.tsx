"use client";

import { useUnifiedBomView } from "@/hooks/useUnifiedBomView";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { UNIFIED_BOM_LEVEL_OPTIONS } from "@/services/sprint2/unifiedBomRowsService";
import "@/styles/enterprise-v50.css";

function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 통합 BOM - 처방 하나를 고르면 ① 완제품→충전품→절단품→코팅품→처방→부자재를 한 표에 직접 입력하는
// 통합 BOM(No./내용/품번/품명/변경사항/규격 - 예전 "생산 BOM 전개"를 대체)과 ② 참고용 원료 BOM/필름·
// 원단·칼선 정보를 한 화면에 모아서 보여준다. ①은 전 직원이 열람하고 Admin/Researcher/Production은
// 직접 입력·수정도 가능(부자재/원료관리와 동일한 기준). ②는 각자의 원래 화면(처방관리/생산관리)에서
// 그대로 입력/수정하고 여기서는 참고만 한다.
export default function UnifiedBomPanel() {
  const s = useUnifiedBomView();
  const auth = useSprint1Auth();
  const canEdit = auth.canWriteProduction;

  return (
    <div className="v50-page">
      <datalist id="unified-bom-level-options">
        {UNIFIED_BOM_LEVEL_OPTIONS.map((opt) => <option key={opt} value={opt} />)}
      </datalist>

      <section className="v50-hero">
        <div>
          <h1 className="v50-title">통합 BOM</h1>
          <p className="v50-desc">
            처방 하나를 고르면 완제품 → 충전품 → 절단품 → 코팅품 → 처방 → 부자재로 이어지는 통합 BOM을
            직접 입력하고, 원료 BOM·필름·원단·칼선 정보를 함께 참고할 수 있습니다.
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>통합 BOM (완제품 → 충전품 → 절단품 → 코팅품 → 처방 → 부자재)</h2>
              {canEdit && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="v50-button-light" onClick={s.addBomRow}>+ 행 추가</button>
                  <button className="v50-button" onClick={s.saveBomRows} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
                </div>
              )}
            </div>
            <p style={{ color: "#64748b", fontSize: 13 }}>
              현재 열려있는 처방({s.formula.formula_code} / {s.formula.revision})에 자동으로 연결되어 저장됩니다.
              완제품·충전품·절단품·코팅품·처방·부자재를 모두 한 표에 순서대로 적으세요. 품번은 직접 입력합니다.
              {!canEdit && " (현재 역할은 열람만 가능합니다.)"}
            </p>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>No.</th><th>내용</th><th>품번</th><th>품명</th><th>변경사항</th><th>규격</th>
                    {canEdit && <th>삭제</th>}
                  </tr>
                </thead>
                <tbody>
                  {s.bomRows.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{i + 1}</td>
                      <td>
                        {canEdit ? (
                          <input
                            className="v50-input"
                            list="unified-bom-level-options"
                            value={row.level_label || ""}
                            onChange={(e) => s.updateBomRow(i, { level_label: e.target.value })}
                          />
                        ) : (row.level_label || "-")}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="v50-input" value={row.item_code || ""} onChange={(e) => s.updateBomRow(i, { item_code: e.target.value })} />
                        ) : (row.item_code || "-")}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="v50-input" value={row.item_name || ""} onChange={(e) => s.updateBomRow(i, { item_name: e.target.value })} />
                        ) : (row.item_name || "-")}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="v50-input" value={row.change_note || ""} onChange={(e) => s.updateBomRow(i, { change_note: e.target.value })} />
                        ) : (row.change_note || "-")}
                      </td>
                      <td>
                        {canEdit ? (
                          <input className="v50-input" value={row.spec || ""} onChange={(e) => s.updateBomRow(i, { spec: e.target.value })} />
                        ) : (row.spec || "-")}
                      </td>
                      {canEdit && (
                        <td><button className="v50-button-light" onClick={() => s.removeBomRow(i)}>삭제</button></td>
                      )}
                    </tr>
                  ))}
                  {s.bomRows.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6}>
                        {canEdit ? "+ 행 추가로 통합 BOM 행을 추가하세요." : "등록된 통합 BOM이 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="v50-panel" style={{ marginBottom: 18 }}>
            <h2>원료 BOM (참고)</h2>
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
            <h2>필름·원단·칼선 (참고)</h2>
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
