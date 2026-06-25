export function getRegulationRisk(type: string) {
  if (type === "Prohibited") return "HIGH";
  if (type === "Restricted") return "MEDIUM";
  if (type === "Warning") return "LOW";
  return "LOW";
}
