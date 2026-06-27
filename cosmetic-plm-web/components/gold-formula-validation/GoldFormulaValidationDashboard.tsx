"use client";

import { useGoldFormulaValidation } from "@/hooks/useGoldFormulaValidation";
import ValidationBadge from "./common/ValidationBadge";

export default function GoldFormulaValidationDashboard() {
  const s = useGoldFormulaValidation();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 02-C1 Formula Validation Engine</h1>
        <p style={{ color: "#6b7280" }}>
          실제 Supabase 처방 데이터를 기준으로 100% 합계, Phase, 중복 원료, INCI 누락, 문서 상태, 금지 키워드 등을 자동 검증합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.formulas.length} />
          <Kpi title="Runs" value={s.runs.length} />
          <Kpi title="Issues" value={s.issues.length} />
          <Kpi title="Selected" value={s.selectedFormula ? `${s.selectedFormula.formula_code}/${s.selectedFormula.revision}` : "-"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Selection</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="처방코드, 처방명 검색" />
          <button onClick={() => s.loadFormulas(s.search)} disabled={s.loading}>Search</button>
        </div>
        <table style={table()}>
          <thead>
            <tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Lines</th><th>Valid</th><th>Open</th></tr>
          </thead>
          <tbody>
            {s.formulas.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.status}</td>
                <td>{x.total_percent}</td><td>{x.line_count}</td><td><ValidationBadge value={x.validation_status} /></td>
                <td><button onClick={() => s.openFormula(x)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Validation Run</h2>
        <p>
          선택 처방: <strong>{s.selectedFormula ? `${s.selectedFormula.formula_code} / ${s.selectedFormula.revision}` : "없음"}</strong>
        </p>
        <button onClick={s.runValidation} disabled={s.loading || !s.selectedFormula}>Run Validation</button>
      </section>

      <section style={section()}>
        <h2>3. Validation History</h2>
        <table style={table()}>
          <thead>
            <tr><th>Created</th><th>Total%</th><th>Status</th><th>Issues</th><th>Blockers</th><th>User</th><th>Open</th></tr>
          </thead>
          <tbody>
            {s.runs.map((x) => (
              <tr key={x.id}>
                <td>{x.created_at}</td>
                <td>{x.total_percent}</td>
                <td><ValidationBadge value={x.validation_status} /></td>
                <td>{x.issue_count}</td>
                <td>{x.blocker_count}</td>
                <td>{x.created_by}</td>
                <td><button onClick={() => s.openRun(x)}>Open Issues</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>4. Validation Issues</h2>
        <table style={table()}>
          <thead>
            <tr><th>Severity</th><th>Type</th><th>Line</th><th>Raw</th><th>Message</th><th>Action</th></tr>
          </thead>
          <tbody>
            {s.issues.map((x, idx) => (
              <tr key={x.id || idx}>
                <td><ValidationBadge value={x.severity} /></td>
                <td>{x.issue_type}</td>
                <td>{x.line_no}</td>
                <td>{x.raw_code}</td>
                <td>{x.message}</td>
                <td>{x.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 26, fontWeight: "bold", color: "#7c3aed" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 280 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
