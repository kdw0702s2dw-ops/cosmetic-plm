export default function WorkflowBadge({ value }: { value: string }) {
  const color =
    value === "APPROVED" || value === "LOCKED"
      ? "#059669"
      : value === "REVIEW" || value === "DRAFT"
        ? "#d97706"
        : value === "REJECTED"
          ? "#dc2626"
          : "#2563eb";

  return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
}
