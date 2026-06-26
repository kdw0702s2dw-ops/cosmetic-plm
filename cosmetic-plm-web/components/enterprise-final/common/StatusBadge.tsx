import type { Status } from "@/types/enterpriseProductionFinal";

export default function StatusBadge({ status }: { status: Status | string }) {
  const color =
    status === "GOOD" || status === "LIVE" || status === "READY" || status === "GENERATED" || status === "EXECUTED"
      ? "#059669"
      : status === "WATCH" || status === "NEEDS_REVIEW" || status === "NEEDS_TEST" || status === "HUMAN_REVIEW"
        ? "#d97706"
        : "#dc2626";

  return (
    <span style={{ color, fontWeight: "bold" }}>
      {status}
    </span>
  );
}
