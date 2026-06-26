// Phase 41~45 Knowledge / SCM / API Integrated Package Service

export function forecastRawMaterialPrice(currentPrice: number, volatilityPercent: number) {
  return Math.round(currentPrice * (1 + volatilityPercent / 100));
}

export function getSupplyRisk(currentPrice: number, forecastPrice: number) {
  if (forecastPrice > currentPrice * 1.1) return "HIGH";
  if (forecastPrice > currentPrice * 1.03) return "MEDIUM";
  return "LOW";
}

export function calculateSavingPercent(currentCost: number, optimizedCost: number) {
  if (!currentCost) return 0;
  return Math.round(((currentCost - optimizedCost) / currentCost) * 100);
}

export function canUsePlant(status: string) {
  return status === "AVAILABLE";
}

export function canActivateApi(status: string) {
  return status === "READY";
}
