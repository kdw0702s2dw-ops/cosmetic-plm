export default function AiBadge({ value }: { value: string }) {
  const color = value === "COMPLETED" || value === "DONE" ? "#059669" : value === "NEEDS_REVIEW" || value === "OPEN" || value === "HOLD" ? "#d97706" : value === "FAILED" || value === "P0" ? "#dc2626" : "#2563eb";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
