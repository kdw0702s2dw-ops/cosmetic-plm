"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { findRawCodesByComponentKeyword } from "@/services/sprint2/rawMaterialService";

export type Sprint1Formula = {
  formula_code: string;
  revision: string;
  confirmed_code?: string;
  formula_name: string;
  status?: string;
  product_type?: string;
  customer?: string;
  target_country?: string;
  assigned_researcher?: string;
  development_type?: string;
  progress_status?: string;
  exposure_type?: string;
  target_market?: string;
  claim?: string;
  measured_moisture_percent?: number | null;
};

export type ProductionBomRow = {
  id?: string;
  formula_code?: string;
  revision?: string;
  production_code?: string;
  product_name?: string;
  material_name_1?: string;
  material_code_1?: string; // 부자재관리(plm_materials) 연동 - 자동완성으로 선택 시 채워짐
  material_name_2?: string;
  material_code_2?: string;
  material_name_3?: string;
  material_code_3?: string;
  molding_type?: string;
  remarks?: string;
};

export type Sprint1FormulaLine = {
  id?: string;
  formula_code: string;
  revision: string;
  line_no: number;
  phase: string;
  phase_seq?: number | string; // Phase 내 표시 순서 (자유 입력, line_no와 무관 - 정렬 전용)
  raw_code?: string;
  raw_name?: string;
  inci_kr?: string;
  inci_en?: string;
  percentage: number | string; // 입력 중 "0.0005" 같은 문자열을 그대로 유지 (계산 시 Number()로 변환)
  function_kr?: string;
  function_en?: string;
  cas_no?: string;
  ec_no?: string;
  unit_price?: number;
  cost_per_kg?: number;
  moq?: string;
  note?: string;
};

// BOM 라인에 저장된 스냅샷과 원료관리의 현재 값을 비교해서 달라진 필드 목록을 반환한다.
// 값이 하나도 다르지 않으면 빈 배열 - 호출부에서 length===0이면 배지를 숨긴다.
export type RawMaterialDiffField = { key: string; label: string; saved: string; latest: string };

export function computeRawMaterialDiff(line: Sprint1FormulaLine, latest: any | undefined): RawMaterialDiffField[] {
  if (!latest) return [];
  const fields: { key: string; label: string; savedRaw: any; latestRaw: any }[] = [
    { key: "unit_price", label: "단가", savedRaw: line.unit_price, latestRaw: latest.unit_price },
    { key: "inci_kr", label: "INCI(국문)", savedRaw: line.inci_kr, latestRaw: latest.inci_kr },
    { key: "inci_en", label: "INCI(영문)", savedRaw: line.inci_en, latestRaw: latest.inci_en },
    { key: "function_kr", label: "효능(국문)", savedRaw: line.function_kr, latestRaw: latest.function_kr },
    { key: "function_en", label: "효능(영문)", savedRaw: line.function_en, latestRaw: latest.function_en },
    { key: "cas_no", label: "CAS No", savedRaw: line.cas_no, latestRaw: latest.cas_no },
    { key: "ec_no", label: "EC No", savedRaw: line.ec_no, latestRaw: latest.ec_no },
    { key: "moq", label: "MOQ", savedRaw: line.moq, latestRaw: latest.moq },
  ];

  const diffs: RawMaterialDiffField[] = [];
  for (const f of fields) {
    if (f.key === "unit_price") {
      const savedNum = Number(f.savedRaw || 0);
      const latestNum = Number(f.latestRaw || 0);
      if (savedNum !== latestNum) {
        diffs.push({ key: f.key, label: f.label, saved: savedNum.toLocaleString(), latest: latestNum.toLocaleString() });
      }
      continue;
    }
    const savedText = (f.savedRaw || "").toString().trim();
    const latestText = (f.latestRaw || "").toString().trim();
    if (savedText !== latestText) {
      diffs.push({ key: f.key, label: f.label, saved: savedText || "-", latest: latestText || "-" });
    }
  }
  return diffs;
}

export async function fetchSprint1Formulas(keyword = "") {
  let query = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,product_type.ilike.%${k}%,confirmed_code.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 확정코드는 처방(formula_code+revision) 하나를 유일하게 가리켜야 하므로, 저장 직전에 같은 확정코드를
// 이미 쓰고 있는 다른 처방(자기 자신 제외)이 있는지 확인한다. DB에도 부분 유니크 인덱스가 있어
// 동시 저장 경합(같은 확정코드를 동시에 입력하는 경우)도 최종적으로 막힌다.
export async function findFormulaByConfirmedCode(confirmedCode: string, excludeFormulaCode: string, excludeRevision: string) {
  const code = confirmedCode.trim();
  if (!code) return null;
  // 필터 문자열에 코드값을 직접 조립하지 않고 클라이언트에서 자기 자신(formula_code+revision)만
  // 걸러내서, 처방코드/Revision 값에 특수문자가 있어도 안전하게 동작한다.
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, formula_name")
    .eq("is_active", true)
    .eq("confirmed_code", code);
  if (error) throw error;
  return (data || []).find((row) => !(row.formula_code === excludeFormulaCode && row.revision === excludeRevision)) || null;
}

export type RawUsageRow = {
  formula_code: string;
  revision: string;
  formula_name: string;
  confirmed_code?: string;
  assigned_researcher?: string;
  percentage: number;
  line_no: number;
};

// 원료코드(+선택적으로 함량)로 그 원료가 쓰인 처방을 검색한다. 소프트삭제(is_active=false)된 처방은
// 결과에서 제외한다. 함량은 사용자가 입력한 값과 저장된 값의 부동소수점 오차를 감안해 소수 4자리로
// 반올림한 값이 완전히 같을 때만 매칭으로 본다(범위/근사 검색이 아니라 "그 함량 그대로"를 찾는 용도).
export async function searchFormulasByRawCode(rawCode: string, percentage?: number | null): Promise<RawUsageRow[]> {
  const code = rawCode.trim();
  if (!code) return [];

  const { data: lineRows, error: lineErr } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .select("formula_code, revision, line_no, percentage")
    .eq("raw_code", code);
  if (lineErr) throw lineErr;

  let rows = lineRows || [];
  if (percentage != null && !Number.isNaN(percentage)) {
    const target = Math.round(percentage * 10000) / 10000;
    rows = rows.filter((r) => Math.round(Number(r.percentage) * 10000) / 10000 === target);
  }
  if (rows.length === 0) return [];

  const codes = Array.from(new Set(rows.map((r) => r.formula_code)));
  const { data: formulaRows, error: fErr } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, formula_name, confirmed_code, assigned_researcher")
    .in("formula_code", codes)
    .eq("is_active", true);
  if (fErr) throw fErr;

  const formulaMap = new Map((formulaRows || []).map((f) => [`${f.formula_code}|${f.revision}`, f]));

  return rows
    .map((r) => {
      const f = formulaMap.get(`${r.formula_code}|${r.revision}`);
      if (!f) return null;
      return {
        formula_code: r.formula_code,
        revision: r.revision,
        formula_name: f.formula_name,
        confirmed_code: f.confirmed_code,
        assigned_researcher: f.assigned_researcher,
        percentage: Number(r.percentage),
        line_no: r.line_no,
      } as RawUsageRow;
    })
    .filter((x): x is RawUsageRow => x != null)
    .sort((a, b) => b.percentage - a.percentage);
}

// 원료 사용처 검색 결과에서 처방을 열 때 사용 - fetchSprint1Formulas는 최근 100건으로 캡핑되어 있어
// 검색된 처방이 그 안에 없을 수 있으므로, formula_code+revision으로 정확히 한 건만 조회한다.
export async function fetchSprint1FormulaByKey(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .eq("is_active", true)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSprint1FormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchSprint1RawOptions(keyword = "") {
  const k = keyword.trim();
  let query = supabaseProductionFinal
    .from("plm_raw_materials")
    .select("*")
    .eq("is_active", true)
    .order("raw_code", { ascending: true })
    .limit(100);

  if (k) {
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,trade_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  let results = data || [];

  // 원료 자체 필드로는 못 찾았지만(예: 복합원료의 두 번째 이후 구성성분으로만 등록된 INCI)
  // 구성성분에 등록된 전성분/CAS로는 걸리는 원료를 보완해서 함께 보여준다.
  if (k) {
    const already = new Set(results.map((r) => r.raw_code));
    const extraCodes = Array.from(await findRawCodesByComponentKeyword(k)).filter((c) => !already.has(c));
    if (extraCodes.length > 0) {
      const { data: extraData, error: extraError } = await supabaseProductionFinal
        .from("plm_raw_materials")
        .select("*")
        .eq("is_active", true)
        .in("raw_code", extraCodes)
        .order("raw_code", { ascending: true });
      if (!extraError && extraData) results = [...results, ...extraData];
    }
  }

  return results;
}

export async function upsertSprint1Formula(formula: Sprint1Formula) {
  // formula 상태는 openFormula()에서 DB row 전체(select("*"))를 그대로 spread해서 만들어지기 때문에,
  // Sprint1Formula 타입엔 id가 없어도 런타임엔 원래 열었던 행의 id가 실려 있을 수 있다.
  // formula_code/revision을 바꿔서 저장하면 이 낡은 id가 새 INSERT에 그대로 끼어들어
  // plm_formulas_pkey(PRIMARY KEY, id)를 위반하므로(23505), upsert 직전에 반드시 제거한다.
  const { id, ...payload } = formula as Sprint1Formula & { id?: string };

  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .upsert({
      ...payload,
      status: payload.status || "DRAFT",
      revision: payload.revision || "R0",
      // exposure_type/target_market은 DB에 CHECK IN (...) 제약이 있어서 빈 문자열은 위반됨 - 미선택이면 null로 저장
      exposure_type: payload.exposure_type || null,
      target_market: payload.target_market || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertSprint1FormulaLines(lines: Sprint1FormulaLine[]) {
  if (lines.length === 0) return [];

  // id는 payload에 절대 포함하지 않는다. (formula_code,revision,line_no) 고유키가 충돌 감지를
  // 전담하므로, 매칭되는 기존 행이 있으면 그 행의 id가 그대로 유지된 채 UPDATE되고 없으면
  // DB의 gen_random_uuid() 기본값이 채운다. id를 실어 보내면 리비전을 바꿔 저장할 때 예전 id가
  // 새 INSERT에 그대로 끼어들어 plm_formula_lines_pkey를 위반한다(23505) - 기존/신규 라인을
  // 배치로 나눌 필요도 없어짐(어차피 전부 id 없이 보내므로 컬럼 구성이 항상 동일).
  const payload = lines.map((line) => {
    const { id, ...rest } = line as Sprint1FormulaLine & { id?: string };
    return {
      ...rest,
      phase: rest.phase || "A",
      cost_per_kg: Number(((Number(rest.percentage || 0) / 100) * Number(rest.unit_price || 0)).toFixed(4)),
      updated_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .upsert(payload, { onConflict: "formula_code,revision,line_no" })
    .select();

  if (error) throw error;
  return data;
}

export async function deleteSprint1FormulaLines(formulaCode: string, revision: string, lineNos: number[]) {
  if (lineNos.length === 0) return;

  const { error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .in("line_no", lineNos);

  if (error) throw error;
}

export async function softDeleteSprint1Formula(formulaCode: string, revision: string) {
  const { error } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;
}

export async function recalcSprint1Formula(formulaCode: string, revision: string) {
  const lines = await fetchSprint1FormulaLines(formulaCode, revision);

  const total = Number(lines.reduce((sum: number, x: any) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((sum: number, x: any) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));

  const { error } = await supabaseProductionFinal
    .from("plm_formulas")
    .update({
      total_percent: total,
      estimated_cost_per_kg: cost,
      updated_at: new Date().toISOString(),
    })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;

  return { total_percent: total, estimated_cost_per_kg: cost };
}

export async function fetchProductionBomRows(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_bom")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ProductionBomRow[];
}

// 생산 BOM은 라인 번호 같은 고유키가 없어서, 원료 구성성분 저장 방식과 동일하게
// 현재 처방분을 전부 지우고 화면에 있는 행을 다시 넣는 방식으로 저장한다.
export async function saveProductionBomRows(formulaCode: string, revision: string, rows: ProductionBomRow[]) {
  const { error: delError } = await supabaseProductionFinal
    .from("plm_production_bom")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (delError) throw delError;

  const clean = rows.filter((r) =>
    r.production_code || r.product_name || r.material_name_1 || r.material_name_2 || r.material_name_3 || r.molding_type || r.remarks
  );
  if (clean.length === 0) return [];

  const payload = clean.map((r) => ({
    production_code: r.production_code || null,
    product_name: r.product_name || null,
    material_name_1: r.material_name_1 || null,
    material_code_1: r.material_code_1 || null,
    material_name_2: r.material_name_2 || null,
    material_code_2: r.material_code_2 || null,
    material_name_3: r.material_name_3 || null,
    material_code_3: r.material_code_3 || null,
    molding_type: r.molding_type || null,
    remarks: r.remarks || null,
    formula_code: formulaCode,
    revision,
  }));

  const { data, error } = await supabaseProductionFinal
    .from("plm_production_bom")
    .insert(payload)
    .select();

  if (error) throw error;
  return (data || []) as ProductionBomRow[];
}

export function buildSprint1InciList(lines: Sprint1FormulaLine[]) {
  return lines
    .slice()
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .map((x) => x.inci_kr || x.inci_en || x.raw_name)
    .filter(Boolean)
    .join(", ");
}

export function nextSprint1LineNo(lines: Sprint1FormulaLine[]) {
  return (Math.max(0, ...lines.map((x) => Number(x.line_no || 0))) + 1);
}

// 같은 Phase 내 마지막 순번 + 10 (없으면 10) - 나중에 중간 삽입할 여유 공간을 둠
export function nextPhaseSeq(lines: Sprint1FormulaLine[], phase: string) {
  const samePhase = lines.filter((x) => (x.phase || "A") === phase);
  if (samePhase.length === 0) return 10;
  return Math.max(0, ...samePhase.map((x) => Number(x.phase_seq || 0))) + 10;
}

// BOM 표시 순서: Phase 오름차순 -> 그 안에서 phase_seq 오름차순(없으면 line_no로 대체).
// 원본 배열은 건드리지 않는다(저장 로직/line_no와 무관, 표시/정렬 전용).
export function sortLinesForDisplay(lines: Sprint1FormulaLine[]) {
  return [...lines].sort((a, b) => {
    const phaseCmp = (a.phase || "A").localeCompare(b.phase || "A");
    if (phaseCmp !== 0) return phaseCmp;
    const seqA = a.phase_seq !== undefined && a.phase_seq !== null && a.phase_seq !== "" ? Number(a.phase_seq) : Number(a.line_no || 0);
    const seqB = b.phase_seq !== undefined && b.phase_seq !== null && b.phase_seq !== "" ? Number(b.phase_seq) : Number(b.line_no || 0);
    return seqA - seqB;
  });
}

// 같은 Phase 내에서 phase_seq가 중복된 그룹만 현재 표시 순서 기준 1,2,3...으로 재부여한다.
// 중복이 없는 그룹은 건드리지 않아 기존에 의도적으로 둔 간격(10,20,30...)을 보존한다.
export function normalizeDuplicatePhaseSeq(lines: Sprint1FormulaLine[]) {
  const sorted = sortLinesForDisplay(lines);
  const byPhase = new Map<string, Sprint1FormulaLine[]>();
  for (const l of sorted) {
    const phase = l.phase || "A";
    const arr = byPhase.get(phase) || [];
    arr.push(l);
    byPhase.set(phase, arr);
  }

  const patches = new Map<number, number>(); // line_no -> new phase_seq
  for (const group of byPhase.values()) {
    const seqValues = group.map((l) => Number(l.phase_seq || 0));
    const hasDuplicate = new Set(seqValues).size !== seqValues.length;
    if (!hasDuplicate) continue;
    group.forEach((l, i) => patches.set(l.line_no, i + 1));
  }
  if (patches.size === 0) return lines;
  return lines.map((l) => (patches.has(l.line_no) ? { ...l, phase_seq: patches.get(l.line_no)! } : l));
}
