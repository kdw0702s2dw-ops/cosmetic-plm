"use client";

import { useGoldFormulaLiveCrud } from "@/hooks/useGoldFormulaLiveCrud";
import LiveFormulaBadge from "./common/LiveFormulaBadge";

export default function GoldFormulaLiveCrudDashboard() {
  const s = useGoldFormulaLiveCrud();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 02-B Formula Live CRUD</h1>
        <p style={{ color: "#6b7280" }}>
          처방을 실제 Supabase DB로 저장/조회/수정/삭제하고, 원료마스터 10,000개에서 원료를 검색해 라인에 적용합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.summaries.length} />
          <Kpi title="Lines" value={s.lines.length} />
          <Kpi title="Total %" value={s.totalPercent} />
          <Kpi title="Validation" value={s.isValid100 ? "PASS" : "FAIL"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Summary Search</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="formula_code, formula_name 검색" />
          <button onClick={() => s.loadSummaries(s.search)} disabled={s.loading}>Search</button>
        </div>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Lines</th><th>Ingredients</th><th>Valid</th><th>Open</th></tr></thead>
          <tbody>
            {s.summaries.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td><LiveFormulaBadge value={x.status} /></td>
                <td>{x.total_percent}</td><td>{x.line_count}</td><td>{x.ingredient_count}</td><td><LiveFormulaBadge value={x.validation_status} /></td>
                <td><button onClick={() => s.openFormula(x.formula_code, x.revision)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Header Editor</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <input style={input()} value={s.header.formula_code} onChange={(e) => s.setHeader({ ...s.header, formula_code: e.target.value })} placeholder="formula_code" />
          <input style={input()} value={s.header.formula_name} onChange={(e) => s.setHeader({ ...s.header, formula_name: e.target.value })} placeholder="formula_name" />
          <input style={input()} value={s.header.revision} onChange={(e) => s.setHeader({ ...s.header, revision: e.target.value })} placeholder="revision" />
          <select style={input()} value={s.header.status} onChange={(e) => s.setHeader({ ...s.header, status: e.target.value as any })}>
            <option>DRAFT</option><option>REVIEW</option><option>APPROVED</option><option>LOCKED</option><option>ARCHIVED</option>
          </select>
          <input style={input()} value={s.header.product_type || ""} onChange={(e) => s.setHeader({ ...s.header, product_type: e.target.value })} placeholder="product_type" />
          <input style={input()} value={s.header.customer || ""} onChange={(e) => s.setHeader({ ...s.header, customer: e.target.value })} placeholder="customer" />
          <input style={input()} value={s.header.target_country || ""} onChange={(e) => s.setHeader({ ...s.header, target_country: e.target.value })} placeholder="target_country" />
          <input style={input()} value={s.header.claim || ""} onChange={(e) => s.setHeader({ ...s.header, claim: e.target.value })} placeholder="claim" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={s.saveCurrentHeader} disabled={s.loading}>Save Header</button>
          <button onClick={s.approveCurrentFormula} disabled={s.loading}>Approve</button>
          <button onClick={s.lockCurrentFormula} disabled={s.loading}>Lock</button>
          <input style={input()} value={s.newRevision} onChange={(e) => s.setNewRevision(e.target.value)} placeholder="new revision" />
          <button onClick={s.cloneCurrentFormula} disabled={s.loading}>Clone Revision</button>
        </div>
      </section>

      <section style={section()}>
        <h2>3. Raw Material Lookup</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.rawSearch} onChange={(e) => s.setRawSearch(e.target.value)} placeholder="RM-05000, 글리세린, Glycerin, CAS 검색" />
          <button onClick={s.searchRaw} disabled={s.loading}>Search Raw</button>
        </div>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Name</th><th>INCI KR</th><th>INCI EN</th><th>Supplier</th><th>CAS</th><th>Apply</th></tr></thead>
          <tbody>
            {s.rawResults.map((x) => (
              <tr key={x.raw_code}>
                <td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.inci_kr}</td><td>{x.inci_en}</td><td>{x.supplier}</td><td>{x.cas_no}</td>
                <td><button onClick={() => s.applyRawMaterial(x)}>Apply</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>4. Formula Lines</h2>
        <p><LiveFormulaBadge value={s.isValid100 ? "PASS" : "FAIL"} /> Total {s.totalPercent}%</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          <input style={input()} type="number" value={s.lineForm.line_no} onChange={(e) => s.setLineForm({ ...s.lineForm, line_no: Number(e.target.value) })} placeholder="line_no" />
          <input style={input()} value={s.lineForm.phase} onChange={(e) => s.setLineForm({ ...s.lineForm, phase: e.target.value })} placeholder="phase" />
          <input style={input()} value={s.lineForm.raw_code} onChange={(e) => s.setLineForm({ ...s.lineForm, raw_code: e.target.value })} placeholder="raw_code" />
          <input style={input()} value={s.lineForm.raw_name || ""} onChange={(e) => s.setLineForm({ ...s.lineForm, raw_name: e.target.value })} placeholder="raw_name" />
          <input style={input()} value={s.lineForm.inci_en || ""} onChange={(e) => s.setLineForm({ ...s.lineForm, inci_en: e.target.value })} placeholder="inci_en" />
          <input style={input()} value={s.lineForm.inci_kr || ""} onChange={(e) => s.setLineForm({ ...s.lineForm, inci_kr: e.target.value })} placeholder="inci_kr" />
          <input style={input()} type="number" value={s.lineForm.percentage} onChange={(e) => s.setLineForm({ ...s.lineForm, percentage: Number(e.target.value) })} placeholder="%" />
          <input style={input()} value={s.lineForm.function_en || ""} onChange={(e) => s.setLineForm({ ...s.lineForm, function_en: e.target.value })} placeholder="function" />
        </div>
        <button style={{ marginTop: 10 }} onClick={s.saveCurrentLine} disabled={s.loading}>Save Line</button>

        <table style={{ ...table(), marginTop: 14 }}>
          <thead><tr><th>No</th><th>Phase</th><th>Raw</th><th>Name</th><th>INCI EN</th><th>INCI KR</th><th>%</th><th>Function</th><th>Action</th></tr></thead>
          <tbody>
            {s.lines.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}-${x.line_no}`}>
                <td>{x.line_no}</td><td>{x.phase}</td><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.inci_en}</td><td>{x.inci_kr}</td><td>{x.percentage}</td><td>{x.function_en}</td>
                <td><button onClick={() => s.setLineForm(x)} style={{ marginRight: 6 }}>Edit</button><button onClick={() => s.removeLine(x)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>5. Formula History</h2>
        <table style={table()}>
          <thead><tr><th>Action</th><th>User</th><th>Created</th></tr></thead>
          <tbody>
            {s.history.map((x, idx) => (
              <tr key={x.id || idx}><td>{x.action}</td><td>{x.created_by}</td><td>{x.created_at}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 26, fontWeight: "bold", color: "#2563eb" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
