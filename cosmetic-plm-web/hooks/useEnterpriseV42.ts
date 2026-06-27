"use client";

import { useEffect, useState } from "react";
import {
  createActivitySnapshot,
  createSystemNotifications,
  fetchActivityTimeline,
  fetchLaunchReadiness,
  fetchNotifications,
  fetchRoleWorkspace,
  globalSearch,
  updateNotificationStatus,
} from "@/services/enterprise-v42/productionExperienceService";
import type { EnterpriseRole } from "@/types/enterpriseV42";

export function useRoleWorkspace() {
  const [role, setRole] = useState<EnterpriseRole>("R&D");
  const [cards, setCards] = useState<any[]>([]);
  const [message, setMessage] = useState("Role Workspace 준비 완료");
  async function load(nextRole = role) {
    const data = await fetchRoleWorkspace(nextRole);
    setCards(data);
    setMessage(`${nextRole} Workspace 조회 완료`);
  }
  function changeRole(nextRole: EnterpriseRole) {
    setRole(nextRole);
    load(nextRole);
  }
  useEffect(() => { load("R&D"); }, []);
  return { role, cards, message, load, changeRole };
}

export function useLaunchReadiness() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("Launch Readiness 준비 완료");
  async function load() {
    const data = await fetchLaunchReadiness();
    setRows(data);
    setMessage(`출시 준비도 ${data.length}건 조회 완료`);
  }
  useEffect(() => { load(); }, []);
  return { rows, selected, setSelected, message, load };
}

export function useGlobalSearch() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState("Global Search 준비 완료");
  async function search() {
    const data = await globalSearch(keyword);
    setResults(data);
    setMessage(`검색 결과 ${data.length}건`);
  }
  return { keyword, setKeyword, results, message, search };
}

export function useNotifications() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("Notification Center 준비 완료");
  async function load() {
    const data = await fetchNotifications();
    setRows(data);
    setMessage(`알림 ${data.length}건 조회 완료`);
  }
  async function generate() {
    await createSystemNotifications();
    await load();
  }
  async function mark(id: string, status: string) {
    await updateNotificationStatus(id, status);
    await load();
  }
  useEffect(() => { load(); }, []);
  return { rows, message, load, generate, mark };
}

export function useActivityTimeline() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("Activity Timeline 준비 완료");
  async function load() {
    const data = await fetchActivityTimeline();
    setRows(data);
    setMessage(`활동 이력 ${data.length}건 조회 완료`);
  }
  async function snapshot() {
    await createActivitySnapshot();
    await load();
  }
  useEffect(() => { load(); }, []);
  return { rows, message, load, snapshot };
}
