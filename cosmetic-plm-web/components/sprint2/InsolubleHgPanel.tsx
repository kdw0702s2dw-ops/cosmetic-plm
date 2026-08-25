"use client";

import { useInsolubleHgCheck } from "@/hooks/useInsolubleHgCheck";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { LOSS_RATE_PRESETS } from "@/services/sprint2/insolubleHgService";
import MaterialLookupCard from "@/components/common/MaterialLookupCard";
import MaterialCodeAutocompleteInput from "@/components/common/MaterialCodeAutocompleteInput";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

// 계산 결과/로스율별 비교 표는 화면 표시만 소수점 둘째 자리로 반올림한다 (저장/PDF/엑셀은 원본 정밀도 유지)
function fmtDisplay(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(2);
}

const NUMERIC_FIELDS: { key: "total_weight" | "cutting_area_a4_weight" | "a4_10x10_weight"; label: string }[] = [
  { key: "total_weight", label: "총중량" },
  { key: "cutting_area_a4_weight", label: "칼선면적 중량" },
  { key: "a4_10x10_weight", label: "10x10㎠ 중량" },
];

const COMPONENTS: { codeKey: "fabric_material_code" | "film_material_code"; weightKey: "fabric_standard_weight" | "film_standard_weight"; label: string }[] = [
  { codeKey: "fabric_material_code", weightKey: "fabric_standard_weight", label: "원단 관리기준" },
  { codeKey: "film_material_code", weightKey: "film_standard_weight", label: "필름 관리기준" },
];

export default function InsolubleHgPanel() {
  const s = useInsolubleHgCheck();
  const auth = useSprint1Auth();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 원단/필름 관리기준과 칼선 조건을 입력하면 도포량·면적비·DCAP중량을 실시간으로 계산합니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
          <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
        </div>
        {s.formula ? (
          <p style={{ color: "#16a34a", fontWeight: 800 }}>
            선택됨: {s.formula.formula_code} · {s.formula.formula_name} · Rev {s.formula.revision} · 확정코드 {s.formula.confirmed_code || "-"}
          </p>
        ) : (
          <p style={{ color: "#94a3b8" }}>처방을 검색해서 선택하세요.</p>
        )}
        {s.formulas.length > 0 && (
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MaterialLookupCard />

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>10×10㎠ 도포량 기준(부자재 제외)</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          라인을 추가해 여러 기준값을 저장할 수 있습니다. 한 번 입력하면 저장되어 다음에 이 화면을 열 때도 항상 그대로 채워져 있고, 값을 바꾸면 자동으로 저장됩니다.
          기준값 하나를 선택하면 아래 &quot;입력값 - 나머지&quot;의 총중량이 (선택한 도포량 + 원단 관리기준 중량 + 필름 관리기준 중량)으로 자동 계산됩니다.
        </p>
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead><tr><th style={{ width: 60 }}></th><th>구분</th><th>도포량(g)</th><th>두께(㎜)</th><th style={{ width: 90 }}></th><th style={{ width: 80 }}></th></tr></thead>
            <tbody>
              {s.referenceLines.map((row, i) => (
                <tr key={row.id} style={row.id === s.selectedReferenceLineId ? { background: "#eff6ff" } : undefined}>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="v50-button-light" disabled={i === 0 || s.referenceLineBusy} onClick={() => s.moveReferenceLine(row.id, "up")}>▲</button>
                      <button className="v50-button-light" disabled={i === s.referenceLines.length - 1 || s.referenceLineBusy} onClick={() => s.moveReferenceLine(row.id, "down")}>▼</button>
                    </div>
                  </td>
                  <td>
                    <input className="v50-input" placeholder="구분(선택)" value={row.label ?? ""}
                      onChange={(e) => s.updateReferenceLine(row.id, "label", e.target.value)} />
                  </td>
                  <td>
                    <input className="v50-input" type="number" value={row.coat_amount_10x10_g ?? ""}
                      onChange={(e) => s.updateReferenceLine(row.id, "coat_amount_10x10_g", e.target.value)} />
                  </td>
                  <td>
                    <input className="v50-input" type="number" value={row.thickness_mm ?? ""}
                      onChange={(e) => s.updateReferenceLine(row.id, "thickness_mm", e.target.value)} />
                  </td>
                  <td>
                    <button
                      className={row.id === s.selectedReferenceLineId ? "v50-button" : "v50-button-light"}
                      disabled={row.coat_amount_10x10_g === null || row.coat_amount_10x10_g === undefined}
                      onClick={() => s.selectReferenceLine(row.id)}
                    >
                      {row.id === s.selectedReferenceLineId ? "선택됨" : "선택"}
                    </button>
                  </td>
                  <td>
                    <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeReferenceLine(row.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {s.referenceLines.length === 0 && (
                <tr><td colSpan={6}>{s.referenceSettingsLoading ? "불러오는 중..." : "저장된 기준값이 없습니다."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="v50-button-light" style={{ marginTop: 10 }} onClick={s.addReferenceLine} disabled={s.referenceLineBusy}>+ 라인 추가</button>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>입력값 - 관리기준 2개</h2>
        <div className="v50-grid-2">
          {COMPONENTS.map((c) => (
            <div key={c.codeKey} style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 800 }}>{c.label}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <MaterialCodeAutocompleteInput
                  value={s.headerInput[c.codeKey]}
                  onChange={(v) => s.updateTextField(c.codeKey, v)}
                  onPick={(m) => {
                    s.updateTextField(c.codeKey, m.material_code);
                    s.updateHeaderField(c.weightKey, String(m.weight_10x10cm ?? ""));
                  }}
                />
                <input className="v50-input" type="number" placeholder="중량" style={{ width: 100 }} value={s.headerInput[c.weightKey] || ""} onChange={(e) => s.updateHeaderField(c.weightKey, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>입력값 - 나머지</h2>
        <div className="v50-grid-2">
          {NUMERIC_FIELDS.map((f) => (
            <label key={f.key} style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              {f.label}
              <input className="v50-input" type="number" value={s.headerInput[f.key] || ""} onChange={(e) => s.updateHeaderField(f.key, e.target.value)} />
            </label>
          ))}
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            칼선(No.)
            <input className="v50-input" value={s.headerInput.cutting_line_no} onChange={(e) => s.setCuttingLineNo(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            로스율
            <select className="v50-input" value={s.headerInput.loss_rate_preset_key ?? "custom"} onChange={(e) => s.selectLossRatePreset(e.target.value)}>
              {LOSS_RATE_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label} ({(p.rate * 100).toFixed(0)}%)</option>)}
              <option value="custom">직접 입력</option>
            </select>
          </label>
          {s.headerInput.loss_rate_preset_key === null && (
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              로스율 직접 입력(%)
              <input className="v50-input" type="number" value={s.headerInput.loss_rate * 100 || ""} onChange={(e) => s.updateCustomLossRate(e.target.value)} />
            </label>
          )}
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            문안용 도포량 (수동)
            <input className="v50-input" type="number" value={s.headerInput.manual_notice_coat_amount ?? ""} onChange={(e) => s.updateManualNoticeCoatAmount(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            가로(cm) (반칼)
            <input className="v50-input" type="number" value={s.headerInput.half_cut_width_cm || ""} onChange={(e) => s.updateHeaderField("half_cut_width_cm", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            세로(cm) (반칼)
            <input className="v50-input" type="number" value={s.headerInput.half_cut_height_cm || ""} onChange={(e) => s.updateHeaderField("half_cut_height_cm", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>계산 결과</h2>
        <div className="v50-grid-4">
          <Kpi label="총중량 하한" value={fmtDisplay(s.headerInput.total_weight)} />
          <Kpi label="총중량 상한" value={fmtDisplay(s.headerResult.total_weight_max)} />
          <Kpi label="도포량 하한" value={fmtDisplay(s.headerResult.coat_amount)} />
          <Kpi label="도포량 상한" value={fmtDisplay(s.headerResult.coat_amount_max)} />
          <Kpi label="면적비(R)" value={fmtDisplay(s.headerResult.area_ratio)} />
          <Kpi label="칼선도포량" value={fmtDisplay(s.headerResult.cutting_line_coat_amount)} />
          <Kpi label="로스반영 도포량" value={fmtDisplay(s.headerResult.loss_adjusted_coat_amount)} color="#2563eb" />
          <Kpi label="부직포중량" value={fmtDisplay(s.headerResult.nonwoven_weight)} />
          <Kpi label="필름중량(완칼)" value={fmtDisplay(s.headerResult.film_weight_full_cut)} />
          <Kpi label="성형품 중량(완칼)" value={fmtDisplay(s.headerResult.dcap_weight_full_cut)} color="#dc2626" />
          <Kpi label="필름중량(반칼)" value={fmtDisplay(s.headerResult.film_weight_half_cut)} />
          <Kpi label="성형품 중량(반칼)" value={fmtDisplay(s.headerResult.dcap_weight_half_cut)} color="#dc2626" />
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>로스율별 비교</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          성형품 중량은 부자재 무게가 포함된 결과입니다.
        </p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>로스율</th><th>로스반영 도포량</th><th>성형품 중량(완칼)</th><th>97%중량(완칼)</th><th>성형품 중량(반칼)</th><th>97%중량(반칼)</th></tr></thead>
            <tbody>
              {s.summaryRows.map((r, i) => (
                <tr key={i}>
                  <td>{(r.loss_rate * 100).toFixed(0)}%</td>
                  <td style={{ color: "#2563eb", fontWeight: r.loss_rate === 0.15 ? 800 : undefined }}>{fmtDisplay(r.loss_adjusted_coat_amount)}</td>
                  <td style={{ color: "#dc2626" }}>{fmtDisplay(r.dcap_weight)}</td>
                  <td style={{ fontWeight: r.loss_rate === 0.1 ? 800 : undefined }}>{fmtDisplay(r.weight_97pct)}</td>
                  <td style={{ color: "#dc2626" }}>{fmtDisplay(r.dcap_weight_half_cut)}</td>
                  <td style={{ fontWeight: r.loss_rate === 0.1 ? 800 : undefined }}>{fmtDisplay(r.weight_97pct_half_cut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          비고
          <textarea className="v50-textarea" rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || !s.formula}>{s.saving ? "저장 중…" : "저장"}</button>
          <button className="v50-button-light" onClick={s.printCurrent} disabled={!s.formula}>PDF 저장</button>
          {auth.canExportData && <button className="v50-button-light" onClick={s.downloadExcelCurrent} disabled={!s.formula}>엑셀 다운로드</button>}
        </div>
      </section>

      <section className="v50-panel">
        <h2>저장 이력</h2>
        {!s.formula ? (
          <p style={{ color: "#64748b" }}>처방을 선택하면 이력이 표시됩니다.</p>
        ) : (
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>저장일시</th><th>총중량</th><th>성형품 중량(완칼)</th><th>비고</th><th style={{ width: 220 }}>작업</th></tr></thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at || "").toLocaleString("ko-KR")}</td>
                    <td>{fmt(h.total_weight)}</td>
                    <td>{fmt(h.dcap_weight_full_cut)}</td>
                    <td>{h.note || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="v50-button-light" onClick={() => s.loadFromHistory(h)}>불러오기</button>
                        <button className="v50-button-light" onClick={() => s.printHistoryItem(h)}>PDF</button>
                        {auth.canExportData && <button className="v50-button-light" onClick={() => s.downloadExcelHistoryItem(h)}>엑셀</button>}
                        <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {s.history.length === 0 && <tr><td colSpan={5}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value" style={color ? { color } : undefined}>{value}</div></article>;
}
