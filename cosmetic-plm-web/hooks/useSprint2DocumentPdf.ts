"use client";

import { useEffect, useState } from "react";
import { createFormulaSheetDocument, downloadHtmlDocument, fetchDocumentFormulas, fetchPdfDocuments, openPrintDocument } from "@/services/sprint2/documentPdfService";

export function useSprint2DocumentPdf() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("문서관리 PDF 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [f, d] = await Promise.all([fetchDocumentFormulas(keyword), fetchPdfDocuments()]);
      setFormulas(f); setDocuments(d); setMessage(`처방 ${f.length}건 / 문서 ${d.length}건 조회 완료`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "문서 데이터 조회 오류"); }
    finally { setLoading(false); }
  }

  async function createDoc(formula: any) {
    setLoading(true);
    try { const doc = await createFormulaSheetDocument(formula); setSelected(doc); await load(); setMessage("Formula Sheet 문서 생성 완료"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "문서 생성 오류"); }
    finally { setLoading(false); }
  }

  function preview(doc: any) { setSelected(doc); setMessage(`${doc.document_code} 미리보기`); }
  function download(doc: any) { downloadHtmlDocument(doc); setMessage("HTML 다운로드 완료"); }
  function print(doc: any) { try { openPrintDocument(doc); setMessage("새 창에서 PDF 저장/인쇄를 실행하세요."); } catch(e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); } }

  useEffect(() => { load(); }, []);
  return { formulas, documents, keyword, setKeyword, selected, message, loading, load, createDoc, preview, download, print };
}
