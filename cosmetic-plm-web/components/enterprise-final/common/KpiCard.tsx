export default function KpiCard({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "good" | "watch" | "risk" }) {
  const color = tone === "good" ? "#059669" : tone === "watch" ? "#d97706" : tone === "risk" ? "#dc2626" : "#2563eb";
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white" }}>
      <strong>{title}</strong>
      <div style={{ fontSize: 28, fontWeight: "bold", color, marginTop: 6 }}>{value}</div>
    </div>
  );
}
