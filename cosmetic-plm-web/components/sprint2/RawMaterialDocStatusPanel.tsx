"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRawMaterialDocumentStatus,
  getDocumentPublicUrl,
  requiredDocTypesForRawCode,
  ALL_DOC_TYPES,
  DOC_TYPE_LABEL,
  type DocType,
  type RawMaterialDocumentStatusRow,
} from "@/services/sprint2/rawMaterialDocumentService";

interface Props {
  // 이 화면에서 특정 원료를 클릭했을 때 "원료 목록" 화면으로 돌아가 해당 원료 편집으로 이동시키기 위한 콜백.
  onSelectMaterial: (rawCode: string) => void;
}

type FilterMode = "all" | "missing" | "complete";
type DocTypeFilter = "ALL" | DocType;
type DocPresenceFilter = "all" | "has" | "missing";

// 원료마다 필요한 서류가 달라서(향료만 Allergen Sheet/IFRA 발급), 그 원료에 실제로 필요한 서류
// 중에서 없는 것만 "누락"으로 센다 - 필요 없는 서류는 비어 있어도 누락이 아니다.
function missingCount(row: RawMaterialDocumentStatusRow) {
  const required = requiredDocTypesForRawCode(row.raw_code);
  return required.filter((t) => !row.docs[t]).length;
}

/**
 * 원료관리 > 서류 현황 - 활성 원료 전체를 대상으로 COA/MSDS/Composition/Allergen Sheet/IFRA
 * 업로드 여부를 한눈에 점검하는 화면. 목록 화면(원료 목록)과 달리 100건 제한 없이 전체를 보여준다.
 * 향료 원료(1FRA*, Z...F)만 Allergen Sheet/IFRA를 기준에 포함하고, 그 외 원료는 COA/MSDS/Composition
 * 3종만 기준으로 삼는다(requiredDocTypesForRawCode).
 *
 * 검색은 코드/원료명뿐 아니라 등록된 공급사명으로도 가능하고, 특정 문서 종류 하나를 골라 그 서류만
 * 보유/미보유 여부로 좁혀볼 수도 있다(전체 누락 기준과는 별개로, 원료가 향료인지와 무관하게 단순히
 * "이 원료에 이 파일이 있는가"만 확인하는 용도).
 */
export default function RawMaterialDocStatusPanel({ onSelectMaterial }: Props) {
  const [rows, setRows] = useState<RawMaterialDocumentStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>("ALL");
  const [docPresence, setDocPresence] = useState<DocPresenceFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setRows(await fetchRawMaterialDocumentStatus());
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "서류 현황 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 특정 문서 종류를 선택했을 때 보유/미보유 건수를 드롭다운 라벨에 함께 보여주기 위한 집계
  const docTypeHasCount = docTypeFilter !== "ALL" ? rows.filter((r) => !!r.docs[docTypeFilter]).length : 0;

  const kw = keyword.trim().toLowerCase();
  const totalMissing = rows.filter((r) => missingCount(r) > 0).length;
  const filtered = rows.filter((r) => {
    if (kw) {
      const supplier = (r.supplier || "").toLowerCase();
      if (!r.raw_code.toLowerCase().includes(kw) && !r.raw_name.toLowerCase().includes(kw) && !supplier.includes(kw)) {
        return false;
      }
    }
    const missing = missingCount(r);
    if (filter === "missing" && missing === 0) return false;
    if (filter === "complete" && missing > 0) return false;
    if (docTypeFilter !== "ALL") {
      const has = !!r.docs[docTypeFilter];
      if (docPresence === "has" && !has) return false;
      if (docPresence === "missing" && has) return false;
    }
    return true;
  });

  return (
    <section className="v50-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>서류 현황</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            원료별 COA / MSDS / Composition / Allergen Sheet / IFRA 업로드 여부를 확인합니다. 코드·원료명·공급사명으로 검색할 수 있고, 코드·원료명을 클릭하면 해당 원료 편집 화면으로 이동합니다.
            <br />
            향료 원료(코드가 1FRA로 시작하거나, Z로 시작하면서 F로 끝나는 경우)만 Allergen Sheet/IFRA를 누락 기준에 포함합니다 — 그 외 원료는 해당 두 서류가 없어도 누락으로 계산하지 않습니다(회색 <b>–</b>로 표시).
          </p>
        </div>
        <button className="v50-button-light" onClick={() => load()} disabled={loading}>
          {loading ? "새로고침 중…" : "새로고침"}
        </button>
      </div>

      {errorMsg && <p style={{ color: "#dc2626", fontWeight: 800 }}>{errorMsg}</p>}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
        <input
          className="v50-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="코드/원료명/공급사명 검색"
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
        />
        <select className="v50-input" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value as FilterMode)}>
          <option value="all">전체 상태 ({rows.length})</option>
          <option value="missing">서류 누락 있음 ({totalMissing})</option>
          <option value="complete">서류 전체 보유 ({rows.length - totalMissing})</option>
        </select>
      </div>

      {/* 문서 종류 하나를 골라 보유/미보유만 따로 확인하는 필터 - 위의 "전체 상태" 필터와 별개로 함께 적용된다 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "0 0 12px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>문서 종류별 확인:</span>
        <select
          className="v50-input"
          style={{ width: 180 }}
          value={docTypeFilter}
          onChange={(e) => { setDocTypeFilter(e.target.value as DocTypeFilter); setDocPresence("all"); }}
        >
          <option value="ALL">전체 문서 종류</option>
          {ALL_DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}
        </select>
        {docTypeFilter !== "ALL" && (
          <select className="v50-input" style={{ width: 180 }} value={docPresence} onChange={(e) => setDocPresence(e.target.value as DocPresenceFilter)}>
            <option value="all">전체 ({rows.length})</option>
            <option value="has">보유 ({docTypeHasCount})</option>
            <option value="missing">미보유 ({rows.length - docTypeHasCount})</option>
          </select>
        )}
      </div>

      <div className="v50-table-wrap" style={{ maxHeight: 520, overflow: "auto" }}>
        <table className="v50-table">
          <thead>
            <tr>
              <th>코드</th>
              <th>원료명</th>
              <th>공급사</th>
              {ALL_DOC_TYPES.map((t) => <th key={t} style={{ textAlign: "center" }}>{DOC_TYPE_LABEL[t]}</th>)}
              <th style={{ textAlign: "center" }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const missing = missingCount(row);
              const required = new Set(requiredDocTypesForRawCode(row.raw_code));
              return (
                <tr key={row.id}>
                  <td style={{ cursor: "pointer" }} onClick={() => onSelectMaterial(row.raw_code)}>{row.raw_code}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => onSelectMaterial(row.raw_code)}>{row.raw_name}</td>
                  <td>{row.supplier || "-"}</td>
                  {ALL_DOC_TYPES.map((t: DocType) => {
                    const doc = row.docs[t];
                    const isRequired = required.has(t);
                    return (
                      <td key={t} style={{ textAlign: "center" }}>
                        {doc ? (
                          <a
                            href={getDocumentPublicUrl(doc.storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${doc.file_name} · ${new Date(doc.uploaded_at).toLocaleDateString("ko-KR")}`}
                            style={{ color: "#16a34a", fontWeight: 800, textDecoration: "none" }}
                          >
                            ✓
                          </a>
                        ) : isRequired ? (
                          <span style={{ color: "#dc2626", fontWeight: 800 }} title="미보유">✗</span>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontWeight: 700 }} title="이 원료에는 해당 서류가 필요하지 않습니다">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", color: missing > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }}>
                    {missing > 0 ? `누락 ${missing}건` : "완료"}
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={ALL_DOC_TYPES.length + 4} style={{ color: "#94a3b8" }}>조건에 맞는 원료가 없습니다.</td></tr>
            )}
            {loading && rows.length === 0 && (
              <tr><td colSpan={ALL_DOC_TYPES.length + 4} style={{ color: "#94a3b8" }}>불러오는 중…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
