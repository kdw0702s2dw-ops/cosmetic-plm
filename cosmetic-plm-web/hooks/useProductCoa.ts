"use client";

import { useEffect, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  CoaItem,
  CoaWorkflowStatus,
  ProductCoa,
  buildDefaultCoa,
  fetchCoaFormulas,
  listProductCoa,
  getProductCoa,
  createProductCoa,
  updateProductCoa,
  deleteProductCoa,
  confirmCoaWriterStage,
  confirmCoaReviewerStage,
  confirmCoaApproverStage,
} from "@/services/sprint2/productCoaService";
import { fetchSignaturesByUserIds } from "@/services/sprint1/signatureService";
import { openCoaPrint, downloadCoaHtml, type CoaSignatureMap } from "@/services/sprint2/productCoaPdfService";
import { downloadCoaExcel } from "@/services/sprint2/productCoaExcelService";

type FormulaRef = { id: string; formula_code: string; revision: string; formula_name?: string; customer?: string };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 품질관리 - 제품 COA(Certificate of Analysis). 시험성적서(useTestCertificate)와 동일한 구조지만,
// 결재 확정 시 확정한 사람의 user id를 함께 기록해서(writer_confirmed_by_id 등) 문서 출력 시
// plm_signatures에서 그 사람의 실제 서명 이미지를 찾아 삽입할 수 있게 한다.
export function useProductCoa() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";
  const myId = auth.profile?.id || null;

  const [list, setList] = useState<ProductCoa[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listKeyword, setListKeyword] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formulaKeyword, setFormulaKeyword] = useState("");
  const [formulaHits, setFormulaHits] = useState<FormulaRef[]>([]);
  const [formulaSearching, setFormulaSearching] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaRef | null>(null);

  const [docNo, setDocNo] = useState("");
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [address, setAddress] = useState("");
  const [productCode, setProductCode] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [testDateFrom, setTestDateFrom] = useState("");
  const [testDateTo, setTestDateTo] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [writerName, setWriterName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [approverName, setApproverName] = useState("");
  const [items, setItems] = useState<CoaItem[]>(() => buildDefaultCoa().items);

  const [workflowStatus, setWorkflowStatus] = useState<CoaWorkflowStatus>("draft");
  const [writerConfirmedAt, setWriterConfirmedAt] = useState<string | null>(null);
  const [writerConfirmedBy, setWriterConfirmedBy] = useState<string | null>(null);
  const [writerConfirmedById, setWriterConfirmedById] = useState<string | null>(null);
  const [reviewerConfirmedAt, setReviewerConfirmedAt] = useState<string | null>(null);
  const [reviewerConfirmedBy, setReviewerConfirmedBy] = useState<string | null>(null);
  const [reviewerConfirmedById, setReviewerConfirmedById] = useState<string | null>(null);
  const [approverConfirmedAt, setApproverConfirmedAt] = useState<string | null>(null);
  const [approverConfirmedBy, setApproverConfirmedBy] = useState<string | null>(null);
  const [approverConfirmedById, setApproverConfirmedById] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function reloadList() {
    setListLoading(true);
    try {
      const rows = await listProductCoa(listKeyword);
      setList(rows);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "목록 조회 오류");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    reloadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchFormulas() {
    setFormulaSearching(true);
    try {
      const rows = await fetchCoaFormulas(formulaKeyword);
      setFormulaHits(rows as FormulaRef[]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setFormulaSearching(false);
    }
  }

  function pickFormula(f: FormulaRef) {
    setSelectedFormula(f);
    const displayCode = (f.formula_code || "").replace(/[A-Za-z]$/, "");
    setProductCode(displayCode);
    setProductName(f.formula_name || f.formula_code || "");
  }

  function openNewCoa() {
    const defaults = buildDefaultCoa();
    setEditingId(null);
    setSelectedFormula(null);
    setFormulaKeyword("");
    setFormulaHits([]);
    setDocNo("");
    setProductName("");
    setManufacturer(defaults.manufacturer || "");
    setAddress(defaults.address || "");
    setProductCode("");
    setBatchNo("");
    setProductCategory("");
    setTestDateFrom(defaults.test_date_from || todayStr());
    setTestDateTo(defaults.test_date_to || todayStr());
    setConclusion(defaults.conclusion || "");
    setWriterName(myName);
    setReviewerName("");
    setApproverName("");
    setItems(defaults.items);
    setWorkflowStatus("draft");
    setWriterConfirmedAt(null); setWriterConfirmedBy(null); setWriterConfirmedById(null);
    setReviewerConfirmedAt(null); setReviewerConfirmedBy(null); setReviewerConfirmedById(null);
    setApproverConfirmedAt(null); setApproverConfirmedBy(null); setApproverConfirmedById(null);
    setShowForm(true);
  }

  async function openExistingCoa(id: string) {
    setMessage("");
    try {
      const coa = await getProductCoa(id);
      setEditingId(coa.id || null);
      setSelectedFormula(coa.formula_id ? { id: coa.formula_id, formula_code: coa.formula_code || "", revision: coa.revision || "" } : null);
      setFormulaKeyword("");
      setFormulaHits([]);
      setDocNo(coa.doc_no || "");
      setProductName(coa.product_name || "");
      setManufacturer(coa.manufacturer || "");
      setAddress(coa.address || "");
      setProductCode(coa.product_code || "");
      setBatchNo(coa.batch_no || "");
      setProductCategory(coa.product_category || "");
      setTestDateFrom(coa.test_date_from || "");
      setTestDateTo(coa.test_date_to || "");
      setConclusion(coa.conclusion || "");
      setWriterName(coa.writer_name || "");
      setReviewerName(coa.reviewer_name || "");
      setApproverName(coa.approver_name || "");
      setItems(coa.items || []);
      setWorkflowStatus(coa.workflow_status || "draft");
      setWriterConfirmedAt(coa.writer_confirmed_at || null);
      setWriterConfirmedBy(coa.writer_confirmed_by || null);
      setWriterConfirmedById(coa.writer_confirmed_by_id || null);
      setReviewerConfirmedAt(coa.reviewer_confirmed_at || null);
      setReviewerConfirmedBy(coa.reviewer_confirmed_by || null);
      setReviewerConfirmedById(coa.reviewer_confirmed_by_id || null);
      setApproverConfirmedAt(coa.approver_confirmed_at || null);
      setApproverConfirmedBy(coa.approver_confirmed_by || null);
      setApproverConfirmedById(coa.approver_confirmed_by_id || null);
      setShowForm(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "COA 조회 오류");
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function updateItem(no: number, patch: Partial<CoaItem>) {
    setItems((prev) => prev.map((it) => (it.no === no ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => {
      const nextNo = prev.length > 0 ? Math.max(...prev.map((it) => it.no)) + 1 : 1;
      const newItem: CoaItem = { no: nextNo, test_item: "", test_standard: "", test_method: "", test_date: todayStr(), result: "" };
      return [...prev, newItem];
    });
  }

  function removeItem(no: number) {
    if (!window.confirm("이 시험항목을 삭제할까요?")) return;
    setItems((prev) => prev.filter((it) => it.no !== no).map((it, idx) => ({ ...it, no: idx + 1 })));
  }

  function moveItem(no: number, direction: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.no === no);
      if (idx === -1) return prev;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((it, i) => ({ ...it, no: i + 1 }));
    });
  }

  function moveItemUp(no: number) {
    moveItem(no, -1);
  }

  function moveItemDown(no: number) {
    moveItem(no, 1);
  }

  function buildCurrentCoa(): ProductCoa {
    return {
      id: editingId || undefined,
      formula_id: selectedFormula?.id || null,
      formula_code: selectedFormula?.formula_code || null,
      revision: selectedFormula?.revision || null,
      doc_no: docNo,
      product_name: productName,
      manufacturer,
      address,
      product_code: productCode,
      batch_no: batchNo,
      product_category: productCategory,
      test_date_from: testDateFrom,
      test_date_to: testDateTo,
      conclusion,
      writer_name: writerName,
      reviewer_name: reviewerName,
      approver_name: approverName,
      workflow_status: workflowStatus,
      writer_confirmed_at: writerConfirmedAt,
      writer_confirmed_by: writerConfirmedBy,
      writer_confirmed_by_id: writerConfirmedById,
      reviewer_confirmed_at: reviewerConfirmedAt,
      reviewer_confirmed_by: reviewerConfirmedBy,
      reviewer_confirmed_by_id: reviewerConfirmedById,
      approver_confirmed_at: approverConfirmedAt,
      approver_confirmed_by: approverConfirmedBy,
      approver_confirmed_by_id: approverConfirmedById,
      items,
      created_by: myName,
    };
  }

  async function saveCoa() {
    if (!productName.trim()) {
      setMessage("제품명을 입력하세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const coa = buildCurrentCoa();
      if (editingId) {
        await updateProductCoa(editingId, coa);
        setMessage("COA가 수정되었습니다.");
      } else {
        const created = await createProductCoa(coa);
        setEditingId(created.id || null);
        setMessage("COA가 저장되었습니다.");
      }
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "COA 저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function removeCoa(id: string) {
    if (!window.confirm("이 COA를 삭제할까요?")) return;
    try {
      await deleteProductCoa(id);
      if (editingId === id) closeForm();
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "COA 삭제 오류");
    }
  }

  async function confirmWriter() {
    if (!editingId) { setMessage("먼저 저장한 뒤 작성을 확정할 수 있습니다."); return; }
    setConfirming(true); setMessage("");
    try {
      const updated = await confirmCoaWriterStage(buildCurrentCoa(), myName, myId);
      setWorkflowStatus(updated.workflow_status || "draft");
      setWriterConfirmedAt(updated.writer_confirmed_at || null);
      setWriterConfirmedBy(updated.writer_confirmed_by || null);
      setWriterConfirmedById(updated.writer_confirmed_by_id || null);
      setMessage(reviewerName.trim() ? "작성이 확정되었습니다. 검토 대기 중입니다." : "작성이 확정되었습니다. 검토자가 없어 승인 대기로 넘어갑니다.");
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "작성 확정 오류");
    } finally {
      setConfirming(false);
    }
  }

  async function confirmReviewer() {
    if (!editingId) return;
    setConfirming(true); setMessage("");
    try {
      const updated = await confirmCoaReviewerStage(buildCurrentCoa(), myName, myId);
      setWorkflowStatus(updated.workflow_status || "draft");
      setReviewerConfirmedAt(updated.reviewer_confirmed_at || null);
      setReviewerConfirmedBy(updated.reviewer_confirmed_by || null);
      setReviewerConfirmedById(updated.reviewer_confirmed_by_id || null);
      setMessage("검토가 확정되었습니다. 승인 대기 중입니다.");
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "검토 확정 오류");
    } finally {
      setConfirming(false);
    }
  }

  async function confirmApprover() {
    if (!editingId) return;
    setConfirming(true); setMessage("");
    try {
      const updated = await confirmCoaApproverStage(buildCurrentCoa(), myName, myId);
      setWorkflowStatus(updated.workflow_status || "draft");
      setApproverConfirmedAt(updated.approver_confirmed_at || null);
      setApproverConfirmedBy(updated.approver_confirmed_by || null);
      setApproverConfirmedById(updated.approver_confirmed_by_id || null);
      setMessage("승인이 완료되었습니다.");
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "승인 확정 오류");
    } finally {
      setConfirming(false);
    }
  }

  // 출력 시점에 작성/검토/승인 확정자의 서명 이미지를 한 번에 조회한다.
  async function loadSignatureMap(): Promise<CoaSignatureMap> {
    const map = await fetchSignaturesByUserIds([writerConfirmedById, reviewerConfirmedById, approverConfirmedById]);
    return {
      writer: writerConfirmedById ? map[writerConfirmedById] : undefined,
      reviewer: reviewerConfirmedById ? map[reviewerConfirmedById] : undefined,
      approver: approverConfirmedById ? map[approverConfirmedById] : undefined,
    };
  }

  async function printCurrentCoa() {
    const signatures = await loadSignatureMap();
    openCoaPrint(buildCurrentCoa(), signatures);
  }

  async function downloadCurrentHtml() {
    const signatures = await loadSignatureMap();
    downloadCoaHtml(buildCurrentCoa(), signatures);
  }

  async function downloadCurrentExcel() {
    const signatures = await loadSignatureMap();
    await downloadCoaExcel(buildCurrentCoa(), signatures);
  }

  return {
    list, listLoading, listKeyword, setListKeyword, reloadList,
    message, setMessage,
    editingId, showForm, saving,
    formulaKeyword, setFormulaKeyword, formulaHits, formulaSearching, searchFormulas, selectedFormula, pickFormula,
    docNo, setDocNo,
    productName, setProductName, manufacturer, setManufacturer, address, setAddress,
    productCode, setProductCode, batchNo, setBatchNo, productCategory, setProductCategory,
    testDateFrom, setTestDateFrom, testDateTo, setTestDateTo, conclusion, setConclusion,
    writerName, setWriterName, reviewerName, setReviewerName, approverName, setApproverName,
    items, updateItem, addItem, removeItem, moveItemUp, moveItemDown,
    openNewCoa, openExistingCoa, closeForm,
    saveCoa, removeCoa,
    workflowStatus, confirming,
    writerConfirmedAt, writerConfirmedBy, reviewerConfirmedAt, reviewerConfirmedBy, approverConfirmedAt, approverConfirmedBy,
    confirmWriter, confirmReviewer, confirmApprover,
    printCurrentCoa, downloadCurrentHtml, downloadCurrentExcel,
  };
}
