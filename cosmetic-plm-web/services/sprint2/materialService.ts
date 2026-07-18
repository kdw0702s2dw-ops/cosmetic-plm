"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type Material = {
  id?: string;
  material_code: string;
  material_name: string;
  spec?: string;
  supplier?: string;
  customer?: string;
  is_active?: boolean;
};

export type FormulaLinkHit = {
  formula_code: string;
  formula_name: string;
  customer: string | null;
};

// 부자재 목록 (코드/명칭/규격/공급사/바이어 검색)
export async function fetchMaterials(keyword = ""): Promise<Material[]> {
  let q = supabaseProductionFinal
    .from("plm_materials")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(
      `material_code.ilike.%${k}%,material_name.ilike.%${k}%,spec.ilike.%${k}%,supplier.ilike.%${k}%,customer.ilike.%${k}%`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Material[];
}

// 생산 BOM 전개의 부자재명1/2/3 자동완성용 (원료명 자동완성과 동일 패턴)
export async function searchMaterialsAutocomplete(keyword: string): Promise<Material[]> {
  const k = keyword.trim();
  if (!k) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_materials")
    .select("*")
    .eq("is_active", true)
    .or(`material_code.ilike.%${k}%,material_name.ilike.%${k}%`)
    .limit(15);
  if (error) throw error;
  return (data || []) as Material[];
}

// 생산 BOM 행에 저장된 material_code_1/2/3로 명칭·규격·공급사를 다시 조회할 때 사용 (여러 코드 한번에)
export async function fetchMaterialsByCodes(codes: string[]): Promise<Material[]> {
  const unique = Array.from(new Set(codes.filter(Boolean)));
  if (unique.length === 0) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_materials")
    .select("*")
    .in("material_code", unique);
  if (error) throw error;
  return (data || []) as Material[];
}

export async function checkMaterialCodeExists(materialCode: string, excludeId?: string): Promise<boolean> {
  let q = supabaseProductionFinal.from("plm_materials").select("id").eq("material_code", materialCode).limit(1);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).length > 0;
}

export async function fetchMaterialByCode(materialCode: string): Promise<Material> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_materials")
    .select("*")
    .eq("material_code", materialCode)
    .single();
  if (error) throw error;
  return data as Material;
}

// id가 있으면(기존 편집) id 기준 UPDATE, 없으면 material_code 기준 upsert (원료관리 saveRawMaterial과 동일 패턴)
export async function saveMaterial(m: Material) {
  const payload = { ...m, is_active: m.is_active ?? true, updated_at: new Date().toISOString() };
  const query = m.id
    ? supabaseProductionFinal.from("plm_materials").update(payload).eq("id", m.id).select("*").single()
    : supabaseProductionFinal.from("plm_materials").upsert(payload, { onConflict: "material_code" }).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data as Material;
}

// 소프트 삭제 - 이미 생산 BOM에 쓰인 부자재의 이력이 깨지지 않도록 is_active=false만 처리
export async function deleteMaterial(materialCode: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_materials")
    .update({ is_active: false })
    .eq("material_code", materialCode);
  if (error) throw error;
}

// 적용 개발번호(Development No.) 검색 - plm_formulas에서 formula_code 기준으로 중복 제거해서 보여준다
// (리비전은 여러 개일 수 있지만 연결은 처방코드 단위이므로 최신 리비전 1건만 대표로 표시)
export async function searchFormulasForLink(keyword: string): Promise<FormulaLinkHit[]> {
  const k = keyword.trim();
  if (!k) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, formula_name, customer, updated_at")
    .eq("is_active", true)
    .or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%`)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const seen = new Set<string>();
  const hits: FormulaLinkHit[] = [];
  for (const row of data || []) {
    if (seen.has(row.formula_code)) continue;
    seen.add(row.formula_code);
    hits.push({ formula_code: row.formula_code, formula_name: row.formula_name, customer: row.customer });
    if (hits.length >= 15) break;
  }
  return hits;
}

// 부자재 하나에 연결된 적용 개발번호 목록
export async function fetchMaterialFormulaLinks(materialCode: string): Promise<FormulaLinkHit[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_material_formula_links")
    .select("formula_code")
    .eq("material_code", materialCode);
  if (error) throw error;

  const codes = (data || []).map((r) => r.formula_code as string);
  if (codes.length === 0) return [];

  // formula_name/customer 표시를 위해 plm_formulas에서 최신 리비전 1건씩 조회
  const { data: formulas, error: fErr } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, formula_name, customer, updated_at")
    .in("formula_code", codes)
    .order("updated_at", { ascending: false });
  if (fErr) throw fErr;

  const byCode = new Map<string, FormulaLinkHit>();
  for (const row of formulas || []) {
    if (!byCode.has(row.formula_code)) {
      byCode.set(row.formula_code, { formula_code: row.formula_code, formula_name: row.formula_name, customer: row.customer });
    }
  }
  return codes.map((c) => byCode.get(c) || { formula_code: c, formula_name: c, customer: null });
}

// 화면에 있는 적용 개발번호 목록 그대로 전체 반영 (기존 것 지우고 다시 넣는 방식 - saveComponents/saveProductionBomRows와 동일 패턴)
export async function saveMaterialFormulaLinks(materialCode: string, formulaCodes: string[]) {
  const { error: delError } = await supabaseProductionFinal
    .from("plm_material_formula_links")
    .delete()
    .eq("material_code", materialCode);
  if (delError) throw delError;

  const unique = Array.from(new Set(formulaCodes.filter(Boolean)));
  if (unique.length === 0) return;

  const { error } = await supabaseProductionFinal
    .from("plm_material_formula_links")
    .insert(unique.map((formula_code) => ({ material_code: materialCode, formula_code })));
  if (error) throw error;
}
