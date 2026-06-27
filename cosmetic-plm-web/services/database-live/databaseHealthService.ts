"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { DatabaseHealthRow } from "@/types/databaseLive";

const tables = [
  ["Raw Material", "enterprise_raw_material_master"],
  ["Formula", "enterprise_formula_master"],
  ["Document", "enterprise_live_documents"],
  ["Regulation", "enterprise_regulation_rules"],
  ["AI Brain", "enterprise_ai_brain_advisors"],
  ["Production Final", "enterprise_production_final_crud"],
];

export async function fetchDatabaseHealth(): Promise<DatabaseHealthRow[]> {
  const results: DatabaseHealthRow[] = [];

  for (const [module, tableName] of tables) {
    try {
      const { count, error } = await supabaseBrowser
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        results.push({ module, tableName, status: "ERROR", count: 0, message: error.message });
      } else {
        results.push({
          module,
          tableName,
          status: (count || 0) > 0 ? "LIVE" : "EMPTY",
          count: count || 0,
          message: (count || 0) > 0 ? "Supabase DB data is live" : "Table exists but no data",
        });
      }
    } catch (err) {
      results.push({
        module,
        tableName,
        status: "ERROR",
        count: 0,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
