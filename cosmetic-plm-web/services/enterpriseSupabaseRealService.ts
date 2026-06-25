// Phase 17 Real Data Pilot Service
// Pass your existing Supabase client into each function.
// Example:
// import { supabase } from "@/lib/supabase";
// const { data, error } = await fetchEnterpriseProjects(supabase);

type SupabaseLike = {
  from: (table: string) => any;
};

export type EnterpriseProjectPayload = {
  project_code: string;
  customer_name: string;
  project_name: string;
  researcher?: string;
  status?: string;
  progress?: number;
  launch_target?: string | null;
  memo?: string;
};

export type GlobalIngredientPayload = {
  inci_name: string;
  korean_name?: string;
  cas_no?: string;
  ec_no?: string;
  function_ko?: string;
  function_en?: string;
  eu_status?: string;
  china_status?: string;
  ewg_grade?: string;
  source?: string;
};

export type EnterpriseRawMaterialPayload = {
  raw_code: string;
  raw_name: string;
  supplier?: string;
  unit_price?: number;
  main_inci?: string;
  composition_total?: number;
};

export function getProjectProgress(status: string) {
  if (status === "개발중") return 30;
  if (status === "샘플발송") return 55;
  if (status === "양산승인") return 80;
  if (status === "출시") return 100;
  return 10;
}

export async function fetchEnterpriseProjects(supabase: SupabaseLike) {
  return supabase
    .from("enterprise_projects")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function createEnterpriseProject(
  supabase: SupabaseLike,
  payload: EnterpriseProjectPayload
) {
  const insertPayload = {
    ...payload,
    status: payload.status || "개발중",
    progress: payload.progress ?? getProjectProgress(payload.status || "개발중"),
  };

  return supabase
    .from("enterprise_projects")
    .insert(insertPayload)
    .select("*")
    .single();
}

export async function updateEnterpriseProjectStatus(
  supabase: SupabaseLike,
  id: string,
  status: string
) {
  return supabase
    .from("enterprise_projects")
    .update({
      status,
      progress: getProjectProgress(status),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
}

export async function fetchGlobalIngredients(
  supabase: SupabaseLike,
  keyword = "",
  page = 1,
  pageSize = 50
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ingredient_master_global")
    .select("*", { count: "exact" })
    .range(from, to);

  const trimmed = keyword.trim();
  if (trimmed) {
    query = query.or(
      `inci_name.ilike.%${trimmed}%,korean_name.ilike.%${trimmed}%,cas_no.ilike.%${trimmed}%`
    );
  }

  return query;
}

export async function upsertGlobalIngredient(
  supabase: SupabaseLike,
  payload: GlobalIngredientPayload
) {
  return supabase
    .from("ingredient_master_global")
    .upsert(payload, { onConflict: "inci_name" })
    .select("*")
    .single();
}

export async function fetchEnterpriseRawMaterials(supabase: SupabaseLike) {
  return supabase
    .from("enterprise_raw_materials")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function createEnterpriseRawMaterial(
  supabase: SupabaseLike,
  payload: EnterpriseRawMaterialPayload
) {
  return supabase
    .from("enterprise_raw_materials")
    .insert({
      ...payload,
      composition_total: payload.composition_total ?? 100,
    })
    .select("*")
    .single();
}

export async function insertEnterpriseAuditLog(
  supabase: SupabaseLike,
  payload: {
    actor?: string;
    action: string;
    module: string;
    target?: string;
    before_json?: unknown;
    after_json?: unknown;
  }
) {
  return supabase.from("audit_logs").insert(payload);
}
