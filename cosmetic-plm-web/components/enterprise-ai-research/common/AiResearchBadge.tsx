export default function AiResearchBadge({ value }: { value: string }) {
  const color = value === "APPLIED" || value === "DONE" || value === "GENERATED"
    ? "#059669" : value === "OPEN" || value === "REVIEW" || value === "HOLD"
    ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
