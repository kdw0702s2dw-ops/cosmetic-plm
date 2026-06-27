export default function LiveFormulaBadge({ value }: { value: string | boolean }) {
  const text = String(value);
  const color =
    text === "PASS" || text === "APPROVED" || text === "LOCKED" || text === "true"
      ? "#059669"
      : text === "DRAFT" || text === "REVIEW" || text === "FAIL"
        ? "#d97706"
        : "#dc2626";

  return <span style={{ color, fontWeight: "bold" }}>{text}</span>;
}
