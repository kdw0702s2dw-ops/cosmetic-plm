export default function RecommendationBadge({ value }: { value: string }) {
  const color = value === "APPLIED" || value === "GENERATED"
    ? "#059669" : value === "OPEN" || value === "HOLD" || value === "P1" || value === "P2"
    ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
