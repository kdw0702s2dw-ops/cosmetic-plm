"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 공개처방(일반)/공개처방(건조)를 원처방(plm_formula_lines)과 독립적으로 저장·관리하기 위한 서비스.
//
// 설계 원칙(중요): plm_formula_lines(원처방)는 이 파일에서 절대 쓰지 않는다(읽기도 안 함) - 규제검증/
// 알러젠계산/실험일지/원료발주가처방 등 원처방을 참조하는 기존 기능이 이 기능 추가로 영향받지 않게
// 하기 위함이다. 공개처방(일반/건조)은 plm_formula_lines_public / plm_formula_lines_dry라는 완전히
// 별도의 테이블에 저장되고, plm_formulas.public_bom_customized / dry_bom_customized 플래그로
// "이 처방/Revision이 별도로 저장된 적이 있는지"를 표시한다.
//
// 플래그가 false인 동안은(=한 번도 저장 안 함) 문서관리 PDF/미리보기 전부 지금까지와 완전히 동일하게
// 동작한다(공개처방(일반)=원처방과 동일, 공개처방(건조)=실측 수분율 기반 자동계산). 사용자가 이 화면에서
// 직접 "저장"을 눌러야만 그 시점부터 해당 처방/Revision만 독립적으로 갈라진다.

export type DisclosureVariant = "PUBLIC" | "DRY";

export type DisclosureLine = {
  id?: string;
  formula_code?: string;
  revision?: string;
  line_no: number;
  phase?: string;
  phase_seq?: number | string;
  raw_code?: string;
  raw_name?: string;
  inci_kr?: string;
  inci_en?: string;
  percentage?: number | string;
  function_kr?: string;
  function_en?: string;
  unit_price?: number;
  cost_per_kg?: number;
  cas_no?: string;
  ec_no?: string;
  moq?: string;
  note?: string;
  is_new_material?: boolean;
};

const VARIANT_TABLE: Record<DisclosureVariant, string> = {
  PUBLIC: "plm_formula_lines_public",
  DRY: "plm_formula_lines_dry",
};

const VARIANT_FLAG_COLUMN: Record<DisclosureVariant, "public_bom_customized" | "dry_bom_customized"> = {
  PUBLIC: "public_bom_customized",
  DRY: "dry_bom_customized",
};

export const VARIANT_LABEL: Record<DisclosureVariant, string> = {
  PUBLIC: "공개처방(일반)",
  DRY: "공개처방(건조)",
};

function calcCost(line: DisclosureLine) {
  return Number(((Number(line.percentage || 0) / 100) * Number(line.unit_price || 0)).toFixed(4));
}

// 저장된 별도 BOM이 있는지(=customized 플래그) 확인. 문서관리 PDF 생성(documentPdfService.resolveLinesForBasis)과
// BOM 편집 화면 둘 다 이 함수로 판단 기준을 통일한다.
export async function fetchDisclosureCustomizedFlags(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("public_bom_customized, dry_bom_customized")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .single();
  if (error) throw error;
  return {
    PUBLIC: !!data?.public_bom_customized,
    DRY: !!data?.dry_bom_customized,
  };
}

export async function fetchDisclosureLines(
  variant: DisclosureVariant,
  formulaCode: string,
  revision: string
): Promise<DisclosureLine[]> {
  const { data, error } = await supabaseProductionFinal
    .from(VARIANT_TABLE[variant])
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });
  if (error) throw error;
  return data || [];
}

// 편집 화면의 현재 내용을 통째로 저장한다. 원처방 BOM 저장(upsertSprint1FormulaLines)과 달리
// line_no별 upsert/삭제분을 따로 추적하지 않고 "전체 삭제 후 다시 insert"로 치환한다 - 이 화면은
// 라인 수가 적고(수십 개) 저장 빈도도 낮아서, 구현을 단순하게 유지하는 쪽이 실수 여지가 적다.
// 저장이 성공하면 plm_formulas의 customized 플래그를 true로 세워 "이제부터 원처방/자동계산과
// 독립적으로 관리됨"을 표시한다.
export async function saveDisclosureLines(
  variant: DisclosureVariant,
  formulaCode: string,
  revision: string,
  lines: DisclosureLine[]
): Promise<DisclosureLine[]> {
  const table = VARIANT_TABLE[variant];

  // 원료코드/원료명 둘 중 하나만 입력된 라인은(예: 코드만 입력하고 이름은 비워둔 채 저장) 그대로
  // 저장을 진행하면 아래 filter에서 조용히 빠져버려서 "라인을 추가했는데 저장이 안 된다"처럼 보이는
  // 문제가 있었다 - 완전히 빈 라인(둘 다 비어있음)만 조용히 제외하고, 한쪽만 채워진 라인은 삭제/insert를
  // 진행하기 전에(=기존 데이터를 지우기 전에) 미리 막아서 사용자가 무엇을 고쳐야 하는지 알 수 있게 한다.
  const incomplete = lines.filter((l) => !!(l.raw_code && l.raw_code.trim()) !== !!(l.raw_name && l.raw_name.trim()));
  if (incomplete.length > 0) {
    const lineNos = incomplete.map((l) => l.line_no).join(", ");
    throw new Error(
      `원료코드/원료명이 한쪽만 입력된 라인이 있어 저장할 수 없습니다 (No. ${lineNos}). 두 값을 모두 입력하거나 그 라인을 삭제한 뒤 다시 저장하세요.`
    );
  }

  const { error: delErr } = await supabaseProductionFinal
    .from(table)
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (delErr) throw delErr;

  const payload = lines
    .filter((l) => l.raw_code && l.raw_name)
    .map((l) => {
      const { id: _id, ...rest } = l;
      return {
        ...rest,
        formula_code: formulaCode,
        revision,
        phase: rest.phase || "A",
        is_new_material: rest.is_new_material ?? false,
        cost_per_kg: calcCost(rest),
        updated_at: new Date().toISOString(),
      };
    });

  if (payload.length > 0) {
    const { error: insErr } = await supabaseProductionFinal.from(table).insert(payload);
    if (insErr) throw insErr;
  }

  const { error: flagErr } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({ [VARIANT_FLAG_COLUMN[variant]]: true, updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (flagErr) throw flagErr;

  return fetchDisclosureLines(variant, formulaCode, revision);
}

// "원처방 값으로 초기화" - 저장된 별도 BOM을 지우고 플래그를 내린다. 그 순간부터 다시 원처방(공개처방
// 일반) 또는 실측 수분율 자동계산(공개처방 건조) 값을 그대로 따라가게 된다.
export async function resetDisclosureVariant(
  variant: DisclosureVariant,
  formulaCode: string,
  revision: string
): Promise<void> {
  const table = VARIANT_TABLE[variant];

  const { error: delErr } = await supabaseProductionFinal
    .from(table)
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (delErr) throw delErr;

  const { error: flagErr } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({ [VARIANT_FLAG_COLUMN[variant]]: false, updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (flagErr) throw flagErr;
}
