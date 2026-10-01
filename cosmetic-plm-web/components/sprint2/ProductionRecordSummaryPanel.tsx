"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllProductionRecords, type ProductionRecord } from "@/services/sprint2/productionRecordService";
import "@/styles/enterprise-v50.css";

function fmt(v: number) {
  if (Number.isNaN(v)) return "-";
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// 선택한 연도(+월)에 해당하는 생산일자 범위(YYYY-MM-DD)를 계산한다. 월을 "전체"로 두면 그 해 전체가 범위가 된다.
function dateRangeOf(year: number, month: number | null): { dateFrom: string; dateTo: string } {
  if (month == null) {
    return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
  }
  const lastDay = new Date(year, month, 0).getDate(); // month는 1~12, new Date(y, m, 0)은 그 달의 마지막 날
  return { dateFrom: `${year}-${pad2(month)}-01`, dateTo: `${year}-${pad2(month)}-${pad2(lastDay)}` };
}

type FormulaSummary = {
  key: string;
  formula_code: string;
  formula_name: string;
  revision: string;
  count: number;
  targetQtyKg: number;
  coating: number;
  molded: number;
  ea: number;
  pack: number;
};

/**
 * 월별·연도별 생산량 집계 - 연도(+월, "전체"=연도 전체) 기준으로 처방별 코팅량/성형품 수량/
 * 완제품 출고 수량(EA·PACK) 합계를 보여준다("월별, 년도별로 처방에 대한 생산량 확인" 요청사항).
 */
export default function ProductionRecordSummaryPanel() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState<number | null>(null); // null = 전체(연도 집계)
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (y: number, m: number | null) => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = dateRangeOf(y, m);
      setRecords(await fetchAllProductionRecords({ dateFrom, dateTo }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "조회 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year, month); }, [year, month]); // eslint-disable-line

  const rows: FormulaSummary[] = useMemo(() => {
    const map = new Map<string, FormulaSummary>();
    for (const r of records) {
      const key = `${r.formula_code}__${r.revision}`;
      if (!map.has(key)) {
        map.set(key, {
          key, formula_code: r.formula_code, formula_name: r.formula_name || "-", revision: r.revision,
          count: 0, targetQtyKg: 0, coating: 0, molded: 0, ea: 0, pack: 0,
        });
      }
      const g = map.get(key)!;
      g.count += 1;
      g.targetQtyKg += r.target_qty_kg || 0;
      g.coating += r.coating_qty || 0;
      g.molded += r.molded_qty || 0;
      g.ea += r.shipped_qty_ea || 0;
      g.pack += r.shipped_qty_pack || 0;
    }
    return Array.from(map.values()).sort((a, b) => a.formula_code.localeCompare(b.formula_code));
  }, [records]);

  const grandTotal = useMemo(
    () => rows.reduce(
      (acc, g) => ({
        count: acc.count + g.count, coating: acc.coating + g.coating, molded: acc.molded + g.molded,
        ea: acc.ea + g.ea, pack: acc.pack + g.pack,
      }),
      { count: 0, coating: 0, molded: 0, ea: 0, pack: 0 }
    ),
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
        연도(또는 연도+월) 기준으로 처방별 생산량(코팅량·성형품 수량·완제품 출고 수량)을 집계합니다. 월을
        &quot;전체&quot;로 두면 그 해 전체 집계(연도별), 특정 월을 고르면 그 달만 집계(월별)됩니다.
      </p>
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
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
          {loading && <span style={{ color: "#64748b", fontSize: 13 }}>조회 중…</span>}
        </div>

        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>처방코드</th><th>처방명</th><th>Rev</th><th>생산 건수</th>
                <th>코팅량 합계 (단위: m)</th><th>성형품 수량 합계 (단위: EA)</th>
                <th>출고수량 합계(EA)</th><th>출고수량 합계(PACK)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.key}>
                  <td>{g.formula_code}</td>
                  <td>{g.formula_name}</td>
                  <td>{g.revision}</td>
                  <td>{g.count}</td>
                  <td>{fmt(g.coating)}</td>
                  <td>{fmt(g.molded)}</td>
                  <td>{fmt(g.ea)}</td>
                  <td>{fmt(g.pack)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} style={{ color: "#94a3b8" }}>{loading ? "불러오는 중..." : "해당 기간에 생산실적이 없습니다."}</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                  <td colSpan={3} style={{ textAlign: "right" }}>전체 합계</td>
                  <td>{grandTotal.count}</td>
                  <td>{fmt(grandTotal.coating)}</td>
                  <td>{fmt(grandTotal.molded)}</td>
                  <td>{fmt(grandTotal.ea)}</td>
                  <td>{fmt(grandTotal.pack)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
