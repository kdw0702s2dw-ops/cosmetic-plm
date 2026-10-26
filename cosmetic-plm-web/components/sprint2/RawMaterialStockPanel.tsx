"use client";

import { useEffect, useMemo, useState } from "react";
import { useRawMaterialStockCheck } from "@/hooks/useRawMaterialStockCheck";
import DecimalInput from "@/components/common/DecimalInput";
import Toast from "@/components/common/Toast";
import "@/styles/enterprise-v50.css";

const PAGE_SIZE = 20;

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function fmtKg(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${fmt(v)}kg`;
}

function sumUsage(entries: number[]) {
  return entries.reduce((a, b) => a + b, 0);
}

export default function RawMaterialStockPanel({ refreshTick }: { refreshTick?: number } = {}) {
  const s = useRawMaterialStockCheck(refreshTick);

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
        날짜를 선택하고 원료별 입고재고량·금일사용량을 입력하면 최종재고량(현재재고량 + 입고재고량 - 금일사용량)이
        자동 계산되어 다음 날 현재재고량으로 이어집니다. 금일사용량은 하루에 여러 번 나눠 썼으면 &ldquo;+ 사용 추가&rdquo;로
        칸을 늘려 각각 입력하세요(최대 10칸, 합계가 금일사용량으로 저장됩니다).
        (대상: 1ACA, 1BSA, 1CLA, 1FRA, 1OLA, 1LQA, 1WXA로 시작하는 원료)
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}
      <Toast toast={s.toast} onClose={() => s.setToast(null)} />

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>날짜 선택</h2>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, maxWidth: 220 }}>
          원장 날짜
          <input className="v50-input" type="date" value={s.ledgerDate} onChange={(e) => s.setLedgerDate(e.target.value)} />
        </label>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>오늘 제조한 처방으로 금일사용량 자동 반영</h2>
        <p className="v50-desc" style={{ marginBottom: 10 }}>
          처방을 검색해서 제조 목록에 담고 제조량(kg)을 입력하세요. 목록에 담긴 처방들의 BOM 비율대로
          재고 관리 대상 원료의 금일사용량을 자동으로 계산합니다. 당일에 여러 처방을 제조했다면 전부
          목록에 담은 뒤 한 번에 반영하면 됩니다(같은 원료를 여러 처방이 쓰면 자동으로 합산됩니다).
          &ldquo;반영&rdquo;을 눌러도 아래 표의 금일사용량 칸만 채워질 뿐 바로 저장되지는 않으니, 내용을
          확인한 뒤 맨 아래 &ldquo;저장&rdquo;을 눌러야 합니다.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="v50-input" style={{ maxWidth: 300 }} value={s.qtyKeyword}
            onChange={(e) => s.setQtyKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && s.searchQtyFormulas()}
            placeholder="처방코드/처방명/확정코드 검색"
          />
          <button className="v50-button-light" onClick={s.searchQtyFormulas} disabled={s.qtySearching}>
            {s.qtySearching ? "검색 중…" : "검색"}
          </button>
        </div>

        {s.qtyFormulas.length > 0 && (
          <div className="v50-table-wrap" style={{ marginBottom: 10 }}>
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
              <tbody>
                {s.qtyFormulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                    <td><button className="v50-button-light" onClick={() => s.stageQtyFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {s.qtyStaged && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
            <span style={{ fontWeight: 800 }}>
              {s.qtyStaged.formula_code} · {s.qtyStaged.formula_name} · Rev {s.qtyStaged.revision} · 확정코드 {s.qtyStaged.confirmed_code || "-"}
            </span>
            <input
              className="v50-input" type="number" style={{ width: 120 }} value={s.qtyStagedQtyKg}
              onChange={(e) => s.setQtyStagedQtyKg(e.target.value)} placeholder="제조량(kg)"
            />
            <button className="v50-button-light" onClick={s.addQtyStagedToList} disabled={s.qtyAdding}>
              {s.qtyAdding ? "담는 중…" : "제조 목록에 담기"}
            </button>
            <button className="v50-button-light" onClick={s.cancelQtyStaged}>취소</button>
          </div>
        )}

        {s.manufacturingList.length > 0 && (
          <>
            <div className="v50-table-wrap" style={{ marginBottom: 10 }}>
              <table className="v50-table">
                <thead><tr><th>처방코드</th><th>처방명</th><th>확정코드</th><th>제조량(kg)</th><th></th></tr></thead>
                <tbody>
                  {s.manufacturingList.map((item, idx) => (
                    <tr key={`${item.formula_code}-${item.revision}`}>
                      <td>{item.formula_code}</td>
                      <td>{item.formula_name || "-"}</td>
                      <td>{item.confirmed_code || "-"}</td>
                      <td>
                        <DecimalInput
                          className="v50-input" style={{ width: 100 }}
                          value={item.target_qty_kg}
                          onChange={(v) => s.updateManufacturingListQty(idx, v)}
                        />
                      </td>
                      <td><button className="v50-button-light" onClick={() => s.removeFromManufacturingList(idx)}>삭제</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {s.requiredUsagePreview.length > 0 ? (
              <div className="v50-table-wrap" style={{ marginBottom: 10 }}>
                <table className="v50-table">
                  <thead><tr><th>원료코드</th><th>원료명</th><th>계산된 사용량(kg)</th></tr></thead>
                  <tbody>
                    {s.requiredUsagePreview.map((r) => (
                      <tr key={r.raw_code}>
                        <td>{r.raw_code}</td><td>{r.raw_name}</td><td style={{ fontWeight: 800 }}>{fmtKg(r.required_qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#b45309", fontSize: 13 }}>
                담긴 처방에 재고 관리 대상 원료(1ACA/1BSA/1CLA/1FRA/1OLA/1LQA/1WXA)가 없습니다.
              </p>
            )}

            <button className="v50-button" onClick={s.applyManufacturingUsage}>금일사용량에 반영</button>
          </>
        )}
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
                <th>원료코드</th><th>원료명</th><th>현재재고량(kg)</th><th>입고재고량(kg)</th><th>금일사용량(kg)</th><th>최종재고량(kg)</th>
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
                        <DecimalInput
                          className="v50-input" style={{ width: 120 }}
                          value={r.opening_stock}
                          onChange={(v) => s.updateOpeningBaseline(r.raw_code, v)}
                        />
                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>최초 등록 - 초기 재고량 입력 필요</div>
                      </div>
                    ) : (
                      <div>
                        {fmtKg(r.opening_stock)}
                        {r.openingMismatch && (
                          <div style={{ fontSize: 11, color: "#b45309", marginTop: 2, maxWidth: 160 }}>
                            ⚠ 전일({r.openingMismatch.priorDate}) 최종재고량({fmtKg(r.openingMismatch.priorClosing)})과 다름 -
                            이후에 전일 날짜가 수정된 것으로 보입니다. 필요하면 이 날짜를 다시 확인하세요.
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <DecimalInput
                      className="v50-input" style={{ width: 120 }}
                      value={r.incoming_stock}
                      onChange={(v) => s.updateIncoming(r.raw_code, v)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      {r.usage_entries.map((v, i) => (
                        <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <DecimalInput
                            className="v50-input" style={{ width: 120 }}
                            value={v}
                            onChange={(val) => s.updateUsageEntry(r.raw_code, i, val)}
                          />
                          {r.usage_entries.length > 1 && (
                            <button
                              type="button"
                              className="v50-button-light"
                              style={{ padding: "2px 8px" }}
                              onClick={() => s.removeUsageEntry(r.raw_code, i)}
                              title="이 칸 삭제"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="v50-button-light"
                        style={{ fontSize: 12, padding: "2px 8px" }}
                        onClick={() => s.addUsageEntry(r.raw_code)}
                        disabled={r.usage_entries.length >= s.MAX_USAGE_ENTRIES}
                      >
                        + 사용 추가 ({r.usage_entries.length}/{s.MAX_USAGE_ENTRIES})
                      </button>
                      {r.usage_entries.length > 1 && (
                        <div style={{ fontWeight: 800, fontSize: 13 }}>합계: {fmtKg(sumUsage(r.usage_entries))}</div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800 }}>{fmtKg(r.closing_stock)}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6}>
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
