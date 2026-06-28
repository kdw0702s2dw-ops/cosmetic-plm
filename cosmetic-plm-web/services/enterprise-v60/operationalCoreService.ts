"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { RawMaterialMaster, RawMaterialComponent, DocumentExportPayload } from "@/types/enterpriseV60Operational";

export async function signInOperational(email: string, password: string) {
  const { data, error } = await supabaseProductionFinal.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutOperational() {
  const { error } = await supabaseProductionFinal.auth.signOut();
  if (error) throw error;
}

export async function getCurrentOperationalUser() {
  const { data, error } = await supabaseProductionFinal.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function fetchRawMaterials(keyword = "") {
  let query = supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .select("*")
    .order("raw_code", { ascending: true })
    .limit(300);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,trade_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,supplier.ilike.%${k}%,manufacturer.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchRawComponents(rawCode: string) {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_raw_material_components")
    .select("*")
    .eq("raw_code", rawCode)
    .order("component_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertRawMaterial(raw: RawMaterialMaster) {
  const payload = {
    ...raw,
    raw_type: raw.raw_type || "SINGLE",
    currency: raw.currency || "KRW",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .upsert(payload, { onConflict: "raw_code" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRawMaterial(rawCode: string) {
  await supabaseProductionFinal.from("enterprise_raw_material_components").delete().eq("raw_code", rawCode);
  const { error } = await supabaseProductionFinal.from("enterprise_raw_material_master").delete().eq("raw_code", rawCode);
  if (error) throw error;
}

export async function upsertRawComponent(component: RawMaterialComponent) {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_raw_material_components")
    .upsert(component, { onConflict: "raw_code,component_no" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRawComponent(rawCode: string, componentNo: number) {
  const { error } = await supabaseProductionFinal
    .from("enterprise_raw_material_components")
    .delete()
    .eq("raw_code", rawCode)
    .eq("component_no", componentNo);

  if (error) throw error;
}

export async function syncRawInciFromComponents(rawCode: string) {
  const comps = await fetchRawComponents(rawCode);
  if (comps.length === 0) return null;

  const sort = (a: any, b: any) => Number(b.composition_percent || 0) - Number(a.composition_percent || 0);
  const inci_kr = comps.slice().sort(sort).map((x: any) => x.inci_kr || x.component_name_kr).filter(Boolean).join(", ");
  const inci_en = comps.slice().sort(sort).map((x: any) => x.inci_en || x.component_name_en).filter(Boolean).join(", ");
  const inci_cn = comps.slice().sort(sort).map((x: any) => x.inci_cn).filter(Boolean).join(", ");
  const inci_jp = comps.slice().sort(sort).map((x: any) => x.inci_jp).filter(Boolean).join(", ");
  const function_kr = Array.from(new Set(comps.map((x: any) => x.function_kr).filter(Boolean))).join(", ");
  const function_en = Array.from(new Set(comps.map((x: any) => x.function_en).filter(Boolean))).join(", ");

  const { data, error } = await supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .update({ inci_kr, inci_en, inci_cn, inci_jp, function_kr, function_en, raw_type: comps.length > 1 ? "COMPLEX" : "SINGLE", updated_at: new Date().toISOString() })
    .eq("raw_code", rawCode)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDocumentCenter(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("gold_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (formulaCode && revision) query = query.eq("formula_code", formulaCode).eq("revision", revision);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function buildDocumentHtml(doc: any): DocumentExportPayload {
  const payload = doc.payload_json || {};
  const formula = payload.formula || {};
  const smart = payload.smart_result || payload.result || {};

  const title = doc.title || doc.document_type || "PLM Document";
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:Arial,'Noto Sans KR',sans-serif;margin:0;background:#f8fafc;color:#0f172a}
  .page{width:900px;margin:24px auto;background:white;padding:42px;border:1px solid #e2e8f0}
  .brand{display:flex;justify-content:space-between;border-bottom:3px solid #0f172a;padding-bottom:16px;margin-bottom:28px}
  h1{font-size:28px;margin:0}.meta{font-size:13px;color:#64748b;line-height:1.7}
  table{width:100%;border-collapse:collapse;margin-top:18px}th{background:#0f172a;color:white;text-align:left}
  th,td{border:1px solid #cbd5e1;padding:10px;font-size:13px}.section{margin-top:28px}
  .sign{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:40px}.box{height:90px;border:1px solid #94a3b8;padding:10px}
  @media print{body{background:white}.page{width:auto;margin:0;border:0}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
  <div class="brand">
    <div><h1>${escapeHtml(title)}</h1><div class="meta">Cosmetic PLM Enterprise Document</div></div>
    <div class="meta">문서코드: ${escapeHtml(doc.document_code || "-")}<br/>생성일: ${escapeHtml(doc.created_at || new Date().toISOString())}<br/>상태: ${escapeHtml(doc.status || "-")}</div>
  </div>
  <div class="section">
    <h2>1. 기본 정보</h2>
    <table>
      <tr><th>항목</th><th>내용</th></tr>
      <tr><td>처방코드</td><td>${escapeHtml(doc.formula_code || formula.formula_code || "-")}</td></tr>
      <tr><td>Revision</td><td>${escapeHtml(doc.revision || formula.revision || "-")}</td></tr>
      <tr><td>문서종류</td><td>${escapeHtml(doc.document_type || "-")}</td></tr>
      <tr><td>제목</td><td>${escapeHtml(title)}</td></tr>
    </table>
  </div>
  <div class="section">
    <h2>2. Smart Formula Summary</h2>
    <table>
      <tr><th>항목</th><th>값</th></tr>
      <tr><td>총합</td><td>${escapeHtml(String(smart.total_percent ?? "-"))}%</td></tr>
      <tr><td>예상 원가</td><td>${escapeHtml(String(smart.estimated_cost_per_kg ?? "-"))} KRW/kg</td></tr>
      <tr><td>예상 pH</td><td>${escapeHtml(String(smart.estimated_ph ?? "-"))}</td></tr>
      <tr><td>예상 점도</td><td>${escapeHtml(String(smart.estimated_viscosity_cps ?? "-"))} cps</td></tr>
      <tr><td>처방 점수</td><td>${escapeHtml(String(smart.formula_score ?? smart.intelligence_score ?? "-"))}</td></tr>
    </table>
  </div>
  <div class="section">
    <h2>3. 전성분 / INCI</h2>
    <p>${escapeHtml(smart.inci_list || "전성분 데이터가 없습니다.")}</p>
  </div>
  <div class="section">
    <h2>4. 확인 및 승인</h2>
    <div class="sign"><div class="box">작성</div><div class="box">검토</div><div class="box">승인</div></div>
  </div>
  <button class="no-print" onclick="window.print()" style="margin-top:30px;padding:12px 18px;background:#2563eb;color:white;border:0;border-radius:10px">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;

  return { document_code: doc.document_code, title, document_type: doc.document_type, formula_code: doc.formula_code, revision: doc.revision, html };
}

function escapeHtml(value: any) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}
