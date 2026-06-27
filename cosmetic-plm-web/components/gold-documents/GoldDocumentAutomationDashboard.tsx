"use client";

import { useGoldDocuments } from "@/hooks/useGoldDocuments";
import DocumentBadge from "./common/DocumentBadge";

export default function GoldDocumentAutomationDashboard() {
  const s = useGoldDocuments();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 03-A Document Automation</h1>
        <p style={{ color: "#6b7280" }}>
          처방, 검증, 원가, Intelligence 데이터를 기반으로 처방서, 원료조성표, 전성분표, Spec, COA, BOM, 제조지시서 문서를 생성합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Formulas" value={s.formulas.length} />
          <Kpi title="Documents" value={s.documents.length} />
          <Kpi title="Selected" value={s.selected ? `${s.selected.formula_code}/${s.selected.revision}` : "-"} />
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
          <thead><tr><th>Code</th><th>Name</th><th>Rev</th><th>Status</th><th>Total%</th><th>Open</th></tr></thead>
          <tbody>
            {s.formulas.map((x) => (
              <tr key={`${x.formula_code}-${x.revision}`}>
                <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.status}</td><td>{x.total_percent}</td>
                <td><button onClick={() => s.openFormula(x)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Generate Document</h2>
        <p>선택 처방: <strong>{s.selected ? `${s.selected.formula_code} / ${s.selected.revision}` : "없음"}</strong></p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={input()} value={s.documentType} onChange={(e) => s.setDocumentType(e.target.value as any)}>
            <option value="FORMULA_SHEET">FORMULA_SHEET</option>
            <option value="INGREDIENT_COMPOSITION">INGREDIENT_COMPOSITION</option>
            <option value="FULL_INGREDIENT_LIST">FULL_INGREDIENT_LIST</option>
            <option value="PRODUCT_SPEC">PRODUCT_SPEC</option>
            <option value="COA">COA</option>
            <option value="TEST_REQUEST">TEST_REQUEST</option>
            <option value="BOM">BOM</option>
            <option value="MANUFACTURING_SHEET">MANUFACTURING_SHEET</option>
            <option value="CUSTOMER_SUMMARY">CUSTOMER_SUMMARY</option>
          </select>
          <select style={input()} value={s.format} onChange={(e) => s.setFormat(e.target.value as any)}>
            <option value="CSV">CSV</option>
            <option value="HTML">HTML</option>
            <option value="PDF_READY">PDF_READY</option>
            <option value="EXCEL_READY">EXCEL_READY</option>
            <option value="WORD_READY">WORD_READY</option>
          </select>
          <button onClick={s.generateDocument} disabled={s.loading || !s.selected}>Generate</button>
        </div>
      </section>

      <section style={section()}>
        <h2>3. Document List</h2>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Type</th><th>Title</th><th>Format</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {s.documents.map((doc) => (
              <tr key={doc.document_code}>
                <td>{doc.document_code}</td>
                <td>{doc.document_type}</td>
                <td>{doc.title}</td>
                <td>{doc.format}</td>
                <td><DocumentBadge value={doc.status} /></td>
                <td>{doc.created_at}</td>
                <td>
                  <button onClick={() => s.downloadDocument(doc)} style={{ marginRight: 6 }}>Download</button>
                  <button onClick={() => s.changeStatus(doc, "REVIEW")} style={{ marginRight: 6 }}>Review</button>
                  <button onClick={() => s.changeStatus(doc, "APPROVED")} style={{ marginRight: 6 }}>Approve</button>
                  <button onClick={() => s.changeStatus(doc, "LOCKED")}>Lock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string | number; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 220 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
