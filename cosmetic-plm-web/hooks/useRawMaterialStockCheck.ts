"use client";

import { useEffect, useState } from "react";
import {
  fetchLatestLedgerBefore, fetchLedgerForDate, fetchStockManagedRawMaterials, saveLedgerRows,
  type StockLedgerRow,
} from "@/services/sprint2/rawMaterialStockService";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export type StockRow = {
  raw_code: string;
  raw_name: string;
  opening_stock: number;
  usage_today: number;
  closing_stock: number;
  openingEditable: boolean; // 이력이 전혀 없는 원료의 최초 등록(baseline)일 때만 true
};

export function useRawMaterialStockCheck() {
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
            opening_stock: Number(existing.opening_stock), usage_today: Number(existing.usage_today),
            closing_stock: Number(existing.closing_stock), openingEditable: false,
          };
        }
        const prior = priorMap.get(m.raw_code);
        const opening = prior ? Number(prior.closing_stock) : 0;
        return {
          raw_code: m.raw_code, raw_name: m.raw_name,
          opening_stock: opening, usage_today: 0, closing_stock: opening,
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

  function updateUsage(rawCode: string, value: string) {
    const usage = value === "" ? 0 : Number(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? { ...r, usage_today: usage, closing_stock: r.opening_stock - usage } : r)));
  }

  function updateOpeningBaseline(rawCode: string, value: string) {
    const opening = value === "" ? 0 : Number(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? { ...r, opening_stock: opening, closing_stock: opening - r.usage_today } : r)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const payload: StockLedgerRow[] = rows.map((r) => ({
        raw_code: r.raw_code, ledger_date: ledgerDate,
        opening_stock: r.opening_stock, usage_today: r.usage_today, closing_stock: r.closing_stock,
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

  return { ledgerDate, setLedgerDate, rows, loading, saving, message, updateUsage, updateOpeningBaseline, save };
}
