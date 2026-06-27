export default function GoldBadge({ value }: { value: string }) {
  const color =
    value === "LIVE" || value === "DONE"
      ? "#059669"
      : value === "READY" || value === "WATCH" || value === "TODO" || value === "EMPTY"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
