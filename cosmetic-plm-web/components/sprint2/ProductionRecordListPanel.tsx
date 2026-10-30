"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllProductionRecords, deleteProductionRecord, updateProductionRecord,
  type ProductionRecord, type ProductionRecordListFilter,
} from "@/services/sprint2/productionRecordService";
import "@/styles/enterprise-v50.css";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

// 수정 폼에서 다루는 입력칸들 - 전부 문자열로 들고 있다가 저장 시점에 숫자/빈값으로 변환한다
// (입력 탭의 "생산실적 입력" 폼과 동일한 필드 구성, 처방 자체는 바꿀 수 없어 제외).
type EditDraft = {
  lot_no: string;
  target_qty_kg: string;
  production_date: string;
  exp_date: string;
  coating_qty: string;
  molded_qty: string;
  shipped_qty_ea: string;
  shipped_qty_pack: string;
  note: string;
};

function draftFromRecord(r: ProductionRecord): EditDraft {
  return {
    lot_no: r.lot_no,
    target_qty_kg: r.target_qty_kg != null ? String(r.target_qty_kg) : "",
    production_date: r.production_date,
    exp_date: r.exp_date || "",
    coating_qty: r.coating_qty != null ? String(r.coating_qty) : "",
    molded_qty: r.molded_qty != null ? String(r.molded_qty) : "",
    shipped_qty_ea: r.shipped_qty_ea != null ? String(r.shipped_qty_ea) : "",
    shipped_qty_pack: r.shipped_qty_pack != null ? String(r.shipped_qty_pack) : "",
    note: r.note || "",
  };
}

/**
 * 생산실적 전체 목록 - 처방을 먼저 선택하지 않아도 지금까지 입력된 모든 생산실적을 검색·조회한다.
 * ("지금 처방으로 검색해서 보게 만들어져 있는데 생산실적 입력한 것들은 리스트로 볼수 있게 해줘" 요청사항)
 * 확정코드/제품명(컨펌 후 확정) 표시 + 수정 기능 추가("처방코드 대신 확정코드로, 처방명 대신 제품명으로,
 * 수정 기능도 만들어달라" 요청사항). 처방 자체는 수정 대상에서 제외(Lot No. 유일성 제약이 처방
 * 단위라 처방을 바꾸려면 삭제 후 새로 등록해야 함).
 */
export default function ProductionRecordListPanel() {
  const [filter, setFilter] = useState<ProductionRecordListFilter>({});
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async (f: ProductionRecordListFilter) => {
    setLoading(true);
    try {
      setRecords(await fetchAllProductionRecords(f));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "조회 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load({}); }, []); // eslint-disable-line

  function applyFilter() {
    load(filter);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 생산실적을 삭제하시겠습니까?")) return;
    try {
      await deleteProductionRecord(id);
      if (editingId === id) cancelEdit();
      await load(filter);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function startEdit(r: ProductionRecord) {
    setEditingId(r.id || null);
    setEditDraft(draftFromRecord(r));
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function updateDraft(patch: Partial<EditDraft>) {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;
    const trimmedLot = editDraft.lot_no.trim();
    if (!trimmedLot) { setMsg("Lot No.를 입력하세요."); return; }
    if (!editDraft.production_date) { setMsg("생산일자를 입력하세요."); return; }
    // DB의 Lot No. UNIQUE 제약을 제거해서(추가 제조 건을 같은 Lot No.로도 등록 가능하게) 더 이상 저장이
    // 막히지 않는다 - 대신 지금 화면에 불러와 있는 목록(records) 안에서 같은 처방(formula_code+revision)에
    // 같은 Lot No.가 있으면 한 번 확인을 받는다. "생산실적 입력" 탭(useProductionRecord)과 동일한 패턴
    // (단, 여기 records는 검색 필터·2000행 상한이 걸린 전체 목록이라, 필터링 중이거나 아주 오래된
    // 데이터는 놓칠 수 있다 - 중복 방지가 아니라 확인용 안내라 치명적이지 않음).
    // Lot No.를 그대로 두고 다른 칸만 고칠 때는 묻지 않는다(이미 중복 등록된 행을 수정할 때마다 뜨지 않게).
    const editingRecord = records.find((r) => r.id === editingId);
    if (editingRecord && trimmedLot !== editingRecord.lot_no) {
      const isDup = records.some(
        (r) =>
          r.id !== editingId &&
          r.formula_code === editingRecord.formula_code &&
          r.revision === editingRecord.revision &&
          r.lot_no === trimmedLot
      );
      if (isDup && !confirm("이미 사용 중인 Lot No.입니다 (같은 처방 내 중복). 그래도 저장하시겠습니까?")) return;
    }
    setSavingEdit(true);
    setMsg("");
    try {
      await updateProductionRecord(editingId, {
        lot_no: trimmedLot,
        target_qty_kg: editDraft.target_qty_kg === "" ? 0 : Number(editDraft.target_qty_kg),
        production_date: editDraft.production_date,
        exp_date: editDraft.exp_date === "" ? null : editDraft.exp_date,
        coating_qty: editDraft.coating_qty === "" ? null : Number(editDraft.coating_qty),
        molded_qty: editDraft.molded_qty === "" ? null : Number(editDraft.molded_qty),
        shipped_qty_ea: editDraft.shipped_qty_ea === "" ? null : Number(editDraft.shipped_qty_ea),
        shipped_qty_pack: editDraft.shipped_qty_pack === "" ? null : Number(editDraft.shipped_qty_pack),
        note: editDraft.note || null,
      });
      setMsg("수정 완료");
      cancelEdit();
      await load(filter);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "수정 오류");
    } finally {
      setSavingEdit(false);
    }
  }

  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => ({
        coating: acc.coating + (r.coating_qty || 0),
        molded: acc.molded + (r.molded_qty || 0),
        ea: acc.ea + (r.shipped_qty_ea || 0),
        pack: acc.pack + (r.shipped_qty_pack || 0),
      }),
      { coating: 0, molded: 0, ea: 0, pack: 0 }
    );
  }, [records]);

  const editingRecord = editingId ? records.find((r) => r.id === editingId) || null : null;

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방 선택 없이 지금까지 입력된 모든 생산실적을 검색·조회합니다.
      </p>
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      {editingRecord && editDraft && (
        <section className="v50-panel" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>생산실적 수정</h2>
          <p style={{ fontSize: 13, color: "#334155", marginBottom: 10 }}>
            <b>{editingRecord.confirmed_code || "-"}</b> · {editingRecord.product_name || editingRecord.formula_name || "-"}
            <span style={{ color: "#94a3b8" }}> (처방은 바꿀 수 없습니다 - 처방을 바꾸려면 삭제 후 새로 등록하세요)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              목표 제조량(kg)
              <input className="v50-input" type="number" value={editDraft.target_qty_kg} onChange={(e) => updateDraft({ target_qty_kg: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              Lot No.
              <input className="v50-input" value={editDraft.lot_no} onChange={(e) => updateDraft({ lot_no: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              생산일자
              <input className="v50-input" type="date" value={editDraft.production_date} onChange={(e) => updateDraft({ production_date: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              EXP (유효기한)
              <input className="v50-input" type="date" value={editDraft.exp_date} onChange={(e) => updateDraft({ exp_date: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              코팅량 (단위: m)
              <input className="v50-input" type="number" value={editDraft.coating_qty} onChange={(e) => updateDraft({ coating_qty: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              성형품 수량 (단위: EA)
              <input className="v50-input" type="number" value={editDraft.molded_qty} onChange={(e) => updateDraft({ molded_qty: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              완제품 출고 수량 (단위: EA)
              <input className="v50-input" type="number" value={editDraft.shipped_qty_ea} onChange={(e) => updateDraft({ shipped_qty_ea: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              완제품 출고 수량 (단위: PACK)
              <input className="v50-input" type="number" value={editDraft.shipped_qty_pack} onChange={(e) => updateDraft({ shipped_qty_pack: e.target.value })} />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 12 }}>
            비고
            <textarea className="v50-textarea" rows={2} value={editDraft.note} onChange={(e) => updateDraft({ note: e.target.value })} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="v50-button" onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "저장 중…" : "수정 저장"}</button>
            <button className="v50-button-light" onClick={cancelEdit}>취소</button>
          </div>
        </section>
      )}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="검색(확정코드/제품명/Lot No.)">
            <input className="v50-input" style={{ minWidth: 220 }} value={filter.keyword || ""}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()} />
          </Field>
          <Field label="생산일자(시작)">
            <input className="v50-input" type="date" value={filter.dateFrom || ""} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
          </Field>
          <Field label="생산일자(종료)">
            <input className="v50-input" type="date" value={filter.dateTo || ""} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
          </Field>
          <button className="v50-button" onClick={applyFilter} disabled={loading}>{loading ? "조회 중…" : "검색"}</button>
        </div>

        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>생산일자</th><th>확정코드</th><th>제품명</th><th>Lot No.</th>
                <th>목표 제조량(kg)</th><th>코팅량 (단위: m)</th><th>성형품 수량 (단위: EA)</th>
                <th>출고수량(EA)</th><th>출고수량(PACK)</th><th>비고</th><th style={{ width: 140 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.production_date}</td>
                  <td>{r.confirmed_code || "-"}</td>
                  <td>{r.product_name || r.formula_name || "-"}</td>
                  <td>{r.lot_no}</td>
                  <td>{fmt(r.target_qty_kg)}</td>
                  <td>{fmt(r.coating_qty)}</td>
                  <td>{fmt(r.molded_qty)}</td>
                  <td>{fmt(r.shipped_qty_ea)}</td>
                  <td>{fmt(r.shipped_qty_pack)}</td>
                  <td>{r.note || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="v50-button-light" onClick={() => startEdit(r)}>수정</button>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r.id!)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={11} style={{ color: "#94a3b8" }}>{loading ? "불러오는 중..." : "생산실적이 없습니다."}</td></tr>}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={5} style={{ textAlign: "right" }}>합계</td>
                  <td>{fmt(totals.coating)}</td>
                  <td>{fmt(totals.molded)}</td>
                  <td>{fmt(totals.ea)}</td>
                  <td>{fmt(totals.pack)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
