export default function FormulaBadge({ value }: { value: string | boolean }) {
  const text = String(value);
  const color =
    text === "APPROVED" || text === "LOCKED" || text === "true"
      ? "#059669"
      : text === "DRAFT" || text === "REVIEW"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{text}</span>;
}
