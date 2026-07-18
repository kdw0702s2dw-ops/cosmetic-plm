"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  fetchRawMaterials, fetchRawMaterialByCode, searchIngredients, saveRawMaterial, deleteRawMaterial,
  fetchComponents, saveComponents, sumComposition, fetchAllergenMaster,
  checkRawCodeExists, searchRawMaterialsAutocomplete,
  fetchRawMaterialsForExport,
  type RawMaterial, type RawMaterialListItem, type Component, type IngredientHit, type AllergenMaster,
} from "@/services/sprint2/rawMaterialService";
import Toast, { type ToastState } from "@/components/common/Toast";
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
  inci_kr: "", inci_en: "", cas_no: "", ec_no: "", function_kr: "", is_active: true,
};

const emptyComp: Component = {
  inci_en: "", inci_kr: "", cas_no: "", ec_no: "", composition_percent: "", function_kr: "",
  is_allergen: false, allergen_id: null,
};

export default function RawMaterialManager() {
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
  function delRow(i: number) {
    setComps((p) => p.filter((_, idx) => idx !== i));
    setAutoDetectedRows((s) => {
      const next = new Set<number>();
      for (const idx of s) {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      }
      return next;
    });
  }

  async function handleSave() {
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
        <button className="v50-button" onClick={newRm}>+ 새 원료</button>
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
            <button className="v50-button-light" onClick={handleDownloadCsv} disabled={downloadBusy}>
              {downloadBusy ? "다운로드 중…" : "CSV 다운로드"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12, position: "relative" }}>
          <input className="v50-input" ref={searchInputRef} value={keyword} onChange={(e) => onSearchKeywordChange(e.target.value)}
            onFocus={() => keyword.trim() && setSearchOpen(true)}
            placeholder="코드/원료명/Trade/INCI 검색" onKeyDown={(e) => e.key === "Enter" && (setSearchOpen(false), load())} style={{ flex: 1 }} />
          <button className="v50-button" onClick={() => { setSearchOpen(false); load(); }}>검색</button>
          {searchOpen && searchLoading && (
            <span style={{ position: "absolute", left: 8, top: -18, fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
          )}
          {searchOpen && searchHits.length > 0 && searchDropdownPos &&
            createPortal(<RawSearchDropdown hits={searchHits} onPick={pickSearchHit} pos={searchDropdownPos} />, document.body)}
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>코드</th><th>원료명</th><th>INCI</th><th>제조사</th><th>단가</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.raw_code} style={{ background: rm.raw_code === r.raw_code ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.raw_code}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.raw_name}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.inci_display}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.manufacturer || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>
                    {r.unit_price != null ? `${Number(r.unit_price).toLocaleString()}${r.currency ? " " + r.currency : ""}` : "-"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectRm(r)}>수정</button>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6}>원료가 없습니다.</td></tr>}
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
          <Field label="Manufacturer"><input className="v50-input" value={rm.manufacturer || ""} onChange={(e) => setRm({ ...rm, manufacturer: e.target.value })} /></Field>
          <Field label="Supplier"><input className="v50-input" value={rm.supplier || ""} onChange={(e) => setRm({ ...rm, supplier: e.target.value })} /></Field>
          <Field label="단가"><input className="v50-input" type="number" value={rm.unit_price ?? ""} onChange={(e) => setRm({ ...rm, unit_price: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          <Field label="MOQ"><input className="v50-input" value={rm.moq || ""} onChange={(e) => setRm({ ...rm, moq: e.target.value })} /></Field>
          <Field label="Lead time"><input className="v50-input" value={rm.lead_time || ""} onChange={(e) => setRm({ ...rm, lead_time: e.target.value })} /></Field>
          <Field label="Origin"><input className="v50-input" value={rm.origin_country || ""} onChange={(e) => setRm({ ...rm, origin_country: e.target.value })} /></Field>
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
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
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

        <div style={{ marginTop: 18 }}>
          <button className="v50-button" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : "원료 저장"}
          </button>
        </div>
      </section>
    </div>
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
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          <b>{item.raw_code}</b> {item.raw_name}
          {item.inci_display && <span style={{ color: "#64748b", marginLeft: 8 }}>{item.inci_display}</span>}
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
