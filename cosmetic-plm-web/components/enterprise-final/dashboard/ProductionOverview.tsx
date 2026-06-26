import KpiCard from "../common/KpiCard";

export default function ProductionOverview({ stats, message }: { stats: any; message: string }) {
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }}>
      <h1 style={{ marginTop: 0 }}>Enterprise v3.0 Production Final</h1>
      <p style={{ color: "#6b7280" }}>
        남은 핵심 작업 5가지를 하나의 모듈화 패키지로 정리한 최종 운영 대시보드입니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard title="Readiness" value={`${stats.readiness}%`} tone={stats.readiness >= 85 ? "good" : "watch"} />
        <KpiCard title="CRUD LIVE" value={`${stats.crudLive}/${stats.crudTotal}`} tone="good" />
        <KpiCard title="Exports" value={`${stats.exportReady}/${stats.exportTotal}`} tone="default" />
        <KpiCard title="AI Ready" value={`${stats.aiReady}/${stats.aiTotal}`} tone="default" />
        <KpiCard title="Health Good" value={stats.healthGood} tone="good" />
        <KpiCard title="Watch/Risk" value={`${stats.healthWatch}/${stats.healthRisk}`} tone={stats.healthRisk > 0 ? "risk" : "watch"} />
      </div>

      <p style={{ color: "#2563eb", fontWeight: "bold" }}>{message}</p>
    </section>
  );
}
