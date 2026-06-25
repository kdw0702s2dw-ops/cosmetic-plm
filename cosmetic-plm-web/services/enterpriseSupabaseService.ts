// Phase 16 Enterprise Supabase CRUD Bridge
// This file uses dependency injection: pass your Supabase client as the first argument.
// Example later:
// import { supabase } from "@/lib/supabase";
// await listProjects(supabase);

type SupabaseLike = {
  from: (table: string) => any;
};

export async function listProjects(supabase: SupabaseLike) {
  return supabase.from("enterprise_projects").select("*").order("created_at", { ascending: false });
}

export async function createProject(supabase: SupabaseLike, payload: Record<string, unknown>) {
  return supabase.from("enterprise_projects").insert(payload).select("*").single();
}

export async function updateProjectStatus(
  supabase: SupabaseLike,
  id: string,
  status: string,
  progress: number
) {
  return supabase.from("enterprise_projects").update({ status, progress, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
}

export async function listFormulas(supabase: SupabaseLike) {
  return supabase.from("enterprise_formulas").select("*").order("created_at", { ascending: false });
}

export async function createFormula(supabase: SupabaseLike, payload: Record<string, unknown>) {
  return supabase.from("enterprise_formulas").insert(payload).select("*").single();
}

export async function updateFormulaLock(
  supabase: SupabaseLike,
  id: string,
  isLocked: boolean,
  status: string
) {
  return supabase.from("enterprise_formulas").update({ is_locked: isLocked, status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
}

export async function searchIngredients(
  supabase: SupabaseLike,
  keyword: string,
  page = 1,
  pageSize = 50
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const query = supabase
    .from("ingredient_master_global")
    .select("*", { count: "exact" })
    .range(from, to);

  if (!keyword.trim()) return query;

  const safeKeyword = keyword.trim();
  return query.or(`inci_name.ilike.%${safeKeyword}%,korean_name.ilike.%${safeKeyword}%,cas_no.ilike.%${safeKeyword}%`);
}

export async function createRawMaterial(supabase: SupabaseLike, payload: Record<string, unknown>) {
  return supabase.from("enterprise_raw_materials").insert(payload).select("*").single();
}

export async function createAuditLog(supabase: SupabaseLike, payload: Record<string, unknown>) {
  return supabase.from("audit_logs").insert(payload);
}

export async function listCustomerPortalItems(supabase: SupabaseLike, customerName?: string) {
  let query = supabase.from("enterprise_customer_portal_items").select("*").eq("visible_to_customer", true);
  if (customerName) query = query.eq("customer_name", customerName);
  return query.order("last_update", { ascending: false });
}

export async function listSupplierTasks(supabase: SupabaseLike, supplier?: string) {
  let query = supabase.from("enterprise_supplier_tasks").select("*");
  if (supplier) query = query.eq("supplier", supplier);
  return query.order("created_at", { ascending: false });
}
