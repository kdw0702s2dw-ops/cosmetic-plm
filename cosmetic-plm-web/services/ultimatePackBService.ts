// Phase 56~60 Ultimate Pack B Service

export function getAgentStatus(input: { blocked: boolean; reviewRequired: boolean; running: boolean }) {
  if (input.blocked) return "BLOCKED";
  if (input.reviewRequired) return "NEEDS_REVIEW";
  if (input.running) return "RUNNING";
  return "DONE";
}

export function calculateAutonomousFormulaScore(input: { stability: number; regulation: number; cost: number; production: number }) {
  return Math.round(input.stability * 0.3 + input.regulation * 0.3 + input.cost * 0.2 + input.production * 0.2);
}

export function getIotStatus(value: number, min: number, max: number) {
  if (value < min * 0.9 || value > max * 1.1) return "ALARM";
  if (value < min || value > max) return "WARNING";
  return "NORMAL";
}

export function calculateOptimizationImprovement(beforeValue: number, afterValue: number) {
  if (!beforeValue) return 0;
  return Math.round(((afterValue - beforeValue) / beforeValue) * 100);
}

export function canSelfDrivingProceed(humanApprovalRequired: boolean, approved: boolean) {
  return !humanApprovalRequired || approved;
}
