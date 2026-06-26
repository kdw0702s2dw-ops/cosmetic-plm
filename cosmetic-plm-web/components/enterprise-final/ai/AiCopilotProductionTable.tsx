import StatusBadge from "../common/StatusBadge";
import SectionCard from "../common/SectionCard";
import type { ProductionAiRow } from "@/types/enterpriseProductionFinal";

export default function AiCopilotProductionTable({ rows, onExecute }: { rows: ProductionAiRow[]; onExecute: (id: string) => void }) {
  return (
    <SectionCard title="3. AI Copilot Production">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th>Command</th><th>Workflow</th><th>Status</th><th>Confidence</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.command}</td><td>{x.workflow}</td><td><StatusBadge status={x.status} /></td><td>{x.confidence}</td>
              <td>{x.status !== "EXECUTED" ? <button onClick={() => onExecute(x.id)}>Execute</button> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
