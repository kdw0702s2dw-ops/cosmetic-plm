import type { UxModuleStatus } from "@/types/enterpriseUx";

export default function UxBadge({ value }: { value: UxModuleStatus | string }) {
  const color =
    value === "LIVE" || value === "READY"
      ? "#059669"
      : value === "WATCH" || value === "EMPTY"
        ? "#d97706"
        : "#dc2626";

  return (
    <span style={{
      display: "inline-block",
      padding: "4px 9px",
      borderRadius: 999,
      background: `${color}15`,
      color,
      fontSize: 12,
      fontWeight: 700,
    }}>
      {value}
    </span>
  );
}
