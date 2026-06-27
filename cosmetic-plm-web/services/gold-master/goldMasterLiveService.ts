"use client";

import { supabaseGold } from "@/lib/supabaseGoldClient";
import type { GoldModuleHealth, GoldRawMaterial, GoldFormula } from "@/types/goldMaster";

const moduleTables = [
  ["Raw Materials", "enterprise_raw_material_master"],
  ["Formula", "enterprise_formula_master"],
  ["Documents", "enterprise_live_documents"],
  ["Regulation", "enterprise_regulation_rules"],
  ["AI Brain", "enterprise_ai_brain_advisors"],
  ["Production Final", "enterprise_production_final_crud"],
  ["Go Live", "enterprise_go_live_checklist"],
];

export async function fetchGoldHealth(): Promise<GoldModuleHealth[]> {
  const result: GoldModuleHealth[] = [];

  for (const [module, tableName] of moduleTables) {
    const { count, error } = await supabaseGold
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      result.push({ module, tableName, count: 0, status: "ERROR", message: error.message });
    } else {
      const c = count || 0;
      result.push({
        module,
        tableName,
        count: c,
        status: c > 0 ? "LIVE" : "EMPTY",
        message: c > 0 ? "Supabase live data connected" : "No data yet",
      });
    }
  }

  return result;
}

export async function fetchGoldRawMaterials(keyword = "", limit = 200): Promise<GoldRawMaterial[]> {
  let query = supabaseGold
    .from("enterprise_raw_material_master")
    .select("raw_code, raw_name, supplier, unit_price, inci_kr, inci_en, cas_no, ec_no, document_status")
    .order("raw_code", { ascending: true })
    .limit(limit);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_en.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GoldRawMaterial[];
}

export async function fetchGoldFormulas(keyword = "", limit = 200): Promise<GoldFormula[]> {
  let query = supabaseGold
    .from("enterprise_formula_master")
    .select("formula_code, formula_name, revision, raw_code, percentage, phase, claim")
    .order("formula_code", { ascending: true })
    .limit(limit);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,raw_code.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GoldFormula[];
}
