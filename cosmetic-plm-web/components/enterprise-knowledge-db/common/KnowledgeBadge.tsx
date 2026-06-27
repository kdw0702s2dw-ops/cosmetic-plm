export default function KnowledgeBadge({ value }: { value: string }) {
  const color = value === "ACTIVE" || value === "GOOD" ? "#059669" : value === "WATCH" || value === "EMPTY" ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
