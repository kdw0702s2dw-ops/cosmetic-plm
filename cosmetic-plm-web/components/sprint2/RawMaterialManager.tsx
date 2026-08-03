"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  fetchRawMaterials, fetchRawMaterialByCode, searchIngredients, saveRawMaterial, deleteRawMaterial,
  fetchComponents, saveComponents, sumComposition, fetchAllergenMaster,
  checkRawCodeExists, searchRawMaterialsAutocomplete,
  fetchRawMaterialsForExport,
  type RawMaterial, type RawMaterialListItem, type Component, type IngredientHit, type AllergenMaster,
} from "@/services/sprint2/rawMaterialService";
import {
  searchCompaniesAutocomplete, saveCompany, type Company, type CompanyCategory,
} from "@/services/sprint2/companyService";
import Toast, { type ToastState } from "@/components/common/Toast";
import SearchDropdown from "@/components/common/SearchDropdown";
import { useAnchorPosition } from "@/hooks/useAnchorPosition";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

// 다운로드/업로드 양식 공통 컬럼 순서 (그대로 다운받아 채워서 재업로드 가능하도록 이름/순서를 맞춤)
const RAW_CSV_HEADERS = [
  "raw_code", "name", "trade_name", "inci_kr", "inci_en", "cas_no", "ec_no",
  "manufacturer", "supplier", "unit_price", "moq", "lead_time", "origin",
] as const;

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildRawMaterialsCsv(rows: RawMaterial[]) {
  const lines = [RAW_CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push([
      r.raw_code, r.raw_name, r.trade_name, r.inci_kr, r.inci_en, r.cas_no, r.ec_no,
      r.manufacturer, r.supplier, r.unit_price ?? "", r.moq, r.lead_time, r.origin_country,
    ].map(csvEscape).join(","));
  }
  return lines.join("\r\n");
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" }); // UTF-8 BOM: 엑셀 한글 깨짐 방지
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyRm: RawMaterial = {
  raw_code: "", raw_name: "", trade_name: "", manufacturer: "", supplier: "",
  unit_price: null, moq: "", lead_time: "", origin_country: "",
  inci_kr: "", inci_en: "", cas_no: "", ec_no: "", function_kr: "", function_en: "", is_active: true,
  is_caution: false, caution_note: "", volatility_type: "NONE",
};

// EU CosIng(Cosmetic Ingredient Database)의 Function 분류 참고 목록.
// 공식 DB(ec.europa.eu/growth/tools-databases/cosing)에서 실제 사용되는 대표 카테고리를 정리한 것으로,
// 전체 목록이 수시로 갱신될 수 있어 목록에 없는 값은 직접 입력도 가능하게 함(datalist 방식).
const COSING_FUNCTIONS = [
  "ABRASIVE", "ANTICAKING", "ANTICORROSIVE", "ANTIDANDRUFF", "ANTIFOAMING", "ANTIMICROBIAL",
  "ANTIOXIDANT", "ANTIPERSPIRANT", "ANTIPLAQUE", "ANTISEBORRHOEIC", "ANTISTATIC", "ASTRINGENT",
  "BINDING", "BLEACHING", "BUFFERING", "BULKING", "CHELATING", "CLEANSING", "DENATURANT",
  "DEODORANT", "DEPILATORY", "EMOLLIENT", "EMULSIFYING", "EMULSION STABILISING", "EXFOLIANT",
  "FILM FORMING", "FLAVOURING", "FOAM BOOSTING", "FOAMING", "FRAGRANCE", "GEL FORMING",
  "HAIR CONDITIONING", "HAIR DYEING", "HAIR FIXING", "HUMECTANT", "HYDROTROPE", "KERATOLYTIC",
  "LIGHT STABILIZER", "MASKING", "NAIL CONDITIONING", "OPACIFYING", "ORAL CARE", "OXIDISING",
  "PERFUMING", "PLASTICISER", "PRESERVATIVE", "PROPELLANT", "REDUCING", "REFATTING", "REFRESHING",
  "SKIN CONDITIONING", "SKIN CONDITIONING - EMOLLIENT", "SKIN CONDITIONING - HUMECTANT",
  "SKIN CONDITIONING - MISCELLANEOUS", "SKIN CONDITIONING - OCCLUSIVE", "SKIN PROTECTING",
  "SMOOTHING", "SOLVENT", "SOOTHING", "STABILISING", "SUNSCREEN AGENT", "SURFACTANT",
  "SURFACTANT - CLEANSING", "SURFACTANT - EMULSIFYING", "SURFACTANT - FOAM BOOSTING",
  "SURFACTANT - FOAMING", "SURFACTANT - HYDROTROPE", "SURFACTANT - SOLUBILIZING", "TONIC",
  "UV ABSORBER", "UV FILTER", "VISCOSITY CONTROLLING",
] as const;

const emptyComp: Component = {
  inci_en: "", inci_kr: "", cas_no: "", ec_no: "", composition_percent: "", function_kr: "",
  is_allergen: false, allergen_id: null,
};

export default function RawMaterialManager() {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteMaterials;
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<RawMaterialListItem[]>([]);
  const [rm, setRm] = useState<RawMaterial>(emptyRm);
  const [comps, setComps] = useState<Component[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // 성분 자동완성 상태 (구성성분 표의 INCI 국문 입력에서만 사용)
  const [hits, setHits] = useState<IngredientHit[]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number } | null>(null);
  const [inciSearchLoading, setInciSearchLoading] = useState(false);
  const compInciRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [dropdownPos, setDropdownPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  // 알러젠 마스터 목록 (구성성분 표의 알러젠 선택 드롭다운 + 자동 감지 매칭용)
  const [allergens, setAllergens] = useState<AllergenMaster[]>([]);
  useEffect(() => { fetchAllergenMaster().then(setAllergens).catch(() => setAllergens([])); }, []);
  // 자동 감지로 체크/선택된 행 번호 (수동으로 다시 만지면 이 표시는 사라짐 - 실제 저장값과는 무관한 화면 전용 상태)
  const [autoDetectedRows, setAutoDetectedRows] = useState<Set<number>>(new Set());

  function clearAutoDetected(i: number) {
    setAutoDetectedRows((s) => {
      if (!s.has(i)) return s;
      const next = new Set(s);
      next.delete(i);
      return next;
    });
  }

  // CAS 번호 일치 우선, 그다음 INCI 영문명 일치(대소문자/공백 무시)로 알러젠 마스터와 매칭
  function matchAllergen(inciEn: string, casNo: string): AllergenMaster | null {
    const cas = (casNo || "").trim();
    if (cas) {
      const casHit = allergens.find((a) => a.cas_no && a.cas_no.trim() === cas);
      if (casHit) return casHit;
    }
    const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    const inci = norm(inciEn || "");
    if (inci) {
      const inciHit = allergens.find((a) => norm(a.allergen_name_en) === inci);
      if (inciHit) return inciHit;
    }
    return null;
  }

  // INCI 영문 / CAS 입력 시 알러젠 자동 감지: 매칭되면 체크박스+드롭다운을 자동으로 채움 (수동 입력은 계속 가능)
  function updateCompDetect(i: number, key: "inci_en" | "cas_no", val: string) {
    setComps((prev) => {
      const next = prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c));
      const match = matchAllergen(next[i].inci_en || "", next[i].cas_no || "");
      if (match) {
        next[i] = { ...next[i], is_allergen: true, allergen_id: match.id };
        setAutoDetectedRows((s) => new Set(s).add(i));
      }
      return next;
    });
  }

  useEffect(() => {
    if (!activeCell || hits.length === 0) {
      setDropdownPos(null);
      return;
    }
    const el = compInciRefs.current[activeCell.row];
    if (!el) {
      setDropdownPos(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const estimatedHeight = Math.min(hits.length * 40 + 8, 240);
    const spaceBelow = window.innerHeight - r.bottom;
    // 아래쪽 공간이 부족하고 위쪽 공간이 더 넓으면 입력창 위로 뒤집어서 연다
    if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
      setDropdownPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
    } else {
      setDropdownPos({ left: r.left, width: r.width, top: r.bottom });
    }
  }, [activeCell, hits]);

  // 원료 목록 검색창 자동완성 상태
  const [searchHits, setSearchHits] = useState<RawMaterialListItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchDropdownPos, setSearchDropdownPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  useEffect(() => {
    if (!searchOpen || searchHits.length === 0 || !searchInputRef.current) {
      setSearchDropdownPos(null);
      return;
    }
    const r = searchInputRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(searchHits.length * 44 + 8, 280);
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
      setSearchDropdownPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
    } else {
      setSearchDropdownPos({ left: r.left, width: r.width, top: r.bottom });
    }
  }, [searchOpen, searchHits]);

  // CSV 다운로드
  const [downloadBusy, setDownloadBusy] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const load = useCallback(async () => {
    setListLoading(true);
    try { setList(await fetchRawMaterials(keyword)); }
    catch (e: any) { setMsg("목록 조회 오류: " + e.message); }
    finally { setListLoading(false); }
  }, [keyword]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  // 검색창 자동완성: 입력 300ms debounce 후 조회
  function onSearchKeywordChange(value: string) {
    setKeyword(value);
    setSearchOpen(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try { setSearchHits(await searchRawMaterialsAutocomplete(value.trim())); }
      catch { setSearchHits([]); }
      finally { setSearchLoading(false); }
    }, 300);
  }

  async function pickSearchHit(item: RawMaterialListItem) {
    setKeyword(item.raw_code);
    setSearchOpen(false);
    setSearchHits([]);
    await selectRm(item);
    try { setList(await fetchRawMaterials(item.raw_code)); } catch { /* 목록 갱신 실패는 무시 */ }
  }

  // 목록 뷰엔 편집에 필요한 필드(moq, cas_no 등)가 없어서, 선택 시 원본 테이블에서 단건 다시 조회
  async function selectRm(item: RawMaterialListItem) {
    setMsg("불러오는 중...");
    try {
      const full = await fetchRawMaterialByCode(item.raw_code);
      setRm(full);
      setComps(await fetchComponents(full.raw_code));
      setAutoDetectedRows(new Set());
      setMsg("");
    } catch (e: any) {
      setMsg("원료 조회 오류: " + e.message);
    }
  }

  function newRm() {
    setRm({ ...emptyRm });
    setComps([]);
    setAutoDetectedRows(new Set());
    setMsg("새 원료 입력 모드");
  }

  async function handleDelete(item: RawMaterialListItem) {
    if (!canWrite) return;
    if (!confirm(`"${item.raw_name}"(${item.raw_code})을(를) 삭제하시겠습니까?\n(처방에 이미 쓰인 이력을 보존하기 위해 목록에서만 숨겨지고, 완전히 지워지진 않습니다.)`)) return;
    try {
      await deleteRawMaterial(item.raw_code);
      if (rm.raw_code === item.raw_code) newRm();
      setMsg("삭제 완료: " + item.raw_code);
      await load();
    } catch (e: any) {
      setMsg("삭제 오류: " + e.message);
    }
  }

  // 원료 목록 CSV 다운로드 (업로드 양식과 컬럼 순서/이름 동일 - 다운받아 채워서 그대로 재업로드 가능)
  async function handleDownloadCsv() {
    setDownloadBusy(true);
    try {
      const rows = await fetchRawMaterialsForExport();
      const csv = buildRawMaterialsCsv(rows);
      const today = new Date();
      const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      downloadTextFile(`원료목록_${ymd}.csv`, csv);
      setMsg(`CSV 다운로드 완료 (${rows.length}건)`);
    } catch (e: any) {
      setMsg("CSV 다운로드 오류: " + e.message);
    } finally {
      setDownloadBusy(false);
    }
  }

  // INCI 입력 → 자동완성 검색
  async function onInciSearch(value: string, row: number) {
    setActiveCell({ row });
    updateComp(row, "inci_kr", value);
    if (value.trim().length >= 1) {
      setInciSearchLoading(true);
      try { setHits(await searchIngredients(value.trim())); }
      catch { setHits([]); }
      finally { setInciSearchLoading(false); }
    } else {
      setHits([]);
      setInciSearchLoading(false);
    }
  }

  // 자동완성 항목 선택 → CAS/EC 자동 채움 + 알러젠 자동 감지
  function pickHit(h: IngredientHit) {
    if (!activeCell) return;
    const row = activeCell.row;
    const patch = {
      inci_en: h.inci_en ?? "", inci_kr: h.inci_kr ?? "",
      inci_cn: h.inci_cn ?? "", inci_jp: h.inci_jp ?? "",
      cas_no: h.cas_no ?? "", ec_no: h.ec_no ?? "",
      function_kr: h.function_kr ?? "", function_en: h.function_en ?? "",
    };
    setComps((p) => {
      const next = p.map((c, i) => (i === row ? { ...c, ...patch } : c));
      const match = matchAllergen(next[row].inci_en || "", next[row].cas_no || "");
      if (match) {
        next[row] = { ...next[row], is_allergen: true, allergen_id: match.id };
        setAutoDetectedRows((s) => new Set(s).add(row));
      }
      return next;
    });
    setHits([]);
    setActiveCell(null);
  }

  function updateComp(i: number, key: keyof Component, val: string | boolean | null) {
    setComps((p) => p.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));
  }
  function addRow() { setComps((p) => [...p, { ...emptyComp }]); }
  // parent_component_no는 1-based 행 번호(저장 시 그 행의 component_no)를 가리킨다.
  // 삭제된 행을 부모로 삼던 자식은 참조를 해제하고, 삭제된 행보다 뒤에 있던 부모 참조는 1씩 당긴다.
  function delRow(i: number) {
    const deletedPos = i + 1;
    setComps((p) =>
      p
        .filter((_, idx) => idx !== i)
        .map((c) => {
          if (!c.parent_component_no) return c;
          if (c.parent_component_no === deletedPos) return { ...c, parent_component_no: null };
          if (c.parent_component_no > deletedPos) return { ...c, parent_component_no: c.parent_component_no - 1 };
          return c;
        })
    );
    setAutoDetectedRows((s) => {
      const next = new Set<number>();
      for (const idx of s) {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      }
      return next;
    });
  }
  function updateParentComponent(i: number, value: string) {
    setComps((p) => p.map((c, idx) => (idx === i ? { ...c, parent_component_no: value ? Number(value) : null } : c)));
  }

  async function handleSave() {
    if (!canWrite) { setMsg("열람 권한만 있어 저장할 수 없습니다."); return; }
    if (!rm.raw_code.trim()) { setMsg("원료코드를 입력하세요."); return; }
    if (!rm.raw_name.trim()) { setMsg("원료명을 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      if (await checkRawCodeExists(rm.raw_code.trim(), rm.id)) {
        setMsg("이미 사용 중인 원료코드입니다");
        setToast({ type: "error", text: "이미 사용 중인 원료코드입니다" });
        return;
      }
      // 대표 INCI 입력란이 없어졌으므로, 구성성분 1번 행 값을 원료 상위 필드로 동기화
      // (처방관리 원료 검색, AI 어시스턴트 등 plm_raw_materials.inci_kr/inci_en/cas_no/ec_no를 직접 참조하는
      //  다른 화면이 계속 정상 동작하도록 하기 위함 - grep으로 확인 완료)
      const first = comps[0];
      const rmToSave = first
        ? { ...rm, inci_kr: first.inci_kr || "", inci_en: first.inci_en || "", cas_no: first.cas_no || "", ec_no: first.ec_no || "" }
        : rm;
      await saveRawMaterial(rmToSave);
      if (comps.length > 0) await saveComponents(rm.raw_code, comps);
      setRm(rmToSave);
      setMsg("저장 완료: " + rm.raw_code);
      setToast({ type: "success", text: "저장되었습니다: " + rm.raw_code });
      await load();
    } catch (e: any) {
      setMsg("저장 오류: " + e.message);
      setToast({ type: "error", text: "저장 실패: " + e.message });
    }
    finally { setSaving(false); }
  }

  const compSum = sumComposition(comps);

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료 관리</h1>
          <p className="v50-desc">모든 원료의 INCI는 아래 구성성분 표에서 입력합니다 (단일 성분이면 행 1개만 등록). INCI 국문 입력 시 CAS·EC가 자동완성됩니다.</p>
        </div>
        {canWrite && <button className="v50-button" onClick={newRm}>+ 새 원료</button>}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      {/* 원료 목록 - 전체 폭 */}
      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>원료 목록</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="v50-button-light" onClick={() => load()} disabled={listLoading}>
              {listLoading ? "새로고침 중…" : "새로고침"}
            </button>
            {auth.canExportData && (
              <button className="v50-button-light" onClick={handleDownloadCsv} disabled={downloadBusy}>
                {downloadBusy ? "다운로드 중…" : "CSV 다운로드"}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12, position: "relative" }}>
          <input className="v50-input" ref={searchInputRef} value={keyword} onChange={(e) => onSearchKeywordChange(e.target.value)}
            onFocus={() => keyword.trim() && setSearchOpen(true)}
            placeholder="코드/원료명/Trade/INCI/비고 검색" onKeyDown={(e) => e.key === "Enter" && (setSearchOpen(false), load())} style={{ flex: 1 }} />
          <button className="v50-button" onClick={() => { setSearchOpen(false); load(); }}>검색</button>
          {searchOpen && searchLoading && (
            <span style={{ position: "absolute", left: 8, top: -18, fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
          )}
          {searchOpen && searchHits.length > 0 && searchDropdownPos &&
            createPortal(<RawSearchDropdown hits={searchHits} onPick={pickSearchHit} pos={searchDropdownPos} />, document.body)}
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>코드</th><th>원료명</th><th>INCI</th><th>제조사</th><th>단가</th><th>비고</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.raw_code} style={{ background: rm.raw_code === r.raw_code ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.raw_code}</td>
                  <td
                    style={{ cursor: "pointer", color: r.is_caution ? "#dc2626" : undefined, fontWeight: r.is_caution ? 700 : undefined }}
                    onClick={() => selectRm(r)}
                    title={r.is_caution ? (r.caution_note || "주의 원료") : undefined}
                  >
                    {r.raw_name}{r.is_caution && " ⚠"}
                  </td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.inci_display}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.manufacturer || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>
                    {r.unit_price != null ? `${Number(r.unit_price).toLocaleString()}${r.currency ? " " + r.currency : ""}` : "-"}
                  </td>
                  <td
                    style={{ cursor: "pointer", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onClick={() => selectRm(r)}
                    title={r.note || undefined}
                  >
                    {r.note || "-"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectRm(r)}>{canWrite ? "수정" : "보기"}</button>
                      {canWrite && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r)}>삭제</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7}>원료가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* 원료 상세 + 구성성분 - 전체 폭 */}
      <section className="v50-panel">
        <h2>{rm.raw_code ? `원료 편집 · ${rm.raw_code}` : "새 원료 등록"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
          <Field label="원료코드*">
            <input className="v50-input" value={rm.raw_code} onChange={(e) => setRm({ ...rm, raw_code: e.target.value })} />
          </Field>
          <Field label="원료명*"><input className="v50-input" value={rm.raw_name} onChange={(e) => setRm({ ...rm, raw_name: e.target.value })} /></Field>
          <Field label="Trade name"><input className="v50-input" value={rm.trade_name || ""} onChange={(e) => setRm({ ...rm, trade_name: e.target.value })} /></Field>
          <CompanyAutocompleteField
            label="Manufacturer" preferredCategory="제조사"
            value={rm.manufacturer || ""} companyId={rm.manufacturer_company_id}
            onChange={(patch) => setRm({ ...rm, manufacturer: patch.value, manufacturer_company_id: patch.companyId })}
          />
          <CompanyAutocompleteField
            label="Supplier" preferredCategory="공급사"
            value={rm.supplier || ""} companyId={rm.supplier_company_id}
            onChange={(patch) => setRm({ ...rm, supplier: patch.value, supplier_company_id: patch.companyId })}
          />
          <Field label="단가"><input className="v50-input" type="number" value={rm.unit_price ?? ""} onChange={(e) => setRm({ ...rm, unit_price: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          <Field label="MOQ"><input className="v50-input" value={rm.moq || ""} onChange={(e) => setRm({ ...rm, moq: e.target.value })} /></Field>
          <Field label="Lead time"><input className="v50-input" value={rm.lead_time || ""} onChange={(e) => setRm({ ...rm, lead_time: e.target.value })} /></Field>
          <Field label="Origin"><input className="v50-input" value={rm.origin_country || ""} onChange={(e) => setRm({ ...rm, origin_country: e.target.value })} /></Field>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!rm.is_caution} onChange={(e) => setRm({ ...rm, is_caution: e.target.checked })} />
              <span style={{ color: rm.is_caution ? "#dc2626" : undefined }}>⚠ 주의 원료</span>
            </label>
            <Field label="주의 사유 (예: 수급불안, 단종 예정 등)">
              <input className="v50-input" value={rm.caution_note || ""} onChange={(e) => setRm({ ...rm, caution_note: e.target.value })} />
            </Field>
            <Field label="휘발성 유형 (건조 후 전성분 계산용)">
              <select className="v50-input" value={rm.volatility_type || "NONE"}
                onChange={(e) => setRm({ ...rm, volatility_type: e.target.value as RawMaterial["volatility_type"] })}>
                <option value="NONE">없음</option>
                <option value="FULL_VOLATILE">완전휘발</option>
                <option value="PARTIAL_RESIDUAL">부분잔류</option>
              </select>
            </Field>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "flex-end" }}>
            <Field label="Function (COSING 기준, 목록에 없으면 직접 입력)">
              <input className="v50-input" list="cosing-function-options" style={{ minWidth: 260 }}
                value={rm.function_en || ""} onChange={(e) => setRm({ ...rm, function_en: e.target.value })}
                placeholder="예: SKIN CONDITIONING" />
              <datalist id="cosing-function-options">
                {COSING_FUNCTIONS.map((f) => <option key={f} value={f} />)}
              </datalist>
            </Field>
            <Field label="Function 국문 (선택)">
              <input className="v50-input" value={rm.function_kr || ""}
                onChange={(e) => setRm({ ...rm, function_kr: e.target.value })} placeholder="예: 피부컨디셔닝" />
            </Field>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="비고">
              <textarea className="v50-textarea" rows={3}
                value={rm.note || ""} onChange={(e) => setRm({ ...rm, note: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* 구성성분 — 모든 원료(단일/복합 공통)의 INCI를 여기서 입력. 단일 성분이면 행 1개(구성비 100%)만 등록 */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>구성성분</h2>
            <span style={{ fontSize: 12, fontWeight: 800, color: Math.abs(compSum - 100) < 0.01 || compSum === 0 ? "#16a34a" : "#dc2626" }}>
              구성비 합계 {compSum}%
            </span>
          </div>
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>#</th><th>INCI 국문</th><th>INCI 영문</th><th>구성비%</th><th>CAS</th><th>EC</th><th>알러젠</th><th></th></tr></thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={i} style={c.parent_component_no ? { background: "#f8fafc" } : undefined}>
                    <td>{c.parent_component_no ? `↳ ${i + 1}` : i + 1}</td>
                    <td style={c.parent_component_no ? { paddingLeft: 20 } : undefined}>
                      <input className="v50-input" ref={(el) => { compInciRefs.current[i] = el; }}
                        value={c.inci_kr || ""} onChange={(e) => onInciSearch(e.target.value, i)} />
                      {activeCell?.row === i && inciSearchLoading && (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
                      )}
                      {activeCell?.row === i && hits.length > 0 && dropdownPos &&
                        createPortal(<Dropdown hits={hits} onPick={pickHit} pos={dropdownPos} />, document.body)}
                    </td>
                    <td><input className="v50-input" value={c.inci_en || ""} onChange={(e) => updateCompDetect(i, "inci_en", e.target.value)} /></td>
                    <td><input className="v50-input" type="number" style={{ width: 72 }} value={c.composition_percent as any || ""} onChange={(e) => updateComp(i, "composition_percent", e.target.value)} /></td>
                    <td><input className="v50-input" value={c.cas_no || ""} onChange={(e) => updateCompDetect(i, "cas_no", e.target.value)} /></td>
                    <td><input className="v50-input" value={c.ec_no || ""} onChange={(e) => updateComp(i, "ec_no", e.target.value)} /></td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, flexWrap: "wrap" }}>
                          <input type="checkbox" checked={!!c.is_allergen}
                            onChange={(e) => { updateComp(i, "is_allergen", e.target.checked); clearAutoDetected(i); }} />
                          알러젠
                          {autoDetectedRows.has(i) && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "1px 6px", borderRadius: 999 }}>
                              자동 감지
                            </span>
                          )}
                        </label>
                        {c.is_allergen && (
                          <select className="v50-input" style={{ fontSize: 12, padding: "4px 6px" }}
                            value={c.allergen_id || ""} onChange={(e) => { updateComp(i, "allergen_id", e.target.value || null); clearAutoDetected(i); }}>
                            <option value="">선택...</option>
                            {allergens.map((a) => (
                              <option key={a.id} value={a.id}>{a.allergen_name_kr || a.allergen_name_en}</option>
                            ))}
                          </select>
                        )}
                        {c.is_allergen && (
                          <select className="v50-input" style={{ fontSize: 12, padding: "4px 6px" }}
                            value={c.parent_component_no || ""} onChange={(e) => updateParentComponent(i, e.target.value)}
                            title="이 성분이 자연 함유된 상위 원료(성분) 행을 지정하면, 구성비 합계 계산에서 이 행은 제외됩니다.">
                            <option value="">상위 성분 없음(독립 성분)</option>
                            {comps.map((other, j) => {
                              if (j === i || other.parent_component_no) return null; // 자기 자신 제외, 이미 자식인 행은 다단계 체인 방지로 후보에서 제외
                              return (
                                <option key={j} value={j + 1}>
                                  {j + 1}. {other.inci_kr || other.inci_en || "(이름 없음)"}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </td>
                    <td><button className="v50-button-light" onClick={() => delRow(i)}>삭제</button></td>
                  </tr>
                ))}
                {comps.length === 0 && <tr><td colSpan={8} style={{ color: "#94a3b8" }}>등록된 성분이 없습니다. 아래 버튼으로 성분을 추가하세요 (단일 성분이면 1개만 등록).</td></tr>}
              </tbody>
            </table>
          </div>
          <button className="v50-button-light" style={{ marginTop: 8 }} onClick={addRow}>+ 구성성분 행 추가</button>
        </div>

        {canWrite && (
          <div style={{ marginTop: 18 }}>
            <button className="v50-button" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중…" : "원료 저장"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// Manufacturer/Supplier 자동완성 - plm_companies에서 이름을 검색하고 고르면 canonical 이름 + company_id를 함께 반영한다.
// preferredCategory에 속한 업체를 우선 정렬해서 보여주되, 검색 자체는 구분과 무관하게 전체 대상이라 데이터가
// 완벽히 분류돼있지 않아도 막히지 않는다. 검색 결과에 없으면 그 자리에서 "새 업체 추가"로 즉시 등록 가능.
type CompanyOrAddNew = Company | { __new: true };

function CompanyAutocompleteField({
  label, preferredCategory, value, companyId, onChange,
}: {
  label: string;
  preferredCategory: CompanyCategory;
  value: string;
  companyId?: string | null;
  onChange: (patch: { value: string; companyId: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hits, setHits] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ name_kr: string; name_en: string; country: string; contact: string } | null>(null);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDropdown = open && !quickAdd && value.trim().length > 0;
  const showQuickAdd = open && !!quickAdd;
  // useAnchorPosition은 hits 배열의 "길이"만 위치 추정에 쓰지만 참조 자체를 의존성으로 보므로,
  // 매 렌더마다 새 배열 리터럴을 넘기면 effect가 매번 재실행되어 무한 렌더 루프에 빠진다 - 길이가 실제로
  // 바뀔 때만 새 배열을 만들도록 useMemo로 참조를 고정한다.
  const estimateCount = showQuickAdd ? 6 : showDropdown ? hits.length + 1 : 0;
  const estimateItems = useMemo(() => new Array(estimateCount).fill(0), [estimateCount]);
  const pos = useAnchorPosition(showDropdown || showQuickAdd ? "open" : null, () => inputRef.current, estimateItems);

  function onInputChange(v: string) {
    onChange({ value: v, companyId: null });
    setOpen(true);
    setQuickAdd(null);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) { setHits([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try { setHits(await searchCompaniesAutocomplete(v.trim(), preferredCategory)); }
      catch { setHits([]); }
      finally { setLoading(false); }
    }, 300);
  }

  function pick(hit: Company) {
    const kw = value.trim().toLowerCase();
    const matchedKr = !!hit.name_kr && hit.name_kr.toLowerCase().includes(kw);
    const matchedEn = !!hit.name_en && hit.name_en.toLowerCase().includes(kw);
    const chosen = matchedKr ? hit.name_kr! : matchedEn ? hit.name_en! : hit.name_kr || hit.name_en || "";
    onChange({ value: chosen, companyId: hit.id! });
    setOpen(false);
    setHits([]);
  }

  function openQuickAdd() {
    setQuickAdd({ name_kr: value.trim(), name_en: "", country: "", contact: "" });
  }

  async function saveQuickAdd() {
    if (!quickAdd) return;
    if (!quickAdd.name_kr.trim() && !quickAdd.name_en.trim()) return;
    setQuickAddSaving(true);
    try {
      const saved = await saveCompany({
        category: [preferredCategory],
        name_kr: quickAdd.name_kr.trim(),
        name_en: quickAdd.name_en.trim(),
        country: quickAdd.country.trim(),
        contact: quickAdd.contact.trim(),
      });
      onChange({ value: saved.name_kr || saved.name_en || "", companyId: saved.id! });
      setOpen(false);
      setQuickAdd(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "업체 등록 오류");
    } finally {
      setQuickAddSaving(false);
    }
  }

  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <input className="v50-input" ref={inputRef} value={value}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => value.trim() && setOpen(true)}
          placeholder={`${preferredCategory} 검색 또는 직접 입력`} />
        {companyId && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>업체관리와 연동됨</span>}
        {showDropdown && loading && <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>}
        {showDropdown && pos && createPortal(
          <SearchDropdown<CompanyOrAddNew>
            hits={[...hits, { __new: true }]}
            pos={pos}
            keyExtractor={(item) => ("__new" in item ? "__new__" : item.id!)}
            onPick={(item) => ("__new" in item ? openQuickAdd() : pick(item))}
            renderItem={(item) =>
              "__new" in item ? (
                <span style={{ color: "#2563eb", fontWeight: 700 }}>+ 새 업체 추가{value.trim() ? `: "${value.trim()}"` : ""}</span>
              ) : (
                <span>
                  <b>{item.name_kr || item.name_en}</b>
                  {item.name_kr && item.name_en && <span style={{ color: "#64748b", marginLeft: 6 }}>{item.name_en}</span>}
                  {item.category?.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: item.category.includes(preferredCategory) ? "#1d4ed8" : "#94a3b8" }}>
                      [{item.category.join(", ")}]
                    </span>
                  )}
                </span>
              )
            }
          />,
          document.body
        )}
        {showQuickAdd && pos && createPortal(
          <div style={{
            position: "fixed", zIndex: 1000, left: pos.left, width: Math.max(pos.width, 260), top: pos.top, bottom: pos.bottom,
            background: "white", border: "1px solid #cbd5e1", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: 10, display: "grid", gap: 6,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>새 업체 등록 ({preferredCategory})</div>
            <input className="v50-input" placeholder="업체명 국문" value={quickAdd!.name_kr} onChange={(e) => setQuickAdd({ ...quickAdd!, name_kr: e.target.value })} />
            <input className="v50-input" placeholder="업체명 영문" value={quickAdd!.name_en} onChange={(e) => setQuickAdd({ ...quickAdd!, name_en: e.target.value })} />
            <input className="v50-input" placeholder="국가/지역 (선택)" value={quickAdd!.country} onChange={(e) => setQuickAdd({ ...quickAdd!, country: e.target.value })} />
            <input className="v50-input" placeholder="담당자 연락처 (선택)" value={quickAdd!.contact} onChange={(e) => setQuickAdd({ ...quickAdd!, contact: e.target.value })} />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {/* 이 팝업은 createPortal로 document.body에 붙어서 .v50-root 밖으로 나가기 때문에,
                  .v50-button 등 클래스가 의존하는 CSS 변수(--blue/--text/--line)를 상속받지 못해
                  버튼이 안 보이는 문제가 있었다. 리터럴 색상값을 인라인으로 직접 지정해서 고정한다. */}
              <button
                type="button" onClick={() => setQuickAdd(null)}
                style={{
                  border: "1px solid #e2e8f0", background: "white", color: "#0f172a",
                  borderRadius: 13, padding: "11px 15px", fontWeight: 900, cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button" disabled={quickAddSaving} onClick={saveQuickAdd}
                style={{
                  border: 0, background: "#2563eb", color: "white",
                  borderRadius: 13, padding: "11px 15px", fontWeight: 900,
                  cursor: quickAddSaving ? "default" : "pointer", opacity: quickAddSaving ? 0.7 : 1,
                }}
              >
                {quickAddSaving ? "저장 중…" : "등록"}
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </Field>
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

function RawSearchDropdown({ hits, onPick, pos }: { hits: RawMaterialListItem[]; onPick: (item: RawMaterialListItem) => void; pos: { left: number; width: number; top?: number; bottom?: number } }) {
  return (
    <div style={{
      position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflow: "auto", textAlign: "left",
    }}>
      {hits.map((item) => (
        <div key={item.raw_code} onClick={() => onPick(item)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          title={item.is_caution ? (item.caution_note || "주의 원료") : undefined}>
          <b>{item.raw_code}</b>{" "}
          <span style={{ color: item.is_caution ? "#dc2626" : undefined, fontWeight: item.is_caution ? 700 : undefined }}>
            {item.raw_name}{item.is_caution && " ⚠"}
          </span>
          {item.inci_display && <span style={{ color: "#64748b", marginLeft: 8 }}>{item.inci_display}</span>}
          {item.note && (
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              비고: {item.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Dropdown({ hits, onPick, pos }: { hits: IngredientHit[]; onPick: (h: IngredientHit) => void; pos: { left: number; width: number; top?: number; bottom?: number } }) {
  return (
    <div style={{
      position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflow: "auto",
    }}>
      {hits.map((h, i) => (
        <div key={i} onClick={() => onPick(h)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          <b>{h.inci_kr}</b> <span style={{ color: "#64748b" }}>{h.inci_en}</span>
          {h.cas_no && <span style={{ color: "#16a34a", marginLeft: 8 }}>CAS {h.cas_no}</span>}
        </div>
      ))}
    </div>
  );
}
