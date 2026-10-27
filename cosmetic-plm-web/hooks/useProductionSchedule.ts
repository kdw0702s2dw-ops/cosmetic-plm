"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  searchFormulasByCodeOrConfirmedCode,
  fetchProductionSchedules,
  searchProductionSchedules,
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

// "날짜 1순위 -> 확정코드 2순위 -> 공정 3순위" 정렬 요청 대응 - 같은 확정코드(=같은 처방)의 일정들이
// 한데 모이고, 그 안에서는 알파벳순이 아니라 실제 공정 진행 순서(SCHEDULE_TYPES: 칭량->제조->도포->
// 타공->포장->출고)대로 보여서 지금 어느 단계인지 한눈에 보기 쉽게 한다.
const SCHEDULE_TYPE_ORDER = new Map(SCHEDULE_TYPES.map((t, i) => [t, i]));

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayStr() {
  return toDateStr(new Date());
}

// 생산관리 "생산일정관리" - 달력(월간) + 목록을 함께 보여주며 처방별 제조/타공/포장/출고 일정을 관리한다.
// refreshToken: 생산관리 화면 상단의 "새로고침" 버튼이 바뀔 때마다 증가하는 값. 값이 바뀌면(0은 초기값이라
// 무시) 현재 보고 있는 달의 일정을 다시 불러온다 - 선택된 날짜/처방/입력 중인 폼 값은 그대로 유지된다.
export function useProductionSchedule(refreshToken?: number) {
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

  // 일정 검색(이미 등록된 일정을 확정코드/처방코드/처방명/담당자로 찾아서 그 날짜로 바로 이동) - 위
  // keyword/hits(등록 폼의 "넣을 처방 고르기" 용)와는 목적이 달라 상태를 분리한다.
  const [findKeyword, setFindKeyword] = useState("");
  const [findResults, setFindResults] = useState<ProductionSchedule[]>([]);
  const [findLoading, setFindLoading] = useState(false);
  const [findMessage, setFindMessage] = useState("");

  // 등록/수정 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  // 신규 등록 시에는 여러 공정을 동시에 선택해 한 번에 각각의 일정으로 저장할 수 있다(토글 다중선택).
  // 다만 "수정" 모드는 이미 존재하는 일정 1건을 고치는 것이므로 공정도 항상 1개만 유지된다.
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(["제조"]);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken) loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

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

  // 검색 결과를 클릭했을 때 그 일정이 있는 달로 달력을 옮기고 그 날짜를 선택한다 - goToday()와 동일한
  // 패턴. monthFrom/monthTo가 바뀌면 loadMonth 이펙트가 알아서 그 달의 일정을 다시 불러온다.
  function goToDate(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDate(dateStr);
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

  // 선택한 날짜가 있으면 그 날짜만, 없으면 이번 달 전체를, 1순위 날짜 -> 2순위 확정코드 -> 3순위 공정
  // 진행 순서로 정렬한다.
  const listItems = useMemo(() => {
    const base = selectedDate ? items.filter((i) => i.schedule_date === selectedDate) : items;
    return [...base].sort((a, b) => {
      if (a.schedule_date !== b.schedule_date) return a.schedule_date.localeCompare(b.schedule_date);
      const ac = a.confirmed_code || "";
      const bc = b.confirmed_code || "";
      if (ac !== bc) return ac.localeCompare(bc);
      return (SCHEDULE_TYPE_ORDER.get(a.schedule_type) ?? 0) - (SCHEDULE_TYPE_ORDER.get(b.schedule_type) ?? 0);
    });
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

  async function findSchedules() {
    if (!findKeyword.trim()) {
      setFindResults([]);
      setFindMessage("");
      return;
    }
    setFindLoading(true);
    setFindMessage("");
    try {
      const results = await searchProductionSchedules(findKeyword);
      setFindResults(results);
      if (results.length === 0) setFindMessage("일치하는 일정이 없습니다.");
    } catch (e) {
      setFindMessage(e instanceof Error ? e.message : "일정 검색 오류");
    } finally {
      setFindLoading(false);
    }
  }

  // 검색 결과 한 줄을 눌렀을 때 - 그 날짜로 달력을 옮기고 결과 목록은 접는다.
  function goToFindResult(item: ProductionSchedule) {
    goToDate(item.schedule_date);
    setFindResults([]);
    setFindKeyword("");
    setFindMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setSelectedFormula(null);
    setKeyword("");
    setHits([]);
    setScheduleTypes(["제조"]);
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
    setScheduleTypes([item.schedule_type]);
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

  // 공정 버튼 클릭 - 수정 모드에서는 기존처럼 1개만 선택되고(해당 일정 1건의 유형을 바꾸는 것이므로),
  // 신규 등록 모드에서는 눌렀다 뗄 수 있는 다중선택(토글)으로 동작해 여러 공정을 동시에 선택할 수 있다.
  function toggleScheduleType(t: ScheduleType) {
    if (editingId) {
      setScheduleTypes([t]);
      return;
    }
    setScheduleTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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
    if (scheduleTypes.length === 0) {
      setMessage("공정을 최소 1개 선택하세요.");
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
      if (editingId) {
        // 수정 모드 - 기존 일정 1건만 업데이트 (공정도 항상 1개 - toggleScheduleType이 보장).
        await saveProductionSchedule({
          id: editingId,
          formula_code: selectedFormula.formula_code,
          revision: selectedFormula.revision,
          formula_name: selectedFormula.formula_name,
          confirmed_code: selectedFormula.confirmed_code,
          schedule_type: scheduleTypes[0],
          schedule_date: scheduleDate,
          quantity: qty,
          assignee: assignee || null,
          status,
          memo: memo || null,
          created_by: auth.profile?.email || undefined,
        });
        setMessage("저장 완료");
      } else {
        // 신규 등록 - 선택한 공정 수만큼 각각 별도 일정으로 동시에 생성 (날짜/수량/담당자/상태/메모는 동일하게 복사).
        await Promise.all(
          scheduleTypes.map((t) =>
            saveProductionSchedule({
              formula_code: selectedFormula.formula_code,
              revision: selectedFormula.revision,
              formula_name: selectedFormula.formula_name,
              confirmed_code: selectedFormula.confirmed_code,
              schedule_type: t,
              schedule_date: scheduleDate,
              quantity: qty,
              assignee: assignee || null,
              status,
              memo: memo || null,
              created_by: auth.profile?.email || undefined,
            })
          )
        );
        setMessage(scheduleTypes.length > 1 ? `${scheduleTypes.length}건 저장 완료` : "저장 완료");
      }
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
    year, month, prevMonth, nextMonth, goToday, goToDate,
    selectedDate, selectDate,
    items, itemsByDate, listItems, loading, message,
    keyword, setKeyword, hits, searching, search, selectedFormula, selectFormula,
    findKeyword, setFindKeyword, findResults, findLoading, findMessage, findSchedules, goToFindResult,
    editingId, editItem, resetForm,
    scheduleTypes, toggleScheduleType, scheduleDate, setScheduleDate,
    quantity, setQuantity, assignee, setAssignee, assignToMe, myName,
    status, setStatus, memo, setMemo, saving, save,
    changeStatus, removeItem, isScheduleOverdue,
    types: SCHEDULE_TYPES, statuses: SCHEDULE_STATUSES,
  };
}
