"use client";

import { useEffect, useState } from "react";
import { downloadTextFile } from "@/lib/downloadTextFile";
import { exportDocumentContent, fetchDocumentFormulas, fetchDocuments, generateAndSaveDocument, updateDocumentStatus } from "@/services/gold-documents/documentAutomationService";
import type { DocumentType, GoldDocument } from "@/types/goldDocuments";

export function useGoldDocuments() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [documents, setDocuments] = useState<GoldDocument[]>([]);
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("FORMULA_SHEET");
  const [format, setFormat] = useState<GoldDocument["format"]>("CSV");
  const [message, setMessage] = useState("Document Automation 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadFormulas(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchDocumentFormulas(keyword);
      setFormulas(data);
      setMessage(`Formula ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const docs = await fetchDocuments(formula.formula_code, formula.revision);
      setDocuments(docs);
      setMessage(`${formula.formula_code} 문서 ${docs.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function generateDocument() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }

    setLoading(true);
    try {
      await generateAndSaveDocument(selected.formula_code, selected.revision, documentType, format);
      const docs = await fetchDocuments(selected.formula_code, selected.revision);
      setDocuments(docs);
      setMessage(`${documentType} 생성 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(doc: GoldDocument, status: GoldDocument["status"]) {
    setLoading(true);
    try {
      await updateDocumentStatus(doc.document_code, status);
      if (selected) {
        setDocuments(await fetchDocuments(selected.formula_code, selected.revision));
      }
      setMessage(`${doc.document_code} 상태 변경 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상태 변경 오류");
    } finally {
      setLoading(false);
    }
  }

  function downloadDocument(doc: GoldDocument) {
    const file = exportDocumentContent(doc);
    downloadTextFile(file.filename, file.content, file.type);
  }

  useEffect(() => {
    loadFormulas("");
  }, []);

  return {
    formulas,
    selected,
    documents,
    search,
    setSearch,
    documentType,
    setDocumentType,
    format,
    setFormat,
    message,
    loading,
    loadFormulas,
    openFormula,
    generateDocument,
    changeStatus,
    downloadDocument,
  };
}
