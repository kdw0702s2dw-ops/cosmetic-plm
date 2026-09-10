"use client";

import { useEffect, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  CERTIFICATE_PRODUCT_TYPES,
  CertificateProductType,
  CertItem,
  CertSubGroup,
  TestCertificate,
  buildDefaultItems,
  fetchCertificateFormulas,
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/services/sprint2/testCertificateService";
import { openCertificatePrint, downloadCertificateHtml } from "@/services/sprint2/testCertificatePdfService";
import { downloadCertificateExcel } from "@/services/sprint2/testCertificateExcelService";

type FormulaRef = { id: string; formula_code: string; revision: string; formula_name?: string; customer?: string };

// 품질관리 - 반제품/완제품 시험성적서. 처방(plm_formulas)을 선택하면 품목코드/고객사·제품명이 자동으로
// 채워지고, 제품유형(반제품/완제품)에 맞는 고정 시험항목 목록이 만들어진다. 사용자는 항목별 시험기준/
// 방법/결과/판정 값을 채운 뒤 저장하고, 저장 여부와 무관하게 현재 입력 상태 그대로 PDF/엑셀로 출력할 수 있다.
export function useTestCertificate() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";

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
    setItemCode(f.formula_code || "");
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

  function printCurrentCertificate() {
    openCertificatePrint(buildCurrentCertificate());
  }

  function downloadCurrentHtml() {
    downloadCertificateHtml(buildCurrentCertificate());
  }

  async function downloadCurrentExcel() {
    await downloadCertificateExcel(buildCurrentCertificate());
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
    items, updateItem, updateSubGroup, updateSubGroupResult,
    openNewCertificate, openExistingCertificate, closeForm,
    saveCertificate, removeCertificate,
    printCurrentCertificate, downloadCurrentHtml, downloadCurrentExcel,
  };
}
