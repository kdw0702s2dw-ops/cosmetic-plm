"use client";

import { useRawMaterialsLive } from "@/hooks/useRawMaterialsLive";
import LiveBadge from "./common/LiveBadge";

export default function RawMaterialLiveManager() {
  const { rows, form, setForm, search, setSearch, totalCount, status, loading, load, save, remove } = useRawMaterialsLive();

  return (
    <section style={card()}>
      <h1 style={{ marginTop: 0 }}>Raw Material Master LIVE</h1>
      <p style={{ color: "#6b7280" }}>
        이 화면은 더미 데이터가 아니라 Supabase `enterprise_raw_material_master` 테이블을 직접 조회합니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Kpi title="DB Total" value={totalCount.toLocaleString()} />
        <Kpi title="Displayed" value={rows.length.toLocaleString()} />
        <Kpi title="Mode" value="LIVE DB" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="RM-05000, 글리세린, Glycerin, CAS 검색" style={input()} />
        <button onClick={() => load(search)} disabled={loading}>Search</button>
        <button onClick={() => load("")} disabled={loading}>Reset</button>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Add / Update Raw Material</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <input style={input()} value={form.raw_code} onChange={(e) => setForm({ ...form, raw_code: e.target.value })} placeholder="raw_code" />
          <input style={input()} value={form.raw_name} onChange={(e) => setForm({ ...form, raw_name: e.target.value })} placeholder="raw_name" />
          <input style={input()} value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="supplier" />
          <input style={input()} value={form.inci_kr || ""} onChange={(e) => setForm({ ...form, inci_kr: e.target.value })} placeholder="inci_kr" />
          <input style={input()} value={form.inci_en || ""} onChange={(e) => setForm({ ...form, inci_en: e.target.value })} placeholder="inci_en" />
          <input style={input()} value={form.cas_no || ""} onChange={(e) => setForm({ ...form, cas_no: e.target.value })} placeholder="cas_no" />
          <input style={input()} value={form.ec_no || ""} onChange={(e) => setForm({ ...form, ec_no: e.target.value })} placeholder="ec_no" />
          <select style={input()} value={form.document_status || "MISSING"} onChange={(e) => setForm({ ...form, document_status: e.target.value })}>
            <option value="MISSING">MISSING</option>
            <option value="VALID">VALID</option>
            <option value="EXPIRING">EXPIRING</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
        <button onClick={save} disabled={loading} style={{ marginTop: 10 }}>Save to Supabase</button>
      </div>

      <p style={{ color: "#2563eb", fontWeight: "bold" }}>{status}</p>

      <div style={{ overflowX: "auto" }}>
        <table style={table()}>
          <thead>
            <tr>
              <th>raw_code</th><th>raw_name</th><th>supplier</th><th>inci_kr</th><th>inci_en</th><th>cas_no</th><th>ec_no</th><th>document</th><th>action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.raw_code}>
                <td>{x.raw_code}</td>
                <td>{x.raw_name}</td>
                <td>{x.supplier}</td>
                <td>{x.inci_kr}</td>
                <td>{x.inci_en}</td>
                <td>{x.cas_no}</td>
                <td>{x.ec_no}</td>
                <td><LiveBadge value={x.document_status || "MISSING"} /></td>
                <td>
                  <button onClick={() => setForm(x)} style={{ marginRight: 6 }}>Edit</button>
                  <button onClick={() => remove(x.raw_code)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
      <strong>{title}</strong>
      <div style={{ fontSize: 24, fontWeight: "bold", color: "#059669" }}>{value}</div>
    </div>
  );
}

function card(): React.CSSProperties {
  return { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 };
}

function input(): React.CSSProperties {
  return { padding: 10, border: "1px solid #d1d5db", borderRadius: 8 };
}

function table(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse" };
}
