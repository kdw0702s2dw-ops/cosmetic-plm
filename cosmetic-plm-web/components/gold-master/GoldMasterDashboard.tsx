"use client";

import { useGoldMasterLive } from "@/hooks/useGoldMasterLive";
import GoldBadge from "./common/GoldBadge";
import GoldCard from "./common/GoldCard";

export default function GoldMasterDashboard() {
  const {
    health,
    rawMaterials,
    formulas,
    rawSearch,
    setRawSearch,
    formulaSearch,
    setFormulaSearch,
    message,
    loading,
    actions,
    stats,
    loadAll,
    markActionDone,
  } = useGoldMasterLive();

  return (
    <main style={{ padding: 24, background: "#fffbeb", minHeight: "100vh" }}>
      <section style={section()}>
        <h1 style={{ marginTop: 0 }}>Enterprise PLM v3.0 GOLD MASTER - Pack 01 Live Core</h1>
        <p style={{ color: "#6b7280" }}>
          Gold Master의 첫 번째 통합 패키지입니다. 더미 데이터 제거를 시작하고, Supabase 실제 DB 조회 상태를 한 화면에서 검증합니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <GoldCard title="Readiness" value={`${stats.readiness}%`} />
          <GoldCard title="Live Modules" value={`${stats.live}/${stats.total}`} />
          <GoldCard title="DB Errors" value={stats.error} />
          <GoldCard title="Raw Displayed" value={stats.rawDisplayed} />
          <GoldCard title="Formula Displayed" value={stats.formulaDisplayed} />
          <GoldCard title="Actions" value={`${stats.actionDone}/${stats.actionTotal}`} />
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={loadAll} disabled={loading}>Refresh GOLD MASTER Live Data</button>
        </div>
        <p style={{ color: "#2563eb", fontWeight: "bold" }}>{message}</p>
      </section>

      <section style={section()}>
        <h2>1. Live DB Health</h2>
        <table style={table()}><thead><tr><th>Module</th><th>Table</th><th>Count</th><th>Status</th><th>Message</th></tr></thead><tbody>
          {health.map((x) => (
            <tr key={x.tableName}>
              <td>{x.module}</td><td>{x.tableName}</td><td>{x.count.toLocaleString()}</td><td><GoldBadge value={x.status} /></td><td>{x.message}</td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>2. Raw Material Master LIVE</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} placeholder="RM-05000, 글리세린, Glycerin 검색" style={input()} />
          <button onClick={loadAll}>Search</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={table()}><thead><tr><th>Code</th><th>Name</th><th>Supplier</th><th>INCI KR</th><th>INCI EN</th><th>CAS</th><th>EC</th><th>Doc</th></tr></thead><tbody>
            {rawMaterials.map((x) => (
              <tr key={x.raw_code}>
                <td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.supplier}</td><td>{x.inci_kr}</td><td>{x.inci_en}</td><td>{x.cas_no}</td><td>{x.ec_no}</td><td><GoldBadge value={x.document_status || "MISSING"} /></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </section>

      <section style={section()}>
        <h2>3. Formula Master LIVE</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={formulaSearch} onChange={(e) => setFormulaSearch(e.target.value)} placeholder="처방코드, 처방명, 원료코드 검색" style={input()} />
          <button onClick={loadAll}>Search</button>
        </div>
        <table style={table()}><thead><tr><th>Formula</th><th>Name</th><th>Rev</th><th>Raw</th><th>%</th><th>Phase</th><th>Claim</th></tr></thead><tbody>
          {formulas.map((x, idx) => (
            <tr key={`${x.formula_code}-${idx}`}>
              <td>{x.formula_code}</td><td>{x.formula_name}</td><td>{x.revision}</td><td>{x.raw_code}</td><td>{x.percentage}</td><td>{x.phase}</td><td>{x.claim}</td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section style={section()}>
        <h2>4. Gold Master Action Plan</h2>
        <table style={table()}><thead><tr><th>Area</th><th>Task</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {actions.map((x) => (
            <tr key={x.id}>
              <td>{x.area}</td><td>{x.task}</td><td>{x.priority}</td><td><GoldBadge value={x.status} /></td>
              <td>{x.status !== "DONE" ? <button onClick={() => markActionDone(x.id)}>Done</button> : "-"}</td>
            </tr>
          ))}
        </tbody></table>
      </section>
    </main>
  );
}

function section(): React.CSSProperties {
  return { border: "1px solid #fde68a", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}

function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}

function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 300 };
}
