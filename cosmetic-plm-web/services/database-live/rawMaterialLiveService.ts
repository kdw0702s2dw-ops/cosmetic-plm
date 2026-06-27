"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { RawMaterialLiveRow } from "@/types/databaseLive";

export async function fetchRawMaterialsLive(search = "", limit = 200) {
  let query = supabaseBrowser
    .from("enterprise_raw_material_master")
    .select("*")
    .order("raw_code", { ascending: true })
    .limit(limit);

  if (search.trim()) {
    const keyword = search.trim();
    query = query.or(
      `raw_code.ilike.%${keyword}%,raw_name.ilike.%${keyword}%,inci_kr.ilike.%${keyword}%,inci_en.ilike.%${keyword}%,cas_no.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as RawMaterialLiveRow[];
}

export async function countRawMaterialsLive() {
  const { count, error } = await supabaseBrowser
    .from("enterprise_raw_material_master")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function upsertRawMaterialLive(row: RawMaterialLiveRow) {
  const { data, error } = await supabaseBrowser
    .from("enterprise_raw_material_master")
    .upsert(row, { onConflict: "raw_code" })
    .select()
    .single();

  if (error) throw error;
  return data as RawMaterialLiveRow;
}

export async function deleteRawMaterialLive(rawCode: string) {
  const { error } = await supabaseBrowser
    .from("enterprise_raw_material_master")
    .delete()
    .eq("raw_code", rawCode);

  if (error) throw error;
}
