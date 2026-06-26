// Master Data Live CRUD Pack Service

export function checkDuplicateByName<T extends { raw_name?: string; inci_en?: string; formula_code?: string }>(
  items: T[],
  value: string,
  key: keyof T
) {
  return items.some((item) => String(item[key] || "").trim().toLowerCase() === value.trim().toLowerCase());
}

export function normalizeFormulaPercentages<T extends { percentage: number }>(items: T[]) {
  const total = items.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  if (!total) return items;
  return items.map((item) => ({ ...item, percentage: Number(((item.percentage / total) * 100).toFixed(4)) }));
}

export function getDocumentStatusColor(status: string) {
  if (status === "VALID") return "GOOD";
  if (status === "EXPIRING") return "WATCH";
  return "RISK";
}

export function getRegulationRisk(ruleType: string) {
  if (ruleType === "PROHIBITED") return "BLOCKER";
  if (ruleType === "RESTRICTED") return "HIGH";
  if (ruleType === "WARNING") return "MEDIUM";
  return "LOW";
}

export function buildCrudAudit(module: string, action: string, target: string, status: string) {
  return {
    module,
    action,
    target,
    status,
    created_at: new Date().toISOString(),
  };
}
