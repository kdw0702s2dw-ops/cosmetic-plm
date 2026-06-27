"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useEnterpriseWorkflow } from "@/hooks/useEnterpriseWorkflow";

function badge(status: string) {
  const cls = `enterprise-v41-badge enterprise-v41-badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

export default function EnterpriseWorkflowCenter() {
  const s = useEnterpriseWorkflow();

  return (
    <EnterpriseShell>
      <div className="enterprise-v41-page">
        <section className="enterprise-v41-hero">
          <div>
            <h1 className="enterprise-v41-title">Enterprise Workflow Center</h1>
            <p className="enterprise-v41-subtitle">
              AI 처방 생성부터 Formula, Validation, Cost, Intelligence, Document, Release, Manufacturing까지 하나의 업무 흐름으로 연결합니다.
            </p>
          </div>
          <button className="enterprise-v41-button" onClick={s.load} disabled={s.loading}>Refresh</button>
        </section>

        <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>

        {s.summary && (
          <section className="enterprise-v41-grid-4" style={{ marginBottom: 16 }}>
            <Kpi label="Formula" value={s.summary.formula_count} />
            <Kpi label="Validation" value={s.summary.validation_count} />
            <Kpi label="Cost" value={s.summary.cost_count} />
            <Kpi label="Documents" value={s.summary.document_count} />
          </section>
        )}

        <section className="enterprise-v41-panel">
          <h2>실제 연구소 업무 흐름</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {s.steps.map((step) => (
              <article key={step.step_key} className="enterprise-v41-card" style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 170px", gap: 14, alignItems: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#2563eb" }}>{step.step_no}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 17 }}>{step.title}</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>{step.description}</div>
                </div>
                <div>
                  {badge(step.status)}
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>Count {step.count}</div>
                </div>
                <a href={step.href} className="enterprise-v41-button" style={{ textAlign: "center", textDecoration: "none" }}>{step.action_label}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="enterprise-v41-panel">
          <h2>빠른 이동</h2>
          <div className="enterprise-v41-workflow">
            <a href="/enterprise-ai-autopilot">AI Autopilot</a>
            <a href="/enterprise-gold-formula-live">Formula</a>
            <a href="/enterprise-gold-formula-validation">Validation</a>
            <a href="/enterprise-gold-formula-cost">Cost</a>
            <a href="/enterprise-gold-intelligence">Intelligence</a>
            <a href="/enterprise-gold-documents">Documents</a>
            <a href="/enterprise-gold-release">Release</a>
            <a href="/enterprise-gold-manufacturing">Manufacturing</a>
          </div>
        </section>
      </div>
    </EnterpriseShell>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <article className="enterprise-v41-card">
      <div className="enterprise-v41-kpi-label">{label}</div>
      <div className="enterprise-v41-kpi-value">{value}</div>
    </article>
  );
}
