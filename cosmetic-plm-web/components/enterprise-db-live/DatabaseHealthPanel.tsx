"use client";

import { useDatabaseHealthLive } from "@/hooks/useDatabaseHealthLive";
import LiveBadge from "./common/LiveBadge";

export default function DatabaseHealthPanel() {
  const { rows, loading, load } = useDatabaseHealthLive();

  return (
    <section style={card()}>
      <h2 style={{ marginTop: 0 }}>Supabase Live DB Health</h2>
      <button onClick={load} disabled={loading}>Refresh DB Health</button>
      <table style={table()}>
        <thead><tr><th>Module</th><th>Table</th><th>Status</th><th>Count</th><th>Message</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.tableName}>
              <td>{x.module}</td><td>{x.tableName}</td><td><LiveBadge value={x.status} /></td><td>{x.count.toLocaleString()}</td><td>{x.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function card(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}
function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse", marginTop: 12 };
}
