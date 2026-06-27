"use client";

import { useEffect, useState } from "react";
import { downloadGoldDocument } from "@/lib/downloadGoldDocument";
import { buildDocumentExportFile, fetchDocumentTasks, fetchExportLogs, fetchWorkflowDocuments, lockDocument, startDocumentWorkflow, updateWorkflowStatus, writeExportLog } from "@/services/gold-document-workflow/documentWorkflowService";
import type { GoldDocumentWorkflowTask } from "@/types/goldDocumentWorkflow";

export function useGoldDocumentWorkflow() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [tasks, setTasks] = useState<GoldDocumentWorkflowTask[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("Document Workflow & Export 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadDocuments(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchWorkflowDocuments(keyword);
      setDocuments(data);
      setMessage(`Document ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openDocument(doc: any) {
    setSelected(doc);
    setLoading(true);
    try {
      const [taskData, logData] = await Promise.all([
        fetchDocumentTasks(doc.document_code),
        fetchExportLogs(doc.document_code),
      ]);
      setTasks(taskData);
      setLogs(logData);
      setMessage(`${doc.document_code} Workflow 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function startWorkflow() {
    if (!selected) return;
    setLoading(true);
    try {
      await startDocumentWorkflow(selected);
      await openDocument(selected);
      await loadDocuments(search);
      setMessage("문서 Workflow 시작 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow 시작 오류");
    } finally {
      setLoading(false);
    }
  }

  async function approveTask(task: GoldDocumentWorkflowTask) {
    setLoading(true);
    try {
      await updateWorkflowStatus(task, "APPROVED", comment || "Approved");
      await openDocument(selected);
      await loadDocuments(search);
      setMessage("문서 승인 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "승인 오류");
    } finally {
      setLoading(false);
    }
  }

  async function rejectTask(task: GoldDocumentWorkflowTask) {
    setLoading(true);
    try {
      await updateWorkflowStatus(task, "REJECTED", comment || "Rejected");
      await openDocument(selected);
      await loadDocuments(search);
      setMessage("문서 반려 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "반려 오류");
    } finally {
      setLoading(false);
    }
  }

  async function lockSelectedDocument() {
    if (!selected) return;
    setLoading(true);
    try {
      await lockDocument(selected.document_code);
      await openDocument(selected);
      await loadDocuments(search);
      setMessage("문서 LOCK 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "LOCK 오류");
    } finally {
      setLoading(false);
    }
  }

  async function exportSelectedDocument() {
    if (!selected) return;
    const file = buildDocumentExportFile(selected);
    downloadGoldDocument(file.filename, file.content, file.mime);
    try {
      await writeExportLog(selected.document_code, selected.format, file.filename);
      setLogs(await fetchExportLogs(selected.document_code));
      setMessage(`${file.filename} 다운로드 및 Export Log 저장 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? `다운로드 완료 / 로그 오류: ${error.message}` : "다운로드 완료 / 로그 오류");
    }
  }

  useEffect(() => {
    loadDocuments("");
  }, []);

  return {
    documents,
    selected,
    tasks,
    logs,
    search,
    setSearch,
    comment,
    setComment,
    message,
    loading,
    loadDocuments,
    openDocument,
    startWorkflow,
    approveTask,
    rejectTask,
    lockSelectedDocument,
    exportSelectedDocument,
  };
}
