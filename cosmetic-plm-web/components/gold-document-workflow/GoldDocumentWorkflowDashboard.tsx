"use client";

import { useGoldDocumentWorkflow } from "@/hooks/useGoldDocumentWorkflow";
import WorkflowBadge from "./common/WorkflowBadge";

export default function GoldDocumentWorkflowDashboard() {
  const s = useGoldDocumentWorkflow();

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>GOLD MASTER Pack 03-B Document Workflow & Export</h1>
        <p style={{ color: "#6b7280" }}>
          생성된 문서를 Review / Approve / Reject / Lock 처리하고, Export Log를 남기며 다운로드합니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Kpi title="Documents" value={s.documents.length} />
          <Kpi title="Tasks" value={s.tasks.length} />
          <Kpi title="Export Logs" value={s.logs.length} />
          <Kpi title="Selected" value={s.selected ? s.selected.document_code : "-"} />
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{s.message}</p>
      </section>

      <section style={section()}>
        <h2>1. Document Search</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={input()} value={s.search} onChange={(e) => s.setSearch(e.target.value)} placeholder="document_code, formula_code 검색" />
          <button onClick={() => s.loadDocuments(s.search)} disabled={s.loading}>Search</button>
        </div>
        <table style={table()}>
          <thead><tr><th>Code</th><th>Formula</th><th>Type</th><th>Format</th><th>Status</th><th>Open</th></tr></thead>
          <tbody>
            {s.documents.map((doc) => (
              <tr key={doc.document_code}>
                <td>{doc.document_code}</td><td>{doc.formula_code}/{doc.revision}</td><td>{doc.document_type}</td><td>{doc.format}</td>
                <td><WorkflowBadge value={doc.status} /></td>
                <td><button onClick={() => s.openDocument(doc)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>2. Selected Document Action</h2>
        <p>선택 문서: <strong>{s.selected ? s.selected.document_code : "없음"}</strong></p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={input()} value={s.comment} onChange={(e) => s.setComment(e.target.value)} placeholder="승인/반려 코멘트" />
          <button onClick={s.startWorkflow} disabled={s.loading || !s.selected}>Start Review</button>
          <button onClick={s.exportSelectedDocument} disabled={s.loading || !s.selected}>Download Export</button>
          <button onClick={s.lockSelectedDocument} disabled={s.loading || !s.selected}>Lock Document</button>
        </div>
      </section>

      <section style={section()}>
        <h2>3. Workflow Tasks</h2>
        <table style={table()}>
          <thead><tr><th>Step</th><th>Status</th><th>Assignee</th><th>Comment</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {s.tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.current_step}</td>
                <td><WorkflowBadge value={task.status} /></td>
                <td>{task.assignee}</td>
                <td>{task.comment}</td>
                <td>{task.created_at}</td>
                <td>
                  <button onClick={() => s.approveTask(task)} style={{ marginRight: 6 }}>Approve</button>
                  <button onClick={() => s.rejectTask(task)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={section()}>
        <h2>4. Export Logs</h2>
        <table style={table()}>
          <thead><tr><th>Format</th><th>File</th><th>User</th><th>Created</th></tr></thead>
          <tbody>
            {s.logs.map((log) => (
              <tr key={log.id}>
                <td>{log.export_format}</td><td>{log.file_name}</td><td>{log.exported_by}</td><td>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string | number; value: string | number }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}><strong>{title}</strong><div style={{ fontSize: 24, fontWeight: "bold", color: "#7c3aed" }}>{value}</div></div>;
}
function section(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 260 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
