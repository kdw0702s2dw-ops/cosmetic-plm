export default function FinalBadge({ value }: { value: string }) {
  const color = value === "PASS" || value === "COMPLETED" || value === "RELEASED" || value === "APPROVED"
    ? "#059669" : value === "WATCH" || value === "PLANNED" || value === "IN_PROGRESS" || value === "REQUESTED"
    ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
