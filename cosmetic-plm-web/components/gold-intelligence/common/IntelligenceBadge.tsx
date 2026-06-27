export default function IntelligenceBadge({ value }: { value: string | number }) {
  const text = String(value);
  const color =
    text === "PASS" || text === "LOW"
      ? "#059669"
      : text === "WATCH" || text === "MEDIUM"
        ? "#d97706"
        : text === "HIGH" || text === "FAIL"
          ? "#dc2626"
          : text === "CRITICAL" || text === "BLOCK"
            ? "#7f1d1d"
            : "#2563eb";

  return <span style={{ color, fontWeight: "bold" }}>{text}</span>;
}
