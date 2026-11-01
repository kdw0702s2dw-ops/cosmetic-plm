"use client";

import { useProductionRecord } from "@/hooks/useProductionRecord";
import DecimalInput from "@/components/common/DecimalInput";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export default function ProductionRecordPanel({ refreshTick }: { refreshTick?: number } = {}) {
  const s = useProductionRecord(refreshTick);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 제품(Lot No.)별로 목표 제조량, 코팅량, 성형품 수량 등 생산실적을 기록으로
        남깁니다. 제조(Lot No.)는 제조(벌크) 단계에서 붙는 번호로, 완제품/출고 단계 번호인
        제품(Lot No.)와 별개로 기록할 수 있습니다. 둘 다 같은 처방 내에서 중복돼도 등록할 수 있고,
        제품(Lot No.)가 중복이면 한 번 확인을 거칩니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사, 확정코드 검색" />
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

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>생산실적 입력</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            목표 제조량(kg)
            <DecimalInput className="v50-input" value={s.targetQtyKg} onChange={(v) => s.updateTargetQtyKg(v)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            제조(Lot No.)
            <input className="v50-input" value={s.mfgLotNo} onChange={(e) => s.setMfgLotNo(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            제품(Lot No.)
            <input className="v50-input" value={s.lotNo} onChange={(e) => s.setLotNo(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            생산일자
            <input className="v50-input" type="date" value={s.productionDate} onChange={(e) => s.setProductionDate(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            EXP (유효기한)
            <input className="v50-input" type="date" value={s.expDate} onChange={(e) => s.setExpDate(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            코팅량 (단위: m)
            <input className="v50-input" type="number" value={s.coatingQty} onChange={(e) => s.setCoatingQty(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            성형품 수량 (단위: EA)
            <input className="v50-input" type="number" value={s.moldedQty} onChange={(e) => s.setMoldedQty(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            완제품 출고 수량 (단위: EA)
            <input className="v50-input" type="number" value={s.shippedQtyEa} onChange={(e) => s.setShippedQtyEa(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            완제품 출고 수량 (단위: PACK)
            <input className="v50-input" type="number" value={s.shippedQtyPack} onChange={(e) => s.setShippedQtyPack(e.target.value)} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 12 }}>
          비고
          <textarea className="v50-textarea" rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || !s.formula}>{s.saving ? "저장 중…" : "저장"}</button>
          {s.auth.canExportData && (
            <button className="v50-button-light" onClick={s.downloadExcel} disabled={!s.formula}>엑셀 다운로드</button>
          )}
        </div>
      </section>

      {s.editingId && s.editDraft && (
        <section className="v50-panel" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>생산실적 수정</h2>
          <p style={{ fontSize: 13, color: "#334155", marginBottom: 10 }}>
            제품(Lot No.) {s.editDraft.lot_no}
            <span style={{ color: "#94a3b8" }}> (처방은 바꿀 수 없습니다 - 처방을 바꾸려면 삭제 후 새로 등록하세요)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              목표 제조량(kg)
              <input className="v50-input" type="number" value={s.editDraft.target_qty_kg} onChange={(e) => s.updateEditDraft({ target_qty_kg: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              제조(Lot No.)
              <input className="v50-input" value={s.editDraft.mfg_lot_no} onChange={(e) => s.updateEditDraft({ mfg_lot_no: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              제품(Lot No.)
              <input className="v50-input" value={s.editDraft.lot_no} onChange={(e) => s.updateEditDraft({ lot_no: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              생산일자
              <input className="v50-input" type="date" value={s.editDraft.production_date} onChange={(e) => s.updateEditDraft({ production_date: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              EXP (유효기한)
              <input className="v50-input" type="date" value={s.editDraft.exp_date} onChange={(e) => s.updateEditDraft({ exp_date: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              코팅량 (단위: m)
              <input className="v50-input" type="number" value={s.editDraft.coating_qty} onChange={(e) => s.updateEditDraft({ coating_qty: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              성형품 수량 (단위: EA)
              <input className="v50-input" type="number" value={s.editDraft.molded_qty} onChange={(e) => s.updateEditDraft({ molded_qty: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              완제품 출고 수량 (단위: EA)
              <input className="v50-input" type="number" value={s.editDraft.shipped_qty_ea} onChange={(e) => s.updateEditDraft({ shipped_qty_ea: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              완제품 출고 수량 (단위: PACK)
              <input className="v50-input" type="number" value={s.editDraft.shipped_qty_pack} onChange={(e) => s.updateEditDraft({ shipped_qty_pack: e.target.value })} />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 12 }}>
            비고
            <textarea className="v50-textarea" rows={2} value={s.editDraft.note} onChange={(e) => s.updateEditDraft({ note: e.target.value })} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="v50-button" onClick={s.saveEdit} disabled={s.savingEdit}>{s.savingEdit ? "저장 중…" : "수정 저장"}</button>
            <button className="v50-button-light" onClick={s.cancelEdit}>취소</button>
          </div>
        </section>
      )}

      <section className="v50-panel">
        <h2>저장 이력 (제품(Lot No.)별)</h2>
        {!s.formula ? (
          <p style={{ color: "#64748b" }}>처방을 선택하면 이력이 표시됩니다.</p>
        ) : (
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead>
                <tr>
                  <th>생산일자</th><th>EXP</th><th>제조(Lot No.)</th><th>제품(Lot No.)</th><th>목표 제조량(kg)</th><th>코팅량 (단위: m)</th><th>성형품 수량 (단위: EA)</th>
                  <th>출고수량(EA)</th><th>출고수량(PACK)</th><th>등록자</th><th>비고</th><th style={{ width: 130 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.production_date}</td>
                    <td>{h.exp_date || "-"}</td>
                    <td>{h.mfg_lot_no || "-"}</td>
                    <td>{h.lot_no}</td>
                    <td>{fmt(h.target_qty_kg)}</td>
                    <td>{fmt(h.coating_qty)}</td>
                    <td>{fmt(h.molded_qty)}</td>
                    <td>{fmt(h.shipped_qty_ea)}</td>
                    <td>{fmt(h.shipped_qty_pack)}</td>
                    <td>{s.resolveCreatedBy(h.created_by)}</td>
                    <td>{h.note || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="v50-button-light" onClick={() => s.startEdit(h)}>수정</button>
                        <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {s.history.length === 0 && <tr><td colSpan={12}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
