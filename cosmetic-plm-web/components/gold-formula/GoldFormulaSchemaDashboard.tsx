"use client";

import { useGoldFormulaSchema } from "@/hooks/useGoldFormulaSchema";
import FormulaBadge from "./common/FormulaBadge";

export default function GoldFormulaSchemaDashboard() {
  const {
    headers,
    lines,
    selected,
    headerForm,
    setHeaderForm,
    lineForm,
    setLineForm,
    search,
    setSearch,
    message,
    loading,
    validation,
    loadHeaders,
    selectHeader,
    saveHeader,
    saveLine,
    removeLine,
  } = useGoldFormulaSchema();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 02-A Formula Live Schema</h1>
        <p style={{ color: "#6b7280" }}>
          처방 Header / Line을 Supabase 실제 DB 기반으로 저장·조회·수정하는 Formula Live Migration 첫 단계입니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formula Headers" value={headers.length} />
          <Kpi title="Selected Lines" value={lines.length} />
          <Kpi title="Total %" value={validation.totalPercent} />
          <Kpi title="Valid 100%" value={validation.isValid100 ? "YES" : "NO"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{message}</p>
      </section>

      <section style={section()}>
        <h2>1. Formula Header CRUD</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <input style={input()} value={headerForm.formula_code} onChange={(e) => setHeaderForm({ ...headerForm, formula_code: e.target.value })} placeholder="formula_code" />
          <input style={input()} value={headerForm.formula_name} onChange={(e) => setHeaderForm({ ...headerForm, formula_name: e.target.value })} placeholder="formula_name" />
          <input style={input()} value={headerForm.revision} onChange={(e) => setHeaderForm({ ...headerForm, revision: e.target.value })} placeholder="revision" />
          <select style={input()} value={headerForm.status} onChange={(e) => setHeaderForm({ ...headerForm, status: e.target.value as any })}>
            <option>DRAFT</option><option>REVIEW</option><option>APPROVED</option><option>LOCKED</option><option>ARCHIVED</option>
          </select>
          <input style={input()} value={headerForm.product_type || ""} onChange={(e) => setHeaderForm({ ...headerForm, product_type: e.target.value })} placeholder="product_type" />
          <input style={input()} value={headerForm.customer || ""} onChange={(e) => setHeaderForm({ ...headerForm, customer: e.target.value })} placeholder="customer" />
          <input style={input()} value={headerForm.target_country || ""} onChange={(e) => setHeaderForm({ ...headerForm, target_country: e.target.value })} placeholder="target_country" />
          <input style={input()} value={headerForm.claim || ""} onChange={(e) => setHeaderForm({ ...headerForm, claim: e.target.value })} placeholder="claim" />
        </div>
        <button onClick={saveHeader} disabled={loading} style={{ marginTop: 10 }}>Save Header</button>
      </section>

      <section style={section()}>
        <h2>2. Formula Search</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="처방코드, 처방명, 고객, 클레임 검색" />
          <button onClick={() => loadHeaders(search)} disabled={loading}>Search</button>
        </div>
        <table style={table()}><thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Product</th><th>Customer</th><th>Claim</th><th>Open</th></tr></thead><tbody>
          {headers.map((x) => (
            <tr key={`${x.formula_code}-${x.revision}`}>
              <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td><FormulaBadge value={x.status} /></td><td>{x.product_type}</td><td>{x.customer}</td><td>{x.claim}</td>
              <td><button onClick={() => selectHeader(x)}>Open</button></td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>3. Formula Lines {selected ? `- ${selected.formula_code} / ${selected.revision}` : ""}</h2>
        <p><FormulaBadge value={validation.isValid100} /> {validation.message}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
          <input style={input()} type="number" value={lineForm.line_no} onChange={(e) => setLineForm({ ...lineForm, line_no: Number(e.target.value) })} placeholder="line_no" />
          <input style={input()} value={lineForm.phase} onChange={(e) => setLineForm({ ...lineForm, phase: e.target.value })} placeholder="phase" />
          <input style={input()} value={lineForm.raw_code} onChange={(e) => setLineForm({ ...lineForm, raw_code: e.target.value })} placeholder="raw_code" />
          <input style={input()} value={lineForm.raw_name || ""} onChange={(e) => setLineForm({ ...lineForm, raw_name: e.target.value })} placeholder="raw_name" />
          <input style={input()} value={lineForm.inci_en || ""} onChange={(e) => setLineForm({ ...lineForm, inci_en: e.target.value })} placeholder="inci_en" />
          <input style={input()} value={lineForm.inci_kr || ""} onChange={(e) => setLineForm({ ...lineForm, inci_kr: e.target.value })} placeholder="inci_kr" />
          <input style={input()} type="number" value={lineForm.percentage} onChange={(e) => setLineForm({ ...lineForm, percentage: Number(e.target.value) })} placeholder="%" />
          <input style={input()} value={lineForm.function_en || ""} onChange={(e) => setLineForm({ ...lineForm, function_en: e.target.value })} placeholder="function" />
        </div>
        <button onClick={saveLine} disabled={loading}>Save Line</button>

        <table style={{ ...table(), marginTop: 14 }}><thead><tr><th>No</th><th>Phase</th><th>Raw Code</th><th>Raw Name</th><th>INCI EN</th><th>INCI KR</th><th>%</th><th>Function</th><th>Action</th></tr></thead><tbody>
          {lines.map((x) => (
            <tr key={`${x.formula_code}-${x.revision}-${x.line_no}`}>
              <td>{x.line_no}</td><td>{x.phase}</td><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.inci_en}</td><td>{x.inci_kr}</td><td>{x.percentage}</td><td>{x.function_en}</td>
              <td><button onClick={() => setLineForm(x)} style={{ marginRight: 6 }}>Edit</button><button onClick={() => removeLine(x)}>Delete</button></td>
            </tr>
          ))}
        </tbody></table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}>
      <strong>{title}</strong>
      <div style={{ fontSize: 26, fontWeight: "bold", color: "#2563eb" }}>{value}</div>
    </div>
  );
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
