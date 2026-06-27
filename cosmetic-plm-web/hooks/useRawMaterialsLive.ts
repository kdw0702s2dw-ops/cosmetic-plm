"use client";

import { useCallback, useEffect, useState } from "react";
import { countRawMaterialsLive, deleteRawMaterialLive, fetchRawMaterialsLive, upsertRawMaterialLive } from "@/services/database-live/rawMaterialLiveService";
import type { RawMaterialLiveRow } from "@/types/databaseLive";

const emptyForm: RawMaterialLiveRow = {
  raw_code: "",
  raw_name: "",
  supplier: "",
  unit_price: null,
  inci_kr: "",
  inci_en: "",
  inci_cn: "",
  inci_jp: "",
  cas_no: "",
  ec_no: "",
  composition_total: 100,
  document_status: "MISSING",
};

export function useRawMaterialsLive() {
  const [rows, setRows] = useState<RawMaterialLiveRow[]>([]);
  const [form, setForm] = useState<RawMaterialLiveRow>(emptyForm);
  const [search, setSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState("Supabase 원료마스터 연결 준비");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (keyword = search) => {
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        fetchRawMaterialsLive(keyword, 300),
        countRawMaterialsLive(),
      ]);
      setRows(items);
      setTotalCount(count);
      setStatus(`Supabase 원료마스터 LIVE: 총 ${count.toLocaleString()}개 / 화면 표시 ${items.length.toLocaleString()}개`);
    } catch (error) {
      setStatus(error instanceof Error ? `DB 조회 오류: ${error.message}` : "DB 조회 오류");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load("");
  }, [load]);

  async function save() {
    if (!form.raw_code || !form.raw_name) {
      setStatus("raw_code와 raw_name은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      await upsertRawMaterialLive(form);
      setStatus(`${form.raw_code} 저장 완료`);
      setForm(emptyForm);
      await load(search);
    } catch (error) {
      setStatus(error instanceof Error ? `저장 오류: ${error.message}` : "저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function remove(rawCode: string) {
    if (!confirm(`${rawCode} 원료를 삭제할까요?`)) return;
    setLoading(true);
    try {
      await deleteRawMaterialLive(rawCode);
      setStatus(`${rawCode} 삭제 완료`);
      await load(search);
    } catch (error) {
      setStatus(error instanceof Error ? `삭제 오류: ${error.message}` : "삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  return { rows, form, setForm, search, setSearch, totalCount, status, loading, load, save, remove };
}
