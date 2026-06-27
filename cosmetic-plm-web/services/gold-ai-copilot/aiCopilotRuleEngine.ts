import type { AiCopilotAction, AiCopilotCommandType } from "@/types/goldAiCopilot";

export function runAiCopilotRuleEngine(input: {
  runCode: string;
  formulaCode: string;
  revision: string;
  commandType: AiCopilotCommandType;
  prompt: string;
  validation: any;
  cost: any;
  score: any;
  stability: any[];
  regulation: any[];
  documents: any[];
}) {
  const actions: AiCopilotAction[] = [];
  const overall = Number(input.score?.overall_score || 0);
  const validationIssues = Number(input.validation?.issue_count || 0);
  const blockers = Number(input.validation?.blocker_count || 0);
  const costStatus = input.cost?.status || "NO_PRICE";
  const highStability = input.stability.filter((x) => x.risk_level === "HIGH" || x.risk_level === "CRITICAL");
  const highRegulation = input.regulation.filter((x) => x.risk_level === "HIGH" || x.risk_level === "CRITICAL");

  if ((input.commandType === "FORMULA_REVIEW" || input.commandType === "LAUNCH_READINESS") && validationIssues > 0) {
    actions.push(makeAction(input, "Formula", blockers > 0 ? "P0" : "P1", "처방 검증 이슈가 존재합니다.", "Validation Engine에서 BLOCKER/ERROR 항목을 먼저 수정하세요."));
  }

  if ((input.commandType === "COST_OPTIMIZATION" || input.commandType === "LAUNCH_READINESS") && costStatus === "OVER_TARGET") {
    actions.push(makeAction(input, "Cost", "P0", "목표 원가를 초과했습니다.", "원가 기여도 상위 원료를 중심으로 대체 원료 또는 공급사 변경을 검토하세요."));
  }

  if ((input.commandType === "COST_OPTIMIZATION" || input.commandType === "LAUNCH_READINESS") && costStatus === "NO_PRICE") {
    actions.push(makeAction(input, "Cost", "P1", "단가 누락 원료가 있습니다.", "원료마스터 unit_price를 보완한 뒤 Cost Engine을 다시 실행하세요."));
  }

  if (input.commandType === "STABILITY_REVIEW" || input.commandType === "LAUNCH_READINESS") {
    highStability.forEach((risk) => actions.push(makeAction(input, "Stability", "P0", risk.message, risk.recommendation)));
  }

  if (input.commandType === "REGULATION_REVIEW" || input.commandType === "LAUNCH_READINESS") {
    highRegulation.forEach((risk) => actions.push(makeAction(input, "Regulation", "P0", risk.message, risk.recommendation)));
  }

  if (input.commandType === "DOCUMENT_PACKAGE" || input.commandType === "LAUNCH_READINESS") {
    const docTypes = new Set(input.documents.map((d) => d.document_type));
    ["FORMULA_SHEET", "INGREDIENT_COMPOSITION", "FULL_INGREDIENT_LIST", "PRODUCT_SPEC", "COA"].forEach((type) => {
      if (!docTypes.has(type)) actions.push(makeAction(input, "Document", "P1", `${type} 문서가 아직 생성되지 않았습니다.`, "Document Automation에서 필수 문서를 생성하세요."));
    });
  }

  if (actions.length === 0) {
    actions.push(makeAction(input, "Launch", "P2", "AI Copilot 기준 주요 리스크가 낮습니다.", "최종 책임자 검토 후 Gold Master Release 절차로 이동하세요."));
  }

  const result = {
    formula_code: input.formulaCode,
    revision: input.revision,
    command_type: input.commandType,
    prompt: input.prompt,
    generated_at: new Date().toISOString(),
    summary: {
      overall_score: overall,
      validation_issues: validationIssues,
      blockers,
      cost_status: costStatus,
      high_stability_risks: highStability.length,
      high_regulation_risks: highRegulation.length,
      document_count: input.documents.length,
      action_count: actions.length,
    },
    actions,
  };

  const status = actions.some((a) => a.priority === "P0") ? "NEEDS_REVIEW" : "COMPLETED";
  return { result, actions, status };
}

function makeAction(input: any, category: AiCopilotAction["action_category"], priority: AiCopilotAction["priority"], message: string, suggested_action: string): AiCopilotAction {
  return { run_code: input.runCode, formula_code: input.formulaCode, revision: input.revision, action_category: category, priority, message, suggested_action, status: "OPEN" };
}
