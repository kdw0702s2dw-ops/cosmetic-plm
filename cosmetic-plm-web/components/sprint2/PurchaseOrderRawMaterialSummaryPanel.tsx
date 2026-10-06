"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPurchaseOrderRawMaterialSummary,
  type RawMaterialPurchaseOrderSummaryRow,
} from "@/services/sprint2/purchaseOrderService";
import "@/styles/enterprise-v50.css";

function formatCurrency(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("ko-KR");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// 선택한 연도(+월)에 해당하는 발주일 범위(YYYY-MM-DD)를 계산한다. 월을 "전체"로 두면 그 해 전체가 범위가 된다.
function dateRangeOf(year: number, month: number | null): { dateFrom: string; dateTo: string } {
  if (month == null) {
    return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
  }
  const lastDay = new Date(year, month, 0).getDate(); // month는 1~12, new Date(y, m, 0)은 그 달의 마지막 날
  return { dateFrom: `${year}-${pad2(month)}-01`, dateTo: `${year}-${pad2(month)}-${pad2(lastDay)}` };
}

/**
 * 원료별 발주금액 집계 - 원료 코드/명칭으로 검색하고, 연도(+월, "전체"=연도 전체) 기준으로 원료별
 * 총 발주 금액(총액=부가세 포함 기준, 취소건 제외)을 확인한다.
 * ("원료 코드 또는 명칭으로 검색해서 월별, 년도별 원료의 총 발주 금액을 확인" 요청사항)
 */
export default function PurchaseOrderRawMaterialSummaryPanel() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState<number | null>(null); // null = 전체(연도 집계)
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<RawMaterialPurchaseOrderSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (y: number, m: number | null, kw: string) => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = dateRangeOf(y, m);
      setRows(await fetchPurchaseOrderRawMaterialSummary({ dateFrom, dateTo, keyword: kw }));
      setMsg("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "조회 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year, month, keyword); }, [year, month]); // eslint-disable-line

  const grandTotal = useMemo(
    () => rows.reduce((acc, g) => ({ count: acc.count + g.item_count, total: acc.total + g.total_amount_sum }), { count: 0, total: 0 }),
    [rows]
  );

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = thisYear + 1; y >= thisYear - 5; y--) years.push(y);
    return years;
  }, [thisYear]);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        원료 코드 또는 명칭으로 검색하고, 연도(또는 연도+월) 기준으로 원료별 총 발주 금액(총액·부가세 포함)을
        집계합니다. 월을 &quot;전체&quot;로 두면 그 해 전체 집계(연도별), 특정 월을 고르면 그 달만 집계(월별)됩니다.
        취소된 발주는 집계에서 제외됩니다.
      </p>
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="검색(원료코드/원료명/Trade Name)">
            <input className="v50-input" style={{ minWidth: 220 }} value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(year, month, keyword)} />
          </Field>
          <Field label="연도">
            <select className="v50-input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </Field>
          <Field label="월">
            <select className="v50-input" value={month ?? ""} onChange={(e) => setMonth(e.target.value === "" ? null : Number(e.target.value))}>
              <option value="">전체(연도 집계)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
            </select>
          </Field>
          <button className="v50-button" onClick={() => load(year, month, keyword)} disabled={loading}>{loading ? "조회 중…" : "검색"}</button>
        </div>

        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>원료코드</th><th>원료명</th><th>Trade Name</th><th>발주 건수</th><th>총 발주 금액(원)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.raw_code}>
                  <td style={{ fontWeight: 700 }}>{g.raw_code}</td>
                  <td>{g.raw_name || "-"}</td>
                  <td>{g.trade_name || "-"}</td>
                  <td>{g.item_count}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(g.total_amount_sum)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ color: "#94a3b8" }}>{loading ? "불러오는 중..." : "해당 조건에 발주 내역이 없습니다."}</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={3} style={{ textAlign: "right" }}>전체 합계</td>
                  <td>{grandTotal.count}</td>
                  <td>{formatCurrency(grandTotal.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
