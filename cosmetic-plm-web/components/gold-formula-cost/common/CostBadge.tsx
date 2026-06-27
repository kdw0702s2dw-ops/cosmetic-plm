export default function CostBadge({ value }: { value: string }) {
  const color =
    value === "GOOD"
      ? "#059669"
      : value === "WATCH" || value === "NO_PRICE"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
