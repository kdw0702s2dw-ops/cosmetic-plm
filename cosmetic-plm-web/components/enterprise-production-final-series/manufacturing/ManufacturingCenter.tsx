"use client";

import { useManufacturingCenter } from "@/hooks/useEnterpriseProductionFinalSeries";
import FinalBadge from "../common/FinalBadge";

export default function ManufacturingCenter() {
  const s = useManufacturingCenter();
  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1>GOLD MASTER Pack 05-B Manufacturing Execution Center</h1>
        <p style={{ color: "#6b7280" }}>Formula → Batch → 원료소요량 → 제조지시 → 제조완료를 연결합니다.</p>
        <input style={input()} type="number" value={s.batchSize} onChange={(e) => s.setBatchSize(Number(e.target.value))} placeholder="Batch Size kg" />
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Create Batch from Formula</h2>
        <table style={table()}><thead><tr><th>Formula</th><th>Name</th><th>Rev</th><th>Total%</th><th>Create</th></tr></thead><tbody>
          {s.formulas.map((f) => <tr key={`${f.formula_code}-${f.revision}`}><td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}</td><td><button onClick={() => s.makeBatch(f)}>Create Batch</button></td></tr>)}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>2. Batch List</h2>
        <table style={table()}><thead><tr><th>Batch</th><th>Formula</th><th>Size kg</th><th>Status</th><th>Open</th></tr></thead><tbody>
          {s.batches.map((b) => <tr key={b.batch_no}><td>{b.batch_no}</td><td>{b.formula_code}/{b.revision}</td><td>{b.batch_size_kg}</td><td><FinalBadge value={b.status} /></td><td><button onClick={() => s.openBatch(b)}>Open</button></td></tr>)}
        </tbody></table>
      </section>

      {s.selectedBatch && <section style={section()}>
        <h2>3. Batch Detail - {s.selectedBatch.batch_no}</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => s.changeBatchStatus("IN_PROGRESS")}>Start</button>
          <button onClick={() => s.changeBatchStatus("QC_HOLD")}>QC Hold</button>
          <button onClick={() => s.changeBatchStatus("COMPLETED")}>Complete</button>
          <button onClick={() => s.changeBatchStatus("RELEASED")}>Release</button>
        </div>
        <h3>Materials</h3>
        <table style={table()}><thead><tr><th>Check</th><th>No</th><th>Phase</th><th>Raw</th><th>Name</th><th>%</th><th>Required kg</th></tr></thead><tbody>
          {s.materials.map((m) => <tr key={m.id}><td><button onClick={() => s.toggleMaterial(m)}>{m.checked ? "OK" : "Check"}</button></td><td>{m.line_no}</td><td>{m.phase}</td><td>{m.raw_code}</td><td>{m.raw_name}</td><td>{m.percentage}</td><td>{m.required_kg}</td></tr>)}
        </tbody></table>
        <h3>Steps</h3>
        <table style={table()}><thead><tr><th>No</th><th>Step</th><th>Instruction</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {s.steps.map((st) => <tr key={st.id}><td>{st.step_no}</td><td>{st.step_name}</td><td>{st.instruction}</td><td><FinalBadge value={st.status} /></td><td><button onClick={() => s.completeStep(st)}>Toggle</button></td></tr>)}
        </tbody></table>
      </section>}
    </main>
  );
}

function section(): React.CSSProperties { return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }; }
function input(): React.CSSProperties { return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 220 }; }
function table(): React.CSSProperties { return { width: "100%", borderCollapse: "collapse" }; }
