"use client";

import { useSampleCenter } from "@/hooks/useEnterpriseProductionFinalSeries";
import FinalBadge from "../common/FinalBadge";

export default function SampleCenter() {
  const s = useSampleCenter();
  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1>GOLD MASTER Pack 05-C Sample & Pilot Management</h1>
        <p style={{ color: "#6b7280" }}>고객 샘플 요청, 파일럿 샘플, 승인/반려 이력을 관리합니다.</p>
        <input style={input()} value={s.customer} onChange={(e) => s.setCustomer(e.target.value)} placeholder="Customer" />
        <input style={input()} value={s.purpose} onChange={(e) => s.setPurpose(e.target.value)} placeholder="Purpose" />
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Create Sample Request</h2>
        <table style={table()}><thead><tr><th>Formula</th><th>Name</th><th>Rev</th><th>Create</th></tr></thead><tbody>
          {s.formulas.map((f) => <tr key={`${f.formula_code}-${f.revision}`}><td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td><button onClick={() => s.create(f)}>Create Sample</button></td></tr>)}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>2. Sample Requests</h2>
        <table style={table()}><thead><tr><th>Sample</th><th>Formula</th><th>Customer</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {s.samples.map((x) => <tr key={x.sample_code}><td>{x.sample_code}</td><td>{x.formula_code}/{x.revision}</td><td>{x.customer}</td><td>{x.purpose}</td><td><FinalBadge value={x.status} /></td><td><button onClick={() => s.update(x, "SUBMITTED")}>Submit</button> <button onClick={() => s.update(x, "APPROVED")}>Approve</button> <button onClick={() => s.update(x, "REJECTED")}>Reject</button></td></tr>)}
        </tbody></table>
      </section>
    </main>
  );
}

function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 220, marginRight: 8 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
