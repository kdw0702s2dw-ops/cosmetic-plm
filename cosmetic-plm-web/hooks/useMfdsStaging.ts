"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveStagingRule, fetchStagingRows, rejectStagingRule, syncMfdsStaging, updateStagingDraft,
  type MfdsStagingRow,
} from "@/services/sprint2/mfdsRegulationService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";

export function useMfdsStaging() {
  const auth = useSprint1Auth();
  const [rows, setRows] = useState<MfdsStagingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchStagingRows(statusFilter));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MFDS 검토 목록 조회 오류");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function sync() {
    setSyncing(true);
    setMessage("MFDS 데이터 동기화 중... (전량 페이지네이션 호출이라 시간이 걸릴 수 있습니다)");
    try {
      const result = await syncMfdsStaging();
      setMessage(`동기화 완료 · API2 매칭 ${result.api2Matched}건 · API3 매칭 ${result.api3Matched}건 · 신규 적재 ${result.inserted}건 (중복 제외 ${result.skippedDuplicates}건)`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MFDS 동기화 오류");
    } finally {
      setSyncing(false);
    }
  }

  function updateDraft(id: string, patch: { max_percent?: number | null; allowed_status_suggested?: string }) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveDraft(row: MfdsStagingRow) {
    try {
      await updateStagingDraft(row.id, { max_percent: row.max_percent, allowed_status_suggested: row.allowed_status_suggested || undefined });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "임시 저장 오류");
    }
  }

  async function approve(row: MfdsStagingRow) {
    try {
      await approveStagingRule(row, auth.profile?.email || "unknown", {
        max_percent: row.max_percent,
        allowed_status: row.allowed_status_suggested || undefined,
      });
      setMessage(`승인 완료: ${row.ingredient_name_kr || row.ingredient_name_en}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "승인 오류");
    }
  }

  async function reject(row: MfdsStagingRow) {
    try {
      await rejectStagingRule(row.id, auth.profile?.email || "unknown");
      setMessage(`거부 처리: ${row.ingredient_name_kr || row.ingredient_name_en}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "거부 처리 오류");
    }
  }

  return { rows, statusFilter, setStatusFilter, loading, syncing, message, load, sync, updateDraft, saveDraft, approve, reject };
}
