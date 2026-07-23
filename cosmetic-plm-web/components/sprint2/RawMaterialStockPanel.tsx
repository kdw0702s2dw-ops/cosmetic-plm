"use client";

import { useEffect, useMemo, useState } from "react";
import { useRawMaterialStockCheck } from "@/hooks/useRawMaterialStockCheck";
import "@/styles/enterprise-v50.css";

const PAGE_SIZE = 20;

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export default function RawMaterialStockPanel() {
  const s = useRawMaterialStockCheck();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [s.ledgerDate]);

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return s.rows;
    return s.rows.filter(
      (r) => r.raw_code.toLowerCase().includes(term) || r.raw_name.toLowerCase().includes(term)
    );
  }, [s.rows, searchTerm]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        날짜를 선택하고 원료별 금일사용량을 입력하면 최종재고량이 자동 계산되어 다음 날 현재재고량으로 이어집니다.
        (대상: 1ACA, 1BSA, 1CLA, 1FRA, 1OLA, 1LQA, 1WXA로 시작하는 원료)
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>날짜 선택</h2>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, maxWidth: 220 }}>
          원장 날짜
          <input className="v50-input" type="date" value={s.ledgerDate} onChange={(e) => s.setLedgerDate(e.target.value)} />
        </label>
      </section>

      <section className="v50-panel">
        <h2>대상 원료 재고</h2>
        <input
          className="v50-input" style={{ marginTop: 8, maxWidth: 320 }}
          placeholder="원료코드 또는 원료명 검색"
          value={searchTerm}
          onChange={(e) => updateSearchTerm(e.target.value)}
        />
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead>
              <tr>
                <th>원료코드</th><th>원료명</th><th>현재재고량</th><th>금일사용량</th><th>최종재고량</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.raw_code}>
                  <td>{r.raw_code}</td>
                  <td>{r.raw_name}</td>
                  <td>
                    {r.openingEditable ? (
                      <div>
                        <input
                          className="v50-input" type="number" style={{ width: 120 }}
                          value={r.opening_stock || ""}
                          onChange={(e) => s.updateOpeningBaseline(r.raw_code, e.target.value)}
                        />
                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>최초 등록 - 초기 재고량 입력 필요</div>
                      </div>
                    ) : (
                      fmt(r.opening_stock)
                    )}
                  </td>
                  <td>
                    <input
                      className="v50-input" type="number" style={{ width: 120 }}
                      value={r.usage_today || ""}
                      onChange={(e) => s.updateUsage(r.raw_code, e.target.value)}
                    />
                  </td>
                  <td style={{ fontWeight: 800 }}>{fmt(r.closing_stock)}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    {s.loading ? "불러오는 중..." : totalCount === 0 && searchTerm ? "검색 결과가 없습니다." : "대상 원료가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            전체 {totalCount}건 중 {rangeStart}-{rangeEnd}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="v50-button-light"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              이전
            </button>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{currentPage} / {totalPages}</span>
            <button
              className="v50-button-light"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              다음
            </button>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="v50-button" onClick={s.save} disabled={s.saving || s.rows.length === 0}>{s.saving ? "저장 중…" : "저장"}</button>
        </div>
      </section>
    </div>
  );
}
