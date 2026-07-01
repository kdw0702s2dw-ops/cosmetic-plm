"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchRawMaterials, searchIngredients, saveRawMaterial,
  fetchComponents, saveComponents, sumComposition,
  type RawMaterial, type Component, type IngredientHit,
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
  const [list, setList] = useState<RawMaterial[]>([]);
  const [rm, setRm] = useState<RawMaterial>(emptyRm);
  const [comps, setComps] = useState<Component[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // 성분 자동완성 상태
  const [hits, setHits] = useState<IngredientHit[]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number; scope: "rm" | "comp" } | null>(null);

  const load = useCallback(async () => {
    try { setList(await fetchRawMaterials(keyword)); }
    catch (e: any) { setMsg("목록 조회 오류: " + e.message); }
  }, [keyword]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function selectRm(r: RawMaterial) {
    setRm(r);
    setMsg("");
    try { setComps(await fetchComponents(r.raw_code)); }
    catch { setComps([]); }
  }

  function newRm() {
    setRm({ ...emptyRm });
    setComps([]);
    setMsg("새 원료 입력 모드");
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

      <section className="v50-split">
        {/* 좌: 원료 목록 */}
        <article className="v50-panel">
          <h2>원료 목록</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="코드/원료명/Trade/INCI 검색" onKeyDown={(e) => e.key === "Enter" && load()} />
            <button className="v50-button" onClick={load}>검색</button>
          </div>
          <div className="v50-table-wrap" style={{ maxHeight: 520, overflow: "auto" }}>
            <table className="v50-table">
              <thead><tr><th>코드</th><th>원료명</th><th>Trade</th><th>INCI</th></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.raw_code} style={{ cursor: "pointer", background: rm.raw_code === r.raw_code ? "#eff6ff" : undefined }}
                    onClick={() => selectRm(r)}>
                    <td>{r.raw_code}</td><td>{r.raw_name}</td><td>{r.trade_name}</td><td>{r.inci_kr}</td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={4}>원료가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        {/* 우: 원료 상세 + 구성성분 */}
        <article className="v50-panel">
          <h2>{rm.raw_code ? `원료 편집 · ${rm.raw_code}` : "새 원료 등록"}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
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
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>대표 INCI (입력 시 CAS·EC 자동)</label>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", gap: 8 }}>
              <input className="v50-input" placeholder="INCI 국문" value={rm.inci_kr || ""}
                onChange={(e) => onInciSearch(e.target.value, "rm", -1)} />
              <input className="v50-input" placeholder="INCI 영문" value={rm.inci_en || ""} onChange={(e) => setRm({ ...rm, inci_en: e.target.value })} />
              <input className="v50-input" placeholder="CAS" value={rm.cas_no || ""} onChange={(e) => setRm({ ...rm, cas_no: e.target.value })} />
              <input className="v50-input" placeholder="EC" value={rm.ec_no || ""} onChange={(e) => setRm({ ...rm, ec_no: e.target.value })} />
            </div>
            {activeCell?.scope === "rm" && hits.length > 0 && (
              <Dropdown hits={hits} onPick={pickHit} />
            )}
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
                      <td style={{ position: "relative" }}>
                        <input className="v50-input" value={c.inci_kr || ""} onChange={(e) => onInciSearch(e.target.value, "comp", i)} />
                        {activeCell?.scope === "comp" && activeCell.row === i && hits.length > 0 && <Dropdown hits={hits} onPick={pickHit} />}
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
        </article>
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

function Dropdown({ hits, onPick }: { hits: IngredientHit[]; onPick: (h: IngredientHit) => void }) {
  return (
    <div style={{
      position: "absolute", zIndex: 30, top: "100%", left: 0, right: 0,
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
