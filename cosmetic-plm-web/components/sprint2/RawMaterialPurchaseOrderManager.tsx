"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { fetchSprint1RawOptions } from "@/services/sprint1/formulaCoreService";
import { searchCompaniesAutocomplete, fetchCompanyById, type Company } from "@/services/sprint2/companyService";
import {
  fetchPurchaseOrders, fetchPurchaseOrderDetail, savePurchaseOrder, deletePurchaseOrder,
  calcItemAmounts, emptyPurchaseOrder, emptyPurchaseOrderItem,
  PURCHASE_ORDER_STATUSES, PURCHASE_ORDER_PAYMENT_STATUSES,
  type PurchaseOrder, type PurchaseOrderItem, type PurchaseOrderSummary, type PurchaseOrderListFilter,
  type PurchaseOrderStatus, type PurchaseOrderPaymentStatus,
} from "@/services/sprint2/purchaseOrderService";
import { printIncomingNotice } from "@/services/sprint2/purchaseOrderDocService";
import { fetchRawMaterialsByCodes } from "@/services/sprint2/rawMaterialService";
import type { PurchaseOrderDraftGroup, PurchaseOrderDraftResult, PurchaseOrderDraftUnresolvedRow } from "@/services/sprint2/manufacturingQtyReviewService";
import SearchDropdown from "@/components/common/SearchDropdown";
import { useAnchorPosition } from "@/hooks/useAnchorPosition";
import Toast, { type ToastState } from "@/components/common/Toast";
import PurchaseOrderRawMaterialSummaryPanel from "@/components/sprint2/PurchaseOrderRawMaterialSummaryPanel";
import PurchaseOrderPrintModal, { type PurchaseOrderPrintTarget } from "@/components/sprint2/PurchaseOrderPrintModal";
import DecimalInput from "@/components/common/DecimalInput";
import { parseDecimal } from "@/lib/parseDecimal";
import PurchaseOrderInspectionModal, { type PurchaseOrderInspectionTarget } from "@/components/sprint2/PurchaseOrderInspectionModal";
import "@/styles/enterprise-v50.css";

type View = "list" | "summary";

function formatCurrency(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("ko-KR");
}

const STATUS_COLOR: Record<PurchaseOrderStatus, { bg: string; fg: string }> = {
  주문완료: { bg: "#dbeafe", fg: "#1d4ed8" },
  부분입고: { bg: "#fef3c7", fg: "#b45309" },
  입고완료: { bg: "#dcfce7", fg: "#16a34a" },
  취소: { bg: "#f1f5f9", fg: "#64748b" },
};
const PAYMENT_STATUS_COLOR: Record<PurchaseOrderPaymentStatus, { bg: string; fg: string }> = {
  미결제: { bg: "#fee2e2", fg: "#dc2626" },
  결제완료: { bg: "#dcfce7", fg: "#16a34a" },
};
// "검수조서" 버튼 등록 여부 표시색 - 기존 STATUS_COLOR.부분입고와 같은 노랑 계열을 재사용해 디자인
// 톤을 맞춘다. 색만으로 구분하면 색약 사용자가 놓칠 수 있어 버튼 라벨도 "검수조서 완료"로 같이 바꾼다.
const INSPECTION_DONE_COLOR = { bg: "#fde047", fg: "#854d0e" };

// 입고일 또는 사진이 하나라도 등록돼 있으면 "검수조서 등록됨"으로 간주한다 - 비고만 입력된 경우는
// 검수조서 작성이 아니라 발주 품목 비고를 쓴 것과 구분이 어려워 신호로 쓰지 않는다.
function isInspectionRegistered(item: PurchaseOrderItem): boolean {
  return Boolean(item.received_date) || Boolean(item.photo_urls && item.photo_urls.length > 0);
}

function Badge({ text, color }: { text: string; color: { bg: string; fg: string } }) {
  return (
    <span style={{ background: color.bg, color: color.fg, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

type SupplierGroup = {
  key: string;
  name: string;
  orders: PurchaseOrderSummary[];
  unpaidTotal: number;
  grandTotal: number;
};

/**
 * 원료 발주관리 - 공급사별로 원료를 발주(주문)하고 결제 현황을 관리하는 화면.
 * 발주 1건 = 공급사 1곳 + 품목(원료) 여러 개 (처방관리의 "처방+BOM"과 동일한 헤더+라인 구조).
 * 목록은 공급사별로 섹션을 나눠서 보여준다 - 월말 결제처럼 여러 공급사에 각각 결제할 금액을
 * 한눈에 파악해야 하는 실무 흐름에 맞춘 것 (요청사항: "섹션이 나눠서 구분이 되어야해").
 */
export default function RawMaterialPurchaseOrderManager({
  initialDraftRequest,
  onDraftHandled,
}: {
  initialDraftRequest?: { requestId: number; result: PurchaseOrderDraftResult } | null;
  // initialDraftRequest를 한 번 처리한 뒤 호출해서 상위(EnterpriseSprint1Workspace)의 보관값을 비워달라고
  // 알려준다. 이 화면은 KEEP_ALIVE_TABS에 없어서 탭을 벗어났다 돌아오면 매번 새로 마운트되는데, 상위
  // state를 안 비우면 handledDraftRequestId(ref)만 초기화돼서 같은 요청이 재전달되고, 이미 저장을
  // 끝낸 발주 초안이 "가져온 발주 초안" 목록에 다시 나타나는 버그가 있었다(품질관리의 openTest/
  // focusTestId·onFocusHandled와 동일한 1회성 전달 패턴을 따른 것).
  onDraftHandled?: () => void;
} = {}) {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteMaterials;

  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<PurchaseOrderListFilter>({ status: "", paymentStatus: "" });
  const [list, setList] = useState<PurchaseOrderSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  // 저장된 발주를 회사 공식 "발주서" 양식(PDF/엑셀)으로 출력하기 위한 대상 - null이면 모달 닫힘.
  // 목록 행의 "발주서" 버튼을 누르면 상세(품목 포함)와 공급사 정보를 새로 불러와서 채운다.
  const [printTarget, setPrintTarget] = useState<PurchaseOrderPrintTarget | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  // "칭량실 안내서" 출력 중 로딩 상태 - 입력할 추가 항목이 없어(발주서와 달리 모달 없이) 버튼을 누르면
  // 바로 발주 상세 + 공급사 + 원료별 제조사를 불러와서 인쇄창을 띄운다.
  const [noticeLoading, setNoticeLoading] = useState(false);
  // 품목별 "검수조서"(원료 입고정보) 입력/출력 모달 대상 - null이면 모달 닫힘. 입고일/사진/비고를
  // 저장하면 handleInspectionSaved가 아래 편집 중인 order.items를 같이 갱신한다.
  const [inspectionTarget, setInspectionTarget] = useState<PurchaseOrderInspectionTarget | null>(null);

  // 제조량 확인("합산 부족 원료 목록")에서 넘어온 공급사별 발주 초안 - 저장되지 않은 상태로만 보관하고,
  // 사용자가 "이 초안 불러오기"를 눌러야 아래 편집 폼에 올라간다(자동 저장 없음). 공급사가 등록 안
  // 된 원료는 pendingDrafts에 못 들어가고 unresolvedDraftRows로 따로 안내한다.
  // (loadDraft는 공급사 자동완성 state 선언 이후에 정의하므로 관련 useEffect도 그 아래에 둔다.)
  const [pendingDrafts, setPendingDrafts] = useState<PurchaseOrderDraftGroup[]>([]);
  const [unresolvedDraftRows, setUnresolvedDraftRows] = useState<PurchaseOrderDraftUnresolvedRow[]>([]);
  const handledDraftRequestId = useRef<number | null>(null);

  const load = useCallback(async (f: PurchaseOrderListFilter) => {
    setListLoading(true);
    try {
      setList(await fetchPurchaseOrders(f));
    } catch (e: any) {
      setMsg("목록 조회 오류: " + e.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, []); // eslint-disable-line

  // 공급사별 섹션으로 묶기 - 미지정(supplier_company_id 없음)은 "공급사 미지정" 섹션으로 모은다.
  const groups: SupplierGroup[] = useMemo(() => {
    const map = new Map<string, SupplierGroup>();
    for (const o of list) {
      const key = o.supplier_company_id || "__none__";
      const name = o.supplier_company_id ? (o.supplier_name_kr || o.supplier_name_en || "(이름없음)") : "공급사 미지정";
      if (!map.has(key)) map.set(key, { key, name, orders: [], unpaidTotal: 0, grandTotal: 0 });
      const g = map.get(key)!;
      g.orders.push(o);
      g.grandTotal += o.total_amount_sum || 0;
      if (o.payment_status === "미결제" && o.status !== "취소") g.unpaidTotal += o.total_amount_sum || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.unpaidTotal - a.unpaidTotal || a.name.localeCompare(b.name, "ko"));
  }, [list]);

  const overallUnpaid = useMemo(() => groups.reduce((s, g) => s + g.unpaidTotal, 0), [groups]);
  const overallTotal = useMemo(() => groups.reduce((s, g) => s + g.grandTotal, 0), [groups]);

  function newOrder() {
    setOrder(emptyPurchaseOrder());
    setMsg("새 발주 입력 모드");
  }

  async function selectOrder(id: string) {
    setMsg("불러오는 중...");
    try {
      setOrder(await fetchPurchaseOrderDetail(id));
      setMsg("");
    } catch (e: any) {
      setMsg("발주 조회 오류: " + e.message);
    }
  }

  // 목록 행의 "발주서" 버튼 - 품목이 포함된 상세와 공급사 정보(상호/TEL)를 새로 불러온 뒤 출력 모달을 연다.
  // 공급사 조회가 실패해도(드물게 삭제된 업체 등) 발주서 자체는 열 수 있게 하고, 모달에서 경고만 보여준다.
  async function openPrintOrder(o: PurchaseOrderSummary) {
    setPrintLoading(true);
    try {
      const detail = await fetchPurchaseOrderDetail(o.id);
      let supplier: Company | null = null;
      if (detail.supplier_company_id) {
        try {
          supplier = await fetchCompanyById(detail.supplier_company_id);
        } catch {
          supplier = null;
        }
      }
      setPrintTarget({ order: detail, supplier });
    } catch (e) {
      setToast({ type: "error", text: "발주서 출력 준비 실패: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setPrintLoading(false);
    }
  }

  // 목록 행의 "칭량실 안내" 버튼 - 발주된 원료가 칭량실에는 알려지지 않으니, 발주 상세 + 공급사 +
  // 원료별 제조사(원료 마스터에서 조회, 발주 품목에는 없는 정보)를 모아 안내서를 바로 인쇄(PDF)한다.
  // 금액/결제 정보가 없는 문서라 발주서와 달리 별도 입력 모달 없이 버튼 1번으로 바로 출력된다.
  async function openIncomingNotice(o: PurchaseOrderSummary) {
    setNoticeLoading(true);
    try {
      const detail = await fetchPurchaseOrderDetail(o.id);
      let supplier: Company | null = null;
      if (detail.supplier_company_id) {
        try {
          supplier = await fetchCompanyById(detail.supplier_company_id);
        } catch {
          supplier = null;
        }
      }
      const codes = detail.items.map((it) => it.raw_code).filter(Boolean);
      const materials = await fetchRawMaterialsByCodes(codes);
      const manufacturerByCode = new Map(materials.map((m) => [m.raw_code, m.manufacturer || ""]));
      printIncomingNotice(detail, supplier, manufacturerByCode);
    } catch (e) {
      setToast({ type: "error", text: "칭량실 안내서 출력 준비 실패: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setNoticeLoading(false);
    }
  }

  async function handleDelete(o: PurchaseOrderSummary) {
    if (!confirm(`발주 "${o.order_no}"를 삭제하시겠습니까? (품목도 함께 삭제되며 되돌릴 수 없습니다.)`)) return;
    try {
      await deletePurchaseOrder(o.id);
      if (order?.id === o.id) setOrder(null);
      setToast({ type: "success", text: "삭제되었습니다: " + o.order_no });
      await load(filter);
    } catch (e: any) {
      setToast({ type: "error", text: "삭제 실패: " + e.message });
    }
  }

  function updateOrder(patch: Partial<PurchaseOrder>) {
    setOrder((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateItem(i: number, patch: Partial<PurchaseOrderItem>) {
    setOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.slice();
      const merged = { ...items[i], ...patch };
      // 단가/수량/부가세율이 바뀌면 공급가/부가세/총액을 자동으로 다시 계산한다(수동 수정도 계속 가능).
      if ("unit_price" in patch || "quantity" in patch || "vat_rate" in patch) {
        Object.assign(merged, calcItemAmounts(merged));
      }
      items[i] = merged;
      return { ...prev, items };
    });
  }

  function addItemRow() {
    setOrder((prev) => (prev ? { ...prev, items: [...prev.items, emptyPurchaseOrderItem()] } : prev));
  }

  function removeItemRow(i: number) {
    setOrder((prev) => (prev ? { ...prev, items: prev.items.filter((_, idx) => idx !== i) } : prev));
  }

  // 검수조서 모달에서 입고일/사진/비고를 저장하면, 지금 편집 중인 order.items에도 같은 내용을 반영해서
  // 모달을 닫지 않고도 화면이 바로 최신 상태로 보이게 한다. 모달이 다시 열렸을 때도 최신 값을 보여주도록
  // inspectionTarget도 함께 갱신한다.
  function handleInspectionSaved(updated: PurchaseOrderItem) {
    setOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
      return { ...prev, items };
    });
    setInspectionTarget((prev) => (prev && prev.item.id === updated.id ? { ...prev, item: { ...prev.item, ...updated } } : prev));
    setToast({ type: "success", text: "검수조서가 저장되었습니다." });
  }

  const itemTotals = useMemo(() => {
    if (!order) return { supply: 0, vat: 0, total: 0 };
    return order.items.reduce(
      (acc, it) => ({ supply: acc.supply + (it.supply_amount || 0), vat: acc.vat + (it.vat_amount || 0), total: acc.total + (it.total_amount || 0) }),
      { supply: 0, vat: 0, total: 0 }
    );
  }, [order]);

  async function handleSave() {
    if (!order) return;
    if (!order.supplier_company_id) { setMsg("공급사를 선택하세요."); return; }
    const validItems = order.items.filter((i) => i.raw_code?.trim());
    if (validItems.length === 0) { setMsg("품목을 1개 이상 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      const id = await savePurchaseOrder({ ...order, created_by: order.created_by ?? auth.profile?.email });
      const saved = await fetchPurchaseOrderDetail(id);
      setOrder(saved);
      // 발주 초안(제조량 확인 연동)에서 저장까지 끝난 공급사는 "가져온 초안" 목록에서 지운다.
      setPendingDrafts((prev) => prev.filter((g) => g.supplier_company_id !== saved.supplier_company_id));
      setToast({ type: "success", text: "저장되었습니다: " + saved.order_no });
      await load(filter);
    } catch (e: any) {
      setToast({ type: "error", text: "저장 실패: " + e.message });
    } finally {
      setSaving(false);
    }
  }

  function applyFilter() {
    load(filter);
  }

  // ---- 원료코드 검색 자동완성(품목 행) ----
  const [rawHits, setRawHits] = useState<any[]>([]);
  const [activeRawRow, setActiveRawRow] = useState<number | null>(null);
  const rawInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const rawSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawAnchorPos = useAnchorPosition(activeRawRow, () => (activeRawRow != null ? rawInputRefs.current[activeRawRow] : null), rawHits);

  function searchRawForRow(i: number, value: string) {
    updateItem(i, { raw_code: value, raw_name: undefined, trade_name: undefined });
    setActiveRawRow(i);
    if (rawSearchTimer.current) clearTimeout(rawSearchTimer.current);
    if (!value.trim()) { setRawHits([]); return; }
    rawSearchTimer.current = setTimeout(async () => {
      try { setRawHits(await fetchSprint1RawOptions(value.trim())); }
      catch { setRawHits([]); }
    }, 250);
  }

  function pickRawForRow(raw: any) {
    if (activeRawRow == null) return;
    // 발주 화면에서 처음 담는 순간의 단가를 기본값으로 채워주되(원료 마스터 최근 단가), 실제 계약 단가가
    // 다르면 바로 아래 칸에서 수정하면 된다. 패킹도 원료관리에 등록된 MOQ를 기본값으로 채워주고(요청사항:
    // "패킹의 경우 원료관리에서 원료 MOQ 등록한 정보가 자동으로 입력되게"), 실제 발주 단위가 다르면
    // 그 자리에서 바로 수정하면 된다.
    updateItem(activeRawRow, {
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      trade_name: raw.trade_name,
      unit_price: raw.unit_price ?? 0,
      packing: raw.moq || "",
      ...calcItemAmounts({ unit_price: raw.unit_price ?? 0, quantity: order?.items[activeRawRow]?.quantity || 0, vat_rate: order?.items[activeRawRow]?.vat_rate ?? 0.1 }),
    });
    setRawHits([]);
    setActiveRawRow(null);
  }

  // ---- 공급사 검색 자동완성(헤더) ----
  const [supplierKeyword, setSupplierKeyword] = useState("");
  const [supplierHits, setSupplierHits] = useState<Company[]>([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement | null>(null);
  const supplierSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supplierAnchorPos = useAnchorPosition(supplierOpen ? "supplier" : null, () => supplierInputRef.current, supplierHits);

  // 발주를 불러오면(선택/신규) 그 발주의 공급사명을 입력창에 표시한다.
  useEffect(() => {
    if (!order) { setSupplierKeyword(""); return; }
    if (!order.supplier_company_id) { setSupplierKeyword(""); return; }
    let cancelled = false;
    fetchCompanyById(order.supplier_company_id)
      .then((c) => { if (!cancelled) setSupplierKeyword(c.name_kr || c.name_en || ""); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [order?.id]); // eslint-disable-line

  function onSupplierInputChange(v: string) {
    setSupplierKeyword(v);
    updateOrder({ supplier_company_id: null });
    setSupplierOpen(true);
    if (supplierSearchTimer.current) clearTimeout(supplierSearchTimer.current);
    if (!v.trim()) { setSupplierHits([]); return; }
    supplierSearchTimer.current = setTimeout(async () => {
      try { setSupplierHits(await searchCompaniesAutocomplete(v.trim(), "공급사")); }
      catch { setSupplierHits([]); }
    }, 250);
  }

  function pickSupplier(c: Company) {
    setSupplierKeyword(c.name_kr || c.name_en || "");
    updateOrder({ supplier_company_id: c.id! });
    setSupplierHits([]);
    setSupplierOpen(false);
  }

  function loadDraft(g: PurchaseOrderDraftGroup) {
    if (order && order.items.some((i) => i.raw_code?.trim()) && !confirm("현재 편집 중인 내용이 사라집니다. 이 초안을 불러올까요?")) return;
    setOrder(g.order);
    setSupplierKeyword(g.supplier_name);
    setMsg(`"${g.supplier_name}" 발주 초안을 불러왔습니다. 품목/수량/단가를 확인한 뒤 저장하세요.`);
  }

  // initialDraftRequest(제조량 확인에서 넘어온 1회성 발주 초안)를 반영한다. 외부에서 들어오는 prop을
  // 로컬 state로 복사하는 의도적인 동기화라 react-hooks/set-state-in-effect 규칙이 걸리는데, 이
  // 파일의 공급사명 조회 effect(위 pickSupplier 윗부분)에도 이미 있는 것과 같은 유형의 패턴이라
  // 억제한다 - 처리 후 onDraftHandled로 상위 값을 바로 비워서 중복 처리를 막는 쪽이 핵심 로직이다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!initialDraftRequest || handledDraftRequestId.current === initialDraftRequest.requestId) return;
    handledDraftRequestId.current = initialDraftRequest.requestId;
    const { drafts, unresolved } = initialDraftRequest.result;
    setPendingDrafts(drafts);
    setUnresolvedDraftRows(unresolved);
    if (drafts.length > 0) {
      loadDraft(drafts[0]);
    } else {
      setMsg("공급사가 등록된 부족 원료가 없어 발주 초안을 만들지 못했습니다. 아래 안내를 확인하세요.");
    }
    // 1회성 전달 - 처리했으니 상위 보관값을 비워달라고 알려준다(안 비우면 이 화면이 재마운트될 때
    // 같은 요청이 다시 내려와서 이미 저장 끝난 초안이 되살아난다).
    onDraftHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftRequest]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료 발주관리</h1>
          <p className="v50-desc">공급사별 원료 발주와 결제 현황을 관리합니다. 목록은 공급사별로 섹션이 나뉘어 표시됩니다.</p>
        </div>
        {canWrite && <button className="v50-button" onClick={newOrder}>+ 새 발주</button>}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />
      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      {/* key로 발주별로 재마운트시켜서, 다른 발주를 열 때마다 납기일자 등 입력값이 기본값으로 리셋되게 한다. */}
      <PurchaseOrderPrintModal key={printTarget?.order.id || "none"} target={printTarget} onClose={() => setPrintTarget(null)} />
      <PurchaseOrderInspectionModal key={inspectionTarget?.item.id || "none"} target={inspectionTarget} onClose={() => setInspectionTarget(null)} onSaved={handleInspectionSaved} />

      {(pendingDrafts.length > 0 || unresolvedDraftRows.length > 0) && (
        <section className="v50-panel" style={{ marginBottom: 18, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0 }}>제조량 확인에서 가져온 발주 초안</h2>
            <button className="v50-button-light" onClick={() => { setPendingDrafts([]); setUnresolvedDraftRows([]); onDraftHandled?.(); }}>닫기</button>
          </div>
          <p className="v50-desc" style={{ marginBottom: 8 }}>
            합산 부족 원료 목록을 원료관리에 등록된 공급사 기준으로 묶은 초안입니다. 아직 저장되지 않았으니 품목·수량·단가를 확인한 뒤 아래에서 &ldquo;발주 저장&rdquo;을 눌러야 확정됩니다.
          </p>
          {pendingDrafts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: unresolvedDraftRows.length > 0 ? 12 : 0 }}>
              {pendingDrafts.map((g) => (
                <div key={g.supplier_company_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: 8 }}>
                  <span><strong>{g.supplier_name}</strong> · 품목 {g.order.items.length}건</span>
                  <button className="v50-button-light" onClick={() => loadDraft(g)}>이 초안 불러오기</button>
                </div>
              ))}
            </div>
          )}
          {unresolvedDraftRows.length > 0 && (
            <div style={{ fontSize: 12, color: "#b45309" }}>
              <strong>공급사가 등록되지 않아 초안에 포함되지 못한 원료:</strong>{" "}
              {unresolvedDraftRows.map((r) => `${r.raw_code}(${r.raw_name})`).join(", ")}
              <br />원료관리에서 공급사를 먼저 등록하거나, 아래 발주 품목에서 직접 추가하세요.
            </div>
          )}
        </section>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <button className={view === "list" ? "v50-button" : "v50-button-light"} onClick={() => setView("list")}>발주 목록</button>
        <button className={view === "summary" ? "v50-button" : "v50-button-light"} onClick={() => setView("summary")}>월별·연도별 원료 발주금액 집계</button>
      </div>

      {view === "summary" && <PurchaseOrderRawMaterialSummaryPanel />}

      {view === "list" && (
      <>
      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>발주 목록</h2>
          <div style={{ display: "flex", gap: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>전체 미결제 합계 {formatCurrency(overallUnpaid)}원</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>전체 발주 총액 {formatCurrency(overallTotal)}원</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="검색(발주번호/공급사/비고)">
            <input className="v50-input" style={{ minWidth: 220 }} value={filter.keyword || ""}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()} />
          </Field>
          <Field label="진행상태">
            <select className="v50-input" value={filter.status || ""} onChange={(e) => setFilter({ ...filter, status: e.target.value as PurchaseOrderStatus | "" })}>
              <option value="">전체</option>
              {PURCHASE_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="결제상태">
            <select className="v50-input" value={filter.paymentStatus || ""} onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value as PurchaseOrderPaymentStatus | "" })}>
              <option value="">전체</option>
              {PURCHASE_ORDER_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="발주일(시작)">
            <input className="v50-input" type="date" value={filter.dateFrom || ""} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
          </Field>
          <Field label="발주일(종료)">
            <input className="v50-input" type="date" value={filter.dateTo || ""} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
          </Field>
          <button className="v50-button" onClick={applyFilter} disabled={listLoading}>{listLoading ? "조회 중…" : "검색"}</button>
        </div>

        {groups.length === 0 && !listLoading && <p style={{ color: "#94a3b8" }}>발주 내역이 없습니다.</p>}

        {groups.map((g) => (
          <div key={g.key} style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{g.name}</strong>
              <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: g.unpaidTotal > 0 ? "#dc2626" : "#94a3b8" }}>미결제 {formatCurrency(g.unpaidTotal)}원</span>
                <span style={{ color: "#475569" }}>합계 {formatCurrency(g.grandTotal)}원</span>
              </div>
            </div>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>발주번호</th><th>발주일</th><th>품목수</th><th>공급가</th><th>부가세</th><th>총액</th>
                    <th>결제예정일</th><th>결제일</th><th>진행상태</th><th>결제상태</th><th style={{ width: 190 }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {g.orders.map((o) => (
                    <tr key={o.id} style={{ background: order?.id === o.id ? "#eff6ff" : undefined }}>
                      <td style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => selectOrder(o.id)}>{o.order_no}</td>
                      <td>{o.order_date}</td>
                      <td>{o.item_count}</td>
                      <td>{formatCurrency(o.supply_amount_sum)}</td>
                      <td>{formatCurrency(o.vat_amount_sum)}</td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(o.total_amount_sum)}</td>
                      <td>{o.payment_due_date || "-"}</td>
                      <td>{o.payment_date || "-"}</td>
                      <td><Badge text={o.status} color={STATUS_COLOR[o.status]} /></td>
                      <td><Badge text={o.payment_status} color={PAYMENT_STATUS_COLOR[o.payment_status]} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="v50-button-light" onClick={() => selectOrder(o.id)}>{canWrite ? "수정" : "보기"}</button>
                          <button className="v50-button-light" disabled={printLoading} onClick={() => openPrintOrder(o)}>발주서</button>
                          <button className="v50-button-light" disabled={noticeLoading} onClick={() => openIncomingNotice(o)} title="발주된 원료를 칭량실에 알리는 안내서(PDF)를 출력합니다">칭량실 안내</button>
                          {canWrite && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(o)}>삭제</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {order && (
        <section className="v50-panel">
          <h2>{order.id ? `발주 편집 · ${order.order_no}` : "새 발주 등록"}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
            <Field label="공급사*">
              <input ref={supplierInputRef} className="v50-input" value={supplierKeyword}
                onChange={(e) => onSupplierInputChange(e.target.value)}
                onFocus={() => setSupplierOpen(true)}
                placeholder="업체명 검색" disabled={!canWrite} />
              {supplierOpen && supplierHits.length > 0 && supplierAnchorPos &&
                createPortal(
                  <SearchDropdown hits={supplierHits} pos={supplierAnchorPos} onPick={pickSupplier}
                    keyExtractor={(c) => c.id!}
                    renderItem={(c) => <div><strong>{c.name_kr || c.name_en}</strong> {c.name_en && c.name_kr ? `(${c.name_en})` : ""}</div>} />,
                  document.body
                )}
            </Field>
            <Field label="발주일">
              <input className="v50-input" type="date" value={order.order_date} onChange={(e) => updateOrder({ order_date: e.target.value })} disabled={!canWrite} />
            </Field>
            <Field label="결제예정일">
              <input className="v50-input" type="date" value={order.payment_due_date || ""} onChange={(e) => updateOrder({ payment_due_date: e.target.value || null })} disabled={!canWrite} />
            </Field>
            <Field label="결제일 (입력하면 결제완료로 자동 전환)">
              <input className="v50-input" type="date" value={order.payment_date || ""}
                onChange={(e) => updateOrder({ payment_date: e.target.value || null, payment_status: e.target.value ? "결제완료" : "미결제" })}
                disabled={!canWrite} />
            </Field>
            <Field label="진행상태">
              <select className="v50-input" value={order.status} onChange={(e) => updateOrder({ status: e.target.value as PurchaseOrderStatus })} disabled={!canWrite}>
                {PURCHASE_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="결제상태">
              <select className="v50-input" value={order.payment_status} onChange={(e) => updateOrder({ payment_status: e.target.value as PurchaseOrderPaymentStatus })} disabled={!canWrite}>
                {PURCHASE_ORDER_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="비고">
                <textarea className="v50-textarea" rows={2} value={order.note || ""} onChange={(e) => updateOrder({ note: e.target.value })} disabled={!canWrite} />
              </Field>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>발주 품목</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead>
                  <tr>
                    <th>#</th><th style={{ minWidth: 200 }}>원료코드/원료명</th><th>단가</th><th>수량</th><th>단위</th><th>패킹</th>
                    <th>공급가</th><th>부가세율</th><th>부가세</th><th>총액</th><th>비고</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input ref={(el) => { rawInputRefs.current[i] = el; }} className="v50-input" style={{ minWidth: 180 }}
                          value={it.raw_code} onChange={(e) => searchRawForRow(i, e.target.value)} disabled={!canWrite} />
                        {(it.raw_name || it.trade_name) && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{it.raw_name}{it.trade_name ? ` (${it.trade_name})` : ""}</div>
                        )}
                        {activeRawRow === i && rawHits.length > 0 && rawAnchorPos &&
                          createPortal(
                            <SearchDropdown hits={rawHits} pos={rawAnchorPos} onPick={pickRawForRow}
                              keyExtractor={(r: any) => r.raw_code}
                              renderItem={(r: any) => <div><strong>{r.raw_code}</strong> {r.raw_name}{r.trade_name ? ` / ${r.trade_name}` : ""}</div>} />,
                            document.body
                          )}
                      </td>
                      <td><DecimalInput className="v50-input" style={{ width: 90 }} value={it.unit_price} blankOnZero={false} onChange={(v) => updateItem(i, { unit_price: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td><DecimalInput className="v50-input" style={{ width: 80 }} value={it.quantity} blankOnZero={false} onChange={(v) => updateItem(i, { quantity: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 60 }} value={it.unit || ""} onChange={(e) => updateItem(i, { unit: e.target.value })} placeholder="kg" disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 100 }} value={it.packing || ""} onChange={(e) => updateItem(i, { packing: e.target.value })} placeholder="20kg/drum" disabled={!canWrite} /></td>
                      <td><DecimalInput className="v50-input" style={{ width: 100 }} value={it.supply_amount} blankOnZero={false} onChange={(v) => updateItem(i, { supply_amount: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td><DecimalInput className="v50-input" style={{ width: 70 }} value={it.vat_rate} blankOnZero={false} onChange={(v) => updateItem(i, { vat_rate: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td><DecimalInput className="v50-input" style={{ width: 90 }} value={it.vat_amount} blankOnZero={false} onChange={(v) => updateItem(i, { vat_amount: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td style={{ fontWeight: 800 }}><DecimalInput className="v50-input" style={{ width: 100 }} value={it.total_amount} blankOnZero={false} onChange={(v) => updateItem(i, { total_amount: parseDecimal(v) })} disabled={!canWrite} /></td>
                      <td><input className="v50-input" style={{ width: 100 }} value={it.note || ""} onChange={(e) => updateItem(i, { note: e.target.value })} disabled={!canWrite} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {/* 품목이 저장되어 id가 생긴 뒤에만 검수조서(입고일/사진/비고)를 쓸 수 있다 - 아직
                              저장 전인 새 행은 먼저 "발주 저장"을 눌러야 버튼이 나타난다. 입고일/사진이 이미
                              등록된 품목은 버튼을 노란색으로 바꾸고 라벨도 "완료"로 바꿔서 한눈에 등록 여부를
                              구분할 수 있게 한다(요청사항: "검수조서 등록되면 노란색으로 변해서 알 수 있게"). */}
                          {it.id && (
                            <button
                              className="v50-button-light"
                              style={isInspectionRegistered(it) ? { background: INSPECTION_DONE_COLOR.bg, color: INSPECTION_DONE_COLOR.fg, fontWeight: 800, border: "none" } : undefined}
                              onClick={() => setInspectionTarget({ order, item: it })}
                            >
                              {isInspectionRegistered(it) ? "검수조서 완료" : "검수조서"}
                            </button>
                          )}
                          {canWrite && <button className="v50-button-light" onClick={() => removeItemRow(i)}>삭제</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {order.items.length === 0 && <tr><td colSpan={12} style={{ color: "#94a3b8" }}>품목이 없습니다.</td></tr>}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                    <td colSpan={6} style={{ textAlign: "right" }}>합계</td>
                    <td>{formatCurrency(itemTotals.supply)}</td>
                    <td></td>
                    <td>{formatCurrency(itemTotals.vat)}</td>
                    <td>{formatCurrency(itemTotals.total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {canWrite && <button className="v50-button-light" style={{ marginTop: 8 }} onClick={addItemRow}>+ 품목 추가</button>}
          </div>

          {canWrite && (
            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <button className="v50-button" onClick={handleSave} disabled={saving}>{saving ? "저장 중…" : "발주 저장"}</button>
              <button className="v50-button-light" onClick={() => setOrder(null)}>닫기</button>
            </div>
          )}
        </section>
      )}
      </>
      )}
    </div>
  );
}
