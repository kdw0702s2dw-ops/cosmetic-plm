"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  searchFormulasByCodeOrConfirmedCode,
  fetchProductionSchedules,
  saveProductionSchedule,
  updateProductionScheduleStatus,
  deleteProductionSchedule,
  isScheduleOverdue,
  SCHEDULE_TYPES,
  SCHEDULE_STATUSES,
  type ProductionSchedule,
  type ScheduleType,
  type ScheduleStatus,
} from "@/services/sprint2/productionScheduleService";

type FormulaRef = { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string };

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayStr() {
  return toDateStr(new Date());
}

// 생산관리 "생산일정관리" - 달력(월간) + 목록을 함께 보여주며 처방별 제조/타공/포장/출고 일정을 관리한다.
export function useProductionSchedule() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";

  // 달력에 표시 중인 연/월 (1~12월)
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1~12
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [items, setItems] = useState<ProductionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 처방 검색(등록/수정 폼용)
  const [keyword, setKeyword] = useState("");
  const [hits, setHits] = useState<FormulaRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaRef | null>(null);

  // 등록/수정 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("제조");
  const [scheduleDate, setScheduleDate] = useState(todayStr());
  const [quantity, setQuantity] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState<ScheduleStatus>("예정");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  // 달력 그리드 계산에 필요한 월의 첫날/마지막날 (달력에는 앞뒤 달 여백 주 포함, 데이터 조회는 해당 월만)
  const monthFrom = useMemo(() => `${year}-${String(month).padStart(2, "0")}-01`, [year, month]);
  const monthTo = useMemo(() => {
    const lastDay = new Date(year, month, 0).getDate(); // month(1~12) 다음달 0일 = 이번달 말일
    return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [year, month]);

  async function loadMonth() {
    setLoading(true);
    try {
      setItems(await fetchProductionSchedules(monthFrom, monthTo));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "일정 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFrom, monthTo]);

  function prevMonth() {
    setSelectedDate(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    setSelectedDate(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelectedDate(todayStr());
  }

  // 날짜(YYYY-MM-DD)별로 그 날의 일정을 묶어준다 - 달력 셀에 유형별 점을 찍는 데 사용.
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ProductionSchedule[]>();
    for (const item of items) {
      const list = map.get(item.schedule_date) || [];
      list.push(item);
      map.set(item.schedule_date, list);
    }
    return map;
  }, [items]);

  // 선택한 날짜가 있으면 그 날짜만, 없으면 이번 달 전체를 날짜순으로.
  const listItems = useMemo(() => {
    const base = selectedDate ? items.filter((i) => i.schedule_date === selectedDate) : items;
    return [...base].sort((a, b) => (a.schedule_date === b.schedule_date ? a.schedule_type.localeCompare(b.schedule_type) : a.schedule_date.localeCompare(b.schedule_date)));
  }, [items, selectedDate]);

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

  function selectFormula(f: FormulaRef) {
    setSelectedFormula(f);
    setHits([]);
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setSelectedFormula(null);
    setKeyword("");
    setHits([]);
    setScheduleType("제조");
    setScheduleDate(selectedDate || todayStr());
    setQuantity("");
    setAssignee("");
    setStatus("예정");
    setMemo("");
  }

  // 목록/달력에서 일정을 눌러 바로 수정 모드로 진입
  function editItem(item: ProductionSchedule) {
    setEditingId(item.id || null);
    setSelectedFormula({
      formula_code: item.formula_code,
      revision: item.revision,
      formula_name: item.formula_name || undefined,
      confirmed_code: item.confirmed_code || undefined,
    });
    setKeyword("");
    setHits([]);
    setScheduleType(item.schedule_type);
    setScheduleDate(item.schedule_date);
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setAssignee(item.assignee || "");
    setStatus(item.status);
    setMemo(item.memo || "");
    setMessage("");
  }

  function assignToMe() {
    setAssignee(myName);
  }

  async function save() {
    if (!selectedFormula) {
      setMessage("처방을 먼저 검색해서 선택하세요.");
      return;
    }
    if (!scheduleDate) {
      setMessage("날짜를 입력하세요.");
      return;
    }
    const qty = quantity.trim() === "" ? null : Number(quantity);
    if (quantity.trim() !== "" && Number.isNaN(qty)) {
      setMessage("수량은 숫자로 입력하세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await saveProductionSchedule({
        id: editingId || undefined,
        formula_code: selectedFormula.formula_code,
        revision: selectedFormula.revision,
        formula_name: selectedFormula.formula_name,
        confirmed_code: selectedFormula.confirmed_code,
        schedule_type: scheduleType,
        schedule_date: scheduleDate,
        quantity: qty,
        assignee: assignee || null,
        status,
        memo: memo || null,
        created_by: auth.profile?.email || undefined,
      });
      setMessage("저장 완료");
      resetForm();
      await loadMonth();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, next: ScheduleStatus) {
    try {
      await updateProductionScheduleStatus(id, next);
      await loadMonth();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "상태 변경 오류");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("이 생산일정을 삭제하시겠습니까?")) return;
    try {
      await deleteProductionSchedule(id);
      if (editingId === id) resetForm();
      await loadMonth();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function selectDate(date: string) {
    setSelectedDate((cur) => (cur === date ? null : date));
  }

  return {
    year, month, prevMonth, nextMonth, goToday,
    selectedDate, selectDate,
    items, itemsByDate, listItems, loading, message,
    keyword, setKeyword, hits, searching, search, selectedFormula, selectFormula,
    editingId, editItem, resetForm,
    scheduleType, setScheduleType, scheduleDate, setScheduleDate,
    quantity, setQuantity, assignee, setAssignee, assignToMe, myName,
    status, setStatus, memo, setMemo, saving, save,
    changeStatus, removeItem, isScheduleOverdue,
    types: SCHEDULE_TYPES, statuses: SCHEDULE_STATUSES,
  };
}
