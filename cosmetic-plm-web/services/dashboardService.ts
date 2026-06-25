export function getKpiStatus(value: number, warnThreshold: number, riskThreshold: number) {
  if (value >= riskThreshold) return "RISK";
  if (value >= warnThreshold) return "WATCH";
  return "GOOD";
}
