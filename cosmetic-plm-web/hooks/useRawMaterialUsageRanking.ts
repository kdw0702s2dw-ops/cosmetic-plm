"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStockManagedRawMaterials, fetchUsageForRange, fetchLatestStockByRawCodes } from "@/services/sprint2/rawMaterialStockService";

export type RankingGranularity = "monthly" | "yearly";

export type RankingRow = {
  rank: number;
  raw_code: string;
  raw_name: string;
  usage: number;
  currentStock: number | null; // 가장 최근(날짜 무관) 저장된 최종재고량 - 칭량_원료재고/제조량 검토와 동일한 "현재재고" 기준
  currentStockDate: string | null;
};

// "실시간 순위가 어려우면 전날까지 기준으로" - 오늘 입력이 아직 안 끝났을 수 있어 어제까지의 저장분만
// 집계 대상으로 삼는다. 컴포넌트가 떠 있는 동안은 고정(자정을 넘겨도 다시 계산하지 않음 - 새로고침하면 갱신됨).
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

function monthRange(yyyyMm: string): { from: string; to: string } {
  const [y, m] = yyyyMm.split("-").map((v) => Number(v));
  const last = daysInMonth(y, m);
  return { from: `${yyyyMm}-01`, to: `${yyyyMm}-${String(last).padStart(2, "0")}` };
}

function yearRange(yyyy: string): { from: string; to: string } {
  return { from: `${yyyy}-01-01`, to: `${yyyy}-12-31` };
}

// 생산관리 상단 "새로고침" 버튼과 연동(다른 하위 도구들과 동일한 패턴).
export function useRawMaterialUsageRanking(refreshToken?: number) {
  const asOf = useMemo(() => yesterdayStr(), []);
  const [granularity, setGranularity] = useState<RankingGranularity>("monthly");
  const [month, setMonth] = useState(asOf.slice(0, 7)); // "YYYY-MM"
  const [year, setYear] = useState(asOf.slice(0, 4)); // "YYYY"
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    // 년도 입력칸은 자유 타이핑을 허용해야 해서(입력 중 "2", "20" 같은 미완성 값도 거쳐감) 4자리를
    // 다 채우기 전에는 조회를 걸지 않는다 - 월 입력은 <input type="month">가 항상 완성된 값만 주므로 문제없음.
    if (granularity === "yearly" && !/^\d{4}$/.test(year)) {
      setRows([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const range = granularity === "monthly" ? monthRange(month) : yearRange(year);
      // 선택한 기간이 어제보다 미래까지 걸쳐 있으면(예: 이번 달/올해) 어제까지만 집계한다.
      const cappedTo = range.to > asOf ? asOf : range.to;
      if (range.from > cappedTo) {
        setRows([]);
        return;
      }
      const [usageMap, materials] = await Promise.all([
        fetchUsageForRange(range.from, cappedTo),
        fetchStockManagedRawMaterials(),
      ]);
      const nameByCode = new Map(materials.map((m) => [m.raw_code, m.raw_name]));
      const ranked: RankingRow[] = Array.from(usageMap, ([raw_code, usage]) => ({
        rank: 0,
        raw_code,
        raw_name: nameByCode.get(raw_code) || raw_code,
        usage,
        currentStock: null,
        currentStockDate: null,
      }))
        .filter((r) => r.usage > 0)
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 30)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      // 화면에 실제로 보여줄 TOP 30만 추려진 뒤에 현재재고량을 조회한다(전체 대상 원료를 다 조회할
      // 필요 없음) - 제조량 검토(useManufacturingQtyReview)와 동일하게 raw_code별 "가장 최근(날짜
      // 무관) 저장된 최종재고량"을 현재재고량으로 쓴다.
      const stockMap = await fetchLatestStockByRawCodes(ranked.map((r) => r.raw_code));
      for (const r of ranked) {
        const stock = stockMap.get(r.raw_code);
        r.currentStock = stock ? stock.closing_stock : null;
        r.currentStockDate = stock ? stock.ledger_date : null;
      }

      setRows(ranked);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "사용량 순위 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  return {
    asOf, granularity, setGranularity, month, setMonth, year, setYear,
    rows, loading, message,
  };
}
