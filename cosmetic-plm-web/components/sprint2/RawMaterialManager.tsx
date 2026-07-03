"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  fetchRawMaterials, fetchRawMaterialByCode, searchIngredients, saveRawMaterial, deleteRawMaterial,
  fetchComponents, saveComponents, sumComposition,
  bulkUpdateUnitPrices,
  type RawMaterial, type RawMaterialListItem, type Component, type IngredientHit, type PriceUpdateRow,
} from "@/services/sprint2/rawMaterialService";
import "@/styles/enterprise-v50.css";

const emptyRm: RawMaterial = {
  raw_code: "", raw_name: "", trade_name: "", manufacturer: "", supplier: "",
  unit_price: null, moq: "", lead_time: "", origin_country: "",
  inci_kr: "", inci_en: "", cas_no: "", ec_no: "", function_kr: "", is_active: true,
};

const emptyComp: Component = {
  inci_en: "", inci_kr: "", cas_no: "", ec_no: "", composition_percent: "", function_kr: "",
};

export default function RawMaterialManager() {
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<RawMaterialListItem[]>([]);
  const [rm, setRm] = useState<RawMaterial>(emptyRm);
  const [comps, setComps] = useState<Component[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // 성분 자동완성 상태
  const [hits, setHits] = useState<IngredientHit[]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number; scope: "rm" | "comp" } | null>(null);
  const rmInciRef = useRef<HTMLInputElement | null>(null);
  const compInciRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [dropdownPos, setDropdownPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  useEffect(() => {
    if (!activeCell || hits.length === 0) {
      setDropdownPos(null);
      return;
    }
    const el = activeCell.scope === "rm" ? rmInciRef.current : compInciRefs.current[activeCell.row];
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

  // CSV 단가 일괄 반영 상태
  const [csvRows, setCsvRows] = useState<PriceUpdateRow[]>([]);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvMsg, setCsvMsg] = useState("");

  const load = useCallback(async () => {
    try { setList(await fetchRawMaterials(keyword)); }
    catch (e: any) { setMsg("목록 조회 오류: " + e.message); }
  }, [keyword]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  // 목록 뷰엔 편집에 필요한 필드(moq, cas_no 등)가 없어서, 선택 시 원본 테이블에서 단건 다시 조회
  async function selectRm(item: RawMaterialListItem) {
    setMsg("불러오는 중...");
    try {
      const full = await fetchRawMaterialByCode(item.raw_code);
      setRm(full);
      setComps(await fetchComponents(full.raw_code));
      setMsg("");
    } catch (e: any) {
      setMsg("원료 조회 오류: " + e.message);
    }
  }

  function newRm() {
    setRm({ ...emptyRm });
    setComps([]);
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

  // CSV 업로드 → raw_code, unit_price 파싱 (헤더: raw_code/원료코드, unit_price/단가)
  async function handleCsvFile(file: File) {
    setCsvMsg("파싱 중…");
    const text = await file.text();
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const rows: PriceUpdateRow[] = [];
    let invalid = 0;
    for (const r of json) {
      const code = String(r.raw_code ?? r["원료코드"] ?? "").trim();
      const price = Number(r.unit_price ?? r["단가"]);
      if (!code || !Number.isFinite(price)) { invalid++; continue; }
      rows.push({ raw_code: code, unit_price: price });
    }
    setCsvRows(rows);
    setCsvMsg(`파싱 완료: 유효 ${rows.length}건${invalid > 0 ? `, 형식 오류로 제외 ${invalid}건` : ""}`);
  }

  async function applyCsvPrices() {
    if (csvRows.length === 0) return;
    setCsvBusy(true);
    setCsvMsg("반영 중…");
    try {
      const { updated, skipped } = await bulkUpdateUnitPrices(csvRows);
      setCsvMsg(`반영 완료: ${updated}건 업데이트${skipped > 0 ? `, DB에 없는 코드 ${skipped}건 스킵` : ""}`);
      setCsvRows([]);
      await load();
    } catch (e: any) {
      setCsvMsg("반영 오류: " + e.message);
    } finally {
      setCsvBusy(false);
    }
  }

  // INCI 입력 → 자동완성 검색
  async function onInciSearch(value: string, scope: "rm" | "comp", row: number) {
    setActiveCell({ row, scope });
    if (scope === "rm") setRm((p) => ({ ...p, inci_kr: value }));
    else updateComp(row, "inci_kr", value);
    if (value.trim().length >= 1) {
      try { setHits(await searchIngredients(value.trim())); } catch { setHits([]); }
    } else setHits([]);
  }

  // 자동완성 항목 선택 → CAS/EC 자동 채움
  function pickHit(h: IngredientHit) {
    if (!activeCell) return;
    const patch = {
      inci_en: h.inci_en ?? "", inci_kr: h.inci_kr ?? "",
      inci_cn: h.inci_cn ?? "", inci_jp: h.inci_jp ?? "",
      cas_no: h.cas_no ?? "", ec_no: h.ec_no ?? "",
      function_kr: h.function_kr ?? "", function_en: h.function_en ?? "",
    };
    if (activeCell.scope === "rm") setRm((p) => ({ ...p, ...patch }));
    else setComps((p) => p.map((c, i) => (i === activeCell.row ? { ...c, ...patch } : c)));
    setHits([]);
    setActiveCell(null);
  }

  function updateComp(i: number, key: keyof Component, val: string) {
    setComps((p) => p.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));
  }
  function addRow() { setComps((p) => [...p, { ...emptyComp }]); }
  function delRow(i: number) { setComps((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    if (!rm.raw_code.trim()) { setMsg("원료코드를 입력하세요."); return; }
    if (!rm.raw_name.trim()) { setMsg("원료명을 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      await saveRawMaterial(rm);
      if (comps.length > 0) await saveComponents(rm.raw_code, comps);
      setMsg("저장 완료: " + rm.raw_code);
      await load();
    } catch (e: any) { setMsg("저장 오류: " + e.message); }
    finally { setSaving(false); }
  }

  const compSum = sumComposition(comps);
  const isComplex = comps.length > 0;

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료 관리</h1>
          <p className="v50-desc">Trade name과 INCI만 입력하면 CAS·EC가 자동으로 채워집니다. 복합원료는 구성성분을 표에서 바로 추가하세요.</p>
        </div>
        <button className="v50-button" onClick={newRm}>+ 새 원료</button>
      </section>

      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>CSV로 단가 일괄 반영</h2>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          헤더: <code>raw_code,unit_price</code> (또는 <code>원료코드,단가</code>). DB에 이미 있는 원료코드만 반영되고, 없는 코드는 무시됩니다.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept=".csv" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCsvFile(file);
            e.target.value = "";
          }} />
          <button className="v50-button" onClick={applyCsvPrices} disabled={csvRows.length === 0 || csvBusy}>
            {csvBusy ? "반영 중…" : `일괄 반영 (${csvRows.length}건)`}
          </button>
        </div>
        {csvMsg && <p style={{ color: "#2563eb", fontWeight: 700, marginTop: 8 }}>{csvMsg}</p>}
      </section>

      {/* 원료 목록 - 전체 폭 */}
      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>원료 목록</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="코드/원료명/Trade/INCI 검색" onKeyDown={(e) => e.key === "Enter" && load()} style={{ flex: 1 }} />
          <button className="v50-button" onClick={load}>검색</button>
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>코드</th><th>원료명</th><th>INCI</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.raw_code} style={{ background: rm.raw_code === r.raw_code ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.raw_code}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.raw_name}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectRm(r)}>{r.inci_display}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectRm(r)}>수정</button>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4}>원료가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* 원료 상세 + 구성성분 - 전체 폭 */}
      <section className="v50-panel">
        <h2>{rm.raw_code ? `원료 편집 · ${rm.raw_code}` : "새 원료 등록"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
          <Field label="원료코드*"><input className="v50-input" value={rm.raw_code} onChange={(e) => setRm({ ...rm, raw_code: e.target.value })} /></Field>
          <Field label="원료명*"><input className="v50-input" value={rm.raw_name} onChange={(e) => setRm({ ...rm, raw_name: e.target.value })} /></Field>
          <Field label="Trade name"><input className="v50-input" value={rm.trade_name || ""} onChange={(e) => setRm({ ...rm, trade_name: e.target.value })} /></Field>
          <Field label="Manufacturer"><input className="v50-input" value={rm.manufacturer || ""} onChange={(e) => setRm({ ...rm, manufacturer: e.target.value })} /></Field>
          <Field label="Supplier"><input className="v50-input" value={rm.supplier || ""} onChange={(e) => setRm({ ...rm, supplier: e.target.value })} /></Field>
          <Field label="단가"><input className="v50-input" type="number" value={rm.unit_price ?? ""} onChange={(e) => setRm({ ...rm, unit_price: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          <Field label="MOQ"><input className="v50-input" value={rm.moq || ""} onChange={(e) => setRm({ ...rm, moq: e.target.value })} /></Field>
          <Field label="Lead time"><input className="v50-input" value={rm.lead_time || ""} onChange={(e) => setRm({ ...rm, lead_time: e.target.value })} /></Field>
          <Field label="Origin"><input className="v50-input" value={rm.origin_country || ""} onChange={(e) => setRm({ ...rm, origin_country: e.target.value })} /></Field>
        </div>

        {/* 단일원료 INCI (자동완성) */}
        <div style={{ position: "relative", marginBottom: 6 }}>
          <label style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>대표 INCI (단일 성분 원료용 — 입력 시 CAS·EC 자동완성. 복합원료는 아래 구성성분 표를 쓰세요)</label>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", gap: 8 }}>
            <input className="v50-input" placeholder="INCI 국문" ref={rmInciRef} value={rm.inci_kr || ""}
              onChange={(e) => onInciSearch(e.target.value, "rm", -1)} />
            <input className="v50-input" placeholder="INCI 영문" value={rm.inci_en || ""} onChange={(e) => setRm({ ...rm, inci_en: e.target.value })} />
            <input className="v50-input" placeholder="CAS" value={rm.cas_no || ""} onChange={(e) => setRm({ ...rm, cas_no: e.target.value })} />
            <input className="v50-input" placeholder="EC" value={rm.ec_no || ""} onChange={(e) => setRm({ ...rm, ec_no: e.target.value })} />
          </div>
          {activeCell?.scope === "rm" && hits.length > 0 && dropdownPos &&
            createPortal(<Dropdown hits={hits} onPick={pickHit} pos={dropdownPos} />, document.body)}
        </div>

        {/* 구성성분 (복합원료) — 엑셀식 */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>구성성분 (복합원료)</h2>
            <span style={{ fontSize: 12, fontWeight: 800, color: Math.abs(compSum - 100) < 0.01 || compSum === 0 ? "#16a34a" : "#dc2626" }}>
              {isComplex ? `구성비 합계 ${compSum}%` : "단일원료"}
            </span>
          </div>
          <div className="v50-table-wrap" style={{ marginTop: 8 }}>
            <table className="v50-table">
              <thead><tr><th>#</th><th>INCI 국문</th><th>INCI 영문</th><th>구성비%</th><th>CAS</th><th>EC</th><th></th></tr></thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <input className="v50-input" ref={(el) => { compInciRefs.current[i] = el; }}
                        value={c.inci_kr || ""} onChange={(e) => onInciSearch(e.target.value, "comp", i)} />
                      {activeCell?.scope === "comp" && activeCell.row === i && hits.length > 0 && dropdownPos &&
                        createPortal(<Dropdown hits={hits} onPick={pickHit} pos={dropdownPos} />, document.body)}
                    </td>
                    <td><input className="v50-input" value={c.inci_en || ""} onChange={(e) => updateComp(i, "inci_en", e.target.value)} /></td>
                    <td><input className="v50-input" type="number" style={{ width: 72 }} value={c.composition_percent as any || ""} onChange={(e) => updateComp(i, "composition_percent", e.target.value)} /></td>
                    <td><input className="v50-input" value={c.cas_no || ""} onChange={(e) => updateComp(i, "cas_no", e.target.value)} /></td>
                    <td><input className="v50-input" value={c.ec_no || ""} onChange={(e) => updateComp(i, "ec_no", e.target.value)} /></td>
                    <td><button className="v50-button-light" onClick={() => delRow(i)}>삭제</button></td>
                  </tr>
                ))}
                {comps.length === 0 && <tr><td colSpan={7} style={{ color: "#94a3b8" }}>단일원료입니다. 복합원료면 아래 버튼으로 구성성분을 추가하세요.</td></tr>}
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
