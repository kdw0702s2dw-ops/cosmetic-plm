"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createFormulaDocument, downloadHtmlDocument, fetchDocumentFormulas, fetchPdfDocuments,
  openPrintDocument, regenerateFormulaDocument, type DocKind,
} from "@/services/sprint2/documentPdfService";
import { downloadLabJournalDocument } from "@/services/sprint2/labJournalExcelService";
import {
  downloadComplexComponentExcel,
  downloadInciListExcel,
  downloadSingleComponentExcel,
} from "@/services/sprint2/documentExcelService";

export type FormulaDocGroup = {
  formula_code: string;
  formula_name: string;
  customer: string;
  latestDocs: any[];
  olderDocs: any[];
};

// 처방코드별로 묶고, 같은 (버전+문서종류) 조합 중 가장 최근 것만 latestDocs에, 나머지는 olderDocs에 넣는다
function groupDocuments(docs: any[]): FormulaDocGroup[] {
  const sorted = [...docs].sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );
  const seenTypeKeys = new Set<string>();
  const byFormula = new Map<string, FormulaDocGroup>();

  for (const d of sorted) {
    if (!byFormula.has(d.formula_code)) {
      byFormula.set(d.formula_code, {
        formula_code: d.formula_code,
        formula_name: d.formula_name || d.formula_code,
        customer: d.customer || "",
        latestDocs: [],
        olderDocs: [],
      });
    }
    const group = byFormula.get(d.formula_code)!;
    const typeKey = `${d.formula_code}|${d.revision}|${d.document_type}`;
    if (!seenTypeKeys.has(typeKey)) {
      seenTypeKeys.add(typeKey);
      group.latestDocs.push(d);
    } else {
      group.olderDocs.push(d);
    }
  }

  return Array.from(byFormula.values());
}

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
      setFormulas(f);
      setDocuments(d);
      setMessage(`처방 ${f.length}건 / 문서 ${d.length}건 조회 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createDoc(formula: any, kind: DocKind) {
    setLoading(true);
    try {
      const doc = await createFormulaDocument(formula, kind);
      setSelected(doc);
      await load();
      setMessage(`${doc.title} 생성 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateDoc(existingDoc: any, formula: any, kind: DocKind) {
    if (!confirm("이미 생성된 문서를 덮어쓸까요?")) return;
    setLoading(true);
    try {
      const doc = await regenerateFormulaDocument(existingDoc, formula, kind);
      setSelected(doc);
      await load();
      setMessage(`${doc.title} 재생성 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 재생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function downloadLabJournal(formula: any) {
    setLoading(true);
    try {
      await downloadLabJournalDocument(formula);
      setMessage(`${formula.formula_name} 실험일지 다운로드 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "실험일지 다운로드 오류");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocExcel(formula: any, kind: DocKind, label: string) {
    setLoading(true);
    try {
      if (kind === "INCI_LIST") await downloadInciListExcel(formula);
      else if (kind === "COMPLEX_COMPONENT_TABLE") await downloadComplexComponentExcel(formula);
      else await downloadSingleComponentExcel(formula);
      setMessage(`${label} 엑셀 다운로드 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류");
    } finally {
      setLoading(false);
    }
  }

  function preview(doc: any) { setSelected(doc); setMessage(`${doc.document_code} 미리보기`); }
  function download(doc: any) { downloadHtmlDocument(doc); setMessage("HTML 다운로드 완료"); }
  function print(doc: any) {
    try { openPrintDocument(doc); setMessage("새 창에서 PDF 저장/인쇄를 실행하세요."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }

  // formula_code+revision+document_type 별 가장 최근 문서 - 문서생성 버튼의 "이미 있음" 판단용
  const existingDocByKey = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of documents) {
      const key = `${d.formula_code}|${d.revision}|${d.document_type}`;
      const current = map.get(key);
      if (!current || new Date(d.created_at).getTime() > new Date(current.created_at).getTime()) {
        map.set(key, d);
      }
    }
    return map;
  }, [documents]);

  const groupedDocs = useMemo(() => groupDocuments(documents), [documents]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  return {
    formulas, documents, keyword, setKeyword, selected, message, loading,
    existingDocByKey, groupedDocs,
    load, createDoc, regenerateDoc, preview, download, print, downloadLabJournal, downloadDocExcel,
  };
}
