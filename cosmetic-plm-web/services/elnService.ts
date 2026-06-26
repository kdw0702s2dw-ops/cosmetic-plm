// Phase 28 Electronic Lab Notebook Service

export function generateExperimentNo(count: number, year = new Date().getFullYear()) {
  return `EXP-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function getObservationResult(value: number, min: number, max: number) {
  if (value >= min && value <= max) return "PASS";
  if (value >= min * 0.9 && value <= max * 1.1) return "WATCH";
  return "FAIL";
}

export function canSignExperiment(status: string) {
  return status === "REVIEW" || status === "IN_PROGRESS";
}

export function getExperimentProgress(status: string) {
  if (status === "DRAFT") return 10;
  if (status === "IN_PROGRESS") return 45;
  if (status === "REVIEW") return 75;
  if (status === "SIGNED") return 100;
  return 0;
}
