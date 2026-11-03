"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 처방관리 "제품유형" 마스터 목록 - 처방 등록 화면의 제품유형 칸을 자유 입력에서 선택형으로 바꾸면서
// 추가됨("플라스타"/"플라스타 패치"처럼 사람마다 다르게 입력해서 통계(제품유형별 분포 등)가 흩어지는
// 문제 때문). 기존에 자유 입력으로 쌓인 값들은 정리하지 않고 그대로 이 테이블에 옮겨뒀고(마이그레이션
// create_plm_product_types 참고), 새 유형은 처방 등록 화면에서 바로 추가할 수 있다(components/common/
// ProductTypeField.tsx). 이름 하나만 관리 - 업체관리처럼 별도의 목록 관리 화면은 아직 없다.
export type ProductType = { id: string; name: string };

export async function listProductTypes(): Promise<ProductType[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_types")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data || []) as ProductType[];
}

// 이름이 대소문자/앞뒤 공백만 다르고 사실상 같은 값이면(DB 고유 인덱스가 lower(trim(name)) 기준) 새로
// 만들지 않고 기존 항목을 그대로 찾아 돌려준다 - 호출하는 쪽에서는 "이미 있는 유형을 골랐다"와 동일하게
// 동작해서, 거의 같은 이름이 중복으로 쌓이는 것을 막는다.
export async function addProductType(name: string): Promise<ProductType> {
  const trimmed = name.trim();
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_types")
    .insert({ name: trimmed })
    .select("id, name")
    .single();
  if (!error) return data as ProductType;

  if (error.code === "23505") {
    const { data: existing, error: findErr } = await supabaseProductionFinal
      .from("plm_product_types")
      .select("id, name")
      .ilike("name", trimmed)
      .limit(1)
      .maybeSingle();
    if (!findErr && existing) return existing as ProductType;
  }
  throw error;
}

// 마스터 목록의 이름을 바꾸면서, 그 이름을 쓰던 처방들(plm_formulas.product_type)도 함께 새 이름으로
// 바꾼다 - plm_product_types.name과 plm_formulas.product_type은 FK가 아니라 문자열 복사본이라, 마스터
// 이름만 바꾸면 기존 처방들은 옛 이름 그대로 남아 목록과 어긋나게 된다. 두 테이블을 한 번에 바꾸는
// 일(과 역할 검사)은 DB 함수 plm_rename_product_type(마이그레이션 add_plm_rename_product_type_rpc)이
// 트랜잭션으로 처리하고, 몇 건의 처방이 함께 바뀌었는지(renamedFormulaCount)를 돌려준다.
export async function renameProductType(id: string, newName: string): Promise<{ name: string; renamedFormulaCount: number }> {
  const trimmed = newName.trim();
  const { data, error } = await supabaseProductionFinal
    .rpc("plm_rename_product_type", { p_id: id, p_new_name: trimmed })
    .single();
  if (error) throw error;
  const row = data as { renamed_formula_count: number };
  return { name: trimmed, renamedFormulaCount: row.renamed_formula_count };
}
