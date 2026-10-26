"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchUsageLog, type UsageLogRow } from "@/services/sprint2/rawMaterialUsageLogService";
import { fetchIncomingStockLog, type IncomingStockLogRow } from "@/services/sprint2/rawMaterialIncomingStockLogService";
import { fetchStockManagedRawMaterials } from "@/services/sprint2/rawMaterialStockService";
import { fetchUserDisplayNames } from "@/services/sprint1/authRbacService";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
// "이번주"는 월요일 시작 기준으로 계산한다(국내 관례). getDay()는 0=일 ... 6=토라서, 월요일까지
// 며칠 전인지를 (day + 6) % 7로 구한다(일요일만 6일 전, 나머지는 day-1일 전).
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday;
}

export type DatePreset = "today" | "week" | "month" | "custom";

// "처방 반영 요약" - 화면에서 한눈에 "어떤 처방을 언제 얼마나 제조했는지"만 보고 싶다는 요청 대응.
// apply_formula 이력은 반영 시점 하나당 재고 관리 대상 원료 수만큼(보통 수십 건) 행이 쌓이기 때문에,
// 상세 표는 정확하지만 한눈에 보기엔 번잡하다. 같은 반영 건(날짜+처방+반영 시각이 전부 같음)을 한
// 줄로 묶어서 보여준다.
export type ApplyFormulaSummaryRow = {
  key: string;
  ledger_date: string;
  confirmed_code: string | null;
  formula_code: string | null;
  formula_revision: string | null;
  formula_name: string | null;
  target_qty_kg: number | null;
  raw_material_count: number;
  created_by: string | null;
  created_at: string | undefined;
};

// "일자별, 금주별 적용한 처방에 대해서 금일 사용량 이력을 확인" 요청사항 대응 - 날짜 범위(오늘/이번주/
// 이번달/직접 지정)로 처방 반영·수정 이력을 조회한다. refreshToken은 생산관리 화면 상단 "새로고침"
// 버튼과 연동(다른 하위 도구들과 동일한 패턴).
export function useRawMaterialUsageLog(refreshToken?: number) {
  const today = todayStr();
  const [preset, setPreset] = useState<DatePreset>("week");
  const [dateFrom, setDateFromState] = useState(() => toDateStr(startOfWeek(new Date())));
  const [dateTo, setDateToState] = useState(today);
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<UsageLogRow[]>([]);
  const [incomingStockRows, setIncomingStockRows] = useState<IncomingStockLogRow[]>([]);
  const [materials, setMaterials] = useState<{ raw_code: string; raw_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStockManagedRawMaterials()
      .then((list) => setMaterials(list))
      .catch(() => {});
  }, []);

  // 로그 테이블엔 raw_name이 없어(값이 바뀔 수 있는 정보라 중복 저장하지 않음) 화면 표시용으로 조회
  // 시점의 원료명을 여기서 매핑한다(칭량_원료재고/사용량 통계와 동일한 방식).
  const rawNameByCode = useMemo(() => new Map(materials.map((m) => [m.raw_code, m.raw_name])), [materials]);

  // "처리자"를 이메일이 아니라 이름으로 보여주기 위한 이메일->이름 맵 - 생산실적 관리(useProductionRecord)
  // 와 동일한 패턴(fetchUserDisplayNames, plm_user_profiles의 self_or_admin RLS를 우회하는 RPC).
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchUserDisplayNames().then(setDisplayNames).catch(() => {});
  }, []);
  function resolveCreatedBy(email?: string | null): string {
    if (!email) return "-";
    return displayNames[email] || email;
  }

  // 같은 반영 건 = ledger_date + 처방코드 + Rev + 반영(저장) 시각이 전부 같은 apply_formula 행들.
  // logFormulaApplyEvents()가 save() 한 번에 여러 원료 행을 한 insert로 묶어 넣기 때문에, 같은 건이면
  // created_at(DB default now())이 밀리초까지 정확히 같다.
  const applyFormulaSummary = useMemo<ApplyFormulaSummaryRow[]>(() => {
    const groups = new Map<string, ApplyFormulaSummaryRow>();
    for (const r of rows) {
      if (r.event_type !== "apply_formula") continue;
      const key = `${r.ledger_date}|${r.formula_code || ""}|${r.formula_revision || ""}|${r.created_at || ""}`;
      const existing = groups.get(key);
      if (existing) {
        existing.raw_material_count += 1;
      } else {
        groups.set(key, {
          key,
          ledger_date: r.ledger_date,
          confirmed_code: r.confirmed_code ?? null,
          formula_code: r.formula_code ?? null,
          formula_revision: r.formula_revision ?? null,
          formula_name: r.formula_name ?? null,
          target_qty_kg: r.target_qty_kg ?? null,
          raw_material_count: 1,
          created_by: r.created_by ?? null,
          created_at: r.created_at,
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) => (a.created_at || "") < (b.created_at || "") ? 1 : -1);
  }, [rows]);

  const load = useCallback(async (from: string, to: string, kw: string) => {
    setLoading(true);
    setMessage("");
    try {
      const [usageRows, incomingRows] = await Promise.all([
        fetchUsageLog({ dateFrom: from, dateTo: to, keyword: kw }),
        fetchIncomingStockLog({ dateFrom: from, dateTo: to, keyword: kw }),
      ]);
      setRows(usageRows);
      setIncomingStockRows(incomingRows);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(dateFrom, dateTo, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken) load(dateFrom, dateTo, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function applyPreset(p: DatePreset) {
    setPreset(p);
    if (p === "today") {
      setDateFromState(today);
      setDateToState(today);
      load(today, today, keyword);
    } else if (p === "week") {
      const f = toDateStr(startOfWeek(new Date()));
      setDateFromState(f);
      setDateToState(today);
      load(f, today, keyword);
    } else if (p === "month") {
      const d = new Date();
      const f = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
      setDateFromState(f);
      setDateToState(today);
      load(f, today, keyword);
    }
    // "custom"은 버튼이 따로 없다 - 아래 날짜 입력칸을 직접 고치면 setCustomDateFrom/To가 자동 전환한다.
  }

  // 날짜 입력칸을 직접 고치면 프리셋 버튼 선택 표시를 "직접 지정"으로 바꿔서, 지금 보고 있는 범위가
  // 프리셋과 더는 일치하지 않는다는 걸 화면에서도 알 수 있게 한다.
  function setCustomDateFrom(v: string) {
    setPreset("custom");
    setDateFromState(v);
  }
  function setCustomDateTo(v: string) {
    setPreset("custom");
    setDateToState(v);
  }

  function search() {
    load(dateFrom, dateTo, keyword);
  }

  return {
    preset, applyPreset,
    dateFrom, setDateFrom: setCustomDateFrom, dateTo, setDateTo: setCustomDateTo,
    keyword, setKeyword, search,
    rows, rawNameByCode, loading, message,
    applyFormulaSummary, resolveCreatedBy,
    incomingStockRows,
  };
}
