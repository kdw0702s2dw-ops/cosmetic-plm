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
  weight_10x10cm?: number | null;
  note?: string;
  image_urls?: string[]; // 부자재 사진(여러 장 가능) - Supabase Storage(material-photos 버킷) 공개 URL 목록
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

// 불용성/수용성 HG의 "10x10cm A4(종이) 중량" 자동입력용 - weight_10x10cm이 등록된 부자재만 노출
export async function searchMaterialsWithWeight10x10(keyword = ""): Promise<Material[]> {
  let q = supabaseProductionFinal
    .from("plm_materials")
    .select("*")
    .eq("is_active", true)
    .not("weight_10x10cm", "is", null)
    .order("material_code", { ascending: true })
    .limit(20);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`material_code.ilike.%${k}%,material_name.ilike.%${k}%`);
  }
  const { data, error } = await q;
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

// 부자재 사진 업로드 - 원료 발주관리 검수조서(uploadPurchaseOrderInspectionPhoto)와 동일한 패턴.
// 호출 전에 lib/imageJpegConvert.ts의 convertImageToJpeg()로 용량을 줄인 File을 넘겨받는다(용량
// 최적화는 호출부 책임, 이 함수는 업로드/URL 발급만 담당).
// 경로의 폴더명은 material_code가 아니라 매번 새로 만드는 ASCII 식별자(crypto.randomUUID())를 쓴다 -
// Supabase Storage 오브젝트 경로는 ASCII만 허용해서, "부2607-01"처럼 한글이 섞인 material_code를
// 그대로 경로에 쓰면 업로드가 Invalid key 오류로 실패한다(검수조서는 DB id를 경로로 써서 이 문제를
// 우연히 피해갔을 뿐, material_code를 그대로 쓰면 안 됨 - 로컬 리뷰에서 확인된 문제, 현재 한글이
// 포함된 부자재코드 28건이 영향을 받았음). image_urls에는 공개 URL만 저장되고 폴더명 자체는 화면
// 어디에도 노출되지 않으므로, material_code와 무관한 식별자를 써도 무방하다 - 저장 전(새 부자재
// 등록 단계)에도 그대로 업로드 가능하다.
const MATERIAL_PHOTO_BUCKET = "material-photos";

export async function uploadMaterialPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const folder = crypto.randomUUID();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseProductionFinal.storage.from(MATERIAL_PHOTO_BUCKET).upload(path, file);
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
  const { data } = supabaseProductionFinal.storage.from(MATERIAL_PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
