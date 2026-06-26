import StatusBadge from "../common/StatusBadge";
import SectionCard from "../common/SectionCard";
import type { ProductionCrudRow } from "@/types/enterpriseProductionFinal";

export default function ProductionCrudTable({ rows, onLive }: { rows: ProductionCrudRow[]; onLive: (id: string) => void }) {
  return (
    <SectionCard title="1. Supabase Live CRUD">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th>Module</th><th>Table</th><th>Operations</th><th>Status</th><th>Persistence</th><th>Audit</th><th>Next Action</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.module}</td><td>{x.tableName}</td><td>{x.operations}</td><td><StatusBadge status={x.crudStatus} /></td><td>{x.persistence}</td><td>{x.audit}</td><td>{x.nextAction}</td>
              <td>{x.crudStatus !== "LIVE" ? <button onClick={() => onLive(x.id)}>LIVE</button> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
