export default function ReleaseBadge({ value }: { value: string }) {
  const color =
    value === "READY" || value === "RELEASED" || value === "PASS"
      ? "#059669"
      : value === "WATCH"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
