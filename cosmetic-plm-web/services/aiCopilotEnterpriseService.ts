// Final Sprint B: AI Copilot Enterprise Service

export function detectCopilotIntent(command: string) {
  const text = command.toLowerCase();
  if (text.includes("원가") || text.includes("cost")) return "OptimizeCost";
  if (text.includes("규제") || text.includes("regulation")) return "CheckRegulation";
  if (text.includes("문서") || text.includes("document")) return "GenerateDocument";
  if (text.includes("출시") || text.includes("launch")) return "LaunchReview";
  if (text.includes("workflow") || text.includes("승인")) return "CreateWorkflow";
  return "CreateFormula";
}

export function calculateCopilotConfidence(input: { hasFormula: boolean; hasIngredient: boolean; hasRegulation: boolean; hasDocument: boolean }) {
  return Math.round(
    (input.hasFormula ? 25 : 0) +
      (input.hasIngredient ? 25 : 0) +
      (input.hasRegulation ? 25 : 0) +
      (input.hasDocument ? 25 : 0)
  );
}

export function getCopilotExecutionStatus(confidence: number) {
  if (confidence >= 80) return "READY";
  if (confidence >= 50) return "NEEDS_REVIEW";
  return "BLOCKED";
}
