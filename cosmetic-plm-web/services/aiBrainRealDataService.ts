// AI Brain Real Data Pack Service

export function calculateLaunchScore(input: {
  formulaTotalFail: boolean;
  hasRegRisk: boolean;
  hasDocumentRisk: boolean;
  costPerKg: number;
}) {
  return Math.max(
    0,
    Math.min(
      100,
      92
        - (input.formulaTotalFail ? 30 : 0)
        - (input.hasRegRisk ? 25 : 0)
        - (input.hasDocumentRisk ? 15 : 0)
        - (input.costPerKg > 15000 ? 8 : 0)
    )
  );
}

export function getRiskLevelByScore(score: number) {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "HIGH";
  return "BLOCKER";
}

export function getLaunchDecision(score: number) {
  if (score >= 80) return "GO";
  if (score >= 60) return "WATCH";
  return "HOLD";
}

export function buildCostRecommendation(costPerKg: number) {
  if (costPerKg > 15000) return "고가 원료의 공급사 이원화와 함량 최적화를 검토하세요.";
  return "현재 kg당 원가가 관리 가능한 수준입니다.";
}

export function buildStabilityRecommendation(productType: string) {
  if (productType.toLowerCase().includes("cream")) {
    return "45℃, RT, Freeze-thaw, 원심 안정성, 점도 변화를 우선 확인하세요.";
  }
  return "pH, 점도, 색상, 냄새, 미생물, 포장 적합성을 확인하세요.";
}
