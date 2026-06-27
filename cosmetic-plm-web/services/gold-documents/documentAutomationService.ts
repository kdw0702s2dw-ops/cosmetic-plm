"use client";

import { supabaseDocuments } from "@/lib/supabaseDocumentsClient";
import { buildDocumentContent, documentToCsv, documentToHtml } from "./documentTemplateEngine";
import type { DocumentType, GoldDocument } from "@/types/goldDocuments";

export async function fetchDocumentFormulas(search = "") {
  let query = supabaseDocuments
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchDocumentSource(formulaCode: string, revision: string) {
  const [header, lines, validation, cost, score, stability, regulation, recommendations] = await Promise.all([
    supabaseDocuments.from("gold_formula_headers").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseDocuments.from("gold_formula_lines").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("line_no", { ascending: true }),
    supabaseDocuments.from("gold_formula_validation_runs").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseDocuments.from("gold_formula_cost_summaries").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseDocuments.from("gold_formula_scores").select("*").eq("formula_code", formulaCode).eq("revision", revision).maybeSingle(),
    supabaseDocuments.from("gold_formula_stability_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseDocuments.from("gold_formula_regulation_risks").select("*").eq("formula_code", formulaCode).eq("revision", revision),
    supabaseDocuments.from("gold_formula_recommendations").select("*").eq("formula_code", formulaCode).eq("revision", revision),
  ]);

  for (const res of [header, lines, validation, cost, score, stability, regulation, recommendations]) {
    if (res.error) throw res.error;
  }

  return {
    header: header.data,
    lines: lines.data || [],
    validation: validation.data,
    cost: cost.data,
    score: score.data,
    stability: stability.data || [],
    regulation: regulation.data || [],
    recommendations: recommendations.data || [],
  };
}

export async function generateAndSaveDocument(formulaCode: string, revision: string, documentType: DocumentType, format: GoldDocument["format"] = "CSV") {
  const source = await fetchDocumentSource(formulaCode, revision);
  const content = buildDocumentContent(documentType, source);

  const documentCode = `${formulaCode}-${revision}-${documentType}`;
  const doc: GoldDocument = {
    document_code: documentCode,
    formula_code: formulaCode,
    revision,
    document_type: documentType,
    title: `${documentType} / ${formulaCode} / ${revision}`,
    format,
    status: "GENERATED",
    content_json: content,
    created_by: "R&D",
  };

  const { data, error } = await supabaseDocuments
    .from("gold_documents")
    .upsert(doc, { onConflict: "document_code" })
    .select()
    .single();

  if (error) throw error;
  return data as GoldDocument;
}

export async function fetchDocuments(formulaCode: string, revision: string) {
  const { data, error } = await supabaseDocuments
    .from("gold_documents")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as GoldDocument[];
}

export async function updateDocumentStatus(documentCode: string, status: GoldDocument["status"]) {
  const { error } = await supabaseDocuments
    .from("gold_documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("document_code", documentCode);

  if (error) throw error;
}

export function exportDocumentContent(doc: GoldDocument) {
  if (doc.format === "HTML" || doc.format === "PDF_READY" || doc.format === "WORD_READY") {
    return {
      filename: `${doc.document_code}.html`,
      content: documentToHtml(doc.content_json),
      type: "text/html;charset=utf-8",
    };
  }

  return {
    filename: `${doc.document_code}.csv`,
    content: documentToCsv(doc.content_json),
    type: "text/csv;charset=utf-8",
  };
}
