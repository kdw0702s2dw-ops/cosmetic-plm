"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  fetchAllStabilityCheckpoints,
  fetchOpenStabilityAlerts,
  isCheckpointOverdue,
  isCheckpointDueSoon,
  type CheckpointWithContext,
} from "@/services/sprint2/stabilityTestService";

// 품질관리 홈 - 전체 시료를 가로질러 이번 달 체크포인트를 달력으로 보여주고, 지연/임박 건을
// 담당자 기준으로 집계해 알림 배너에 노출한다(생산일정관리의 달력 + 원료 소싱 일정관리의 알림을 합친 형태).
export function useStabilityHome() {
  const auth = useSprint1Auth();
  const myName = auth.profile?.display_name || auth.profile?.email || "";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [myOnly, setMyOnly] = useState(false);

  const [monthCheckpoints, setMonthCheckpoints] = useState<CheckpointWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAlerts, setOpenAlerts] = useState<CheckpointWithContext[]>([]);
  const [message, setMessage] = useState("");

  const monthFrom = useMemo(() => `${year}-${String(month).padStart(2, "0")}-01`, [year, month]);
  const monthTo = useMemo(() => {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [year, month]);

  async function loadMonth() {
    setLoading(true);
    try {
      setMonthCheckpoints(await fetchAllStabilityCheckpoints(monthFrom, monthTo));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "일정 조회 오류");
    } finally {
      setLoading(false);
    }
  }
  async function loadAlerts() {
    try {
      setOpenAlerts(await fetchOpenStabilityAlerts());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "알림 조회 오류");
    }
  }
  async function reload() {
    await Promise.all([loadMonth(), loadAlerts()]);
  }

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFrom, monthTo]);
  useEffect(() => {
    loadAlerts();
  }, []);

  function prevMonth() {
    setSelectedDate(null);
    if (month === 1) { setYear((y) => y - 1); setMonth(12); } else { setMonth((m) => m - 1); }
  }
  function nextMonth() {
    setSelectedDate(null);
    if (month === 12) { setYear((y) => y + 1); setMonth(1); } else { setMonth((m) => m + 1); }
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelectedDate(t.toISOString().slice(0, 10));
  }
  function selectDate(date: string) {
    setSelectedDate((cur) => (cur === date ? null : date));
  }

  const visibleMonthCheckpoints = useMemo(
    () => (myOnly ? monthCheckpoints.filter((cp) => cp.condition?.test?.assignee === myName) : monthCheckpoints),
    [monthCheckpoints, myOnly, myName]
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CheckpointWithContext[]>();
    for (const cp of visibleMonthCheckpoints) {
      const list = map.get(cp.due_date) || [];
      list.push(cp);
      map.set(cp.due_date, list);
    }
    return map;
  }, [visibleMonthCheckpoints]);

  const listItems = useMemo(() => {
    const base = selectedDate ? visibleMonthCheckpoints.filter((cp) => cp.due_date === selectedDate) : visibleMonthCheckpoints;
    return [...base].sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [visibleMonthCheckpoints, selectedDate]);

  // 진행중인 시료만 대상으로 지연/임박을 집계한다(중단/완료된 시료의 남은 체크포인트는 알림에서 제외).
  const activeAlerts = useMemo(() => openAlerts.filter((cp) => cp.condition?.test?.status === "진행중"), [openAlerts]);
  const overdueAlerts = useMemo(() => activeAlerts.filter((cp) => isCheckpointOverdue(cp)), [activeAlerts]);
  const dueSoonAlerts = useMemo(() => activeAlerts.filter((cp) => !isCheckpointOverdue(cp) && isCheckpointDueSoon(cp)), [activeAlerts]);
  const myOverdueAlerts = useMemo(() => overdueAlerts.filter((cp) => cp.condition?.test?.assignee === myName), [overdueAlerts, myName]);
  const myDueSoonAlerts = useMemo(() => dueSoonAlerts.filter((cp) => cp.condition?.test?.assignee === myName), [dueSoonAlerts, myName]);

  // 미완료 일정이 남아있는 시료 수(중복 제거) - "진행 중인 시료" 감을 잡는 용도의 대략적인 통계.
  const activeSampleCount = useMemo(() => {
    const ids = new Set(activeAlerts.map((cp) => cp.condition?.test?.id).filter(Boolean));
    return ids.size;
  }, [activeAlerts]);

  return {
    year, month, prevMonth, nextMonth, goToday, selectedDate, selectDate,
    myOnly, setMyOnly, myName,
    itemsByDate, listItems, loading, message, reload,
    overdueCount: overdueAlerts.length, dueSoonCount: dueSoonAlerts.length,
    myOverdueCount: myOverdueAlerts.length, myDueSoonCount: myDueSoonAlerts.length,
    activeSampleCount,
    isCheckpointOverdue, isCheckpointDueSoon,
  };
}
