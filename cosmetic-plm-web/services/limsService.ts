// Phase 29 LIMS Test Center Service

export function generateSampleNo(count: number, year = new Date().getFullYear()) {
  return `QC-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function judgeNumericSpec(value: number, min: number, max: number) {
  if (value >= min && value <= max) return "PASS";
  if (value >= min * 0.9 && value <= max * 1.1) return "OOT";
  return "OOS";
}

export function getSampleStatusFromTests(hasOos: boolean, hasPending: boolean) {
  if (hasOos) return "REJECTED";
  if (hasPending) return "REVIEW";
  return "APPROVED";
}

export function canIssueCoa(status: string) {
  return status === "APPROVED";
}
