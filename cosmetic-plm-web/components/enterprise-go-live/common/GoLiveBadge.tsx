export default function GoLiveBadge({ value }: { value: string }) {
  const color = value === "PASS" || value === "GO" || value === "READY" || value === "CLOSED"
    ? "#059669"
    : value === "WATCH" || value === "NEEDS_INPUT" || value === "OPEN"
      ? "#d97706"
      : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
