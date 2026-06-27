export default function ValidationBadge({ value }: { value: string | number }) {
  const text = String(value);
  const color =
    text === "PASS" || text === "INFO"
      ? "#059669"
      : text === "WATCH" || text === "WARNING"
        ? "#d97706"
        : text === "ERROR"
          ? "#dc2626"
          : text === "BLOCKER"
            ? "#7f1d1d"
            : "#2563eb";

  return <span style={{ color, fontWeight: "bold" }}>{text}</span>;
}
