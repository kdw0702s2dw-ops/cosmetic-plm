import StatusBadge from "../common/StatusBadge";
import SectionCard from "../common/SectionCard";
import type { ProductionDocumentRow } from "@/types/enterpriseProductionFinal";

export default function DocumentEngineTable({ rows, onGenerate }: { rows: ProductionDocumentRow[]; onGenerate: (id: string) => void }) {
  return (
    <SectionCard title="2. Real Document Engine">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th>Document</th><th>Format</th><th>Source</th><th>Status</th><th>File</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.documentType}</td><td>{x.format}</td><td>{x.source}</td><td><StatusBadge status={x.status} /></td><td>{x.fileName}</td>
              <td>{x.status !== "GENERATED" ? <button onClick={() => onGenerate(x.id)}>Generate</button> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
