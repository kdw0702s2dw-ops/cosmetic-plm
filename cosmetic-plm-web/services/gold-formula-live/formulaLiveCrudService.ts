"use client";

import { supabaseFormulaLive } from "@/lib/supabaseFormulaLiveClient";
import type { FormulaHeaderLive, FormulaHistoryLive, FormulaLineLive, FormulaSummaryLive, RawMaterialLookup } from "@/types/goldFormulaLive";

export async function searchRawMaterialsForFormula(keyword: string, limit = 20): Promise<RawMaterialLookup[]> {
  if (!keyword.trim()) return [];

  const k = keyword.trim();
  const { data, error } = await supabaseFormulaLive
    .from("enterprise_raw_material_master")
    .select("raw_code, raw_name, inci_kr, inci_en, supplier, cas_no, ec_no")
    .or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_kr.ilike.%${k}%,inci_en.ilike.%${k}%,cas_no.ilike.%${k}%`)
    .order("raw_code", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as RawMaterialLookup[];
}

export async function fetchFormulaSummaries(search = "", limit = 100): Promise<FormulaSummaryLive[]> {
  let query = supabaseFormulaLive
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(limit);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,status.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FormulaSummaryLive[];
}

export async function fetchHeader(formulaCode: string, revision: string): Promise<FormulaHeaderLive | null> {
  const { data, error } = await supabaseFormulaLive
    .from("gold_formula_headers")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .maybeSingle();

  if (error) throw error;
  return data as FormulaHeaderLive | null;
}

export async function fetchLines(formulaCode: string, revision: string): Promise<FormulaLineLive[]> {
  const { data, error } = await supabaseFormulaLive
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return (data || []) as FormulaLineLive[];
}

export async function saveHeader(header: FormulaHeaderLive) {
  const { data, error } = await supabaseFormulaLive
    .from("gold_formula_headers")
    .upsert(header, { onConflict: "formula_code,revision" })
    .select()
    .single();

  if (error) throw error;
  await writeFormulaHistory(header.formula_code, header.revision, "SAVE_HEADER", header, header.created_by || "R&D");
  return data as FormulaHeaderLive;
}

export async function saveLine(line: FormulaLineLive, user = "R&D") {
  const { data, error } = await supabaseFormulaLive
    .from("gold_formula_lines")
    .upsert(line, { onConflict: "formula_code,revision,line_no" })
    .select()
    .single();

  if (error) throw error;
  await writeFormulaHistory(line.formula_code, line.revision, "SAVE_LINE", line, user);
  return data as FormulaLineLive;
}

export async function deleteLine(line: FormulaLineLive, user = "R&D") {
  const { error } = await supabaseFormulaLive
    .from("gold_formula_lines")
    .delete()
    .eq("formula_code", line.formula_code)
    .eq("revision", line.revision)
    .eq("line_no", line.line_no);

  if (error) throw error;
  await writeFormulaHistory(line.formula_code, line.revision, "DELETE_LINE", line, user);
}

export async function cloneFormula(formulaCode: string, revision: string, newRevision: string, user = "R&D") {
  const header = await fetchHeader(formulaCode, revision);
  const lines = await fetchLines(formulaCode, revision);
  if (!header) throw new Error("원본 처방 Header를 찾을 수 없습니다.");

  const newHeader: FormulaHeaderLive = {
    ...header,
    id: undefined,
    revision: newRevision,
    status: "DRAFT",
    created_by: user,
  };

  await saveHeader(newHeader);

  for (const line of lines) {
    await saveLine({ ...line, id: undefined, revision: newRevision }, user);
  }

  const { error } = await supabaseFormulaLive
    .from("gold_formula_revisions")
    .insert({
      formula_code: formulaCode,
      from_revision: revision,
      to_revision: newRevision,
      reason: "Formula clone",
      created_by: user,
    });

  if (error) throw error;
  await writeFormulaHistory(formulaCode, newRevision, "CLONE_FORMULA", { from: revision, to: newRevision }, user);
}

export async function lockFormula(formulaCode: string, revision: string, user = "R&D") {
  const { error } = await supabaseFormulaLive
    .from("gold_formula_headers")
    .update({ status: "LOCKED", updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;
  await writeFormulaHistory(formulaCode, revision, "LOCK_FORMULA", { status: "LOCKED" }, user);
}

export async function approveFormula(formulaCode: string, revision: string, user = "QA") {
  const { error } = await supabaseFormulaLive
    .from("gold_formula_headers")
    .update({ status: "APPROVED", updated_at: new Date().toISOString() })
    .eq("formula_code", formulaCode)
    .eq("revision", revision);

  if (error) throw error;
  await writeFormulaHistory(formulaCode, revision, "APPROVE_FORMULA", { status: "APPROVED" }, user);
}

export async function fetchHistory(formulaCode: string, revision: string): Promise<FormulaHistoryLive[]> {
  const { data, error } = await supabaseFormulaLive
    .from("gold_formula_history")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as FormulaHistoryLive[];
}

export async function writeFormulaHistory(formulaCode: string, revision: string, action: string, payload: Record<string, unknown>, user: string) {
  const { error } = await supabaseFormulaLive
    .from("gold_formula_history")
    .insert({
      formula_code: formulaCode,
      revision,
      action,
      payload,
      created_by: user,
    });

  if (error) throw error;
}
