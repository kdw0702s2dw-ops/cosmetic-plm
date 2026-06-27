"use client";

import { supabaseDocumentWorkflow } from "@/lib/supabaseDocumentWorkflowClient";
import type { GoldDocumentWorkflowTask, DocumentApprovalStatus, DocumentWorkflowStep } from "@/types/goldDocumentWorkflow";

export async function fetchWorkflowDocuments(search = "") {
  let query = supabaseDocumentWorkflow
    .from("gold_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search.trim()) {
    const k = search.trim();
    query = query.or(`document_code.ilike.%${k}%,formula_code.ilike.%${k}%,document_type.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchDocumentTasks(documentCode: string): Promise<GoldDocumentWorkflowTask[]> {
  const { data, error } = await supabaseDocumentWorkflow
    .from("gold_document_workflow_tasks")
    .select("*")
    .eq("document_code", documentCode)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as GoldDocumentWorkflowTask[];
}

export async function startDocumentWorkflow(doc: any, step: DocumentWorkflowStep = "QA", assignee = "QA") {
  const task = {
    document_code: doc.document_code,
    formula_code: doc.formula_code,
    revision: doc.revision,
    document_type: doc.document_type,
    current_step: step,
    status: "REVIEW",
    assignee,
    comment: "Document workflow started",
  };

  const { data, error } = await supabaseDocumentWorkflow
    .from("gold_document_workflow_tasks")
    .insert(task)
    .select()
    .single();

  if (error) throw error;

  await supabaseDocumentWorkflow
    .from("gold_documents")
    .update({ status: "REVIEW", updated_at: new Date().toISOString() })
    .eq("document_code", doc.document_code);

  await writeDocumentAudit(doc.document_code, "START_WORKFLOW", task, assignee);
  return data as GoldDocumentWorkflowTask;
}

export async function updateWorkflowStatus(task: GoldDocumentWorkflowTask, status: DocumentApprovalStatus, comment: string, user = "QA") {
  const { data, error } = await supabaseDocumentWorkflow
    .from("gold_document_workflow_tasks")
    .update({ status, comment, updated_at: new Date().toISOString() })
    .eq("id", task.id)
    .select()
    .single();

  if (error) throw error;

  await supabaseDocumentWorkflow
    .from("gold_documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("document_code", task.document_code);

  await writeDocumentAudit(task.document_code, status, { task, comment }, user);
  return data as GoldDocumentWorkflowTask;
}

export async function lockDocument(documentCode: string, user = "QA") {
  const { error } = await supabaseDocumentWorkflow
    .from("gold_documents")
    .update({ status: "LOCKED", updated_at: new Date().toISOString() })
    .eq("document_code", documentCode);

  if (error) throw error;
  await writeDocumentAudit(documentCode, "LOCK_DOCUMENT", { status: "LOCKED" }, user);
}

export async function writeExportLog(documentCode: string, exportFormat: string, fileName: string, user = "R&D") {
  const { error } = await supabaseDocumentWorkflow
    .from("gold_document_export_logs")
    .insert({
      document_code: documentCode,
      export_format: exportFormat,
      file_name: fileName,
      exported_by: user,
    });

  if (error) throw error;
}

export async function fetchExportLogs(documentCode: string) {
  const { data, error } = await supabaseDocumentWorkflow
    .from("gold_document_export_logs")
    .select("*")
    .eq("document_code", documentCode)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function writeDocumentAudit(documentCode: string, action: string, payload: any, user = "SYSTEM") {
  const { error } = await supabaseDocumentWorkflow
    .from("gold_document_history")
    .insert({
      document_code: documentCode,
      action,
      payload,
      created_by: user,
    });

  if (error) throw error;
}

export function buildDocumentExportFile(doc: any) {
  const filenameBase = doc.document_code.replaceAll("/", "-").replaceAll(" ", "_");

  if (doc.format === "HTML" || doc.format === "PDF_READY" || doc.format === "WORD_READY") {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>${doc.title}</title>
<style>body{font-family:Arial;padding:24px;} table{width:100%;border-collapse:collapse;} td,th{border:1px solid #ddd;padding:8px;} th{background:#f3f4f6;} pre{white-space:pre-wrap;}</style>
</head><body><h1>${doc.title}</h1><table>${Object.entries(doc.content_json || {}).map(([k,v]) => `<tr><th>${k}</th><td><pre>${typeof v === "object" ? JSON.stringify(v, null, 2) : String(v ?? "")}</pre></td></tr>`).join("")}</table></body></html>`;
    return { filename: `${filenameBase}.html`, content: html, mime: "text/html;charset=utf-8" };
  }

  const rows = [["Field", "Value"], ...Object.entries(doc.content_json || {}).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v ?? "")])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return { filename: `${filenameBase}.csv`, content: csv, mime: "text/csv;charset=utf-8" };
}
