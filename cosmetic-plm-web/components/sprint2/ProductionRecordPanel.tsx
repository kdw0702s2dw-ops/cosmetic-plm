"use client";

import { useState } from "react";
import { useProductionRecord } from "@/hooks/useProductionRecord";
import { searchProductionSchedules, type ProductionSchedule as ScheduleItem } from "@/services/sprint2/productionScheduleService";
import { FUNCTIONAL_CLAIM_OPTIONS, TEST_PROGRESS_OPTIONS, type FunctionalClaim, type TestProgressStatus } from "@/services/sprint2/productionRecordService";
import DecimalInput from "@/components/common/DecimalInput";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export default function ProductionRecordPanel({ refreshTick }: { refreshTick?: number } = {}) {
  const s = useProductionRecord(refreshTick);

  // 생산_일정관리에서 불러오기 - "생산_일정관리에 등록된 내용으로 생산실적관리 쪽으로 내용을 불러오고
  // 싶다"는 요청에 따라, 출고관리 입력 화면의 "생산실적에서 불러오기"와 같은 방식(검색 -> 결과 클릭 ->
  // 자동 입력)으로 만든다. 일정은 처방(formula_code/revision)이 항상 있으므로 선택하면 처방도 함께
  // 자동 선택되고(저장 이력도 같이 불러와짐), 제조(Lot No.)·제품(Lot No.)·목표 제조량(kg)이 채워진다.
  // 채워진 값은 저장 전까지 아래 입력칸에서 자유롭게 고쳐 쓸 수 있다(자동입력은 편의 기능일 뿐).
  const [scheduleKeyword, setScheduleKeyword] = useState("");
  const [scheduleHits, setScheduleHits] = useState<ScheduleItem[]>([]);
  const [scheduleSearching, setScheduleSearching] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  async function searchSchedules() {
    if (!scheduleKeyword.trim()) {
      setScheduleHits([]);
      setScheduleMsg("");
      return;
    }
    setScheduleSearching(true);
    setScheduleMsg("");
    try {
      const results = await searchProductionSchedules(scheduleKeyword);
      setScheduleHits(results);
      if (results.length === 0) setScheduleMsg("일치하는 일정이 없습니다.");
    } catch (e) {
      setScheduleMsg(e instanceof Error ? e.message : "일정 검색 오류");
    } finally {
      setScheduleSearching(false);
    }
  }

  function pickSchedule(item: ScheduleItem) {
    s.selectFormula({
      formula_code: item.formula_code,
      revision: item.revision,
      formula_name: item.formula_name,
      confirmed_code: item.confirmed_code,
      product_name: item.product_name,
    });
    s.setMfgLotNo(item.mfg_lot_no || "");
    s.setLotNo(item.lot_no || "");
    // quantity가 없는 일정을 고르면 직전에 채워져 있던 값이 아니라 빈 값(0)으로 비워야 한다 - 조건부로만
    // 채우면 이전 선택의 목표 제조량이 그대로 남아 다른 일정의 실적으로 잘못 저장될 수 있었다.
    s.updateTargetQtyKg(item.quantity != null ? String(item.quantity) : "");
    setScheduleHits([]);
    setScheduleKeyword("");
    setScheduleMsg("");
  }

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 선택하고 제품(Lot No.)별로 목표 제조량, 코팅량, 성형품 수량 등 생산실적을 기록으로
        남깁니다. 제조(Lot No.)는 제조(벌크) 단계에서 붙는 번호로, 완제품/출고 단계 번호인
        제품(Lot No.)와 별개로 기록할 수 있습니다. 둘 다 같은 처방 내에서 중복돼도 등록할 수 있고,
        제품(Lot No.)가 중복이면 한 번 확인을 거칩니다. 완제품 출고 수량(EA/PACK)은 제품(Lot No.)
        단위로 1개 값만 관리되므로, 같은 Lot으로 추가 생산을 등록해도 출고 수량이 중복 합산되지
        않습니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>일정에서 불러오기 (선택)</h2>
        <p className="v50-desc" style={{ marginBottom: 10 }}>
          생산_일정관리에 등록해 둔 일정을 검색해서 선택하면 처방·제조(Lot No.)·제품(Lot No.)·목표
          제조량(kg)이 한 번에 채워집니다(채워진 값은 저장 전 자유롭게 고쳐 쓸 수 있습니다). 필요 없으면
          건너뛰고 아래 &quot;처방 선택&quot;에서 직접 처방을 검색해도 됩니다.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="v50-input" style={{ maxWidth: 280 }}
            value={scheduleKeyword}
            onChange={(e) => setScheduleKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchSchedules()}
            placeholder="확정코드, 처방명, 제품명, 제조(Lot No.), 제품(Lot No.)로 검색"
          />
          <button className="v50-button-light" onClick={searchSchedules} disabled={scheduleSearching}>{scheduleSearching ? "검색 중…" : "검색"}</button>
        </div>
        {scheduleMsg && <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>{scheduleMsg}</p>}
        {scheduleHits.length > 0 && (
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>날짜</th><th>유형</th><th>확정코드</th><th>제품명</th><th>제조(Lot No.)</th><th>제품(Lot No.)</th><th>목표 제조량(kg)</th><th></th></tr></thead>
              <tbody>
                {scheduleHits.map((item) => (
                  <tr key={item.id}>
                    <td>{item.schedule_date}</td>
                    <td>{item.schedule_type}</td>
                    <td>{item.confirmed_code || "-"}</td>
                    <td>{item.product_name || item.formula_name || "-"}</td>
                    <td>{item.mfg_lot_no || "-"}</td>
                    <td>{item.lot_no || "-"}</td>
                    <td>{item.quantity ?? "-"}</td>
                    <td><button className="v50-button-light" onClick={() => pickSchedule(item)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
            <input className="v50-input" value={s.lotNo} onChange={(e) => s.updateLotNo(e.target.value)} />
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
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            기능성
            <select className="v50-input" value={s.functionalClaim} onChange={(e) => s.setFunctionalClaim(e.target.value as FunctionalClaim)}>
              {FUNCTIONAL_CLAIM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            중금속
            <select className="v50-input" value={s.heavyMetalStatus} onChange={(e) => s.setHeavyMetalStatus(e.target.value as TestProgressStatus)}>
              {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
            미생물
            <select className="v50-input" value={s.microbialStatus} onChange={(e) => s.setMicrobialStatus(e.target.value as TestProgressStatus)}>
              {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        {s.lotShipmentNotice && (
          <p style={{ color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 10px", fontSize: 13, marginTop: 12 }}>
            {s.lotShipmentNotice}
          </p>
        )}
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
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
            완제품 총 출고 수량(EA/PACK)은 이 Lot 전체(동일 Lot No.로 등록된 다른 생산실적 행 포함)에
            공통으로 적용되는 값입니다. 여기서 수정하면 이 Lot의 모든 행에 똑같이 반영됩니다.
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
              완제품 총 출고 수량 (단위: EA, 이 Lot 전체 공통)
              <input className="v50-input" type="number" value={s.editDraft.shipped_qty_ea} onChange={(e) => s.updateEditDraft({ shipped_qty_ea: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              완제품 총 출고 수량 (단위: PACK, 이 Lot 전체 공통)
              <input className="v50-input" type="number" value={s.editDraft.shipped_qty_pack} onChange={(e) => s.updateEditDraft({ shipped_qty_pack: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              기능성
              <select className="v50-input" value={s.editDraft.functional_claim} onChange={(e) => s.updateEditDraft({ functional_claim: e.target.value as FunctionalClaim })}>
                {FUNCTIONAL_CLAIM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              중금속
              <select className="v50-input" value={s.editDraft.heavy_metal_status} onChange={(e) => s.updateEditDraft({ heavy_metal_status: e.target.value as TestProgressStatus })}>
                {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              미생물
              <select className="v50-input" value={s.editDraft.microbial_status} onChange={(e) => s.updateEditDraft({ microbial_status: e.target.value as TestProgressStatus })}>
                {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
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
                  <th>출고수량(EA, Lot 공통)</th><th>출고수량(PACK, Lot 공통)</th><th>기능성</th><th>중금속</th><th>미생물</th><th>등록자</th><th>비고</th><th style={{ width: 130 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {s.history.map((h) => {
                  // Lot 출고 레코드가 있으면(정상 상태) 그 값을 그대로 쓴다(값이 비어 있어도 - 누군가
                  // 비웠다면 0/빈 값이 맞는 현재 상태이므로). 아직 레코드가 없는 예외적인 경우에만
                  // 행 자신의 옛 값으로 대체한다 - 합계/수정 폼과 동일한 규칙.
                  const shipment = s.lotShipments.get(h.lot_no);
                  const shippedEa = shipment ? shipment.shipped_qty_ea : h.shipped_qty_ea;
                  const shippedPack = shipment ? shipment.shipped_qty_pack : h.shipped_qty_pack;
                  return (
                    <tr key={h.id}>
                      <td>{h.production_date}</td>
                      <td>{h.exp_date || "-"}</td>
                      <td>{h.mfg_lot_no || "-"}</td>
                      <td>{h.lot_no}</td>
                      <td>{fmt(h.target_qty_kg)}</td>
                      <td>{fmt(h.coating_qty)}</td>
                      <td>{fmt(h.molded_qty)}</td>
                      <td>{fmt(shippedEa)}</td>
                      <td>{fmt(shippedPack)}</td>
                      <td>{h.functional_claim}</td>
                      <td>{h.heavy_metal_status}</td>
                      <td>{h.microbial_status}</td>
                      <td>{s.resolveCreatedBy(h.created_by)}</td>
                      <td>{h.note || "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="v50-button-light" onClick={() => s.startEdit(h)}>수정</button>
                          <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeHistory(h.id!)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {s.history.length === 0 && <tr><td colSpan={15}>{s.loading ? "불러오는 중..." : "저장된 이력이 없습니다."}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
