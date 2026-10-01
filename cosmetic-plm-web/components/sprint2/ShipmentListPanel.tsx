"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchShipmentRecords,
  updateShipmentRecord,
  deleteShipmentRecord,
  FUNCTIONAL_CLAIM_OPTIONS,
  TEST_PROGRESS_OPTIONS,
  type ShipmentRecord,
  type ShipmentRecordInput,
} from "@/services/sprint2/shipmentRecordService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

function fmtQty(q: number | null) {
  return q === null || q === undefined ? "" : String(q);
}

/**
 * 출고관리 > 전체 목록 - 등록된 모든 출고 기록을 검색·조회하고 각 셀을 바로 편집할 수 있는 표.
 * 검색은 출고일/고객사/수량/제품코드/제품명/LOT(EXP)만 대상으로 하고(기능성/중금속/미생물은 검색
 * 대상이 아니라 표에서 직접 보고 확인하는 값), 표 자체는 각 셀을 바로 편집할 수 있는 형태다
 * (텍스트/숫자/날짜는 포커스를 벗어날 때, 드롭다운은 선택 즉시 저장).
 */
export default function ShipmentListPanel() {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteProduction;
  const [rows, setRows] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setRows(await fetchShipmentRecords());
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "출고 기록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []); // eslint-disable-line

  // 각 셀 수정 - 화면에는 즉시 반영하고(낙관적 업데이트), DB 저장은 텍스트/숫자/날짜는 onBlur에서,
  // 드롭다운은 onChange에서 바로 호출한다(persistNow=true).
  function editCell(id: string, patch: ShipmentRecordInput) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function persistCell(id: string, patch: ShipmentRecordInput) {
    setSavingId(id);
    setErrorMsg(null);
    try {
      await updateShipmentRecord(id, patch);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
      await load(); // 저장 실패 시 서버 상태로 되돌린다
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(row: ShipmentRecord) {
    if (!confirm(`${row.shipment_date || ""} ${row.customer || ""} ${row.product_name || ""} 출고 기록을 삭제하시겠습니까?`)) return;
    try {
      await deleteShipmentRecord(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  const kw = keyword.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!kw) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.shipment_date, r.customer, r.quantity != null ? String(r.quantity) : "",
        r.product_code, r.product_name, r.lot_exp,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [rows, kw]);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        등록된 모든 출고 기록을 검색·조회합니다. 출고일·고객사·수량·제품코드·제품명·LOT (EXP)로 검색할 수 있습니다.
      </p>

      {errorMsg && <p style={{ color: "#dc2626", fontWeight: 800 }}>{errorMsg}</p>}

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0 }}>출고 목록</h2>
          <button className="v50-button-light" onClick={() => load()} disabled={loading}>{loading ? "새로고침 중…" : "새로고침"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          <input
            className="v50-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="출고일/고객사/수량/제품코드/제품명/LOT (EXP) 검색"
            style={{ flex: 1, maxWidth: 360 }}
          />
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 560, overflow: "auto" }}>
          {/* 컬럼이 많고 제품명·LOT(EXP)처럼 긴 값이 들어가는 칸도 있어서, 표 자체가 화면보다 넓어질 수
              있다 - v50-table-wrap의 가로 스크롤로 보고, 각 칸은 min-width를 줘서 값이 잘려 보이지
              않게 한다(원료관리 등 다른 화면과 동일하게 폭이 좁아지면 스크롤로 해결). */}
          <table className="v50-table" style={{ minWidth: 1360 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>출고일</th>
                <th style={{ minWidth: 150 }}>고객사</th>
                <th style={{ minWidth: 90 }}>수량</th>
                <th style={{ minWidth: 130 }}>제품코드</th>
                <th style={{ minWidth: 260 }}>제품명</th>
                <th style={{ minWidth: 220 }}>LOT (EXP)</th>
                <th style={{ minWidth: 140 }}>기능성</th>
                <th style={{ minWidth: 110 }}>중금속</th>
                <th style={{ minWidth: 110 }}>미생물</th>
                {canWrite && <th style={{ width: 70 }}>삭제</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isSaving = savingId === r.id;
                return (
                  <tr key={r.id} style={isSaving ? { opacity: 0.6 } : undefined}>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ minWidth: 130 }} type="date" value={r.shipment_date || ""}
                          onChange={(e) => editCell(r.id, { shipment_date: e.target.value || null })}
                          onBlur={(e) => persistCell(r.id, { shipment_date: e.target.value || null })} />
                      ) : (r.shipment_date || "-")}
                    </td>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ minWidth: 150 }} value={r.customer || ""}
                          onChange={(e) => editCell(r.id, { customer: e.target.value })}
                          onBlur={(e) => persistCell(r.id, { customer: e.target.value })} />
                      ) : (r.customer || "-")}
                    </td>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ width: 90 }} type="number" value={fmtQty(r.quantity)}
                          onChange={(e) => editCell(r.id, { quantity: e.target.value === "" ? null : Number(e.target.value) })}
                          onBlur={(e) => persistCell(r.id, { quantity: e.target.value === "" ? null : Number(e.target.value) })} />
                      ) : (r.quantity ?? "-")}
                    </td>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ minWidth: 130 }} value={r.product_code || ""}
                          onChange={(e) => editCell(r.id, { product_code: e.target.value })}
                          onBlur={(e) => persistCell(r.id, { product_code: e.target.value })} />
                      ) : (r.product_code || "-")}
                    </td>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ minWidth: 260 }} value={r.product_name || ""}
                          onChange={(e) => editCell(r.id, { product_name: e.target.value })}
                          onBlur={(e) => persistCell(r.id, { product_name: e.target.value })} />
                      ) : (
                        <span style={{ display: "inline-block", minWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.product_name || "-"}</span>
                      )}
                    </td>
                    <td>
                      {canWrite ? (
                        <input className="v50-input" style={{ minWidth: 220 }} value={r.lot_exp || ""}
                          onChange={(e) => editCell(r.id, { lot_exp: e.target.value })}
                          onBlur={(e) => persistCell(r.id, { lot_exp: e.target.value })} />
                      ) : (r.lot_exp || "-")}
                    </td>
                    <td>
                      {canWrite ? (
                        <select className="v50-input" style={{ minWidth: 140 }} value={r.functional_claim}
                          onChange={(e) => { const v = e.target.value as ShipmentRecord["functional_claim"]; editCell(r.id, { functional_claim: v }); persistCell(r.id, { functional_claim: v }); }}>
                          {FUNCTIONAL_CLAIM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : r.functional_claim}
                    </td>
                    <td>
                      {canWrite ? (
                        <select className="v50-input" style={{ minWidth: 110 }} value={r.heavy_metal_status}
                          onChange={(e) => { const v = e.target.value as ShipmentRecord["heavy_metal_status"]; editCell(r.id, { heavy_metal_status: v }); persistCell(r.id, { heavy_metal_status: v }); }}>
                          {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : r.heavy_metal_status}
                    </td>
                    <td>
                      {canWrite ? (
                        <select className="v50-input" style={{ minWidth: 110 }} value={r.microbial_status}
                          onChange={(e) => { const v = e.target.value as ShipmentRecord["microbial_status"]; editCell(r.id, { microbial_status: v }); persistCell(r.id, { microbial_status: v }); }}>
                          {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : r.microbial_status}
                    </td>
                    {canWrite && (
                      <td>
                        <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r)}>삭제</button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={canWrite ? 10 : 9} style={{ color: "#94a3b8" }}>{rows.length === 0 ? "등록된 출고 기록이 없습니다." : "검색 조건에 맞는 기록이 없습니다."}</td></tr>
              )}
              {loading && rows.length === 0 && (
                <tr><td colSpan={canWrite ? 10 : 9} style={{ color: "#94a3b8" }}>불러오는 중…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
