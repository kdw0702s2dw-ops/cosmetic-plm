"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchShipmentRecords, type ShipmentRecord } from "@/services/sprint2/shipmentRecordService";
import "@/styles/enterprise-v50.css";

function fmtQty(q: number | null) {
  return q === null || q === undefined ? "-" : q.toLocaleString("ko-KR");
}

type CustomerGroup = {
  key: string;
  name: string;
  rows: ShipmentRecord[];
  totalQty: number;
};

/**
 * 출고관리 > 업체별 보기 - 고객사별로 섹션을 나눠서 출고 건수·수량 합계와 세부 내역을 보여준다
 * (요청사항: "업체별로 볼 수 있는 기능도 만들어줘"). 수정은 "전체 목록" 탭에서 하고, 여기는 조회 전용.
 */
export default function ShipmentCustomerViewPanel() {
  const [rows, setRows] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

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

  const kw = keyword.trim().toLowerCase();
  const groups: CustomerGroup[] = useMemo(() => {
    const map = new Map<string, CustomerGroup>();
    for (const r of rows) {
      const name = r.customer?.trim() || "고객사 미지정";
      const key = name;
      if (!map.has(key)) map.set(key, { key, name, rows: [], totalQty: 0 });
      const g = map.get(key)!;
      g.rows.push(r);
      g.totalQty += r.quantity || 0;
    }
    const all = Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name, "ko"));
    if (!kw) return all;
    return all.filter((g) => g.name.toLowerCase().includes(kw));
  }, [rows, kw]);

  const overallCount = rows.length;
  const overallQty = useMemo(() => rows.reduce((s, r) => s + (r.quantity || 0), 0), [rows]);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        고객사별로 출고 내역을 묶어서 보여줍니다. 각 고객사 섹션 상단에 출고 건수와 수량 합계가 표시됩니다.
      </p>

      {errorMsg && <p style={{ color: "#dc2626", fontWeight: 800 }}>{errorMsg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>업체별 출고 현황</h2>
          <div style={{ display: "flex", gap: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>전체 출고 건수 {overallCount}건</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>전체 수량 합계 {overallQty.toLocaleString("ko-KR")}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          <input className="v50-input" style={{ flex: 1, maxWidth: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="고객사명 검색" />
          <button className="v50-button-light" onClick={() => load()} disabled={loading}>{loading ? "새로고침 중…" : "새로고침"}</button>
        </div>

        {!loading && groups.length === 0 && <p style={{ color: "#94a3b8" }}>표시할 출고 내역이 없습니다.</p>}

        {groups.map((g) => (
          <div key={g.key} style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{g.name}</strong>
              <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700, color: "#475569" }}>
                <span>건수 {g.rows.length}건</span>
                <span>수량 합계 {g.totalQty.toLocaleString("ko-KR")}</span>
              </div>
            </div>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>출고일</th><th>수량</th><th>제품코드</th><th>제품명</th><th>LOT (EXP)</th>
                    <th>기능성</th><th>중금속</th><th>미생물</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.shipment_date || "-"}</td>
                      <td>{fmtQty(r.quantity)}</td>
                      <td>{r.product_code || "-"}</td>
                      <td>{r.product_name || "-"}</td>
                      <td>{r.lot_exp || "-"}</td>
                      <td>{r.functional_claim}</td>
                      <td>{r.heavy_metal_status}</td>
                      <td>{r.microbial_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
