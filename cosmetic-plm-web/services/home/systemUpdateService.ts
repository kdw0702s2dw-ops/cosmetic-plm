"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 연구원 홈에 노출되는 "시스템 업데이트" 안내. 등록 후 이 일수가 지나면 화면에서 자동으로 사라진다
// (행을 지우는 게 아니라, 조회 시 created_at 기준으로 걸러내는 방식 - 나중에 필요하면 이력 조회도 가능).
export const SYSTEM_UPDATE_VISIBLE_DAYS = 2;

export type SystemUpdate = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
};

// 최근 N일(SYSTEM_UPDATE_VISIBLE_DAYS) 이내에 등록된 업데이트만 최신순으로 반환한다.
export async function fetchRecentSystemUpdates(): Promise<SystemUpdate[]> {
  const cutoff = new Date(Date.now() - SYSTEM_UPDATE_VISIBLE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseProductionFinal
    .from("plm_system_updates")
    .select("*")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SystemUpdate[];
}

export async function addSystemUpdate(params: { title: string; description?: string; createdBy?: string }): Promise<SystemUpdate> {
  const { title, description, createdBy } = params;
  const { data, error } = await supabaseProductionFinal
    .from("plm_system_updates")
    .insert({ title: title.trim(), description: description?.trim() || null, created_by: createdBy ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as SystemUpdate;
}

export async function deleteSystemUpdate(id: string): Promise<void> {
  const { error } = await supabaseProductionFinal.from("plm_system_updates").delete().eq("id", id);
  if (error) throw error;
}
