"use client";

import { useEffect, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  CERTIFICATE_PRODUCT_TYPES,
  CertificateProductType,
  CertItem,
  CertSubGroup,
  TestCertificate,
  WorkflowStatus,
  buildDefaultItems,
  fetchCertificateFormulas,
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  confirmWriterStage,
  confirmReviewerStage,
  confirmApproverStage,
} from "@/services/sprint2/testCertificateService";
import { fetchSignaturesByUserIds } from "@/services/sprint1/signatureService";
import { openCertificatePrint, downloadCertificateHtml } from "@/services/sprint2/testCertificatePdfService";
import { downloadCertificateExcel } from "@/services/sprint2/testCertificateExcelService";

type FormulaRef = { id: string; formula_code: string; revision: string; formula_name?: string; customer?: string };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 품질관리 - 반제품/완제품 시험성적서. 처방(plm_formulas)을 선택하면 품목코드/고객사·제품명이 자동으로
// 채워지고, 제품유형(반제품/완제품)에 맞는 고정 시험항목 목록이 만들어진다. 사용자는 항목별 시험기준/
// 방법/결과/판정 값을 채운 뒤 저장하고, 저장 여부와 무관하게 현재 입력 상태 그대로 PDF/엑셀로 출력할 수 있다.
export function useTestCertificate() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";
  const myId = auth.profile?.id || null;

  const [list, setList] = useState<TestCertificate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listKeyword, setListKeyword] = useState("");
  const [listProductFilter, setListProductFilter] = useState<CertificateProductType | "전체">("전체");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productType, setProductType] = useState<CertificateProductType>("완제품");
  const [formulaKeyword, setFormulaKeyword] = useState("");
  const [formulaHits, setFormulaHits] = useState<FormulaRef[]>([]);
  const [formulaSearching, setFormulaSearching] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaRef | null>(null);

  const [docNo, setDocNo] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [customerProduct, setCustomerProduct] = useState("");
  const [testDept, setTestDept] = useState("품질관리부");
  const [overallVerdict, setOverallVerdict] = useState("적합");
  const [writerName, setWriterName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [approverName, setApproverName] = useState("");
  const [items, setItems] = useState<CertItem[]>(() => buildDefaultItems("완제품"));

  // 결재 워크플로우 상태 - 신규 작성 중에는 항상 draft, 저장된 성적서를 열면 DB에 기록된 값으로 채워진다.
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("draft");
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
      const rows = await listCertificates(listProductFilter === "전체" ? undefined : listProductFilter, listKeyword);
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
  }, [listProductFilter]);

  async function searchFormulas() {
    setFormulaSearching(true);
    try {
      const rows = await fetchCertificateFormulas(formulaKeyword);
      setFormulaHits(rows as FormulaRef[]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setFormulaSearching(false);
    }
  }

  function pickFormula(f: FormulaRef) {
    setSelectedFormula(f);
    // 처방코드의 마지막 영문자 1글자는 사내 구분용이라 바이어에게 비공개 - 품목코드에는 그 앞부분만 노출한다
    // (예: 3TSA005A -> 3TSA005). 마지막 글자가 영문이 아니면(숫자로 끝나는 코드) 그대로 둔다.
    const displayCode = (f.formula_code || "").replace(/[A-Za-z]$/, "");
    setItemCode(displayCode);
    const productPart = f.formula_name || f.formula_code || "";
    setCustomerProduct(f.customer ? `${f.customer} / ${productPart}` : productPart);
  }

  function openNewCertificate(type: CertificateProductType) {
    setEditingId(null);
    setProductType(type);
    setSelectedFormula(null);
    setFormulaKeyword("");
    setFormulaHits([]);
    setDocNo("");
    setItemCode("");
    setLotNo("");
    setCustomerProduct("");
    setTestDept("품질관리부");
    setOverallVerdict("적합");
    setWriterName(myName);
    setReviewerName("");
    setApproverName("");
    setItems(buildDefaultItems(type));
    setWorkflowStatus("draft");
    setWriterConfirmedAt(null); setWriterConfirmedBy(null); setWriterConfirmedById(null);
    setReviewerConfirmedAt(null); setReviewerConfirmedBy(null); setReviewerConfirmedById(null);
    setApproverConfirmedAt(null); setApproverConfirmedBy(null); setApproverConfirmedById(null);
    setShowForm(true);
  }

  async function openExistingCertificate(id: string) {
    setMessage("");
    try {
      const cert = await getCertificate(id);
      setEditingId(cert.id || null);
      setProductType(cert.product_type);
      setSelectedFormula(cert.formula_id ? { id: cert.formula_id, formula_code: cert.formula_code || "", revision: cert.revision || "" } : null);
      setFormulaKeyword("");
      setFormulaHits([]);
      setDocNo(cert.doc_no || "");
      setItemCode(cert.item_code || "");
      setLotNo(cert.lot_no || "");
      setCustomerProduct(cert.customer_product || "");
      setTestDept(cert.test_dept || "품질관리부");
      setOverallVerdict(cert.overall_verdict || "적합");
      setWriterName(cert.writer_name || "");
      setReviewerName(cert.reviewer_name || "");
      setApproverName(cert.approver_name || "");
      setItems(cert.items || []);
      setWorkflowStatus(cert.workflow_status || "draft");
      setWriterConfirmedAt(cert.writer_confirmed_at || null);
      setWriterConfirmedBy(cert.writer_confirmed_by || null);
      setWriterConfirmedById(cert.writer_confirmed_by_id || null);
      setReviewerConfirmedAt(cert.reviewer_confirmed_at || null);
      setReviewerConfirmedBy(cert.reviewer_confirmed_by || null);
      setReviewerConfirmedById(cert.reviewer_confirmed_by_id || null);
      setApproverConfirmedAt(cert.approver_confirmed_at || null);
      setApproverConfirmedBy(cert.approver_confirmed_by || null);
      setApproverConfirmedById(cert.approver_confirmed_by_id || null);
      setShowForm(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "성적서 조회 오류");
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function updateItem(no: number, patch: Partial<CertItem>) {
    setItems((prev) => prev.map((it) => (it.no === no ? { ...it, ...patch } : it)));
  }

  function updateSubGroup(no: number, groupIdx: number, patch: Partial<CertSubGroup>) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.no !== no || !it.subGroups) return it;
        const subGroups = it.subGroups.map((g, i) => (i === groupIdx ? { ...g, ...patch } : g));
        return { ...it, subGroups };
      })
    );
  }

  function updateSubGroupResult(no: number, groupIdx: number, resultIdx: number, value: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.no !== no || !it.subGroups) return it;
        const subGroups = it.subGroups.map((g, i) => {
          if (i !== groupIdx) return g;
          const results = g.results.map((r, ri) => (ri === resultIdx ? value : r));
          return { ...g, results };
        });
        return { ...it, subGroups };
      })
    );
  }

  // 시험항목 행 추가/삭제 - 고정 템플릿 외에 추가로 필요한 항목을 그때그때 만들거나 지울 수 있게 한다.
  // 삭제 후에는 No.가 1,2,3...으로 다시 이어지도록 번호를 재부여한다.
  function addItem() {
    setItems((prev) => {
      const nextNo = prev.length > 0 ? Math.max(...prev.map((it) => it.no)) + 1 : 1;
      const newItem: CertItem = { no: nextNo, label: "", method: "", test_date: todayStr(), spec: "", result: "" };
      return [...prev, newItem];
    });
  }

  function removeItem(no: number) {
    if (!window.confirm("이 시험항목을 삭제할까요?")) return;
    setItems((prev) => prev.filter((it) => it.no !== no).map((it, idx) => ({ ...it, no: idx + 1 })));
  }

  // 시험항목 순서 이동 - 이동 후에도 No.가 1,2,3...으로 이어지도록 다시 매긴다.
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

  function buildCurrentCertificate(): TestCertificate {
    return {
      id: editingId || undefined,
      product_type: productType,
      formula_id: selectedFormula?.id || null,
      formula_code: selectedFormula?.formula_code || null,
      revision: selectedFormula?.revision || null,
      doc_no: docNo,
      item_code: itemCode,
      lot_no: lotNo,
      customer_product: customerProduct,
      test_dept: testDept,
      overall_verdict: overallVerdict,
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

  async function saveCertificate() {
    if (!lotNo.trim()) {
      setMessage("제조번호를 입력하세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const cert = buildCurrentCertificate();
      if (editingId) {
        await updateCertificate(editingId, cert);
        setMessage("성적서가 수정되었습니다.");
      } else {
        const created = await createCertificate(cert);
        setEditingId(created.id || null);
        setMessage("성적서가 저장되었습니다.");
      }
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "성적서 저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function removeCertificate(id: string) {
    if (!window.confirm("이 성적서를 삭제할까요?")) return;
    try {
      await deleteCertificate(id);
      if (editingId === id) closeForm();
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "성적서 삭제 오류");
    }
  }

  // 결재 확정 - 저장되지 않은 성적서는 먼저 저장을 요구한다 (확정 기록은 DB에 남아야 하므로).
  async function confirmWriter() {
    if (!editingId) { setMessage("먼저 저장한 뒤 작성을 확정할 수 있습니다."); return; }
    setConfirming(true); setMessage("");
    try {
      const updated = await confirmWriterStage(buildCurrentCertificate(), myName, myId);
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
      const updated = await confirmReviewerStage(buildCurrentCertificate(), myName, myId);
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
      const updated = await confirmApproverStage(buildCurrentCertificate(), myName, myId);
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

  function printCurrentCertificate() {
    openCertificatePrint(buildCurrentCertificate());
  }

  function downloadCurrentHtml() {
    downloadCertificateHtml(buildCurrentCertificate());
  }

  // 엑셀 출력 시점에 작성/검토/승인 확정자 각자의 서명 이미지를 조회한다.
  async function downloadCurrentExcel() {
    const map = await fetchSignaturesByUserIds([writerConfirmedById, reviewerConfirmedById, approverConfirmedById]);
    await downloadCertificateExcel(buildCurrentCertificate(), {
      writer: writerConfirmedById ? map[writerConfirmedById] : undefined,
      reviewer: reviewerConfirmedById ? map[reviewerConfirmedById] : undefined,
      approver: approverConfirmedById ? map[approverConfirmedById] : undefined,
    });
  }

  return {
    CERTIFICATE_PRODUCT_TYPES,
    list, listLoading, listKeyword, setListKeyword, listProductFilter, setListProductFilter, reloadList,
    message, setMessage,
    editingId, showForm, saving,
    productType, setProductType,
    formulaKeyword, setFormulaKeyword, formulaHits, formulaSearching, searchFormulas, selectedFormula, pickFormula,
    docNo, setDocNo,
    itemCode, setItemCode, lotNo, setLotNo, customerProduct, setCustomerProduct,
    testDept, setTestDept, overallVerdict, setOverallVerdict,
    writerName, setWriterName, reviewerName, setReviewerName, approverName, setApproverName,
    items, updateItem, updateSubGroup, updateSubGroupResult, addItem, removeItem, moveItemUp, moveItemDown,
    openNewCertificate, openExistingCertificate, closeForm,
    saveCertificate, removeCertificate,
    workflowStatus, confirming,
    writerConfirmedAt, writerConfirmedBy, reviewerConfirmedAt, reviewerConfirmedBy, approverConfirmedAt, approverConfirmedBy,
    confirmWriter, confirmReviewer, confirmApprover,
    printCurrentCertificate, downloadCurrentHtml, downloadCurrentExcel,
  };
}
