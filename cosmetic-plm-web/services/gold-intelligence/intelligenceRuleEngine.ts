import type { FormulaScore, IntelligenceRecommendation, RegulationRisk, StabilityRisk } from "@/types/goldIntelligence";

export function evaluateStability(input: { formulaCode: string; revision: string; lines: any[] }): StabilityRisk[] {
  const risks: StabilityRisk[] = [];
  const text = input.lines.map((x) => `${x.raw_name || ""} ${x.inci_en || ""} ${x.function_en || ""}`).join(" ").toLowerCase();
  const oilPercent = input.lines
    .filter((x) => /oil|butter|wax|squalane|dimethicone|silicone|triglyceride/i.test(`${x.raw_name} ${x.inci_en}`))
    .reduce((sum, x) => sum + Number(x.percentage || 0), 0);
  const surfactantPercent = input.lines
    .filter((x) => /surfactant|emulsifier|polysorbate|glyceryl|cetearyl|lecithin/i.test(`${x.function_en} ${x.raw_name} ${x.inci_en}`))
    .reduce((sum, x) => sum + Number(x.percentage || 0), 0);
  const acidPercent = input.lines
    .filter((x) => /acid|salicylic|glycolic|lactic|ascorbic/i.test(`${x.raw_name} ${x.inci_en}`))
    .reduce((sum, x) => sum + Number(x.percentage || 0), 0);

  if (oilPercent > 20 && surfactantPercent < 2) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      area: "Separation",
      risk_level: "HIGH",
      message: `오일/왁스성 원료가 ${oilPercent.toFixed(2)}%이나 유화 안정화 성분이 낮습니다.`,
      recommendation: "유화제/점증제 보강 또는 유상 비율 조정을 검토하세요.",
    });
  }

  if (acidPercent > 5) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      area: "pH",
      risk_level: "MEDIUM",
      message: `산성 원료 비율이 ${acidPercent.toFixed(2)}%입니다.`,
      recommendation: "pH 목표 범위, 완충 시스템, 자극 가능성을 확인하세요.",
    });
  }

  if (/retinol|ascorbic|tocopherol/.test(text)) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      area: "Oxidation",
      risk_level: "MEDIUM",
      message: "산화 민감 원료가 포함되어 있습니다.",
      recommendation: "항산화제, 킬레이트제, 차광/에어리스 포장 적용을 검토하세요.",
    });
  }

  if (/fragrance|parfum|limonene|linalool|citral|eugenol/.test(text)) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      area: "Odor",
      risk_level: "LOW",
      message: "향료 또는 알러젠 성분 후보가 포함되어 있습니다.",
      recommendation: "향 안정성, 알러젠 표시, 민감성 타깃 적합성을 확인하세요.",
    });
  }

  if (risks.length === 0) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      area: "Temperature",
      risk_level: "LOW",
      message: "주요 안정성 리스크가 낮게 평가되었습니다.",
      recommendation: "고온/저온/Freeze-Thaw 기본 안정성 시험을 진행하세요.",
    });
  }

  return risks;
}

export function evaluateRegulation(input: { formulaCode: string; revision: string; lines: any[] }): RegulationRisk[] {
  const risks: RegulationRisk[] = [];
  const countries: RegulationRisk["country"][] = ["KR", "EU", "US", "CN", "JP", "ASEAN"];

  for (const line of input.lines) {
    const text = `${line.raw_name || ""} ${line.inci_en || ""}`.toLowerCase();

    if (/hydroquinone|formaldehyde|chloroform|mercury/.test(text)) {
      for (const country of countries) {
        risks.push({
          formula_code: input.formulaCode,
          revision: input.revision,
          country,
          raw_code: line.raw_code,
          risk_level: "CRITICAL",
          message: `${line.raw_code}에서 금지/고위험 원료 키워드가 감지되었습니다.`,
          recommendation: "해당 국가 출시 전 RA 즉시 검토 및 대체 원료 적용이 필요합니다.",
        });
      }
    }

    if (/retinol|salicylic|glycolic|uv filter|octocrylene|homosalate/.test(text)) {
      risks.push({
        formula_code: input.formulaCode,
        revision: input.revision,
        country: "EU",
        raw_code: line.raw_code,
        risk_level: "MEDIUM",
        message: `${line.raw_code}는 국가별 제한/고시 함량 검토가 필요할 수 있습니다.`,
        recommendation: "EU/KR/CN/JP/US 제한 함량과 사용 목적을 확인하세요.",
      });
    }
  }

  if (risks.length === 0) {
    risks.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      country: "KR",
      raw_code: null,
      risk_level: "LOW",
      message: "1차 규제 키워드 리스크가 낮게 평가되었습니다.",
      recommendation: "최종 출시 전 국가별 금지/제한 원료 DB와 RA 검토를 수행하세요.",
    });
  }

  return risks;
}

export function scoreFormula(input: {
  formulaCode: string;
  revision: string;
  validationStatus?: string | null;
  validationIssues: number;
  blockerCount: number;
  costStatus?: string | null;
  stabilityRisks: StabilityRisk[];
  regulationRisks: RegulationRisk[];
}) {
  const validationScore = Math.max(0, 100 - input.validationIssues * 5 - input.blockerCount * 25);
  const costScore = input.costStatus === "OVER_TARGET" ? 70 : input.costStatus === "NO_PRICE" ? 75 : 95;
  const stabilityPenalty = input.stabilityRisks.reduce((sum, r) => sum + riskPenalty(r.risk_level), 0);
  const regulationPenalty = input.regulationRisks.reduce((sum, r) => sum + riskPenalty(r.risk_level), 0);
  const stabilityScore = Math.max(0, 100 - stabilityPenalty);
  const regulationScore = Math.max(0, 100 - regulationPenalty);
  const documentScore = input.validationIssues > 0 ? 80 : 95;
  const overallScore = Math.round((validationScore * 0.25) + (costScore * 0.2) + (stabilityScore * 0.2) + (regulationScore * 0.25) + (documentScore * 0.1));

  const status = overallScore >= 90 ? "PASS" : overallScore >= 75 ? "WATCH" : input.blockerCount > 0 ? "BLOCK" : "FAIL";

  const score: FormulaScore = {
    formula_code: input.formulaCode,
    revision: input.revision,
    validation_score: validationScore,
    cost_score: costScore,
    stability_score: stabilityScore,
    regulation_score: regulationScore,
    document_score: documentScore,
    overall_score: overallScore,
    status,
  };

  return score;
}

export function buildRecommendations(input: {
  formulaCode: string;
  revision: string;
  score: FormulaScore;
  stabilityRisks: StabilityRisk[];
  regulationRisks: RegulationRisk[];
  validationIssues: number;
}) {
  const recs: IntelligenceRecommendation[] = [];

  if (input.validationIssues > 0) {
    recs.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      category: "Validation",
      priority: "P0",
      message: "처방 검증 이슈가 남아 있습니다.",
      action: "Validation 화면에서 BLOCKER/ERROR부터 수정하세요.",
    });
  }

  for (const risk of input.stabilityRisks.filter((x) => x.risk_level === "HIGH" || x.risk_level === "CRITICAL")) {
    recs.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      category: "Stability",
      priority: "P0",
      message: risk.message,
      action: risk.recommendation,
    });
  }

  for (const risk of input.regulationRisks.filter((x) => x.risk_level === "HIGH" || x.risk_level === "CRITICAL")) {
    recs.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      category: "Regulation",
      priority: "P0",
      message: risk.message,
      action: risk.recommendation,
    });
  }

  if (input.score.overall_score >= 90) {
    recs.push({
      formula_code: input.formulaCode,
      revision: input.revision,
      category: "Launch",
      priority: "P2",
      message: "GOLD MASTER 기준 출시 가능성이 높습니다.",
      action: "문서 자동 생성 및 승인 Workflow로 이동하세요.",
    });
  }

  return recs;
}

function riskPenalty(level: string) {
  if (level === "CRITICAL") return 40;
  if (level === "HIGH") return 25;
  if (level === "MEDIUM") return 10;
  return 2;
}
