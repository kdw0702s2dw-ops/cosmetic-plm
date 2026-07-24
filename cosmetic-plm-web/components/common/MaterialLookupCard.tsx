"use client";

import { useState } from "react";
import { searchMaterialsAutocomplete, type Material } from "@/services/sprint2/materialService";

// 불용성/수용성 HG에서 부자재 규격·10x10cm 중량을 참고용으로 조회하는 카드.
// 자동입력 없음 - 사용자가 결과를 보고 원하는 입력란에 직접 타이핑해서 넣는다.
export default function MaterialLookupCard() {
  const [keyword, setKeyword] = useState("");
  const [hits, setHits] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    setLoading(true);
    try {
      setHits(await searchMaterialsAutocomplete(keyword));
      setSearched(true);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="v50-panel" style={{ marginBottom: 18 }}>
      <h2>부자재 조회</h2>
      <p className="v50-desc" style={{ marginBottom: 10 }}>
        부자재코드/명으로 검색해서 규격·10x10cm 중량을 확인한 뒤, 아래 입력값에 필요한 값을 직접 입력하세요. (자동입력 없음)
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="부자재코드/명 검색" onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="v50-button" onClick={search} disabled={loading}>{loading ? "검색 중…" : "검색"}</button>
      </div>
      {searched && (
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>부자재코드</th><th>부자재명</th><th>규격</th><th>10x10cm 중량</th></tr></thead>
            <tbody>
              {hits.map((m) => (
                <tr key={m.material_code}>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td>{m.spec || "-"}</td>
                  <td>{m.weight_10x10cm ?? "-"}</td>
                </tr>
              ))}
              {hits.length === 0 && <tr><td colSpan={4}>검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
