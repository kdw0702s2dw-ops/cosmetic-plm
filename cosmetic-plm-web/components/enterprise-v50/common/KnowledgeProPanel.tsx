"use client";

import { useV50KnowledgePro } from "@/hooks/useV50KnowledgeAdminPro";
import type { KnowledgeTab } from "@/types/enterpriseV50KnowledgeAdmin";

const tabs: KnowledgeTab[] = ["원료", "INCI", "규제", "상용성"];

export default function KnowledgeProPanel() {
  const s = useV50KnowledgePro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">지식DB PRO</h1>
          <p className="v50-desc">원료, INCI, CAS, 기능, 국가 규제, 상용성 정보를 한글 업무 화면에서 통합 검색합니다.</p>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="원료" value={String(s.summary?.raws ?? "-")} hint="원료 마스터" />
        <Kpi label="INCI" value={String(s.summary?.inci ?? "-")} hint="글로벌 INCI" />
        <Kpi label="규제" value={String(s.summary?.regulations ?? "-")} hint="국가별 규칙" />
        <Kpi label="상용성" value={String(s.summary?.compatibility ?? "-")} hint="혼합/안정성" />
      </section>

      <section className="v50-panel">
        <h2>지식 검색</h2>
        <div className="v50-flow" style={{ marginBottom: 12 }}>
          {tabs.map((t) => <button key={t} onClick={() => s.changeTab(t)}>{t}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="원료명, INCI, CAS, 규제 키워드를 검색하세요" />
          <button className="v50-button" onClick={() => s.search()}>검색</button>
        </div>
        <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
      </section>

      <section className="v50-panel">
        <h2>{s.tab} 결과</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>{Object.keys(s.rows[0] || { 안내: "" }).slice(0, 8).map((k) => <th key={k}>{translateHeader(k)}</th>)}</tr>
            </thead>
            <tbody>
              {s.rows.map((row, idx) => (
                <tr key={row.id || row.raw_code || row.inci_code || row.rule_code || row.compat_code || idx}>
                  {Object.keys(s.rows[0] || { 안내: "" }).slice(0, 8).map((k) => <td key={k}>{String(row[k] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function translateHeader(key: string) {
  const map: Record<string, string> = {
    raw_code: "원료코드",
    raw_name: "원료명",
    inci_en: "INCI 영문",
    inci_kr: "INCI 국문",
    cas_no: "CAS No.",
    ec_no: "EC No.",
    supplier: "공급사",
    unit_price: "단가",
    inci_code: "INCI 코드",
    inci_cn: "중국명",
    inci_jp: "일본명",
    function_en: "기능",
    country: "국가",
    keyword: "키워드",
    risk_type: "위험구분",
    rule_summary: "규제내용",
    ingredient_a: "성분 A",
    ingredient_b: "성분 B",
    status: "상태",
    risk_summary: "위험요약",
  };
  return map[key] || key;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
