"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export const COMPANY_CATEGORIES = ["원료사", "브랜드사", "제조사", "공급사"] as const;
export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export type Company = {
  id?: string;
  category: string[];
  name_kr?: string;
  name_en?: string;
  country?: string;
  phone?: string;
  email?: string;
  note?: string;
  is_active?: boolean;
};

// 업체 목록 (국문명/영문명/국가/담당자 검색)
export async function fetchCompanies(keyword = ""): Promise<Company[]> {
  let q = supabaseProductionFinal
    .from("plm_companies")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`name_kr.ilike.%${k}%,name_en.ilike.%${k}%,country.ilike.%${k}%,phone.ilike.%${k}%,email.ilike.%${k}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Company[];
}

// 원료관리 Manufacturer/Supplier 자동완성용 - preferredCategory에 속한 업체를 앞쪽에 두되,
// 검색 자체는 구분과 무관하게 전체 대상으로 한다 (데이터가 완벽히 분류되지 않았을 수 있으므로).
export async function searchCompaniesAutocomplete(keyword: string, preferredCategory?: CompanyCategory): Promise<Company[]> {
  const k = keyword.trim();
  if (!k) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_companies")
    .select("*")
    .eq("is_active", true)
    .or(`name_kr.ilike.%${k}%,name_en.ilike.%${k}%`)
    .limit(30);
  if (error) throw error;
  const rows = (data || []) as Company[];
  if (!preferredCategory) return rows.slice(0, 15);

  const preferred = rows.filter((r) => r.category?.includes(preferredCategory));
  const others = rows.filter((r) => !r.category?.includes(preferredCategory));
  return [...preferred, ...others].slice(0, 15);
}

export async function fetchCompanyById(id: string): Promise<Company> {
  const { data, error } = await supabaseProductionFinal.from("plm_companies").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Company;
}

// 원료 화면·문서에서 manufacturer_company_id/supplier_company_id로 canonical 이름을 일괄 조회할 때 사용
export async function fetchCompaniesByIds(ids: (string | null | undefined)[]): Promise<Map<string, Company>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (unique.length === 0) return new Map();
  const { data, error } = await supabaseProductionFinal.from("plm_companies").select("*").in("id", unique);
  if (error) throw error;
  const map = new Map<string, Company>();
  for (const c of (data || []) as Company[]) map.set(c.id!, c);
  return map;
}

// canonical 표시명: 국문명 우선, 없으면 영문명
export function companyDisplayName(c: Company | undefined | null): string {
  if (!c) return "";
  return c.name_kr || c.name_en || "";
}

// id가 있으면(기존 편집) id 기준 UPDATE, 없으면 신규 INSERT (업체는 material_code 같은 자연키가 없어 upsert 대신 순수 insert)
export async function saveCompany(c: Company): Promise<Company> {
  const payload = { ...c, is_active: c.is_active ?? true, updated_at: new Date().toISOString() };
  const query = c.id
    ? supabaseProductionFinal.from("plm_companies").update(payload).eq("id", c.id).select("*").single()
    : supabaseProductionFinal.from("plm_companies").insert(payload).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data as Company;
}

// 소프트 삭제 - 이미 원료에 연결된 업체의 이력이 깨지지 않도록 is_active=false만 처리
export async function deleteCompany(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_companies").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
