"use client";

import ProductionOverview from "./dashboard/ProductionOverview";
import ProductionCrudTable from "./crud/ProductionCrudTable";
import DocumentEngineTable from "./documents/DocumentEngineTable";
import AiCopilotProductionTable from "./ai/AiCopilotProductionTable";
import ProductionHealthTable from "./stability/ProductionHealthTable";
import { useEnterpriseProductionFinal } from "@/hooks/useEnterpriseProductionFinal";
import { exportCsv } from "@/lib/exportCsv";

export default function EnterpriseProductionFinalDashboard() {
  const { data, stats, message, markCrudLive, generateDocument, executeAi } = useEnterpriseProductionFinal();

  function exportAll() {
    exportCsv("enterprise_production_final_summary.csv", [
      ["section", "count"],
      ["crud", data.crud.length],
      ["documents", data.documents.length],
      ["ai", data.ai.length],
      ["health", data.health.length],
      ["readiness", stats.readiness],
    ]);
  }

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <ProductionOverview stats={stats} message={message} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={exportAll} style={{ border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
          Production Summary CSV
        </button>
      </div>
      <ProductionCrudTable rows={data.crud} onLive={markCrudLive} />
      <DocumentEngineTable rows={data.documents} onGenerate={generateDocument} />
      <AiCopilotProductionTable rows={data.ai} onExecute={executeAi} />
      <ProductionHealthTable rows={data.health} />
    </main>
  );
}
