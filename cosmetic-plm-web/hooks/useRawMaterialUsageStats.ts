"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchLedgerHistory, fetchStockManagedRawMaterials, type StockLedgerRow,
} from "@/services/sprint2/rawMaterialStockService";

export type Granularity = "daily" | "monthly" | "yearly";

export type UsageStatRow = {
  period: string; // daily: "YYYY-MM-DD", monthly: "YYYY-MM", yearly: "YYYY"
  usage: number; // 해당 기간 금일사용량 합계
  closingStock: number; // 해당 기간 마지막 날짜의 최종재고량("기간 말 재고")
};

function periodKey(ledgerDate: string, granularity: Granularity): string {
  if (granularity === "yearly") return ledgerDate.slice(0, 4);
  if (granularity === "monthly") return ledgerDate.slice(0, 7);
  return ledgerDate;
}

// history는 항상 날짜 오름차순으로 들어온다(fetchLedgerHistory에서 ledger_date asc 정렬) - 그래서 같은
// 기간(월/년) 안에서 더 나중에 만나는 날짜가 자연스럽게 "기간 말 재고"가 된다.
function aggregate(history: StockLedgerRow[], granularity: Granularity): UsageStatRow[] {
  if (granularity === "daily") {
    return history.map((h) => ({
      period: h.ledger_date,
      usage: Number(h.usage_today),
      closingStock: Number(h.closing_stock),
    }));
  }
  const map = new Map<string, { usage: number; closingStock: number }>();
  for (const h of history) {
    const key = periodKey(h.ledger_date, granularity);
    const prev = map.get(key);
    const usage = Number(h.usage_today);
    const closingStock = Number(h.closing_stock);
    map.set(key, { usage: (prev?.usage || 0) + usage, closingStock });
  }
  return Array.from(map, ([period, v]) => ({ period, usage: v.usage, closingStock: v.closingStock }));
}

// refreshToken: 생산관리 화면 상단 "새로고침" 버튼과 연동(다른 하위 도구들과 동일한 패턴) - 값이
// 바뀌면 현재 선택된 원료의 이력을 다시 불러온다. 원료를 아직 선택하지 않았으면 아무 일도 하지 않는다.
export function useRawMaterialUsageStats(refreshToken?: number) {
  const [materials, setMaterials] = useState<{ raw_code: string; raw_name: string }[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<{ raw_code: string; raw_name: string } | null>(null);
  const [history, setHistory] = useState<StockLedgerRow[]>([]);
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStockManagedRawMaterials()
      .then((list) => setMaterials(list))
      .catch((e) => setMessage(e instanceof Error ? e.message : "대상 원료 조회 오류"));
  }, []);

  // 칭량_원료재고 화면과 동일한 "타이핑으로 클라이언트 필터" 방식 - 원료 목록이 많지 않아 별도
  // 자동완성 컴포넌트 없이 이미 불러온 materials 배열을 코드/이름으로 걸러내기만 하면 된다.
  const filteredMaterials = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter(
      (m) => m.raw_code.toLowerCase().includes(term) || m.raw_name.toLowerCase().includes(term)
    );
  }, [materials, keyword]);

  async function loadHistory(rawCode: string) {
    setLoading(true);
    setMessage("");
    try {
      setHistory(await fetchLedgerHistory(rawCode));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function selectMaterial(m: { raw_code: string; raw_name: string }) {
    setSelected(m);
    loadHistory(m.raw_code);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken && selected) loadHistory(selected.raw_code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const dailyRows = useMemo(() => aggregate(history, "daily"), [history]);
  const monthlyRows = useMemo(() => aggregate(history, "monthly"), [history]);
  const yearlyRows = useMemo(() => aggregate(history, "yearly"), [history]);
  const activeRows =
    granularity === "daily" ? dailyRows : granularity === "monthly" ? monthlyRows : yearlyRows;
  const totalUsage = useMemo(() => activeRows.reduce((a, r) => a + r.usage, 0), [activeRows]);

  return {
    keyword, setKeyword, filteredMaterials, selected, selectMaterial,
    granularity, setGranularity, activeRows, totalUsage, loading, message,
    historyCount: history.length,
  };
}
