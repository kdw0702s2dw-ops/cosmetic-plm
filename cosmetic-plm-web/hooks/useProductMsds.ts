"use client";

import { useEffect, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  MsdsRow,
  MsdsSection,
  MsdsWorkflowStatus,
  ProductMsds,
  buildDefaultMsds,
  fetchMsdsFormulas,
  listProductMsds,
  getProductMsds,
  createProductMsds,
  updateProductMsds,
  deleteProductMsds,
  confirmMsdsApproverStage,
} from "@/services/sprint2/productMsdsService";
import { fetchSignaturesByUserIds } from "@/services/sprint1/signatureService";
import { openMsdsPrint, downloadMsdsHtml, type MsdsSignatureMap } from "@/services/sprint2/productMsdsPdfService";
import { downloadMsdsExcel } from "@/services/sprint2/productMsdsExcelService";

type FormulaRef = { id: string; formula_code: string; revision: string; formula_name?: string; customer?: string };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 품질관리 - 제품 MSDS(Material Safety Data Sheet). 제품 COA와 동일한 패턴으로 Approved By
// 단일 단계 결재를 쓰고, 확정 시 확정한 사람의 user id(approver_confirmed_by_id)를 기록해서 문서
// 출력 시 그 사람의 실제 서명 이미지를 삽입한다. 2~16번 섹션은 sections 배열로 다루며, 각 섹션의
// 행(label/value)만 값 편집이 가능하고 섹션 구성(제목/행 순서) 자체는 템플릿을 그대로 따른다.
export function useProductMsds() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";
  const myId = auth.profile?.id || null;

  const [list, setList] = useState<ProductMsds[]>([]);
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
  const [productCode, setProductCode] = useState("");
  const [productType, setProductType] = useState("");
  const [revision, setRevision] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [address, setAddress] = useState("");
  const [telEmergency, setTelEmergency] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [approverName, setApproverName] = useState("");
  const [sections, setSections] = useState<MsdsSection[]>(() => buildDefaultMsds().sections);

  const [workflowStatus, setWorkflowStatus] = useState<MsdsWorkflowStatus>("draft");
  const [approverConfirmedAt, setApproverConfirmedAt] = useState<string | null>(null);
  const [approverConfirmedBy, setApproverConfirmedBy] = useState<string | null>(null);
  const [approverConfirmedById, setApproverConfirmedById] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function reloadList() {
    setListLoading(true);
    try {
      const rows = await listProductMsds(listKeyword);
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
      const rows = await fetchMsdsFormulas(formulaKeyword);
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

  function openNewMsds() {
    const defaults = buildDefaultMsds();
    setEditingId(null);
    setSelectedFormula(null);
    setFormulaKeyword("");
    setFormulaHits([]);
    setDocNo("");
    setProductName("");
    setProductCode("");
    setProductType(defaults.product_type || "");
    setRevision(defaults.revision || "");
    setManufacturer(defaults.manufacturer || "");
    setAddress(defaults.address || "");
    setTelEmergency(defaults.tel_emergency || "");
    setIssueDate("");
    setApproverName("");
    setSections(defaults.sections);
    setWorkflowStatus("draft");
    setApproverConfirmedAt(null); setApproverConfirmedBy(null); setApproverConfirmedById(null);
    setShowForm(true);
  }

  async function openExistingMsds(id: string) {
    setMessage("");
    try {
      const msds = await getProductMsds(id);
      setEditingId(msds.id || null);
      setSelectedFormula(msds.formula_id ? { id: msds.formula_id, formula_code: msds.formula_code || "", revision: msds.revision || "" } : null);
      setFormulaKeyword("");
      setFormulaHits([]);
      setDocNo(msds.doc_no || "");
      setProductName(msds.product_name || "");
      setProductCode(msds.product_code || "");
      setProductType(msds.product_type || "");
      setRevision(msds.revision || "");
      setManufacturer(msds.manufacturer || "");
      setAddress(msds.address || "");
      setTelEmergency(msds.tel_emergency || "");
      setIssueDate(msds.issue_date || "");
      setApproverName(msds.approver_name || "");
      setSections(msds.sections && msds.sections.length > 0 ? msds.sections : buildDefaultMsds().sections);
      setWorkflowStatus(msds.workflow_status || "draft");
      setApproverConfirmedAt(msds.approver_confirmed_at || null);
      setApproverConfirmedBy(msds.approver_confirmed_by || null);
      setApproverConfirmedById(msds.approver_confirmed_by_id || null);
      setShowForm(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MSDS 조회 오류");
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function updateSectionRow(sectionNo: number, rowIndex: number, patch: Partial<MsdsRow>) {
    setSections((prev) =>
      prev.map((sec) =>
        sec.no === sectionNo
          ? { ...sec, rows: sec.rows.map((row, idx) => (idx === rowIndex ? { ...row, ...patch } : row)) }
          : sec
      )
    );
  }

  function addSectionRow(sectionNo: number) {
    setSections((prev) =>
      prev.map((sec) => (sec.no === sectionNo ? { ...sec, rows: [...sec.rows, { label: "", value: "" }] } : sec))
    );
  }

  function removeSectionRow(sectionNo: number, rowIndex: number) {
    setSections((prev) =>
      prev.map((sec) => (sec.no === sectionNo ? { ...sec, rows: sec.rows.filter((_, idx) => idx !== rowIndex) } : sec))
    );
  }

  function updateSectionNote(sectionNo: number, field: "introNote" | "outroNote", value: string) {
    setSections((prev) => prev.map((sec) => (sec.no === sectionNo ? { ...sec, [field]: value } : sec)));
  }

  function buildCurrentMsds(): ProductMsds {
    return {
      id: editingId || undefined,
      formula_id: selectedFormula?.id || null,
      formula_code: selectedFormula?.formula_code || null,
      revision,
      doc_no: docNo,
      product_name: productName,
      product_code: productCode,
      product_type: productType,
      manufacturer,
      address,
      tel_emergency: telEmergency,
      sections,
      issue_date: issueDate,
      approver_name: approverName,
      workflow_status: workflowStatus,
      approver_confirmed_at: approverConfirmedAt,
      approver_confirmed_by: approverConfirmedBy,
      approver_confirmed_by_id: approverConfirmedById,
      created_by: myName,
    };
  }

  async function saveMsds() {
    if (!productName.trim()) {
      setMessage("제품명을 입력하세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const msds = buildCurrentMsds();
      if (editingId) {
        await updateProductMsds(editingId, msds);
        setMessage("MSDS가 수정되었습니다.");
      } else {
        const created = await createProductMsds(msds);
        setEditingId(created.id || null);
        setMessage("MSDS가 저장되었습니다.");
      }
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MSDS 저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function removeMsds(id: string) {
    if (!window.confirm("이 MSDS를 삭제할까요?")) return;
    try {
      await deleteProductMsds(id);
      if (editingId === id) closeForm();
      await reloadList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MSDS 삭제 오류");
    }
  }

  async function confirmApprover() {
    if (!editingId) return;
    setConfirming(true); setMessage("");
    try {
      const updated = await confirmMsdsApproverStage(buildCurrentMsds(), myName, myId);
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

  // 출력 시점에 승인(Approved By) 확정자의 서명 이미지를 조회한다.
  async function loadSignatureMap(): Promise<MsdsSignatureMap> {
    const map = await fetchSignaturesByUserIds([approverConfirmedById]);
    return {
      approver: approverConfirmedById ? map[approverConfirmedById] : undefined,
    };
  }

  async function printCurrentMsds() {
    const signatures = await loadSignatureMap();
    openMsdsPrint(buildCurrentMsds(), signatures);
  }

  async function downloadCurrentHtml() {
    const signatures = await loadSignatureMap();
    downloadMsdsHtml(buildCurrentMsds(), signatures);
  }

  async function downloadCurrentExcel() {
    const signatures = await loadSignatureMap();
    await downloadMsdsExcel(buildCurrentMsds(), signatures);
  }

  return {
    list, listLoading, listKeyword, setListKeyword, reloadList,
    message, setMessage,
    editingId, showForm, saving,
    formulaKeyword, setFormulaKeyword, formulaHits, formulaSearching, searchFormulas, selectedFormula, pickFormula,
    docNo, setDocNo,
    productName, setProductName, productCode, setProductCode, productType, setProductType, revision, setRevision,
    manufacturer, setManufacturer, address, setAddress, telEmergency, setTelEmergency,
    issueDate, setIssueDate, approverName, setApproverName,
    sections, updateSectionRow, addSectionRow, removeSectionRow, updateSectionNote,
    openNewMsds, openExistingMsds, closeForm,
    saveMsds, removeMsds,
    workflowStatus, confirming,
    approverConfirmedAt, approverConfirmedBy,
    confirmApprover,
    printCurrentMsds, downloadCurrentHtml, downloadCurrentExcel,
  };
}
