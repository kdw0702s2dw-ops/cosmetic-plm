export default function GoldCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white" }}>
      <strong>{title}</strong>
      <div style={{ fontSize: 28, fontWeight: "bold", color: "#b45309", marginTop: 6 }}>{value}</div>
    </div>
  );
}
