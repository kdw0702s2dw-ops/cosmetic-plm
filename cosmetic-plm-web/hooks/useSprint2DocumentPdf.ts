"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeOrderSheetRows, createFormulaDocument, createRawMaterialOrderSheetDocument,
  deleteFormulaDocument, downloadHtmlDocument, fetchDocumentFormulas, fetchFormulaLinesForPdf, fetchPdfDocuments,
  openPrintDocument, regenerateFormulaDocument, regenerateRawMaterialOrderSheetDocument, setFormulaDocBasisOverride,
  type DocBasis, type DocKind, type DocLang, type OrderSheetRow,
} from "@/services/sprint2/documentPdfService";
import { downloadLabJournalDocument } from "@/services/sprint2/labJournalExcelService";
import {
  downloadComplexComponentExcel,
  downloadInciListExcel,
  downloadRawMaterialOrderSheetExcel,
  downloadSingleComponentExcel,
} from "@/services/sprint2/documentExcelService";

type OrderSheetModalState = {
  open: boolean;
  mode: "pdf" | "excel";
  formula: any;
  existingDoc: any | null;
  rows: OrderSheetRow[];
  personInCharge: string;
  loading: boolean;
};

const EMPTY_ORDER_SHEET_MODAL: OrderSheetModalState = {
  open: false, mode: "pdf", formula: null, existingDoc: null, rows: [], personInCharge: "", loading: false,
};

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
    const typeKey = `${d.formula_code}|${d.revision}|${d.document_type}|${d.basis || "MIX"}|${d.lang || "BOTH"}`;
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
      // 문서 조회를 처방 조회 뒤로 순차 실행(예전엔 Promise.all로 동시 조회) - 지금 화면에 뜬 처방
      // 범위(formula_code)로 문서 조회를 좁히기 위함이다. 전체 문서 수가 시스템 전체적으로 아무리
      // 많아져도, 화면에 보이는 처방들의 문서 상태(생성됨/미생성)는 항상 정확하게 조회된다 -
      // fetchPdfDocuments의 주석 참고.
      const f = await fetchDocumentFormulas(keyword);
      const formulaCodes = Array.from(new Set(f.map((x: any) => x.formula_code).filter(Boolean)));
      const d = await fetchPdfDocuments(formulaCodes);
      setFormulas(f);
      setDocuments(d);
      setMessage(`처방 ${f.length}건 / 문서 ${d.length}건 조회 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createDoc(formula: any, kind: DocKind, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
    setLoading(true);
    try {
      const doc = await createFormulaDocument(formula, kind, basis, lang);
      setSelected(doc);
      await load();
      setMessage(`${doc.title} 생성 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateDoc(existingDoc: any, formula: any, kind: DocKind, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
    if (!confirm("이미 생성된 문서를 덮어쓸까요?")) return;
    setLoading(true);
    try {
      const doc = await regenerateFormulaDocument(existingDoc, formula, kind, basis, lang);
      setSelected(doc);
      await load();
      setMessage(`${doc.title} 재생성 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 재생성 오류");
    } finally {
      setLoading(false);
    }
  }

  // 생성된 문서를 삭제해서 "미생성" 상태로 되돌린다(서류 발급 실수를 바로잡기 위한 기능 - 되돌릴 수 없어서
  // 확인창을 한 번 거친다).
  async function deleteDoc(existingDoc: any) {
    if (!confirm(`"${existingDoc.title}" 문서를 삭제할까요? 삭제하면 "미생성" 상태로 돌아갑니다.`)) return;
    setLoading(true);
    try {
      await deleteFormulaDocument(existingDoc.id);
      if (selected?.id === existingDoc.id) setSelected(null);
      await load();
      setMessage("문서를 삭제했습니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "문서 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  // "제조는 원처방, 서류는 공개처방(일반)" 예외 플래그를 저장하고, 화면에 바로 반영되도록 formulas를
  // 갱신한다(전체 재조회 없이 로컬 상태만 갱신 - 체크박스를 눌렀을 때 바로 기본 기준/경고가 바뀌어야 함).
  async function setDocBasisOverride(formula: any, requiresPublicBasis: boolean) {
    try {
      await setFormulaDocBasisOverride(formula.formula_code, formula.revision, requiresPublicBasis);
      setFormulas((prev) =>
        prev.map((f) =>
          f.formula_code === formula.formula_code && f.revision === formula.revision
            ? { ...f, requires_public_basis_docs: requiresPublicBasis }
            : f
        )
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "기준 설정 저장 오류");
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

  async function downloadDocExcel(formula: any, kind: DocKind, label: string, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
    setLoading(true);
    try {
      if (kind === "INCI_LIST") await downloadInciListExcel(formula, basis, lang);
      else if (kind === "COMPLEX_COMPONENT_TABLE") await downloadComplexComponentExcel(formula, basis, lang);
      else if (kind === "COMPLEX_COMPONENT_TABLE_TRADE_NAME") await downloadComplexComponentExcel(formula, basis, lang, true);
      else await downloadSingleComponentExcel(formula, basis, lang);
      setMessage(`${label} 엑셀 다운로드 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류");
    } finally {
      setLoading(false);
    }
  }

  const [orderSheetModal, setOrderSheetModal] = useState<OrderSheetModalState>(EMPTY_ORDER_SHEET_MODAL);

  // "PDF 생성/재생성" 또는 "엑셀 다운로드" 버튼 클릭 시 바로 만들지 않고, 자동판정된 신규 체크/함량을
  // 먼저 보여주는 미리보기 팝업을 연다. 담당자는 매번 빈칸에서 시작한다(이전 값 기억 안 함).
  async function openOrderSheetModal(formula: any, existingDoc: any | null, mode: "pdf" | "excel") {
    setOrderSheetModal({ ...EMPTY_ORDER_SHEET_MODAL, open: true, mode, formula, existingDoc, loading: true });
    try {
      const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
      const rows = await computeOrderSheetRows(formula, lines);
      setOrderSheetModal((prev) => ({ ...prev, rows, loading: false }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "원료발주가처방 데이터 조회 오류");
      setOrderSheetModal(EMPTY_ORDER_SHEET_MODAL);
    }
  }

  function updateOrderSheetRowIsNew(index: number, isNew: boolean) {
    setOrderSheetModal((prev) => ({
      ...prev,
      rows: prev.rows.map((r, i) => (i === index ? { ...r, isNew } : r)),
    }));
  }

  function setOrderSheetPersonInCharge(value: string) {
    setOrderSheetModal((prev) => ({ ...prev, personInCharge: value }));
  }

  function closeOrderSheetModal() {
    setOrderSheetModal(EMPTY_ORDER_SHEET_MODAL);
  }

  async function confirmOrderSheet() {
    const { mode, formula, existingDoc, rows, personInCharge } = orderSheetModal;
    setOrderSheetModal((prev) => ({ ...prev, loading: true }));
    try {
      if (mode === "excel") {
        await downloadRawMaterialOrderSheetExcel(formula, rows, personInCharge);
        setMessage("원료발주가처방 엑셀 다운로드 완료");
      } else if (existingDoc) {
        const doc = await regenerateRawMaterialOrderSheetDocument(existingDoc, formula, rows, personInCharge);
        setSelected(doc);
        await load();
        setMessage(`${doc.title} 재생성 완료`);
      } else {
        const doc = await createRawMaterialOrderSheetDocument(formula, rows, personInCharge);
        setSelected(doc);
        await load();
        setMessage(`${doc.title} 생성 완료`);
      }
      setOrderSheetModal(EMPTY_ORDER_SHEET_MODAL);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "원료발주가처방 처리 오류");
      setOrderSheetModal((prev) => ({ ...prev, loading: false }));
    }
  }

  function preview(doc: any) { setSelected(doc); setMessage(`${doc.document_code} 미리보기`); }
  function download(doc: any) { downloadHtmlDocument(doc); setMessage("HTML 다운로드 완료"); }
  function print(doc: any) {
    try { openPrintDocument(doc); setMessage("새 창에서 PDF 저장/인쇄를 실행하세요."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }

  // formula_code+revision+document_type+basis 별 가장 최근 문서 - 문서생성 버튼의 "이미 있음" 판단용
  // (basis 포함: 배합시/건조후 두 버전이 서로 "이미 있음"으로 잘못 인식되지 않도록)
  const existingDocByKey = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of documents) {
      const key = `${d.formula_code}|${d.revision}|${d.document_type}|${d.basis || "MIX"}|${d.lang || "BOTH"}`;
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
    load, createDoc, regenerateDoc, deleteDoc, setDocBasisOverride, preview, download, print, downloadLabJournal, downloadDocExcel,
    orderSheetModal, openOrderSheetModal, updateOrderSheetRowIsNew, setOrderSheetPersonInCharge,
    closeOrderSheetModal, confirmOrderSheet,
  };
}
