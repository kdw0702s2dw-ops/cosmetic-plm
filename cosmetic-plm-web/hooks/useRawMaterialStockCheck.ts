"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchLatestLedgerBefore, fetchLedgerForDate, fetchStockManagedRawMaterials, saveLedgerRows,
  type StockLedgerRow,
} from "@/services/sprint2/rawMaterialStockService";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines } from "@/services/sprint1/formulaCoreService";
import { sumRequiredByRawCode } from "@/services/sprint2/manufacturingQtyReviewService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import {
  logFormulaApplyEvents, logManualEditEvents,
  type ApplyFormulaLogInput, type ManualEditLogInput,
} from "@/services/sprint2/rawMaterialUsageLogService";

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
  // "저장 시점 freeze 방식" 때문에 생길 수 있는 불일치 경고: 이 날짜의 현재재고량(opening_stock)이
  // 이미 저장돼 있는데, 그 값이 "바로 전날(prior) 원장의 최종재고량"과 다르면 표시된다. 전형적인 발생
  // 원인은 이 날짜를 먼저 저장한 뒤 그보다 이전 날짜를 나중에 수정/정정한 경우 - 이 날짜 쪽은 저장 시점에
  // 고정(freeze)된 값을 그대로 쓰기 때문에 자동으로 다시 계산되지 않는다. 자동 재계산은 하지 않고(사용자
  // 결정: 경고 표시만), 화면에서 사람이 직접 확인 후 필요하면 이 날짜의 현재재고량을 수정하도록 안내한다.
  openingMismatch: { priorDate: string; priorClosing: number } | null;
  // 이미 저장돼 있던 금일사용량(합계) - "수정 이력" 판정 기준값. 이 날짜에 저장된 적이 없는 행(최초
  // 등록 대기 행, carry-forward로 opening만 채워진 아직 저장 전 행)은 비교할 "이전 값"이 없으므로
  // null이다. save()에서 이 값과 지금 화면의 금일사용량 합계가 다르면 "수정"으로 보고 이력에 남긴다.
  originalUsageToday: number | null;
};

function sumUsage(entries: number[]) {
  return entries.reduce((a, b) => a + b, 0);
}

// 입력 중인 문자열을 안전하게 숫자로 변환한다. DecimalInput은 "-", "." 처럼 아직 완성되지 않은 중간
// 입력 상태도 그대로 넘겨줄 수 있는데, Number("-")나 Number(".")는 NaN이라 그대로 state에 들어가면
// 합계 계산(closing_stock 등)이 NaN으로 오염된다 - 그런 미완성 값은 0으로 취급한다(최종 저장 전에
// 사용자가 입력을 완성하면 그때 정상 숫자로 반영됨).
function parseDecimal(value: string): number {
  if (value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function recompute(r: StockRow): StockRow {
  return { ...r, closing_stock: r.opening_stock + r.incoming_stock - sumUsage(r.usage_entries) };
}

// ---- "오늘 제조한 처방으로 금일사용량 자동 반영" ----
// 요청사항: "당일에 확정코드의 처방으로 300kg를 제조한다면 금일사용량에 일일이 원료를 찾아서 기재해야
// 해서 비효율적이다 - 처방을 불러와서 제조량을 기입하면 자동으로 금일사용량이 연동됐으면 좋겠다"
// + "당일에 처방 1개만 제조하는 게 아니라 여러 개 제조할 수 있으니 참고". 제조량 확인(manufacturingQtyReviewService)
// 화면의 "제조 목록"과 동일한 패턴(처방 검색 -> 제조량 입력 -> 목록에 담기, 여러 처방을 목록에 함께
// 담아 합산)을 그대로 재사용한다 - 같은 "BOM 비율 × 제조량" 계산(sumRequiredByRawCode)을 공유하므로
// "합산 부족 원료 목록"과 이 화면의 숫자가 서로 어긋나지 않는다.
type FormulaSearchHit = { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string | null };
type FormulaLineForUsage = { raw_code?: string; raw_name?: string; percentage: number | string };
type ManufacturingListItem = {
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string | null;
  target_qty_kg: number;
  lines: FormulaLineForUsage[];
};

// refreshToken: 생산관리 화면 상단의 "새로고침" 버튼이 바뀔 때마다 증가하는 값. 값이 바뀌면(0은
// 초기값이라 무시) 현재 보고 있는 날짜의 원장을 다시 불러온다 - 선택된 날짜/입력 중인 값은 그대로 유지된다.
export function useRawMaterialStockCheck(refreshToken?: number) {
  const auth = useSprint1Auth();
  const [ledgerDate, setLedgerDate] = useState(todayStr());
  const [materials, setMaterials] = useState<{ raw_code: string; raw_name: string }[]>([]);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // "오늘 제조한 처방으로 금일사용량 자동 반영" - 처방 검색/담기/제조 목록 상태 (useManufacturingQtyReview의
  // "제조 목록" 패턴과 동일).
  const [qtyKeyword, setQtyKeyword] = useState("");
  const [qtyFormulas, setQtyFormulas] = useState<FormulaSearchHit[]>([]);
  const [qtySearching, setQtySearching] = useState(false);
  const [qtyStaged, setQtyStaged] = useState<FormulaSearchHit | null>(null);
  const [qtyStagedQtyKg, setQtyStagedQtyKg] = useState("");
  const [qtyAdding, setQtyAdding] = useState(false);
  const [manufacturingList, setManufacturingList] = useState<ManufacturingListItem[]>([]);
  // "반영"을 누른 처방별 원료 사용량 breakdown을 저장(save) 전까지 모아둔다 - 저장할 때 한꺼번에
  // "처방 반영 이력"으로 기록한다(manufacturingList는 반영 즉시 비워지므로 breakdown을 따로 안 쌓아두면
  // 어떤 처방이 반영됐는지 저장 시점엔 알 수 없다). 날짜를 바꾸면 비운다(아래 ledgerDate 이펙트).
  const [pendingFormulaUsageLog, setPendingFormulaUsageLog] = useState<ApplyFormulaLogInput[]>([]);

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
        const prior = priorMap.get(m.raw_code);
        if (existing) {
          // 과거 버그(이미 수정됨): "저장"이 화면에 보이는 원료 전체를 한 번에 저장하는 구조였어서,
          // 어떤 원료 하나만 최초 등록(현재재고량) 입력하고 저장해도 아직 한 번도 입력한 적 없는 다른
          // 원료들까지 opening/incoming/usage/closing이 전부 0인 "빈" 행이 같이 저장돼버린 적이 있다.
          // 그런 빈 행은(이 날짜 이전 이력도 전혀 없고, 이 날짜 행 자체도 완전히 0) 실제로 아무 정보도
          // 담고 있지 않으므로, 여전히 "최초 등록 대기" 상태로 취급해 입력칸을 계속 보여준다(DB 행을
          // 지우지 않고도 다시 입력할 수 있게 하는 안전장치 - 다음 저장 때 실제 값을 입력하면 이 빈 행은
          // 그 값으로 덮어써진다).
          const isBlankPlaceholder =
            !prior &&
            Number(existing.opening_stock) === 0 &&
            Number(existing.incoming_stock || 0) === 0 &&
            Number(existing.usage_today) === 0 &&
            Number(existing.closing_stock) === 0;
          if (isBlankPlaceholder) {
            return {
              raw_code: m.raw_code, raw_name: m.raw_name,
              opening_stock: 0, incoming_stock: 0, usage_entries: [0], closing_stock: 0,
              openingEditable: true, openingMismatch: null, originalUsageToday: null,
            };
          }
          const existingOpening = Number(existing.opening_stock);
          const priorClosing = prior ? Number(prior.closing_stock) : null;
          // 부동소수점 누적 오차로 인한 거짓 경고를 피하기 위해 아주 작은 차이는 무시한다.
          const openingMismatch =
            prior && priorClosing !== null && Math.abs(existingOpening - priorClosing) > 1e-6
              ? { priorDate: prior.ledger_date, priorClosing }
              : null;
          return {
            raw_code: m.raw_code, raw_name: m.raw_name,
            opening_stock: existingOpening,
            incoming_stock: Number(existing.incoming_stock || 0),
            // 저장된 값은 합계 1개뿐이라, 다시 열람할 때는 입력칸 1개에 그 합계를 그대로 보여준다.
            usage_entries: [Number(existing.usage_today)],
            closing_stock: Number(existing.closing_stock), openingEditable: false,
            openingMismatch, originalUsageToday: Number(existing.usage_today),
          };
        }
        const opening = prior ? Number(prior.closing_stock) : 0;
        return {
          raw_code: m.raw_code, raw_name: m.raw_name,
          opening_stock: opening, incoming_stock: 0, usage_entries: [0], closing_stock: opening,
          openingEditable: !prior, // 과거 이력이 전혀 없으면 최초 등록 baseline 입력 필요
          openingMismatch: null, originalUsageToday: null, // 이 날짜엔 아직 저장된 적이 없어 "이전 값"이 없음
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

  // 원장 날짜를 바꾸면 "제조 목록"도 함께 비운다 - 담아둔 처방을 다른 날짜의 금일사용량에 잘못
  // 반영하는 일이 없도록 한다(첫 마운트 때도 한 번 실행되지만 그때는 이미 비어 있어 영향 없음).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManufacturingList([]);
    setQtyStaged(null);
    setQtyStagedQtyKg("");
    setPendingFormulaUsageLog([]);
  }, [ledgerDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refreshToken) loadForDate(ledgerDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function updateIncoming(rawCode: string, value: string) {
    const incoming = parseDecimal(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? recompute({ ...r, incoming_stock: incoming }) : r)));
  }

  function updateOpeningBaseline(rawCode: string, value: string) {
    const opening = parseDecimal(value);
    setRows((prev) => prev.map((r) => (r.raw_code === rawCode ? recompute({ ...r, opening_stock: opening }) : r)));
  }

  function updateUsageEntry(rawCode: string, index: number, value: string) {
    const usage = parseDecimal(value);
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

  // 제조 목록(처방 + 제조량)에 담긴 처방들의 BOM 비율 × 제조량을 raw_code 기준으로 합산한다 - 여러
  // 처방이 같은 원료를 쓰면 자동으로 더해진다("여러 개 제조할 수 있으니 참고" 요청사항 대응).
  const requiredUsageByRawCode = useMemo(
    () => sumRequiredByRawCode(manufacturingList.map((i) => ({ lines: i.lines, target_qty_kg: i.target_qty_kg }))),
    [manufacturingList]
  );
  const requiredUsagePreview = useMemo(
    () =>
      Array.from(requiredUsageByRawCode, ([raw_code, v]) => ({ raw_code, raw_name: v.raw_name, required_qty: v.required_qty }))
        .sort((a, b) => a.raw_code.localeCompare(b.raw_code)),
    [requiredUsageByRawCode]
  );

  async function searchQtyFormulas() {
    setQtySearching(true);
    setMessage("");
    try {
      setQtyFormulas(await searchProductionFormulas(qtyKeyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setQtySearching(false);
    }
  }

  function stageQtyFormula(f: FormulaSearchHit) {
    setQtyStaged(f);
    setQtyStagedQtyKg("");
    setQtyFormulas([]);
    setQtyKeyword("");
  }

  function cancelQtyStaged() {
    setQtyStaged(null);
    setQtyStagedQtyKg("");
  }

  // 고른 처방 + 입력한 제조량을 제조 목록에 담는다. 같은 처방코드+Rev가 이미 목록에 있으면 새 항목을
  // 만들지 않고 기존 제조량에 더한다(같은 처방을 그날 나눠서 여러 번 담아도 합산되게).
  async function addQtyStagedToList() {
    if (!qtyStaged) {
      setMessage("처방을 먼저 검색해서 선택하세요.");
      return;
    }
    const qty = qtyStagedQtyKg.trim() === "" ? 0 : Number(qtyStagedQtyKg);
    if (Number.isNaN(qty) || qty <= 0) {
      setMessage("제조량을 0보다 크게 입력하세요.");
      return;
    }
    setQtyAdding(true);
    setMessage("");
    try {
      const existingIdx = manufacturingList.findIndex(
        (i) => i.formula_code === qtyStaged.formula_code && i.revision === qtyStaged.revision
      );
      if (existingIdx >= 0) {
        setManufacturingList((prev) =>
          prev.map((i, idx) => (idx === existingIdx ? { ...i, target_qty_kg: i.target_qty_kg + qty } : i))
        );
      } else {
        const lines = await fetchSprint1FormulaLines(qtyStaged.formula_code, qtyStaged.revision);
        setManufacturingList((prev) => [
          ...prev,
          {
            formula_code: qtyStaged.formula_code, revision: qtyStaged.revision,
            formula_name: qtyStaged.formula_name, confirmed_code: qtyStaged.confirmed_code,
            target_qty_kg: qty, lines,
          },
        ]);
      }
      setQtyStaged(null);
      setQtyStagedQtyKg("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 담기 오류");
    } finally {
      setQtyAdding(false);
    }
  }

  function updateManufacturingListQty(idx: number, value: string) {
    const qty = parseDecimal(value);
    setManufacturingList((prev) => prev.map((i, j) => (j === idx ? { ...i, target_qty_kg: qty } : i)));
  }

  function removeFromManufacturingList(idx: number) {
    setManufacturingList((prev) => prev.filter((_, j) => j !== idx));
  }

  // 제조 목록 기준으로 계산된 필요량을 아래 표의 금일사용량에 반영한다 - 저장(save)까지 눌러야 실제로
  // 저장되므로, 반영 후에도 사용자가 내용을 확인/수정할 수 있다. 아직 아무것도 입력 안 한 칸([0] 1개)은
  // 그 값으로 바로 채우고, 이미 값이 있으면 "+ 사용 추가"와 동일하게 새 칸을 추가한다(최대 10칸 -
  // 다 찼으면 마지막 칸에 더해서 값이 사라지지 않게 한다).
  function applyManufacturingUsage() {
    if (requiredUsageByRawCode.size === 0) {
      setMessage("제조 목록에 처방을 먼저 담으세요.");
      return;
    }
    setRows((prev) =>
      prev.map((r) => {
        const hit = requiredUsageByRawCode.get(r.raw_code);
        if (!hit) return r;
        const amount = Math.round(hit.required_qty * 1e6) / 1e6;
        const untouched = r.usage_entries.length === 1 && r.usage_entries[0] === 0;
        const entries = untouched
          ? [amount]
          : r.usage_entries.length < MAX_USAGE_ENTRIES
          ? [...r.usage_entries, amount]
          : r.usage_entries.map((v, i) => (i === r.usage_entries.length - 1 ? v + amount : v));
        return recompute({ ...r, usage_entries: entries });
      })
    );

    // 처방별로 어떤 원료에 얼마씩 반영됐는지 지금(반영 시점) 미리 계산해서 모아둔다 - manufacturingList는
    // 바로 아래에서 비우기 때문에, 저장 시점에는 "어떤 처방이었는지" 정보가 이미 사라진 뒤라서다.
    const newLogEntries: ApplyFormulaLogInput[] = manufacturingList.flatMap((item) => {
      const byRaw = sumRequiredByRawCode([{ lines: item.lines, target_qty_kg: item.target_qty_kg }]);
      return Array.from(byRaw, ([raw_code, v]) => ({
        raw_code, ledger_date: ledgerDate,
        formula_code: item.formula_code, formula_revision: item.revision,
        formula_name: item.formula_name, confirmed_code: item.confirmed_code,
        target_qty_kg: item.target_qty_kg,
        applied_usage: Math.round(v.required_qty * 1e6) / 1e6,
        created_by: auth.profile?.email || null,
      }));
    });
    setPendingFormulaUsageLog((prev) => [...prev, ...newLogEntries]);

    setMessage(`제조 목록 ${manufacturingList.length}건을 금일사용량에 반영했습니다 - 아래 표에서 확인한 뒤 "저장"을 눌러야 실제로 저장됩니다.`);
    setManufacturingList([]);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      // "저장"은 화면에 보이는 대상 원료 전체를 한 번에 저장한다(날짜별 입고재고량/금일사용량은 원료마다
      // 따로 저장할 이유가 없어서). 문제는 아직 한 번도 이력이 없는 "최초 등록"(openingEditable) 원료 중
      // 이번에 전혀 손대지 않은 것들 - 전부 opening/incoming/사용량이 기본값 0인 채로 같이 저장돼버리면,
      // 그 순간 해당 날짜 원장 행이 생겨서 다시 불러올 때 openingEditable이 false로 바뀌어 입력칸이
      // 사라진다("원료 A의 현재재고량만 입력하고 저장했더니 다른 미등록 원료들도 입력이 안 된다" 버그).
      // 그래서 "최초 등록 대상이면서 이번 저장에서 아무것도 입력하지 않은" 행은 저장 대상에서 제외해
      // 다음에 열었을 때도 계속 최초 등록 입력칸으로 남아있게 한다.
      const payload: StockLedgerRow[] = rows
        .filter((r) => !(r.openingEditable && r.opening_stock === 0 && r.incoming_stock === 0 && sumUsage(r.usage_entries) === 0))
        .map((r) => ({
          raw_code: r.raw_code, ledger_date: ledgerDate,
          opening_stock: r.opening_stock, incoming_stock: r.incoming_stock,
          usage_today: sumUsage(r.usage_entries), closing_stock: r.closing_stock,
        }));

      // "수정 이력" 대상 판정: 이 날짜에 이미 저장된 적이 있는 행(originalUsageToday가 있음) 중,
      // 지금 화면의 금일사용량 합계가 그 값과 달라진 행만 - 예: 250kg로 저장돼 있던 걸 200kg로
      // 고쳐서 다시 저장하는 경우(요청사항 대응). 처음 저장하는 행(원래값 없음)은 "수정"이 아니라
      // 최초 입력이라 여기 포함하지 않는다.
      const manualEdits: ManualEditLogInput[] = rows
        .filter((r) => r.originalUsageToday !== null && Math.abs(sumUsage(r.usage_entries) - r.originalUsageToday) > 1e-6)
        .map((r) => ({
          raw_code: r.raw_code, ledger_date: ledgerDate,
          old_usage_today: r.originalUsageToday as number, new_usage_today: sumUsage(r.usage_entries),
          created_by: auth.profile?.email || null,
        }));

      await saveLedgerRows(payload);

      // 이력 기록은 "있으면 좋은" 부가 정보라, 여기서 실패해도 이미 끝난 원장 저장 자체를 되돌리지
      // 않는다 - 대신 저장은 완료됐다고 알리되 이력 기록 실패 사실만 별도로 알려준다.
      try {
        if (pendingFormulaUsageLog.length > 0) await logFormulaApplyEvents(pendingFormulaUsageLog);
        if (manualEdits.length > 0) await logManualEditEvents(manualEdits);
        setPendingFormulaUsageLog([]);
        await loadForDate(ledgerDate);
        setMessage("저장 완료");
      } catch (logErr) {
        setPendingFormulaUsageLog([]);
        await loadForDate(ledgerDate);
        setMessage(
          "저장은 완료됐지만 사용량 이력 기록에는 실패했습니다: " +
            (logErr instanceof Error ? logErr.message : String(logErr))
        );
      }
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
    // 오늘 제조한 처방으로 금일사용량 자동 반영
    qtyKeyword, setQtyKeyword, qtyFormulas, qtySearching, searchQtyFormulas,
    qtyStaged, stageQtyFormula, cancelQtyStaged, qtyStagedQtyKg, setQtyStagedQtyKg, qtyAdding, addQtyStagedToList,
    manufacturingList, updateManufacturingListQty, removeFromManufacturingList,
    requiredUsagePreview, applyManufacturingUsage,
  };
}
