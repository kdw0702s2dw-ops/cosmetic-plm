export default function DocumentBadge({ value }: { value: string }) {
  const color =
    value === "APPROVED" || value === "LOCKED" || value === "GENERATED"
      ? "#059669"
      : value === "REVIEW" || value === "DRAFT"
        ? "#d97706"
        : "#2563eb";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
