"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllProductionRecords, deleteProductionRecord,
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

/**
 * 생산실적 전체 목록 - 처방을 먼저 선택하지 않아도 지금까지 입력된 모든 생산실적을 검색·조회한다.
 * ("지금 처방으로 검색해서 보게 만들어져 있는데 생산실적 입력한 것들은 리스트로 볼수 있게 해줘" 요청사항)
 */
export default function ProductionRecordListPanel() {
  const [filter, setFilter] = useState<ProductionRecordListFilter>({});
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
      await load(filter);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제 오류");
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

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방 선택 없이 지금까지 입력된 모든 생산실적을 검색·조회합니다.
      </p>
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="검색(처방코드/처방명/Lot No.)">
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
                <th>생산일자</th><th>처방코드</th><th>처방명</th><th>Rev</th><th>Lot No.</th>
                <th>목표 제조량(kg)</th><th>코팅량 (단위: m)</th><th>성형품 수량 (단위: EA)</th>
                <th>출고수량(EA)</th><th>출고수량(PACK)</th><th>비고</th><th style={{ width: 70 }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.production_date}</td>
                  <td>{r.formula_code}</td>
                  <td>{r.formula_name || "-"}</td>
                  <td>{r.revision}</td>
                  <td>{r.lot_no}</td>
                  <td>{fmt(r.target_qty_kg)}</td>
                  <td>{fmt(r.coating_qty)}</td>
                  <td>{fmt(r.molded_qty)}</td>
                  <td>{fmt(r.shipped_qty_ea)}</td>
                  <td>{fmt(r.shipped_qty_pack)}</td>
                  <td>{r.note || "-"}</td>
                  <td><button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r.id!)}>삭제</button></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={12} style={{ color: "#94a3b8" }}>{loading ? "불러오는 중..." : "생산실적이 없습니다."}</td></tr>}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={6} style={{ textAlign: "right" }}>합계</td>
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
