"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  checkMaterialCodeExists, deleteMaterial, fetchMaterialByCode, fetchMaterialFormulaLinks,
  fetchMaterials, saveMaterial, saveMaterialFormulaLinks, searchFormulasForLink, uploadMaterialPhoto,
  type FormulaLinkHit, type Material,
} from "@/services/sprint2/materialService";
import { convertImageToJpeg } from "@/lib/imageJpegConvert";
import Toast, { type ToastState } from "@/components/common/Toast";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

const emptyMaterial: Material = {
  material_code: "", material_name: "", spec: "", supplier: "", customer: "", is_active: true, weight_10x10cm: null, note: "", image_urls: [],
};

export default function MaterialManager() {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteMaterials;
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<Material[]>([]);
  const [material, setMaterial] = useState<Material>(emptyMaterial);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [listLoading, setListLoading] = useState(false);

  // 적용 개발번호 (다대다) - 저장 버튼을 눌러야 실제 반영되는 화면 전용 상태
  const [linkedFormulas, setLinkedFormulas] = useState<FormulaLinkHit[]>([]);
  const [formulaKeyword, setFormulaKeyword] = useState("");
  const [formulaHits, setFormulaHits] = useState<FormulaLinkHit[]>([]);
  const [formulaSearchOpen, setFormulaSearchOpen] = useState(false);
  const [formulaSearchLoading, setFormulaSearchLoading] = useState(false);
  const formulaInputRef = useRef<HTMLInputElement | null>(null);
  const formulaSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formulaDropdownPos, setFormulaDropdownPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  // 부자재 사진(여러 장) - 저장 버튼을 눌러야 실제 반영되는 화면 전용 상태(검수조서 사진 초안과 동일 패턴)
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoFileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setListLoading(true);
    try { setList(await fetchMaterials(keyword)); }
    catch (e: any) { setMsg("목록 조회 오류: " + e.message); }
    finally { setListLoading(false); }
  }, [keyword]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!formulaSearchOpen || formulaHits.length === 0 || !formulaInputRef.current) {
      setFormulaDropdownPos(null);
      return;
    }
    const r = formulaInputRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(formulaHits.length * 44 + 8, 280);
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
      setFormulaDropdownPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
    } else {
      setFormulaDropdownPos({ left: r.left, width: r.width, top: r.bottom });
    }
  }, [formulaSearchOpen, formulaHits]);

  function onFormulaKeywordChange(value: string) {
    setFormulaKeyword(value);
    setFormulaSearchOpen(true);
    if (formulaSearchTimer.current) clearTimeout(formulaSearchTimer.current);
    if (!value.trim()) {
      setFormulaHits([]);
      setFormulaSearchLoading(false);
      return;
    }
    setFormulaSearchLoading(true);
    formulaSearchTimer.current = setTimeout(async () => {
      try { setFormulaHits(await searchFormulasForLink(value.trim())); }
      catch { setFormulaHits([]); }
      finally { setFormulaSearchLoading(false); }
    }, 300);
  }

  function pickFormulaHit(hit: FormulaLinkHit) {
    setLinkedFormulas((prev) => (prev.some((f) => f.formula_code === hit.formula_code) ? prev : [...prev, hit]));
    setFormulaKeyword("");
    setFormulaHits([]);
    setFormulaSearchOpen(false);
  }

  function removeLinkedFormula(formulaCode: string) {
    setLinkedFormulas((prev) => prev.filter((f) => f.formula_code !== formulaCode));
  }

  // Storage 경로는 material_code와 무관한 UUID 폴더명을 쓰므로(uploadMaterialPhoto 주석 참고) 코드
  // 입력 여부와 상관없이 기술적으로는 업로드가 가능하지만, 부자재코드가 없으면 저장 시 어차피
  // 막히고(handleSave 검증) 어떤 부자재의 사진인지 추적하기도 어려우므로 UX상 먼저 입력하게 막는다.
  async function handleAddPhoto(file: File) {
    if (!material.material_code.trim()) {
      setToast({ type: "error", text: "부자재코드를 먼저 입력하세요." });
      return;
    }
    setUploadingPhoto(true);
    try {
      const jpeg = await convertImageToJpeg(file);
      const url = await uploadMaterialPhoto(jpeg);
      setMaterial((prev) => ({ ...prev, image_urls: [...(prev.image_urls || []), url] }));
    } catch (e) {
      setToast({ type: "error", text: e instanceof Error ? e.message : "사진 업로드 중 오류가 발생했습니다." });
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removePhoto(url: string) {
    setMaterial((prev) => ({ ...prev, image_urls: (prev.image_urls || []).filter((u) => u !== url) }));
  }

  async function selectMaterial(item: Material) {
    setMsg("불러오는 중...");
    try {
      const full = await fetchMaterialByCode(item.material_code);
      setMaterial(full);
      setLinkedFormulas(await fetchMaterialFormulaLinks(full.material_code));
      setMsg("");
    } catch (e: any) {
      setMsg("부자재 조회 오류: " + e.message);
    }
  }

  function newMaterial() {
    setMaterial({ ...emptyMaterial });
    setLinkedFormulas([]);
    setMsg("새 부자재 입력 모드");
  }

  async function handleDelete(item: Material) {
    if (!canWrite) return;
    if (!confirm(`"${item.material_name}"(${item.material_code})을(를) 삭제하시겠습니까?\n(생산 BOM에 이미 쓰인 이력을 보존하기 위해 목록에서만 숨겨지고, 완전히 지워지진 않습니다.)`)) return;
    try {
      await deleteMaterial(item.material_code);
      if (material.material_code === item.material_code) newMaterial();
      setMsg("삭제 완료: " + item.material_code);
      await load();
    } catch (e: any) {
      setMsg("삭제 오류: " + e.message);
    }
  }

  async function handleSave() {
    if (!canWrite) { setMsg("열람 권한만 있어 저장할 수 없습니다."); return; }
    if (!material.material_code.trim()) { setMsg("부자재코드를 입력하세요."); return; }
    if (!material.material_name.trim()) { setMsg("부자재명을 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      if (await checkMaterialCodeExists(material.material_code.trim(), material.id)) {
        setMsg("이미 사용 중인 부자재코드입니다");
        setToast({ type: "error", text: "이미 사용 중인 부자재코드입니다" });
        return;
      }
      const saved = await saveMaterial(material);
      await saveMaterialFormulaLinks(saved.material_code, linkedFormulas.map((f) => f.formula_code));
      setMaterial(saved);
      setMsg("저장 완료: " + saved.material_code);
      setToast({ type: "success", text: "저장되었습니다: " + saved.material_code });
      await load();
    } catch (e: any) {
      setMsg("저장 오류: " + e.message);
      setToast({ type: "error", text: "저장 실패: " + e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">부자재 관리</h1>
          <p className="v50-desc">용기·부자재의 코드/명칭/규격/공급사와 적용 개발번호(Development No.)를 관리합니다. 처방관리 "생산 BOM 전개"의 부자재명 자동완성과 연동됩니다.</p>
        </div>
        {canWrite && <button className="v50-button" onClick={newMaterial}>+ 새 부자재</button>}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>부자재 목록</h2>
          <button className="v50-button-light" onClick={() => load()} disabled={listLoading}>
            {listLoading ? "새로고침 중…" : "새로고침"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12 }}>
          <input className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="코드/명칭/규격/공급사/바이어 검색" onKeyDown={(e) => e.key === "Enter" && load()} style={{ flex: 1 }} />
          <button className="v50-button" onClick={() => load()}>검색</button>
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>사진</th><th>코드</th><th>명칭</th><th>규격</th><th>공급사</th><th>바이어</th><th>10x10cm 중량</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.material_code} style={{ background: material.material_code === m.material_code ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>
                    {m.image_urls && m.image_urls.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_urls[0]} alt={m.material_name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid #e2e8f0" }} />
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>-</span>
                    )}
                  </td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.material_code}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.material_name}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.spec || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.supplier || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.customer || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectMaterial(m)}>{m.weight_10x10cm ?? "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectMaterial(m)}>{canWrite ? "수정" : "보기"}</button>
                      {canWrite && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(m)}>삭제</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8}>부자재가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>{material.material_code ? `부자재 편집 · ${material.material_code}` : "새 부자재 등록"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
          <Field label="부자재코드*">
            <input className="v50-input" value={material.material_code} onChange={(e) => setMaterial({ ...material, material_code: e.target.value })} />
          </Field>
          <Field label="부자재명*">
            <input className="v50-input" value={material.material_name} onChange={(e) => setMaterial({ ...material, material_name: e.target.value })} />
          </Field>
          <Field label="규격">
            <input className="v50-input" value={material.spec || ""} onChange={(e) => setMaterial({ ...material, spec: e.target.value })} />
          </Field>
          <Field label="공급사">
            <input className="v50-input" value={material.supplier || ""} onChange={(e) => setMaterial({ ...material, supplier: e.target.value })} />
          </Field>
          <Field label="바이어">
            <input className="v50-input" value={material.customer || ""} onChange={(e) => setMaterial({ ...material, customer: e.target.value })} />
          </Field>
          <Field label="10x10cm 중량 (g)">
            <input
              className="v50-input" type="number" value={material.weight_10x10cm ?? ""}
              onChange={(e) => setMaterial({ ...material, weight_10x10cm: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="비고">
              <textarea className="v50-textarea" rows={3}
                value={material.note || ""} onChange={(e) => setMaterial({ ...material, note: e.target.value })} />
            </Field>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 4 }}>
            부자재 사진 (업로드 시 용량을 줄인 JPG로 자동 변환되어 저장됩니다)
          </label>
          {material.image_urls && material.image_urls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              {material.image_urls.map((url) => (
                <div key={url} style={{ position: "relative", width: 110, height: 110, border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="부자재 사진" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {canWrite && (
                    <button type="button" onClick={() => removePhoto(url)}
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(15,23,42,0.7)", color: "white", border: "none", borderRadius: 4, width: 20, height: 20, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {canWrite && (
            <>
              <input ref={photoFileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddPhoto(f); e.target.value = ""; }} />
              <button type="button" className="v50-button-light" disabled={uploadingPhoto} onClick={() => photoFileRef.current?.click()}>
                {uploadingPhoto ? "업로드 중…" : "+ 사진 추가"}
              </button>
              {!material.material_code.trim() && (
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>부자재코드를 먼저 입력하세요</span>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <h2 style={{ margin: "0 0 8px" }}>적용 개발번호 (Development No.)</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {linkedFormulas.map((f) => (
              <span key={f.formula_code} style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8",
                borderRadius: 999, padding: "6px 10px", fontSize: 13, fontWeight: 700,
              }}>
                {f.formula_code} · {f.formula_name}
                <button type="button" onClick={() => removeLinkedFormula(f.formula_code)}
                  style={{ border: 0, background: "transparent", color: "#1d4ed8", cursor: "pointer", fontWeight: 900, padding: 0 }}>
                  ×
                </button>
              </span>
            ))}
            {linkedFormulas.length === 0 && <span style={{ color: "#94a3b8", fontSize: 13 }}>연결된 개발번호가 없습니다.</span>}
          </div>
          <div style={{ position: "relative", maxWidth: 420 }}>
            <input className="v50-input" ref={formulaInputRef} value={formulaKeyword}
              onChange={(e) => onFormulaKeywordChange(e.target.value)}
              onFocus={() => formulaKeyword.trim() && setFormulaSearchOpen(true)}
              placeholder="처방코드·처방명으로 개발번호 검색해서 추가" />
            {formulaSearchOpen && formulaSearchLoading && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>
            )}
            {formulaSearchOpen && formulaHits.length > 0 && formulaDropdownPos &&
              createPortal(<FormulaDropdown hits={formulaHits} onPick={pickFormulaHit} pos={formulaDropdownPos} />, document.body)}
          </div>
        </div>

        {canWrite && (
          <div style={{ marginTop: 18 }}>
            <button className="v50-button" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중…" : "부자재 저장"}
            </button>
          </div>
        )}
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

function FormulaDropdown({ hits, onPick, pos }: { hits: FormulaLinkHit[]; onPick: (h: FormulaLinkHit) => void; pos: { left: number; width: number; top?: number; bottom?: number } }) {
  return (
    <div style={{
      position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflow: "auto", textAlign: "left",
    }}>
      {hits.map((h) => (
        <div key={h.formula_code} onClick={() => onPick(h)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          <b>{h.formula_code}</b> {h.formula_name}
          {h.customer && <span style={{ color: "#64748b", marginLeft: 8 }}>{h.customer}</span>}
        </div>
      ))}
    </div>
  );
}
