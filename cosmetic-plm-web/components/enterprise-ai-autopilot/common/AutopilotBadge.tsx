export default function AutopilotBadge({ value }: { value: string }) {
  const color = value === "COMPLETED" || value === "DONE"
    ? "#059669" : value === "RUNNING" || value === "READY" || value === "TODO"
    ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
