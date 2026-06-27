"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useGlobalSearch } from "@/hooks/useEnterpriseV42";
import V42Badge from "../common/V42Badge";

export default function GlobalSearchDashboard() {
  const s = useGlobalSearch();
  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">Global Search</h1>
          <p className="enterprise-v41-subtitle">Formula, Raw Material, Document를 한 번에 검색합니다.</p>
        </div>
      </section>
      <section className="enterprise-v41-panel">
        <div style={{ display: "flex", gap: 8 }}>
          <input className="enterprise-v41-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="검색어 입력" />
          <button className="enterprise-v41-button" onClick={s.search}>Search</button>
        </div>
        <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>
      </section>
      <section className="enterprise-v41-grid-2">
        {s.results.map((r, idx) => (
          <a key={idx} href={r.href} className="enterprise-v41-card" style={{ textDecoration: "none", color: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{r.title}</strong>
              <V42Badge value={r.status || r.type} />
            </div>
            <p style={{ color: "#64748b" }}>{r.type} · {r.description}</p>
          </a>
        ))}
      </section>
    </EnterpriseShell>
  );
}
