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
  note?: string | null;
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

// 단일성분표 Function 컬럼 채우기 전용 - 효능(영문)이 등록된 활성 성분만 가볍게 통째로 가져온다.
// (전성분관리 전체가 수백 건 수준이라 처방 단위로 CAS 필터링하지 않고 한 번에 캐시해도 충분히 가볍다.)
export async function fetchIngredientFunctionEntries(): Promise<
  Array<Pick<IngredientDictionaryItem, "cas_no" | "inci_en" | "inci_kr" | "function_en">>
> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .select("cas_no, inci_en, inci_kr, function_en")
    .eq("is_active", true)
    .not("function_en", "is", null);
  if (error) throw error;
  return (data || []) as Array<Pick<IngredientDictionaryItem, "cas_no" | "inci_en" | "inci_kr" | "function_en">>;
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

// CAS No 필드에 "A, B, C"처럼 여러 CAS(이성질체 등)가 콤마로 같이 들어있는 경우가 있어서,
// 완전 문자열 일치 대신 콤마로 쪼갠 CAS 집합끼리 하나라도 겹치면 같은 성분으로 판단한다.
function splitCasTokens(casNo: string): string[] {
  return casNo.split(",").map((s) => s.trim()).filter(Boolean);
}

function casSetsOverlap(a: string, b: string): boolean {
  const setA = new Set(splitCasTokens(a));
  return splitCasTokens(b).some((t) => setA.has(t));
}

// cas_no가 주어진 CAS 토큰 중 하나라도 부분일치하는 후보를 SQL로 넓게 가져온 뒤,
// JS에서 콤마 split한 토큰 집합이 실제로 겹치는지 정확히 재확인한다.
export async function findIngredientByCasNo(casNo: string, excludeId?: string): Promise<IngredientDictionaryItem | null> {
  const tokens = splitCasTokens(casNo);
  if (tokens.length === 0) return null;

  let q = supabaseProductionFinal
    .from("plm_ingredient_dictionary")
    .select("id, inci_kr, inci_en, cas_no")
    .eq("is_active", true)
    .or(tokens.map((t) => `cas_no.ilike.%${t}%`).join(","));
  if (excludeId) q = q.neq("id", excludeId);

  const { data, error } = await q;
  if (error) throw error;
  const candidates = (data || []) as IngredientDictionaryItem[];
  return candidates.find((c) => casSetsOverlap(casNo, c.cas_no || "")) || null;
}

// 저장 전 중복 경고용 - cas_no 또는 inci_kr이 이미 있는 다른 행이 있으면 그 행을 반환 (본인 행은 제외)
// CAS 우선 확인(콤마로 나뉜 이성질체 등도 겹치면 매칭), 없으면 inci_kr 정확 일치로 확인
export async function checkIngredientDuplicate(
  args: { casNo?: string; inciKr?: string },
  excludeId?: string
): Promise<IngredientDictionaryItem | null> {
  const casNo = (args.casNo || "").trim();
  const inciKr = (args.inciKr || "").trim();
  if (!casNo && !inciKr) return null;

  if (casNo) {
    const casMatch = await findIngredientByCasNo(casNo, excludeId);
    if (casMatch) return casMatch;
  }
  if (inciKr) {
    let q = supabaseProductionFinal
      .from("plm_ingredient_dictionary")
      .select("id, inci_kr, inci_en, cas_no")
      .eq("is_active", true)
      .eq("inci_kr", inciKr)
      .limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data, error } = await q;
    if (error) throw error;
    if (data && data[0]) return data[0];
  }
  return null;
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
    note: item.note || null,
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
