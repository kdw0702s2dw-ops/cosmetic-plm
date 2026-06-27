"use client";

import DatabaseHealthPanel from "./DatabaseHealthPanel";
import RawMaterialLiveManager from "./RawMaterialLiveManager";

export default function EnterpriseDatabaseLiveDashboard() {
  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <DatabaseHealthPanel />
      <RawMaterialLiveManager />
    </main>
  );
}
