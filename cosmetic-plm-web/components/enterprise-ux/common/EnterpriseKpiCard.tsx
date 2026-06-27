"use client";

export default function EnterpriseKpiCard({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string | number;
  hint?: string;
  status?: string;
}) {
  const cls = `enterprise-v41-badge enterprise-v41-badge-${String(status || "live").toLowerCase()}`;
  return (
    <article className="enterprise-v41-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div className="enterprise-v41-kpi-label">{label}</div>
        {status && <span className={cls}>{status}</span>}
      </div>
      <div className="enterprise-v41-kpi-value">{value}</div>
      {hint && <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>}
    </article>
  );
}
