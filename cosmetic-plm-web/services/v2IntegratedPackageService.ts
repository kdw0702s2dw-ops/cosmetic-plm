// Phase 31~35 Enterprise v2.0 Integrated Package Service

export function getDigitalTwinMixer(batchKg: number) {
  if (batchKg < 10) return "Lab Homomixer";
  if (batchKg < 100) return "Pilot Vacuum Mixer";
  if (batchKg < 1000) return "Production Vacuum Mixer";
  return "Mass Tank";
}

export function predictDigitalTwinYield(batchKg: number) {
  if (batchKg < 10) return 98;
  if (batchKg < 100) return 97;
  if (batchKg < 1000) return 96;
  return 94;
}

export function getRegulatoryAiStatus(highRiskCount: number, mediumRiskCount: number) {
  if (highRiskCount > 0) return "BLOCKED";
  if (mediumRiskCount > 0) return "CAUTION";
  return "OK";
}

export function getKpiStatus(value: number, warning: number, risk: number) {
  if (value >= risk) return "RISK";
  if (value >= warning) return "WATCH";
  return "GOOD";
}

export function canLockV2Package(input: { p0Count: number; regulatoryBlocked: number; criticalDeviation: number }) {
  return input.p0Count === 0 && input.regulatoryBlocked === 0 && input.criticalDeviation === 0;
}
