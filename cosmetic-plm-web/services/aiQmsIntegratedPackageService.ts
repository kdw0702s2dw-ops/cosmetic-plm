// Phase 36~40 Enterprise AI/QMS Integrated Package Service

export function getCopilotRisk(input: { highRegRisk: boolean; oosCount: number; expiredDocs: number }) {
  if (input.highRegRisk || input.oosCount > 0 || input.expiredDocs > 0) return "HIGH";
  return "LOW";
}

export function getQmsDueDate(days: number) {
  const due = new Date();
  due.setDate(due.getDate() + days);
  return due.toISOString().slice(0, 10);
}

export function canCloseCapa(input: { rootCauseDone: boolean; actionDone: boolean; effectivenessDone: boolean }) {
  return input.rootCauseDone && input.actionDone && input.effectivenessDone;
}

export function canMakeDocumentEffective(status: string) {
  return status === "APPROVED" || status === "REVIEW";
}

export function canPassValidation(status: string) {
  return status === "EXECUTING" || status === "RETEST";
}
