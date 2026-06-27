import type { FormulaLineForValidation, FormulaValidationIssue, RawMaterialRule } from "@/types/goldFormulaValidation";

const allowedPhases = ["A", "B", "C", "D", "E", "F", "G", "H"];

const restrictedKeywords = [
  "chloroform",
  "mercury",
  "hydroquinone",
  "formaldehyde",
  "methanol",
];

export function runFormulaValidationEngine(input: {
  formulaCode: string;
  revision: string;
  lines: FormulaLineForValidation[];
  rawMaterials: RawMaterialRule[];
}) {
  const issues: FormulaValidationIssue[] = [];
  const { formulaCode, revision, lines, rawMaterials } = input;

  const totalPercent = Number(lines.reduce((sum, line) => sum + Number(line.percentage || 0), 0).toFixed(4));

  if (lines.length === 0) {
    issues.push({
      formula_code: formulaCode,
      revision,
      issue_type: "MISSING_RAW",
      severity: "BLOCKER",
      message: "처방 라인이 없습니다.",
      action: "최소 1개 이상의 원료 라인을 등록하세요.",
    });
  }

  if (Math.abs(totalPercent - 100) >= 0.0001) {
    issues.push({
      formula_code: formulaCode,
      revision,
      issue_type: "TOTAL_PERCENT",
      severity: Math.abs(totalPercent - 100) > 5 ? "BLOCKER" : "ERROR",
      message: `처방 총합이 ${totalPercent}%입니다.`,
      action: "처방 총합을 100%로 보정하세요.",
    });
  }

  const rawCounts = new Map<string, number>();
  for (const line of lines) {
    rawCounts.set(line.raw_code, (rawCounts.get(line.raw_code) || 0) + 1);
  }

  for (const [rawCode, count] of rawCounts.entries()) {
    if (count > 1) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "DUPLICATE_RAW",
        severity: "WARNING",
        raw_code: rawCode,
        message: `${rawCode} 원료가 ${count}회 중복 사용되었습니다.`,
        action: "의도된 중복인지 확인하고 가능하면 하나의 라인으로 합산하세요.",
      });
    }
  }

  for (const line of lines) {
    if (!allowedPhases.includes(String(line.phase || "").toUpperCase())) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "PHASE",
        severity: "ERROR",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.line_no}번 라인의 Phase 값이 잘못되었습니다: ${line.phase}`,
        action: "Phase는 A~H 중 하나로 입력하세요.",
      });
    }

    if (Number(line.percentage) <= 0) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "PERCENTAGE_RANGE",
        severity: "ERROR",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.line_no}번 라인의 함량이 0 이하입니다.`,
        action: "함량을 0보다 크게 입력하세요.",
      });
    }

    if (Number(line.percentage) > 100) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "PERCENTAGE_RANGE",
        severity: "BLOCKER",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.line_no}번 라인의 함량이 100%를 초과합니다.`,
        action: "함량을 확인하세요.",
      });
    }

    if (!line.inci_en && !line.inci_kr) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "MISSING_INCI",
        severity: "WARNING",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.line_no}번 라인의 INCI 정보가 비어 있습니다.`,
        action: "원료마스터에서 INCI 국문/영문을 보완하세요.",
      });
    }

    const lower = `${line.raw_name || ""} ${line.inci_en || ""} ${line.inci_kr || ""}`.toLowerCase();
    if (restrictedKeywords.some((keyword) => lower.includes(keyword))) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "PROHIBITED_RAW",
        severity: "BLOCKER",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.line_no}번 라인에서 금지/주의 원료 키워드가 감지되었습니다.`,
        action: "RA 검토 전까지 처방 승인/고객 제출을 보류하세요.",
      });
    }
  }

  const rawMap = new Map(rawMaterials.map((raw) => [raw.raw_code, raw]));
  for (const line of lines) {
    const raw = rawMap.get(line.raw_code);
    if (!raw) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "MISSING_RAW",
        severity: "ERROR",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${line.raw_code} 원료가 원료마스터에서 확인되지 않습니다.`,
        action: "원료마스터 등록 여부를 확인하세요.",
      });
      continue;
    }

    if (!raw.inci_en && !raw.inci_kr) {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "MISSING_INCI",
        severity: "WARNING",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${raw.raw_code} 원료마스터의 INCI 정보가 비어 있습니다.`,
        action: "원료마스터 INCI 정보를 보완하세요.",
      });
    }

    if (!raw.document_status || raw.document_status === "MISSING" || raw.document_status === "EXPIRED") {
      issues.push({
        formula_code: formulaCode,
        revision,
        issue_type: "DOCUMENT",
        severity: raw.document_status === "EXPIRED" ? "ERROR" : "WARNING",
        line_no: line.line_no,
        raw_code: line.raw_code,
        message: `${raw.raw_code} 문서 상태가 ${raw.document_status || "MISSING"}입니다.`,
        action: "COA/MSDS/Spec 등 원료 문서를 확인하세요.",
      });
    }
  }

  const blockerCount = issues.filter((issue) => issue.severity === "BLOCKER").length;
  const errorCount = issues.filter((issue) => issue.severity === "ERROR").length;

  return {
    totalPercent,
    issues,
    issueCount: issues.length,
    blockerCount,
    validationStatus: blockerCount > 0 || errorCount > 0 ? "FAIL" : issues.length > 0 ? "WATCH" : "PASS",
  };
}
