"use client";

import { useState } from "react";
import { fetchSprint1Formulas } from "@/services/sprint1/formulaCoreService";

// "처방 불러오기" - 원처방/공개처방(일반)/공개처방(건조) 세 탭 어디서나 쓰는 공용 모달.
// 다른 처방을 검색해서 고르면 onPick(formulaCode, revision)이 호출되고, 실제로 어느 편집중인
// 화면(BOM)에 채울지는 호출한 쪽(useSprint1FormulaCore.loadFormulaFromCode)이 현재 열려있는
// 탭 기준으로 판단한다 - 이 모달은 "무엇을 고르는지"만 책임진다.
export default function FormulaLoadModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (formulaCode: string, revision: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    setLoading(true);
    try {
      const data = await fetchSprint1Formulas(keyword);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 12, padding: 20, width: 560, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>처방 불러오기</h3>
          <button type="button" className="v50-button-light" onClick={onClose}>닫기</button>
        </div>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 0 }}>
          선택한 처방의 원처방 BOM을 지금 편집 중인 탭에 통째로 불러옵니다. 화면에서 "저장"을 눌러야 실제로 반영됩니다.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="v50-input"
            style={{ flex: 1 }}
            placeholder="처방코드, 처방명, 고객사 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            autoFocus
          />
          <button type="button" className="v50-button" onClick={runSearch} disabled={loading}>검색</button>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {results.map((f) => (
            <button
              key={`${f.formula_code}|${f.revision}`}
              type="button"
              className="v50-button-light"
              style={{ textAlign: "left", display: "flex", justifyContent: "space-between", gap: 10, width: "100%" }}
              onClick={() => onPick(f.formula_code, f.revision)}
            >
              <span>{f.formula_name} ({f.formula_code}) · Rev {f.revision}</span>
              <span style={{ color: "#64748b", flexShrink: 0 }}>{f.customer || ""}</span>
            </button>
          ))}
          {searched && results.length === 0 && !loading && (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
