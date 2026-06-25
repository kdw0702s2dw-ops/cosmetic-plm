// Phase 19 External Portal RLS Service
// Pass your Supabase client into each function.

type SupabaseLike = {
  from: (table: string) => any;
};

export type ExternalAccountMappingPayload = {
  account_type: "customer" | "supplier";
  email: string;
  company_name: string;
  mapped_key: string;
  access_scope?: string;
  status?: string;
};

export async function listExternalAccountMappings(supabase: SupabaseLike) {
  return supabase
    .from("enterprise_external_account_mappings")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function createExternalAccountMapping(
  supabase: SupabaseLike,
  payload: ExternalAccountMappingPayload
) {
  return supabase
    .from("enterprise_external_account_mappings")
    .insert({
      ...payload,
      access_scope: payload.access_scope || (payload.account_type === "customer" ? "portal_only" : "documents_only"),
      status: payload.status || "READY",
    })
    .select("*")
    .single();
}

export async function activateExternalAccountMapping(supabase: SupabaseLike, id: string) {
  return supabase
    .from("enterprise_external_account_mappings")
    .update({ status: "ACTIVE", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
}

export async function listCustomerPortalForExternalUser(supabase: SupabaseLike) {
  return supabase
    .from("enterprise_customer_portal_items")
    .select("*")
    .eq("visible_to_customer", true)
    .order("last_update", { ascending: false });
}

export async function listSupplierTasksForExternalUser(supabase: SupabaseLike) {
  return supabase
    .from("enterprise_supplier_tasks")
    .select("*")
    .order("created_at", { ascending: false });
}
