"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  searchFormulasByCodeOrConfirmedCode,
  fetchSourcingBoardItems,
  fetchActiveSourcingNoteForFormula,
  saveSourcingNote,
  updateSourcingStatus,
  deleteSourcingNote,
  isDueSoonOrOverdue,
  SOURCING_STATUSES,
  type SourcingScheduleNote,
  type SourcingStatus,
} from "@/services/sprint2/sourcingScheduleService";

type FormulaRef = { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string };

// SENT(발송 완료) 칼럼은 무한히 쌓이지 않도록 최신 항목 위주로 화면에 이 개수만 노출한다.
const SENT_COLUMN_LIMIT = 15;

export function useSourcingSchedule() {
  const auth = useSprint1Auth();
  const myEmail = auth.profile?.email || "";

  const [keyword, setKeyword] = useState("");
  const [hits, setHits] = useState<FormulaRef[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedFormula, setSelectedFormula] = useState<FormulaRef | null>(null);
  const [editingItem, setEditingItem] = useState<SourcingScheduleNote | null>(null);
  const [note, setNote] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [expectedArrivalDate, setExpectedArrivalDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<SourcingScheduleNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  async function loadBoard() {
    setLoading(true);
    try {
      setItems(await fetchSourcingBoardItems());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "일정 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  const visibleItems = useMemo(
    () => (onlyMine ? items.filter((i) => i.assignee && i.assignee === myEmail) : items),
    [items, onlyMine, myEmail]
  );

  // 칼럼별로 묶기 - SENT 칼럼은 최신순으로 상위 N개만.
  const board = useMemo(() => {
    const grouped: Record<SourcingStatus, SourcingScheduleNote[]> = {
      REQUESTED: [], QUOTE_WAIT: [], ARRIVAL_WAIT: [], SENT: [],
    };
    for (const item of visibleItems) {
      const key = (item.status || "REQUESTED") as SourcingStatus;
      if (grouped[key]) grouped[key].push(item);
    }
    grouped.SENT = grouped.SENT.slice(0, SENT_COLUMN_LIMIT);
    return grouped;
  }, [visibleItems]);

  // 예상 입고일이 임박/연체된 활성(발송 완료 아닌) 건수 - 연구원 홈 상단 알림 배지에 사용.
  const alertCount = useMemo(() => items.filter((i) => isDueSoonOrOverdue(i)).length, [items]);

  async function search() {
    if (!keyword.trim()) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      setHits(await searchFormulasByCodeOrConfirmedCode(keyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setSearching(false);
    }
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  async function selectFormula(f: FormulaRef) {
    setSelectedFormula(f);
    setHits([]);
    setMessage("");
    try {
      const existing = await fetchActiveSourcingNoteForFormula(f.formula_code, f.revision);
      setEditingItem(existing);
      setNote(existing?.note || "");
      setRequestedDate(existing?.requested_date || today());
      setExpectedArrivalDate(existing?.expected_arrival_date || "");
      setAssignee(existing?.assignee || "");
    } catch (e) {
      setEditingItem(null);
      setNote("");
      setRequestedDate(today());
      setExpectedArrivalDate("");
      setAssignee("");
      setMessage(e instanceof Error ? e.message : "기존 소싱 메모 조회 오류");
    }
  }

  // 보드 카드를 바로 눌러 수정 모드로 진입할 때 사용 (재검색 없이 편집 가능)
  function editItem(item: SourcingScheduleNote) {
    setSelectedFormula({
      formula_code: item.formula_code,
      revision: item.revision,
      formula_name: item.formula_name,
      confirmed_code: item.confirmed_code,
    });
    setEditingItem(item);
    setNote(item.note || "");
    setRequestedDate(item.requested_date || today());
    setExpectedArrivalDate(item.expected_arrival_date || "");
    setAssignee(item.assignee || "");
    setMessage("");
  }

  function assignToMe() {
    setAssignee(myEmail);
  }

  function reset() {
    setSelectedFormula(null);
    setEditingItem(null);
    setNote("");
    setRequestedDate("");
    setExpectedArrivalDate("");
    setAssignee("");
    setKeyword("");
    setHits([]);
  }

  async function save() {
    if (!selectedFormula) {
      setMessage("처방을 먼저 검색해서 선택하세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await saveSourcingNote({
        id: editingItem?.id,
        formula_code: selectedFormula.formula_code,
        revision: selectedFormula.revision,
        formula_name: selectedFormula.formula_name,
        confirmed_code: selectedFormula.confirmed_code,
        note,
        status: editingItem?.status || "REQUESTED",
        requested_date: requestedDate || null,
        expected_arrival_date: expectedArrivalDate || null,
        assignee: assignee || null,
        sample_sent: editingItem?.sample_sent || false,
        created_by: editingItem?.created_by || auth.profile?.email || undefined,
      });
      setMessage("저장 완료");
      reset();
      await loadBoard();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function moveStatus(id: string, status: SourcingStatus) {
    try {
      await updateSourcingStatus(id, status);
      if (editingItem?.id === id) reset();
      await loadBoard();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "단계 변경 오류");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("이 소싱 일정을 삭제하시겠습니까?")) return;
    try {
      await deleteSourcingNote(id);
      if (editingItem?.id === id) reset();
      await loadBoard();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  return {
    keyword, setKeyword, hits, searching, search, selectFormula,
    selectedFormula, editingItem, note, setNote, saving, save, reset, editItem,
    requestedDate, setRequestedDate, expectedArrivalDate, setExpectedArrivalDate,
    assignee, setAssignee, assignToMe, myEmail,
    onlyMine, setOnlyMine,
    items, board, loading, message, moveStatus, removeItem, alertCount,
    statuses: SOURCING_STATUSES,
  };
}
