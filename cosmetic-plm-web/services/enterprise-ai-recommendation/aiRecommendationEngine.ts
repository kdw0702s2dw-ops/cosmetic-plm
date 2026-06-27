export function buildAiRecommendations(input: {
  runCode: string;
  requestText: string;
  productType: string;
  claim: string;
  targetCost: number | null;
  targetCountry: string;
  formulas: any[];
  rawMaterials: any[];
  inciRows: any[];
  regulationRules: any[];
  compatibilityRules: any[];
}) {
  const request = `${input.requestText} ${input.productType} ${input.claim}`.toLowerCase();

  const similarFormulas = input.formulas
    .map((formula) => {
      const text = `${formula.formula_name || ""} ${formula.product_type || ""} ${formula.claim || ""}`.toLowerCase();
      let score = 0;
      for (const token of request.split(/\s+/).filter(Boolean)) {
        if (text.includes(token)) score += 5;
      }
      if (input.productType && text.includes(input.productType.toLowerCase())) score += 20;
      if (input.claim && text.includes(input.claim.toLowerCase().split("/")[0].trim())) score += 15;
      return { ...formula, similarity_score: Math.min(100, score) };
    })
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);

  const rawCandidates = input.rawMaterials
    .filter((raw) => {
      const text = `${raw.raw_name || ""} ${raw.inci_en || ""} ${raw.inci_kr || ""}`.toLowerCase();
      return ["glycerin", "panthenol", "ceramide", "niacinamide", "hyaluronate", "squalane", "carbomer"].some((k) => text.includes(k));
    })
    .slice(0, 10);

  const regulationHits = input.regulationRules.filter((rule) => {
    const keyword = String(rule.keyword || "").toLowerCase();
    return keyword && request.includes(keyword.toLowerCase());
  });

  const compatibilityHits = input.compatibilityRules.filter((rule) => {
    const a = String(rule.ingredient_a || "").toLowerCase();
    const b = String(rule.ingredient_b || "").toLowerCase();
    return (a && request.includes(a)) || (b && request.includes(b));
  });

  const items = [];

  items.push({
    run_code: input.runCode,
    recommendation_type: "SIMILAR_FORMULA",
    priority: "P1",
    title: "유사 처방 후보",
    message: similarFormulas.length ? `유사 처방 ${similarFormulas.length}건을 찾았습니다.` : "유사 처방이 부족합니다. Formula Library를 확장하세요.",
    expected_impact: "기존 처방 기반 개발 시간 단축",
    status: "OPEN",
  });

  items.push({
    run_code: input.runCode,
    recommendation_type: "RAW_SUBSTITUTE",
    priority: "P1",
    title: "추천 원료 후보",
    message: rawCandidates.length ? `핵심 컨셉 원료 후보 ${rawCandidates.length}건을 찾았습니다.` : "추천 가능한 원료 후보가 부족합니다.",
    expected_impact: "원료 선택 속도 향상",
    status: "OPEN",
  });

  if (input.targetCost) {
    items.push({
      run_code: input.runCode,
      recommendation_type: "COST_OPTIMIZATION",
      priority: "P0",
      title: "목표 원가 최적화",
      message: `목표 원가 ${input.targetCost.toLocaleString()}원/kg 기준으로 고비용 원료를 대체 검토하세요.`,
      expected_impact: "개발 초기 원가 초과 방지",
      status: "OPEN",
    });
  }

  items.push({
    run_code: input.runCode,
    recommendation_type: "STABILITY_PREDICTION",
    priority: compatibilityHits.length ? "P0" : "P2",
    title: "상용성/안정성 예측",
    message: compatibilityHits.length ? `상용성 주의 항목 ${compatibilityHits.length}건이 감지되었습니다.` : "상용성 리스크가 낮게 평가되었습니다.",
    expected_impact: "안정성 실패 가능성 감소",
    status: "OPEN",
  });

  items.push({
    run_code: input.runCode,
    recommendation_type: "REGULATION_RISK",
    priority: regulationHits.length ? "P0" : "P1",
    title: "규제 리스크",
    message: regulationHits.length ? `${input.targetCountry} 포함 규제 검토 후보 ${regulationHits.length}건 감지` : "1차 규제 키워드 리스크 낮음",
    expected_impact: "출시 국가별 리스크 조기 발견",
    status: "OPEN",
  });

  items.push({
    run_code: input.runCode,
    recommendation_type: "PH_RECOMMENDATION",
    priority: "P2",
    title: "추천 pH 범위",
    message: request.includes("약산성") || request.includes("sensitive") ? "민감성/약산성 컨셉: pH 5.0~6.0 권장" : "일반 스킨케어: pH 5.5~7.0 권장",
    expected_impact: "피부 사용감 및 안정성 개선",
    status: "OPEN",
  });

  items.push({
    run_code: input.runCode,
    recommendation_type: "PRESERVATIVE_SYSTEM",
    priority: "P2",
    title: "방부 시스템 추천",
    message: "Phenoxyethanol + Ethylhexylglycerin 또는 제품 pH/제형에 맞는 대체 방부 시스템을 검토하세요.",
    expected_impact: "미생물 안정성 확보",
    status: "OPEN",
  });

  items.push({
    run_code: input.runCode,
    recommendation_type: "EMULSIFIER_SYSTEM",
    priority: input.productType.toLowerCase().includes("cream") ? "P1" : "P2",
    title: "유화 시스템 추천",
    message: input.productType.toLowerCase().includes("cream") ? "크림 제형: Glyceryl Stearate/Cetearyl Alcohol/Sorbitan계 조합 검토" : "수상 제형: Solubilizer/폴리머 안정화 검토",
    expected_impact: "제형 안정성 및 사용감 개선",
    status: "OPEN",
  });

  return {
    summary: {
      similar_formula_count: similarFormulas.length,
      raw_candidate_count: rawCandidates.length,
      regulation_hit_count: regulationHits.length,
      compatibility_hit_count: compatibilityHits.length,
      recommendation_count: items.length,
    },
    similar_formulas: similarFormulas,
    raw_candidates: rawCandidates,
    regulation_hits: regulationHits,
    compatibility_hits: compatibilityHits,
    items,
  };
}
