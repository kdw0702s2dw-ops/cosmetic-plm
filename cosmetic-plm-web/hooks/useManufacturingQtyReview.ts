"use client";

import { useEffect, useMemo, useState } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines } from "@/services/sprint1/formulaCoreService";
import { fetchLatestStockByRawCodes, isStockManagedRawCode } from "@/services/sprint2/rawMaterialStockService";
import { fetchRawMaterialsByCodes } from "@/services/sprint2/rawMaterialService";
import {
  calcCombinedShortageRows, deleteManufacturingQtyReviewSheet, fetchManufacturingQtyReviewSheets, saveManufacturingQtyReviewSheet,
  type ManufacturingListFormula, type ManufacturingQtyReviewSheet, type ShortageRow,
} from "@/services/sprint2/manufacturingQtyReviewService";
import { downloadManufacturingQtyReviewExcel, printManufacturingQtyReviewSheet } from "@/services/sprint2/manufacturingQtyReviewDocService";

// "제조 목록"에 담긴 처방 1건의 화면 내부 상태 - 처방 정보 + 목표 제조량 + 그 처방의 BOM 라인(목록에
// 담는 시점에 미리 조회해둔다 - 원료 필요량 계산에 필요).
type ManufacturingListItem = ManufacturingListFormula & { lines: any[] };

// 오늘 당일에 여러 처방을 동시에 제조할 때, 처방을 하나씩 검색해서 "제조 목록"에 담아두면(처방별
// 목표 제조량 입력) 그 목록 전체를 기준으로 재고 관리 대상 원료의 필요량/부족량을 합산해서 보여준다.
// 같은 원료가 여러 처방에 걸쳐 쓰였으면 필요량을 모두 더한 뒤 재고와 비교하므로, 부족 원료를 처방별로
// 따로 확인하고 수작업으로 합산할 필요가 없다.
// refreshToken: 생산관리 화면 상단의 "새로고침" 버튼이 바뀔 때마다 증가하는 값. 값이 바뀌면(0은
// 초기값이라 무시) 저장 이력과(목록에 처방이 있으면) 재고를 다시 조회한다.
export function useManufacturingQtyReview(refreshToken?: number) {
  const auth = useSprint1Auth();

  // 처방 검색(제조 목록에 담을 처방을 고르는 용도)
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 검색 결과에서 고른 뒤, 목표 제조량을 입력하는 중인 "담기 전" 처방 1건
  const [staged, setStaged] = useState<any | null>(null);
  const [stagedQtyKg, setStagedQtyKg] = useState("");
  const [adding, setAdding] = useState(false);

  // 제조 목록 - 오늘 함께 제조할 처방들을 담아두는 목록. 이 목록 전체를 기준으로 원료를 합산한다.
  const [list, setList] = useState<ManufacturingListItem[]>([]);

  const [latestStock, setLatestStock] = useState<Map<string, { closing_stock: number; ledger_date: string }>>(new Map());
  // 원료관리(plm_raw_materials)의 단가/통화/MOQ - 합산 부족 원료 목록에 연동해서 보여주고 발주 금액을
  // 계산하는 데 쓴다("단가 MOQ 정보가 연동되서 함께 볼 수 있게... 발주 금액 계산" 요청사항).
  const [rawMaterialInfo, setRawMaterialInfo] = useState<Map<string, { unit_price?: number | null; currency?: string; moq?: string }>>(new Map());
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ManufacturingQtyReviewSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const shortageRows: ShortageRow[] = useMemo(
    () => calcCombinedShortageRows(list.map((i) => ({ lines: i.lines, target_qty_kg: i.target_qty_kg })), latestStock, rawMaterialInfo),
    [list, latestStock, rawMaterialInfo]
  );

  // 부족 원료 전체의 발주 금액 합계(통화가 섞여 있어도 일단 숫자로만 합산 - 대부분 KRW 단일 통화 전제).
  const totalOrderAmount = useMemo(
    () => shortageRows.reduce((sum, r) => sum + (r.order_amount || 0), 0),
    [shortageRows]
  );

  async function search() {
    setSearching(true);
    try {
      setFormulas(await searchProductionFormulas(keyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setSearching(false);
    }
  }

  function stageFormula(f: any) {
    setStaged(f);
    setStagedQtyKg("");
    setFormulas([]);
    setMessage("");
  }

  function updateStagedQtyKg(value: string) {
    setStagedQtyKg(value);
  }

  async function refreshStockForList(items: ManufacturingListItem[]) {
    const targetedCodes = Array.from(
      new Set(items.flatMap((i) => i.lines.map((l: any) => l.raw_code)).filter(isStockManagedRawCode))
    );
    const [stock, materials] = await Promise.all([
      fetchLatestStockByRawCodes(targetedCodes),
      fetchRawMaterialsByCodes(targetedCodes),
    ]);
    setLatestStock(stock);
    setRawMaterialInfo(
      new Map(materials.map((m) => [m.raw_code, { unit_price: m.unit_price, currency: m.currency, moq: m.moq }]))
    );
  }

  // 고른 처방 + 입력한 목표 제조량을 제조 목록에 추가한다. 같은 처방코드+Rev가 이미 목록에 있으면
  // 새 항목을 만들지 않고 기존 목표 제조량에 더한다(같은 처방을 나눠서 여러 번 담는 경우 대비).
  async function addStagedToList() {
    if (!staged) {
      setMessage("처방을 먼저 검색해서 선택하세요.");
      return;
    }
    const qty = stagedQtyKg.trim() === "" ? 0 : Number(stagedQtyKg);
    if (Number.isNaN(qty) || qty <= 0) {
      setMessage("목표 제조량을 0보다 크게 입력하세요.");
      return;
    }
    setAdding(true);
    setMessage("");
    try {
      const existingIdx = list.findIndex((i) => i.formula_code === staged.formula_code && i.revision === staged.revision);
      let nextList: ManufacturingListItem[];
      if (existingIdx >= 0) {
        nextList = list.map((i, idx) => (idx === existingIdx ? { ...i, target_qty_kg: i.target_qty_kg + qty } : i));
      } else {
        const formulaLines = await fetchSprint1FormulaLines(staged.formula_code, staged.revision);
        nextList = [
          ...list,
          {
            formula_code: staged.formula_code,
            revision: staged.revision,
            formula_name: staged.formula_name,
            confirmed_code: staged.confirmed_code,
            target_qty_kg: qty,
            lines: formulaLines,
          },
        ];
      }
      setList(nextList);
      await refreshStockForList(nextList);
      setStaged(null);
      setStagedQtyKg("");
      setKeyword("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 추가 오류");
    } finally {
      setAdding(false);
    }
  }

  function updateListQty(idx: number, value: string) {
    const qty = value === "" ? 0 : Number(value);
    setList((prev) => prev.map((i, j) => (j === idx ? { ...i, target_qty_kg: qty } : i)));
  }

  function removeFromList(idx: number) {
    setList((prev) => prev.filter((_, j) => j !== idx));
  }

  function clearList() {
    if (list.length > 0 && !confirm("제조 목록을 모두 비우시겠습니까?")) return;
    setList([]);
    setLatestStock(new Map());
    setNote("");
  }

  async function loadHistory() {
    setLoading(true);
    try {
      setHistory(await fetchManufacturingQtyReviewSheets());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, []);

  useEffect(() => {
    if (!refreshToken) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    if (list.length > 0) refreshStockForList(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function buildCurrentSheet(): ManufacturingQtyReviewSheet {
    if (list.length === 0) throw new Error("제조 목록에 처방을 먼저 담으세요.");
    const formulasPayload: ManufacturingListFormula[] = list.map((i) => ({
      formula_code: i.formula_code,
      revision: i.revision,
      formula_name: i.formula_name,
      confirmed_code: i.confirmed_code,
      target_qty_kg: i.target_qty_kg,
    }));
    return { formulas: formulasPayload, shortage_rows: shortageRows, note };
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const sheet = buildCurrentSheet();
      await saveManufacturingQtyReviewSheet({ ...sheet, created_by: auth.profile?.email || undefined });
      setMessage("저장 완료");
      await loadHistory();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  // 이력에서 불러오기 - 처방별 BOM 라인은 용량 문제로 이력에 저장해두지 않으므로, 불러올 때 각 처방의
  // BOM을 다시 조회해서 제조 목록을 복원한다. 그사이 삭제되는 등 조회가 안 되는 처방은 건너뛴다.
  async function loadFromHistory(sheet: ManufacturingQtyReviewSheet) {
    setLoading(true);
    setMessage("");
    try {
      const restored: ManufacturingListItem[] = [];
      for (const f of sheet.formulas) {
        try {
          const formulaLines = await fetchSprint1FormulaLines(f.formula_code, f.revision);
          restored.push({ ...f, lines: formulaLines });
        } catch {
          // 삭제/변경된 처방은 건너뛴다
        }
      }
      setList(restored);
      await refreshStockForList(restored);
      setNote(sheet.note || "");
      setMessage(`불러옴: ${new Date(sheet.created_at || "").toLocaleString("ko-KR")}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 불러오기 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeHistory(id: string) {
    if (!confirm("이 검토 이력을 삭제하시겠습니까?")) return;
    try {
      await deleteManufacturingQtyReviewSheet(id);
      await loadHistory();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function printCurrent() {
    try { printManufacturingQtyReviewSheet(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelCurrent() {
    try { await downloadManufacturingQtyReviewExcel(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }
  function printHistoryItem(sheet: ManufacturingQtyReviewSheet) {
    try { printManufacturingQtyReviewSheet(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelHistoryItem(sheet: ManufacturingQtyReviewSheet) {
    try { await downloadManufacturingQtyReviewExcel(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }

  return {
    keyword, setKeyword, formulas, searching, search,
    staged, stageFormula, stagedQtyKg, updateStagedQtyKg, adding, addStagedToList,
    list, updateListQty, removeFromList, clearList,
    shortageRows, totalOrderAmount, note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
