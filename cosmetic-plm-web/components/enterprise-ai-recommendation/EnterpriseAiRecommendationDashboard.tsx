"use client";

import { useEnterpriseAiRecommendation } from "@/hooks/useEnterpriseAiRecommendation";
import RecommendationBadge from "./common/RecommendationBadge";

export default function EnterpriseAiRecommendationDashboard() {
  const s = useEnterpriseAiRecommendation();
  const result = s.selected?.result_json || {};
  const similar = result.similar_formulas || [];
  const raws = result.raw_candidates || [];

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise PLM v4.0 AI Research Platform Pack 02</h1>
        <p style={{ color: "#6b7280" }}>
          Knowledge DB, Formula Library, Raw Material Master, Regulation, Compatibility 데이터를 기반으로 AI 추천을 생성합니다.
        </p>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. AI Recommendation Request</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          <select style={input()} value={s.productType} onChange={(e) => s.setProductType(e.target.value)}>
            <option value="Cream">Cream</option>
            <option value="Serum">Serum</option>
            <option value="Toner">Toner</option>
            <option value="Cleanser">Cleanser</option>
          </select>
          <input style={input()} value={s.claim} onChange={(e) => s.setClaim(e.target.value)} placeholder="Claim" />
          <input style={input()} type="number" value={s.targetCost ?? ""} onChange={(e) => s.setTargetCost(e.target.value ? Number(e.target.value) : null)} placeholder="Target Cost/kg" />
          <input style={input()} value={s.targetCountry} onChange={(e) => s.setTargetCountry(e.target.value)} placeholder="Target Country" />
        </div>
        <textarea style={{ ...input(), width: "100%", minHeight: 100, marginTop: 10 }} value={s.requestText} onChange={(e) => s.setRequestText(e.target.value)} />
        <button style={{ marginTop: 10 }} onClick={s.run} disabled={s.loading}>Run AI Recommendation</button>
      </section>

      <section style={section()}>
        <h2>2. Recommendation Runs</h2>
        <table style={table()}>
          <thead><tr><th>Run</th><th>Product</th><th>Claim</th><th>Country</th><th>Status</th><th>Open</th></tr></thead>
          <tbody>
            {s.runs.map((r) => (
              <tr key={r.run_code}>
                <td>{r.run_code}</td><td>{r.target_product_type}</td><td>{r.target_claim}</td><td>{r.target_country}</td>
                <td><RecommendationBadge value={r.status} /></td>
                <td><button onClick={() => s.open(r)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {s.selected && (
        <>
          <section style={section()}>
            <h2>3. Recommendation Summary</h2>
            <pre style={pre()}>{JSON.stringify(result.summary || {}, null, 2)}</pre>
          </section>

          <section style={section()}>
            <h2>4. Similar Formula Candidates</h2>
            <table style={table()}>
              <thead><tr><th>Library</th><th>Name</th><th>Product</th><th>Claim</th><th>Score</th></tr></thead>
              <tbody>
                {similar.map((x: any) => <tr key={x.library_code}><td>{x.library_code}</td><td>{x.formula_name}</td><td>{x.product_type}</td><td>{x.claim}</td><td>{x.similarity_score}</td></tr>)}
              </tbody>
            </table>
          </section>

          <section style={section()}>
            <h2>5. Raw Material Candidates</h2>
            <table style={table()}>
              <thead><tr><th>Raw</th><th>Name</th><th>INCI EN</th><th>INCI KR</th><th>Supplier</th></tr></thead>
              <tbody>
                {raws.map((x: any) => <tr key={x.raw_code}><td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.inci_en}</td><td>{x.inci_kr}</td><td>{x.supplier}</td></tr>)}
              </tbody>
            </table>
          </section>

          <section style={section()}>
            <h2>6. AI Recommendation Items</h2>
            <table style={table()}>
              <thead><tr><th>Priority</th><th>Type</th><th>Title</th><th>Message</th><th>Impact</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {s.items.map((item) => (
                  <tr key={item.id}>
                    <td><RecommendationBadge value={item.priority} /></td>
                    <td>{item.recommendation_type}</td>
                    <td>{item.title}</td>
                    <td>{item.message}</td>
                    <td>{item.expected_impact}</td>
                    <td><RecommendationBadge value={item.status} /></td>
                    <td>
                      <button onClick={() => s.updateItem(item, "APPLIED")}>Apply</button>{" "}
                      <button onClick={() => s.updateItem(item, "HOLD")}>Hold</button>{" "}
                      <button onClick={() => s.updateItem(item, "REJECTED")}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
function pre(): React.CSSProperties { return { background: "#f8fafc", padding: 12, borderRadius: 8, overflowX: "auto" }; }
