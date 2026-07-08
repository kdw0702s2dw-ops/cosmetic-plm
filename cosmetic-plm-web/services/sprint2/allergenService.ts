"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 처방 저장 시 plm_regulatory_alerts와 정확히 같은 시점에 호출 (plm_calculate_allergen_alerts RPC)
export async function calculateAllergenAlerts(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal.rpc("plm_calculate_allergen_alerts", {
    p_formula_code: formulaCode,
    p_revision: revision,
  });
  if (error) throw error;
  return data as number;
}

export async function fetchAllergenAlerts(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_allergen_alerts")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("allergen_name_en");
  if (error) throw error;
  return data || [];
}
