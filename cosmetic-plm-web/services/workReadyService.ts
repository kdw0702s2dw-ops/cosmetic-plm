// Work Ready Integrated Pack Service

export function getMappingStatus(recordCount: number, qualityScore: number) {
  if (recordCount > 0 && qualityScore >= 80) return "SYNCED";
  if (qualityScore < 40) return "ERROR";
  return "NEEDS_MAPPING";
}

export function getAiReviewStatus(confidence: number) {
  if (confidence >= 90) return "APPROVED";
  if (confidence >= 75) return "READY";
  return "NEEDS_REVIEW";
}

export function getDocumentStatus(hasSourceData: boolean, requiresReview = true) {
  if (!hasSourceData) return "DRAFT";
  return requiresReview ? "REVIEW" : "GENERATED";
}

export function getChatbotRisk(hasRegRisk: boolean, hasQualityRisk: boolean) {
  if (hasRegRisk || hasQualityRisk) return "HIGH";
  return "LOW";
}

export function getCodeQualityStatus(watchCount: number, fixRequiredCount: number) {
  if (fixRequiredCount > 0) return "FIX_REQUIRED";
  if (watchCount > 0) return "WATCH";
  return "GOOD";
}
