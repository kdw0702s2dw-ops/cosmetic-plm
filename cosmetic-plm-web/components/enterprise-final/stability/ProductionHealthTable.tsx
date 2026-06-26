import StatusBadge from "../common/StatusBadge";
import SectionCard from "../common/SectionCard";
import type { ProductionHealthRow } from "@/types/enterpriseProductionFinal";

export default function ProductionHealthTable({ rows }: { rows: ProductionHealthRow[] }) {
  return (
    <SectionCard title="4. Production Stability / Health Check">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th>Area</th><th>Status</th><th>Message</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.area}</td><td><StatusBadge status={x.status} /></td><td>{x.message}</td><td>{x.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
