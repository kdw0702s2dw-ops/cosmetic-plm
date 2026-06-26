// Final Sprint A: Supabase Live CRUD Enterprise Service

export function canUseRealtime(moduleName: string) {
  return ["Formula", "Ingredient", "Document", "Workflow", "Approval"].includes(moduleName);
}

export function buildAuditEvent(input: { module: string; operation: string; target: string; user?: string }) {
  return {
    id: `audit-${Date.now()}`,
    module: input.module,
    operation: input.operation,
    target: input.target,
    user: input.user || "system",
    created_at: new Date().toISOString(),
  };
}

export function getCrudReadiness(input: { connected: number; total: number }) {
  if (!input.total) return "RISK";
  const ratio = input.connected / input.total;
  if (ratio >= 0.8) return "GOOD";
  if (ratio >= 0.5) return "WATCH";
  return "RISK";
}

export function isWriteOperation(operation: string) {
  return ["INSERT", "UPDATE", "DELETE", "UPSERT"].includes(operation);
}
