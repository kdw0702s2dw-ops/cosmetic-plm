// Phase 18 + 18.5 Enterprise Master Repository Service
// Dependency injection style: pass your Supabase client into each function.

type SupabaseLike = {
  from: (table: string) => any;
};

export async function fetchRepositorySnapshot(supabase: SupabaseLike) {
  const [
    projects,
    formulas,
    rawMaterials,
    documents,
    regulations,
    customerItems,
    supplierTasks,
  ] = await Promise.all([
    supabase.from("enterprise_projects").select("*"),
    supabase.from("enterprise_formulas").select("*"),
    supabase.from("enterprise_raw_materials").select("*"),
    supabase.from("enterprise_material_documents").select("*"),
    supabase.from("enterprise_country_regulations").select("*"),
    supabase.from("enterprise_customer_portal_items").select("*"),
    supabase.from("enterprise_supplier_tasks").select("*"),
  ]);

  return {
    projects,
    formulas,
    rawMaterials,
    documents,
    regulations,
    customerItems,
    supplierTasks,
  };
}

export async function createRepositoryAudit(
  supabase: SupabaseLike,
  action: string,
  target: string,
  afterJson?: unknown
) {
  return supabase.from("audit_logs").insert({
    actor: "system",
    action,
    module: "MasterRepository",
    target,
    after_json: afterJson,
  });
}

export function getRepositoryRiskLevel(input: {
  status?: string;
  is_locked?: boolean;
  regulation_type?: string;
  composition_total?: number;
}) {
  if (input.regulation_type === "Prohibited") return "HIGH";
  if (input.composition_total !== undefined && Math.abs(input.composition_total - 100) > 0.0001) return "HIGH";
  if (input.regulation_type === "Restricted") return "MEDIUM";
  if (input.status === "보류" || input.status === "Draft") return "MEDIUM";
  return "LOW";
}

export function buildImpactAction(type: string) {
  if (type === "Formula") return "처방 Breakdown IL 및 BOM 재계산 필요";
  if (type === "Regulation") return "판매국가별 규제 한도/금지 여부 검토 필요";
  if (type === "Customer") return "고객 제출 후 변경 여부 및 Revision 승인 필요";
  if (type === "Supplier") return "공급사 문서/원료 변경 확인 필요";
  return "영향 범위 확인 필요";
}
