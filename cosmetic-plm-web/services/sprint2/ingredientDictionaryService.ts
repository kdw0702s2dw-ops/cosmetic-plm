"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type IngredientDictionaryItem = {
  id?: string;
  inci_en?: string | null;
  inci_kr?: string | null;
  inci_cn?: string | null;
  inci_jp?: string | null;
  cas_no?: string | null;
  ec_no?: string | null;
  function_kr?: string | null;
  function_en?: string | null;
  source?: string | null;
  is_active?: boolean;
  updated_at?: string;
};

export type IngredientDictionaryPage = {
  items: IngredientDictionaryItem[];
  total: number;
};

// 목록 조회: is_active=true만, 한글명/영문명/CAS No 검색 + 페이지네이션(count exact)
export async function fetchIngredientDictionary(params: {
  keyword?: string;
  page: number; // 1부터 시작
  pageSize: number;
}): Promise<IngredientDictionaryPage> {
  const { keyword = "", page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`inci_kr.ilike.%${k}%,inci_en.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data || []) as IngredientDictionaryItem[], total: count || 0 };
}

export async function fetchIngredientById(id: string): Promise<IngredientDictionaryItem> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as IngredientDictionaryItem;
}

// 저장 전 중복 경고용 - cas_no 또는 inci_kr이 이미 있는 다른 행이 있으면 그 행을 반환 (본인 행은 제외)
export async function checkIngredientDuplicate(
  args: { casNo?: string; inciKr?: string },
  excludeId?: string
): Promise<IngredientDictionaryItem | null> {
  const casNo = (args.casNo || "").trim();
  const inciKr = (args.inciKr || "").trim();
  if (!casNo && !inciKr) return null;

  const orParts: string[] = [];
  if (casNo) orParts.push(`cas_no.eq.${casNo}`);
  if (inciKr) orParts.push(`inci_kr.eq.${inciKr}`);

  let q = supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .select("id, inci_kr, inci_en, cas_no")
    .eq("is_active", true)
    .or(orParts.join(","))
    .limit(1);
  if (excludeId) q = q.neq("id", excludeId);

  const { data, error } = await q;
  if (error) throw error;
  return (data && data[0]) || null;
}

export async function saveIngredient(item: IngredientDictionaryItem): Promise<IngredientDictionaryItem> {
  const payload = {
    inci_en: item.inci_en || null,
    inci_kr: item.inci_kr || null,
    inci_cn: item.inci_cn || null,
    inci_jp: item.inci_jp || null,
    cas_no: item.cas_no || null,
    ec_no: item.ec_no || null,
    function_kr: item.function_kr || null,
    function_en: item.function_en || null,
    updated_at: new Date().toISOString(),
  };

  const query = item.id
    ? supabaseProductionFinal.from("plm_ingredient_dictionary").update(payload).eq("id", item.id).select("*").single()
    : supabaseProductionFinal
        .from("plm_ingredient_dictionary")
        .insert({ ...payload, source: "manual", is_active: true })
        .select("*")
        .single();

  const { data, error } = await query;
  if (error) throw error;
  return data as IngredientDictionaryItem;
}

// 소프트 삭제 - is_active=false (하드 삭제 아님)
export async function deleteIngredient(id: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
