"use client";

import { useEffect, useState } from "react";
import {
  fetchLatestLedgerBefore, fetchLedgerForDate, fetchStockManagedRawMaterials, saveLedgerRows,
  type StockLedgerRow,
} from "@/services/sprint2/rawMaterialStockService";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 금일사용량은 하루에 여러 번(최대 10회) 나눠 쓸 수 있어서 화면에서는 입력칸 여러 개(usage_entries)로
// 받고, 그 합계만 DB의 usage_today(숫자 1개)로 저장한다 - 몇 시에 얼마씩 나눠 썼는지 개별 이력은
// 남기지 않는 것으로 확인된 설계(사용자 확인됨).
const MAX_USAGE_ENTRIES = 10;

export type StockRow = {
  raw_code: string;
  raw_name: string;
  opening_stock: number;
  incoming_stock: number; // 입고재고량 - 날짜별 직접 입력
  usage_entries: number[]; // 금일사용량을 나눠 입력한 값들 - 합계가 usage_today로 저장됨
  closing_stock: number; // = opening_stock + incoming_stock - sum(usage_entries)
  openingEditable: boolean; // 이력이 전혀 없는 원료의 최초 등록(baseline)일 때만 true
};

function sumUsage(entries: number[]) {
  return entries.reduce((a, b) => a + b, 0);
}

function recompute(r: StockRow): StockRow {
  return { ...r, closing_stock: r.opening_stock + r.incoming_stock - sumUsage(r.usage_entries) };
}

// refreshToken: 생산관리 화면 상단의 "새로고침" 버튼이 바뀔 때마다 증가하는 값. 값이 바뀌면(0은
// 초기값이라 무시) 현재 보고 있는 날짜의 원장을 다시 불러온다 - 선택된 날짜/입력 중인 값은 그대로 유지된다.
export function useRawMaterialStockCheck(refreshToken?: number) {
  const [ledgerDate, setLedgerDate] = useState(todayStr());
  const [materials, setMaterials] = useState<{ raw_code: string; raw_name: string }[]>([]);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStockManagedRawMaterials()
      .then((list) => setMaterials(list))
      .catch((e) => setMessage(e instanceof Error ? e.message : "대상 원료 조회 오류"));
  }, []);

  async function loadForDate(date: string) {
    if (materials.length === 0) return;
    setLoading(true);
    setMessage("");
    try {
      const rawCodes = materials.map((m) => m.raw_code);
      const [existingMap, priorMap] = await Promise.all([
        fetchLedgerForDate(rawCodes, date),
        fetchLatestLedgerBefore(rawCodes, date),
      ]);
      const built: StockRow[] = materials.map((m) => {
        const existing = existingMap.get(m.raw_code);
        if (existing) {
          return {
            raw_code: m.raw_code, raw_name: m.raw_name,
            opening_stock: Number(existing.opening_stock),
            incoming_stock: Number(existing.incoming_stock || 0),
            // 저장된 값은 합계 1개뿐이라, 다시 열람할 때는 입력칸 1개에 그 합계를 그대로 보여준다.
            usage_entries: [Number(existing.usage_today)],
            closing_stock: Number(existing.closing_stock), openingEditable: false,
          };
        }
        const prior = priorMap.get(m.raw_code);
        const opening = prior ? Number(prior.closing_stock) : 0;
        return {
          raw_code: m.raw_code, raw_name: m.raw_name,
          opening_stock: opening, incoming_stock: 0, usage_entries: [0], closing_stock: opening,
          openingEditable: !prior, // 과거 이력이 전혀 없으면 최초 등록 baseline 입력 필요
        };
      });
      setRows(built);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "원장 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (materials.length > 0) loadForDate(ledgerDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, ledgerDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken) loadForDate(ledgerDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function updateIncoming(rawCode: string, value: string) {
    const incoming = value === "" ? 0 : Number(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? recompute({ ...r, incoming_stock: incoming }) : r)));
  }

  function updateOpeningBaseline(rawCode: string, value: string) {
    const opening = value === "" ? 0 : Number(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? recompute({ ...r, opening_stock: opening }) : r)));
  }

  function updateUsageEntry(rawCode: string, index: number, value: string) {
    const usage = value === "" ? 0 : Number(value);
    setRows((prev) =>
      prev.map((r) => {
        if (r.raw_code !== rawCode) return r;
        const entries = r.usage_entries.map((v, i) => (i === index ? usage : v));
        return recompute({ ...r, usage_entries: entries });
      })
    );
  }

  function addUsageEntry(rawCode: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.raw_code !== rawCode || r.usage_entries.length >= MAX_USAGE_ENTRIES) return r;
        return recompute({ ...r, usage_entries: [...r.usage_entries, 0] });
      })
    );
  }

  function removeUsageEntry(rawCode: string, index: number) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.raw_code !== rawCode) return r;
        const entries = r.usage_entries.filter((_, i) => i !== index);
        // 최소 1칸은 항상 남겨둔다(0으로 리셋) - 화면에서 입력칸이 완전히 사라지지 않도록.
        return recompute({ ...r, usage_entries: entries.length > 0 ? entries : [0] });
      })
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const payload: StockLedgerRow[] = rows.map((r) => ({
        raw_code: r.raw_code, ledger_date: ledgerDate,
        opening_stock: r.opening_stock, incoming_stock: r.incoming_stock,
        usage_today: sumUsage(r.usage_entries), closing_stock: r.closing_stock,
      }));
      await saveLedgerRows(payload);
      await loadForDate(ledgerDate);
      setMessage("저장 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  return {
    ledgerDate, setLedgerDate, rows, loading, saving, message,
    updateIncoming, updateOpeningBaseline, updateUsageEntry, addUsageEntry, removeUsageEntry,
    MAX_USAGE_ENTRIES, save,
  };
}
