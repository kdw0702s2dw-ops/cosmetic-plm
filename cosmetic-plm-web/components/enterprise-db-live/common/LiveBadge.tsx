export default function LiveBadge({ value }: { value: string }) {
  const color =
    value === "LIVE" || value === "VALID"
      ? "#059669"
      : value === "EMPTY" || value === "MISSING"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
