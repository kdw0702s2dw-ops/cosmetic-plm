"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  searchFormulasByCodeOrConfirmedCode,
  fetchStabilityTests,
  saveStabilityTest,
  deleteStabilityTest,
  fetchStabilityConditions,
  addStabilityCondition,
  deleteStabilityCondition,
  addStabilityCheckpoint,
  deleteStabilityCheckpoint,
  saveCheckpointResult,
  uploadStabilityPhoto,
  isCheckpointOverdue,
  computeOverallJudgement,
  suggestJudgement,
  STABILITY_CONDITION_PRESETS,
  STABILITY_ITEM_PRESETS,
  STABILITY_CONDITION_TYPES,
  STABILITY_TEST_STATUSES,
  buildStabilityCertificateHtml,
  openPrintDocument,
  downloadHtmlDocument,
  type StabilityTest,
  type StabilityConditionType,
  type StabilityTestStatus,
  type StabilityItemTemplate,
  type StabilityResultItem,
  type StabilityConditionWithCheckpoints,
  type StabilityCheckpoint,
} from "@/services/sprint2/stabilityTestService";

type FormulaRef = { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 품질관리 - 화장품 안정성시험 관리. 시료(처방 연동) -> 시험조건(장기보존/가속/...) -> 체크포인트(시점별 결과) 3단 구조를 다룬다.
export function useStabilityTest() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";

  const [tests, setTests] = useState<StabilityTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [listKeyword, setListKeyword] = useState("");

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<StabilityConditionWithCheckpoints[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  // 시료 등록/수정 폼
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [formulaKeyword, setFormulaKeyword] = useState("");
  const [formulaHits, setFormulaHits] = useState<FormulaRef[]>([]);
  const [formulaSearching, setFormulaSearching] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaRef | null>(null);
  const [sampleName, setSampleName] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [assignee, setAssignee] = useState("");
  const [testStatus, setTestStatus] = useState<StabilityTestStatus>("진행중");
  const [testMemo, setTestMemo] = useState("");
  const [savingTest, setSavingTest] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  // 조건 추가 폼
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [conditionType, setConditionType] = useState<StabilityConditionType>("장기보존");
  const [conditionLabel, setConditionLabel] = useState(STABILITY_CONDITION_PRESETS[0].label);
  const [conditionStartDate, setConditionStartDate] = useState(todayStr());
  const [itemTemplates, setItemTemplates] = useState<StabilityItemTemplate[]>(STABILITY_ITEM_PRESETS.map((x) => ({ ...x })));
  const [savingCondition, setSavingCondition] = useState(false);

  // 체크포인트 결과 입력
  const [activeCheckpoint, setActiveCheckpoint] = useState<StabilityCheckpoint | null>(null);
  const [activeConditionForCheckpoint, setActiveConditionForCheckpoint] = useState<StabilityConditionWithCheckpoints | null>(null);
  const [resultDraft, setResultDraft] = useState<StabilityResultItem[]>([]);
  const [photoDraft, setPhotoDraft] = useState<string[]>([]);
  const [checkpointMemo, setCheckpointMemo] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);

  async function loadTests() {
    setLoading(true);
    try {
      setTests(await fetchStabilityTests());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "시험 목록 조회 오류");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadTests();
  }, []);

  const visibleTests = useMemo(() => {
    const k = listKeyword.trim().toLowerCase();
    if (!k) return tests;
    return tests.filter(
      (t) =>
        t.formula_code.toLowerCase().includes(k) ||
        (t.sample_name || "").toLowerCase().includes(k) ||
        (t.lot_no || "").toLowerCase().includes(k) ||
        (t.confirmed_code || "").toLowerCase().includes(k)
    );
  }, [tests, listKeyword]);

  async function selectTest(id: string) {
    setSelectedTestId(id);
    closeCheckpointForm();
    setConditionsLoading(true);
    try {
      setConditions(await fetchStabilityConditions(id));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "시험조건 조회 오류");
      setConditions([]);
    } finally {
      setConditionsLoading(false);
    }
  }

  async function reloadConditions() {
    if (!selectedTestId) return;
    try {
      setConditions(await fetchStabilityConditions(selectedTestId));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "시험조건 조회 오류");
    }
  }

  async function searchFormula() {
    if (!formulaKeyword.trim()) {
      setFormulaHits([]);
      return;
    }
    setFormulaSearching(true);
    try {
      setFormulaHits(await searchFormulasByCodeOrConfirmedCode(formulaKeyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setFormulaSearching(false);
    }
  }

  function pickFormula(f: FormulaRef) {
    setSelectedFormula(f);
    setFormulaHits([]);
    setSampleName((prev) => prev || f.formula_name || "");
  }

  function newTestForm() {
    setEditingTestId(null);
    setSelectedFormula(null);
    setFormulaKeyword("");
    setFormulaHits([]);
    setSampleName("");
    setLotNo("");
    setManufactureDate(todayStr());
    setStorageLocation("");
    setAssignee("");
    setTestStatus("진행중");
    setTestMemo("");
    setShowTestForm(true);
  }

  function editTestForm(t: StabilityTest) {
    setEditingTestId(t.id || null);
    setSelectedFormula({
      formula_code: t.formula_code, revision: t.revision,
      formula_name: t.formula_name || undefined, confirmed_code: t.confirmed_code || undefined,
    });
    setFormulaKeyword("");
    setFormulaHits([]);
    setSampleName(t.sample_name || "");
    setLotNo(t.lot_no || "");
    setManufactureDate(t.manufacture_date || "");
    setStorageLocation(t.storage_location || "");
    setAssignee(t.assignee || "");
    setTestStatus(t.status);
    setTestMemo(t.memo || "");
    setShowTestForm(true);
  }

  async function saveTest() {
    if (!selectedFormula) {
      setMessage("처방을 먼저 검색해서 선택하세요.");
      return;
    }
    setSavingTest(true);
    setMessage("");
    try {
      const saved = await saveStabilityTest({
        id: editingTestId || undefined,
        formula_code: selectedFormula.formula_code,
        revision: selectedFormula.revision,
        formula_name: selectedFormula.formula_name,
        confirmed_code: selectedFormula.confirmed_code,
        sample_name: sampleName || null,
        lot_no: lotNo || null,
        manufacture_date: manufactureDate || null,
        storage_location: storageLocation || null,
        assignee: assignee || null,
        status: testStatus,
        memo: testMemo || null,
        created_by: auth.profile?.email || undefined,
      });
      setMessage("저장 완료");
      setShowTestForm(false);
      await loadTests();
      if (saved.id) await selectTest(saved.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingTest(false);
    }
  }

  async function removeTest(id: string) {
    if (!confirm("이 시료의 모든 시험 기록(조건/체크포인트 포함)이 삭제됩니다. 계속하시겠습니까?")) return;
    try {
      await deleteStabilityTest(id);
      if (selectedTestId === id) {
        setSelectedTestId(null);
        setConditions([]);
      }
      await loadTests();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  // 조건 유형을 바꾸면 라벨/평가항목을 그 유형의 기본 프리셋으로 되돌린다.
  function selectConditionType(type: StabilityConditionType) {
    setConditionType(type);
    const preset = STABILITY_CONDITION_PRESETS.find((p) => p.type === type);
    setConditionLabel(preset?.label || type);
    setItemTemplates(STABILITY_ITEM_PRESETS.map((x) => ({ ...x })));
  }

  function addItemTemplateRow() {
    setItemTemplates((prev) => [...prev, { key: `custom_${Date.now()}`, label: "", type: "text" }]);
  }
  function updateItemTemplate(index: number, patch: Partial<StabilityItemTemplate>) {
    setItemTemplates((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeItemTemplate(index: number) {
    setItemTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitAddCondition() {
    if (!selectedTestId) return;
    if (itemTemplates.length === 0) {
      setMessage("평가 항목을 1개 이상 구성하세요.");
      return;
    }
    setSavingCondition(true);
    setMessage("");
    try {
      await addStabilityCondition({
        test_id: selectedTestId,
        condition_type: conditionType,
        condition_label: conditionLabel,
        start_date: conditionStartDate,
        item_templates: itemTemplates,
      });
      setMessage("시험조건이 추가되었습니다.");
      setShowAddCondition(false);
      await reloadConditions();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "시험조건 추가 오류");
    } finally {
      setSavingCondition(false);
    }
  }

  async function removeCondition(id: string) {
    if (!confirm("이 시험조건과 모든 체크포인트가 삭제됩니다. 계속하시겠습니까?")) return;
    try {
      await deleteStabilityCondition(id);
      await reloadConditions();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  async function addExtraCheckpoint(conditionId: string, label: string, dueDate: string) {
    try {
      await addStabilityCheckpoint(conditionId, label, dueDate);
      await reloadConditions();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "체크포인트 추가 오류");
    }
  }

  async function removeCheckpoint(id: string) {
    if (!confirm("이 체크포인트를 삭제하시겠습니까?")) return;
    try {
      await deleteStabilityCheckpoint(id);
      if (activeCheckpoint?.id === id) closeCheckpointForm();
      await reloadConditions();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  // 체크포인트를 열면 이미 입력된 결과가 있으면 그대로 불러오고, 없으면 그 조건의 항목 구성으로 빈 입력행을 만든다.
  function openCheckpointForm(condition: StabilityConditionWithCheckpoints, checkpoint: StabilityCheckpoint) {
    setActiveConditionForCheckpoint(condition);
    setActiveCheckpoint(checkpoint);
    const base: StabilityResultItem[] =
      checkpoint.results && checkpoint.results.length > 0
        ? checkpoint.results
        : condition.item_templates.map((t) => ({ key: t.key, label: t.label, type: t.type, value: "", judgement: "" as const, memo: "" }));
    setResultDraft(base.map((r) => ({ ...r })));
    setPhotoDraft([...(checkpoint.photo_urls || [])]);
    setCheckpointMemo(checkpoint.memo || "");
  }

  function closeCheckpointForm() {
    setActiveCheckpoint(null);
    setActiveConditionForCheckpoint(null);
    setResultDraft([]);
    setPhotoDraft([]);
    setCheckpointMemo("");
  }

  function updateResultValue(index: number, value: string) {
    setResultDraft((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const tmpl = activeConditionForCheckpoint?.item_templates.find((t) => t.key === r.key);
        const suggested = tmpl ? suggestJudgement(tmpl, value) : "";
        return { ...r, value, judgement: suggested || r.judgement };
      })
    );
  }
  function updateResultJudgement(index: number, judgement: StabilityResultItem["judgement"]) {
    setResultDraft((prev) => prev.map((r, i) => (i === index ? { ...r, judgement } : r)));
  }

  async function addPhotoToDraft(file: File) {
    if (!activeCheckpoint) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadStabilityPhoto(selectedTestId || "unknown", activeCheckpoint.id, file);
      setPhotoDraft((prev) => [...prev, url]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "사진 업로드 오류");
    } finally {
      setUploadingPhoto(false);
    }
  }
  function removePhotoFromDraft(url: string) {
    setPhotoDraft((prev) => prev.filter((u) => u !== url));
  }

  async function submitCheckpointResult() {
    if (!activeCheckpoint) return;
    setSavingCheckpoint(true);
    setMessage("");
    try {
      await saveCheckpointResult(activeCheckpoint.id, {
        results: resultDraft,
        photo_urls: photoDraft,
        memo: checkpointMemo,
        recorded_by: myName,
      });
      setMessage("결과가 저장되었습니다.");
      closeCheckpointForm();
      await reloadConditions();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "결과 저장 오류");
    } finally {
      setSavingCheckpoint(false);
    }
  }

  function printCertificate(test: StabilityTest) {
    openPrintDocument(buildStabilityCertificateHtml(test, conditions));
  }
  function downloadCertificate(test: StabilityTest) {
    downloadHtmlDocument(buildStabilityCertificateHtml(test, conditions));
  }

  const selectedTest = useMemo(() => tests.find((t) => t.id === selectedTestId) || null, [tests, selectedTestId]);

  return {
    tests: visibleTests, allTestsCount: tests.length, loading, message, listKeyword, setListKeyword, loadTests,
    selectedTestId, selectedTest, selectTest, conditions, conditionsLoading,
    showTestForm, setShowTestForm, newTestForm, editTestForm, editingTestId,
    formulaKeyword, setFormulaKeyword, formulaHits, formulaSearching, searchFormula, selectedFormula, pickFormula,
    sampleName, setSampleName, lotNo, setLotNo, manufactureDate, setManufactureDate,
    storageLocation, setStorageLocation, assignee, setAssignee, testStatus, setTestStatus, testMemo, setTestMemo,
    savingTest, saveTest, removeTest,
    showAddCondition, setShowAddCondition, conditionType, selectConditionType, conditionLabel, setConditionLabel,
    conditionStartDate, setConditionStartDate, itemTemplates, addItemTemplateRow, updateItemTemplate, removeItemTemplate,
    savingCondition, submitAddCondition, removeCondition,
    addExtraCheckpoint, removeCheckpoint,
    activeCheckpoint, activeConditionForCheckpoint, openCheckpointForm, closeCheckpointForm,
    resultDraft, updateResultValue, updateResultJudgement, photoDraft, addPhotoToDraft, removePhotoFromDraft, uploadingPhoto,
    checkpointMemo, setCheckpointMemo, savingCheckpoint, submitCheckpointResult,
    printCertificate, downloadCertificate,
    isCheckpointOverdue, computeOverallJudgement,
    conditionTypes: STABILITY_CONDITION_TYPES, testStatuses: STABILITY_TEST_STATUSES,
    canWrite: auth.canWriteQuality, myName,
  };
}
