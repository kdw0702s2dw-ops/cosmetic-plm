"use client";

import { useEnterpriseKnowledgeDb } from "@/hooks/useEnterpriseKnowledgeDb";
import KnowledgeBadge from "./common/KnowledgeBadge";

export default function EnterpriseKnowledgeDbDashboard() {
  const s = useEnterpriseKnowledgeDb();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise PLM v3.1 Knowledge Database Master Pack</h1>
        <p style={{ color: "#6b7280" }}>
          INCI, 규제, 처방 라이브러리, 원료 상용성 데이터를 PLM 지식 기반으로 연결합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {s.stats.map((x) => (
            <div key={x.table} style={card()}>
              <strong>{x.module}</strong>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>{x.count}</div>
              <KnowledgeBadge value={x.status} />
            </div>
          ))}
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>Knowledge Search</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => s.changeTab("INCI")}>Global INCI</button>
          <button onClick={() => s.changeTab("REG")}>Regulation</button>
          <button onClick={() => s.changeTab("LIB")}>Formula Library</button>
          <button onClick={() => s.changeTab("COMP")}>Compatibility</button>
          <input style={input()} value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="검색어 입력" />
          <button onClick={() => s.search()}>Search</button>
        </div>
        <p>현재 탭: <strong>{s.tab}</strong></p>
        <div style={{ overflowX: "auto" }}>
          <table style={table()}>
            <thead>
              <tr>{Object.keys(s.rows[0] || { empty: "" }).map((k) => <th key={k}>{k}</th>)}</tr>
            </thead>
            <tbody>
              {s.rows.map((row, idx) => (
                <tr key={row.id || idx}>
                  {Object.keys(s.rows[0] || { empty: "" }).map((k) => <td key={k}>{String(row[k] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function card(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#f8fafc" };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 280 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
