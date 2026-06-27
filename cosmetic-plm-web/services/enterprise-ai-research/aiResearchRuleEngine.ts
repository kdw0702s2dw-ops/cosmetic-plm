import type { AiGeneratedFormulaLine, AiResearchAction, AiResearchMode } from "@/types/enterpriseAiResearch";

const baseFormulaLibrary: Record<string, AiGeneratedFormulaLine[]> = {
  Cream: [
    { line_no: 1, phase: "A", raw_code: "RM-00001", raw_name: "정제수", inci_en: "Water", inci_kr: "정제수", percentage: 68.5, function_en: "Solvent", reason: "기본 수상 베이스" },
    { line_no: 2, phase: "A", raw_code: "RM-00002", raw_name: "글리세린", inci_en: "Glycerin", inci_kr: "글리세린", percentage: 5, function_en: "Humectant", reason: "보습" },
    { line_no: 3, phase: "A", raw_code: "RM-00003", raw_name: "부틸렌글라이콜", inci_en: "Butylene Glycol", inci_kr: "부틸렌글라이콜", percentage: 6, function_en: "Humectant", reason: "보습 및 용제" },
    { line_no: 4, phase: "B", raw_code: "RM-00041", raw_name: "스쿠알란", inci_en: "Squalane", inci_kr: "스쿠알란", percentage: 8, function_en: "Emollient", reason: "피부 장벽감 및 사용감" },
    { line_no: 5, phase: "B", raw_code: "RM-00078", raw_name: "세테아릴알코올", inci_en: "Cetearyl Alcohol", inci_kr: "세테아릴알코올", percentage: 3, function_en: "Emulsion Stabilizer", reason: "유화 안정화" },
    { line_no: 6, phase: "B", raw_code: "RM-00081", raw_name: "글리세릴스테아레이트", inci_en: "Glyceryl Stearate", inci_kr: "글리세릴스테아레이트", percentage: 2.5, function_en: "Emulsifier", reason: "유화" },
    { line_no: 7, phase: "C", raw_code: "RM-00022", raw_name: "판테놀", inci_en: "Panthenol", inci_kr: "판테놀", percentage: 2, function_en: "Skin Conditioning", reason: "진정" },
    { line_no: 8, phase: "C", raw_code: "RM-00036", raw_name: "세라마이드엔피", inci_en: "Ceramide NP", inci_kr: "세라마이드엔피", percentage: 0.5, function_en: "Skin Conditioning", reason: "장벽 케어" },
    { line_no: 9, phase: "C", raw_code: "RM-00163", raw_name: "페녹시에탄올", inci_en: "Phenoxyethanol", inci_kr: "페녹시에탄올", percentage: 0.8, function_en: "Preservative", reason: "방부" },
    { line_no: 10, phase: "C", raw_code: "RM-00164", raw_name: "에틸헥실글리세린", inci_en: "Ethylhexylglycerin", inci_kr: "에틸헥실글리세린", percentage: 0.7, function_en: "Preservative Booster", reason: "방부 보조" },
    { line_no: 11, phase: "A", raw_code: "RM-00009", raw_name: "카보머", inci_en: "Carbomer", inci_kr: "카보머", percentage: 0.3, function_en: "Viscosity Increasing", reason: "점도 형성" },
    { line_no: 12, phase: "C", raw_code: "RM-00112", raw_name: "시트릭애씨드", inci_en: "Citric Acid", inci_kr: "시트릭애씨드", percentage: 0.7, function_en: "pH Adjuster", reason: "pH 조정" },
  ],
  Serum: [
    { line_no: 1, phase: "A", raw_code: "RM-00001", raw_name: "정제수", inci_en: "Water", inci_kr: "정제수", percentage: 78.5, function_en: "Solvent", reason: "수상 베이스" },
    { line_no: 2, phase: "A", raw_code: "RM-00002", raw_name: "글리세린", inci_en: "Glycerin", inci_kr: "글리세린", percentage: 5, function_en: "Humectant", reason: "보습" },
    { line_no: 3, phase: "A", raw_code: "RM-00024", raw_name: "나이아신아마이드", inci_en: "Niacinamide", inci_kr: "나이아신아마이드", percentage: 5, function_en: "Skin Conditioning", reason: "브라이트닝 컨셉" },
    { line_no: 4, phase: "A", raw_code: "RM-00019", raw_name: "소듐하이알루로네이트", inci_en: "Sodium Hyaluronate", inci_kr: "소듐하이알루로네이트", percentage: 0.2, function_en: "Humectant", reason: "보습" },
    { line_no: 5, phase: "A", raw_code: "RM-00022", raw_name: "판테놀", inci_en: "Panthenol", inci_kr: "판테놀", percentage: 3, function_en: "Skin Conditioning", reason: "진정" },
    { line_no: 6, phase: "A", raw_code: "RM-00098", raw_name: "잔탄검", inci_en: "Xanthan Gum", inci_kr: "잔탄검", percentage: 0.3, function_en: "Viscosity Increasing", reason: "점도 안정화" },
    { line_no: 7, phase: "C", raw_code: "RM-00163", raw_name: "페녹시에탄올", inci_en: "Phenoxyethanol", inci_kr: "페녹시에탄올", percentage: 0.8, function_en: "Preservative", reason: "방부" },
    { line_no: 8, phase: "C", raw_code: "RM-00164", raw_name: "에틸헥실글리세린", inci_en: "Ethylhexylglycerin", inci_kr: "에틸헥실글리세린", percentage: 0.7, function_en: "Preservative Booster", reason: "방부 보조" },
    { line_no: 9, phase: "A", raw_code: "RM-00003", raw_name: "부틸렌글라이콜", inci_en: "Butylene Glycol", inci_kr: "부틸렌글라이콜", percentage: 6.5, function_en: "Humectant", reason: "보습/용제" },
  ],
};

export function generateAiResearchResult(input: {
  projectCode: string;
  mode: AiResearchMode;
  productType: string;
  claim: string;
  targetCost: number | null;
  targetCountry: string;
  prompt: string;
}) {
  const productType = input.productType || "Cream";
  const base = baseFormulaLibrary[productType] || baseFormulaLibrary.Cream;
  const lines = tuneFormulaByPrompt(base, input.prompt, input.claim);
  const total = Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));

  const actions: AiResearchAction[] = [];
  if (Math.abs(total - 100) > 0.0001) {
    actions.push(makeAction(input.projectCode, "Formula", "P0", `생성 처방 총합이 ${total}%입니다.`, "100%로 보정하세요."));
  }
  if ((input.targetCost || 0) > 0) {
    actions.push(makeAction(input.projectCode, "Cost", "P1", `목표 원가 ${input.targetCost}원/kg 기준 검토가 필요합니다.`, "Cost Engine 실행 후 고비용 원료를 검토하세요."));
  }
  actions.push(makeAction(input.projectCode, "Regulation", "P1", `${input.targetCountry} 출시 규제 검토가 필요합니다.`, "Regulation/AI Copilot에서 국가별 검토를 실행하세요."));
  actions.push(makeAction(input.projectCode, "Stability", "P1", "초기 안정성 리스크 검토가 필요합니다.", "Formula Intelligence Center에서 안정성 평가를 실행하세요."));
  actions.push(makeAction(input.projectCode, "Document", "P2", "처방 확정 후 문서 패키지를 생성하세요.", "Document Automation에서 Formula Sheet, 전성분표, Spec, COA를 생성하세요."));

  return {
    project_code: input.projectCode,
    product_type: productType,
    claim: input.claim,
    target_country: input.targetCountry,
    target_cost_per_kg: input.targetCost,
    generated_formula_lines: lines,
    formula_total_percent: total,
    strategy: buildStrategy(input.prompt, input.claim),
    actions,
  };
}

function tuneFormulaByPrompt(base: AiGeneratedFormulaLine[], prompt: string, claim: string) {
  const text = `${prompt} ${claim}`.toLowerCase();
  let lines = base.map((x) => ({ ...x }));

  if (text.includes("민감") || text.includes("sensitive") || text.includes("진정")) {
    lines = lines.map((x) => x.inci_en === "Panthenol" ? { ...x, percentage: Math.max(x.percentage, 3), reason: x.reason + " / 민감성 진정 강화" } : x);
  }

  if (text.includes("세라마이드") || text.includes("barrier") || text.includes("장벽")) {
    lines = lines.map((x) => x.inci_en === "Ceramide NP" ? { ...x, percentage: Math.max(x.percentage, 0.5), reason: x.reason + " / 장벽 컨셉 핵심" } : x);
  }

  if (text.includes("저가") || text.includes("원가") || text.includes("cost")) {
    lines = lines.map((x) => x.inci_en === "Squalane" ? { ...x, percentage: Math.min(x.percentage, 5), reason: x.reason + " / 원가 절감 조정" } : x);
  }

  const total = lines.reduce((sum, x) => sum + x.percentage, 0);
  const diff = Number((100 - total).toFixed(4));
  lines[0] = { ...lines[0], percentage: Number((lines[0].percentage + diff).toFixed(4)) };
  return lines;
}

function buildStrategy(prompt: string, claim: string) {
  return [
    `요청 컨셉: ${claim || "General"}`,
    `프롬프트 기반 핵심 방향: ${prompt || "기본 ODM 베이스 처방"}`,
    "1차 생성 처방은 연구원 검토용이며, 안정성/규제/원가/문서 검토 후 확정해야 합니다.",
  ];
}

function makeAction(projectCode: string, category: AiResearchAction["category"], priority: AiResearchAction["priority"], message: string, action: string): AiResearchAction {
  return { project_code: projectCode, category, priority, message, action, status: "OPEN" };
}
