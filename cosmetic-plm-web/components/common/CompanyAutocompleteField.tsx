"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchCompanyById, searchCompaniesAutocomplete, saveCompany, type Company, type CompanyCategory,
} from "@/services/sprint2/companyService";
import SearchDropdown from "@/components/common/SearchDropdown";
import { useAnchorPosition } from "@/hooks/useAnchorPosition";

// 원료관리(원료 등록)의 Manufacturer/Supplier 자동완성 필드를 공용 컴포넌트로 뽑아낸 것 -
// 출고관리의 고객사 필드 등 "업체관리와 연동되는 입력칸"이 필요한 다른 화면에서도 그대로 재사용한다.
// plm_companies에서 이름을 검색하고 고르면 canonical 이름 + company_id를 함께 반영하며, 검색 결과에
// 없으면 그 자리에서 "새 업체 추가"로 즉시 등록할 수 있다.
type CompanyOrAddNew = Company | { __new: true };

export default function CompanyAutocompleteField({
  label, preferredCategory, value, companyId, onChange,
}: {
  label: string;
  preferredCategory: CompanyCategory;
  value: string;
  companyId?: string | null;
  // email/phone은 업체(공급사 등)에 등록된 연락처를 선택 시점에 함께 넘겨서, 호출부가 자신의
  // 이메일/전화번호 칸을 자동으로 채울 수 있게 한다 (업체에 값이 없으면 undefined, 해당 칸이 없는
  // 호출부는 그냥 무시하면 됨).
  onChange: (patch: { value: string; companyId: string | null; email?: string; phone?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hits, setHits] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // id가 있으면 "기존 업체 수정"(saveCompany가 UPDATE로 처리), 없으면 "새 업체 등록"(INSERT).
  // category는 신규 등록 시에는 이 필드가 속한 preferredCategory 하나로 시작하지만, 기존 업체를
  // 수정할 때는 그 업체가 이미 갖고 있던 구분을 그대로 보존해야 다른 화면(예: 제조사로도 등록된
  // 업체)에 영향을 주지 않는다.
  const [quickAdd, setQuickAdd] = useState<{ id?: string; category: string[]; name_kr: string; name_en: string; country: string; phone: string; email: string } | null>(null);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDropdown = open && !quickAdd && value.trim().length > 0;
  const showQuickAdd = open && !!quickAdd;
  // useAnchorPosition은 hits 배열의 "길이"만 위치 추정에 쓰지만 참조 자체를 의존성으로 보므로,
  // 매 렌더마다 새 배열 리터럴을 넘기면 effect가 매번 재실행되어 무한 렌더 루프에 빠진다 - 길이가 실제로
  // 바뀔 때만 새 배열을 만들도록 useMemo로 참조를 고정한다.
  // quickAdd(새 업체 등록/정보 수정) 팝업은 더 이상 입력창 기준 좌표(pos)를 쓰지 않는다 - 화면 중앙
  // 모달로 바꿔서, 내용 길이나 입력창 위치와 무관하게 취소/저장 버튼이 항상 보이도록 했다(아래 참고).
  const estimateItems = useMemo(() => new Array(showDropdown ? hits.length + 1 : 0).fill(0), [showDropdown, hits.length]);
  const pos = useAnchorPosition(showDropdown ? "open" : null, () => inputRef.current, estimateItems);

  // 입력창이 속한 화면이 다른 탭으로 전환되어 보이지 않게 되면(원료관리·출고관리 등 "keep-alive" 탭은
  // 언마운트되지 않고 display:none으로만 숨겨짐) 열려 있던 자동완성 팝업을 자동으로 닫는다. 이 팝업은
  // createPortal로 document.body에 바로 붙기 때문에 부모의 display:none을 타고 내려가지 않아서,
  // 안 닫아주면 탭을 옮겨도 화면 위에 계속 떠 있는 버그가 있었다.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const check = () => {
      const el = inputRef.current;
      if (el && el.offsetParent === null) {
        setOpen(false);
        setQuickAdd(null);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Esc로도 닫을 수 있게 - 팝업이 의도치 않게 화면 밖으로 밀려 취소 버튼을 못 누르는 경우의 대비책.
  useEffect(() => {
    if (!showQuickAdd) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setQuickAdd(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showQuickAdd]);

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
    onChange({ value: chosen, companyId: hit.id!, email: hit.email || undefined, phone: hit.phone || undefined });
    setOpen(false);
    setHits([]);
  }

  function openQuickAdd() {
    setQuickAdd({ category: [preferredCategory], name_kr: value.trim(), name_en: "", country: "", phone: "", email: "" });
  }

  // 이미 업체관리와 연동된(companyId가 있는) 필드 옆의 "수정" 버튼 - 그 업체의 최신 정보를 불러와
  // 같은 팝업(퀵애드와 동일 UI)에 채워서 바로 고칠 수 있게 한다. 별도 화면(업체관리)으로 이동할 필요 없음.
  async function openEditCompany() {
    if (!companyId) return;
    setEditLoading(true);
    try {
      const c = await fetchCompanyById(companyId);
      setQuickAdd({
        id: c.id, category: c.category || [preferredCategory],
        name_kr: c.name_kr || "", name_en: c.name_en || "", country: c.country || "",
        phone: c.phone || "", email: c.email || "",
      });
      setOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "업체 정보 조회 오류");
    } finally {
      setEditLoading(false);
    }
  }

  async function saveQuickAdd() {
    if (!quickAdd) return;
    if (!quickAdd.name_kr.trim() && !quickAdd.name_en.trim()) return;
    setQuickAddSaving(true);
    try {
      const saved = await saveCompany({
        id: quickAdd.id,
        category: quickAdd.category,
        name_kr: quickAdd.name_kr.trim(),
        name_en: quickAdd.name_en.trim(),
        country: quickAdd.country.trim(),
        phone: quickAdd.phone.trim(),
        email: quickAdd.email.trim(),
      });
      onChange({ value: saved.name_kr || saved.name_en || "", companyId: saved.id!, email: saved.email || undefined, phone: saved.phone || undefined });
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
        {companyId && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>업체관리와 연동됨</span>
            <button
              type="button" onClick={openEditCompany} disabled={editLoading}
              style={{
                fontSize: 11, color: "#2563eb", fontWeight: 700, background: "none", border: "none",
                padding: 0, cursor: editLoading ? "default" : "pointer", textDecoration: "underline",
              }}
            >
              {editLoading ? "불러오는 중…" : "수정"}
            </button>
          </span>
        )}
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
        {showQuickAdd && createPortal(
          // 입력창 옆에 좌표(pos)로 띄우던 팝업을 화면 중앙 모달로 바꿨다. 기존 방식은 position:fixed
          // 좌표를 여는 시점에 한 번만 계산해서 (1) 스크롤하면 입력창을 따라가지 못하고 열었던 화면
          // 위치에 그대로 떠 있었고, (2) 입력창이 화면 아래쪽에 있으면 팝업이 뷰포트 밖으로 밀려나
          // 취소/저장 버튼을 누를 수 없는 경우가 있었다. 모달은 뷰포트 중앙에 maxHeight+overflow로
          // 고정되므로 입력창 위치나 스크롤 상태와 무관하게 버튼이 항상 보인다. 배경(backdrop) 클릭 또는
          // Esc로도 닫을 수 있다.
          <div
            onClick={() => { setOpen(false); setQuickAdd(null); }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(360px, 100%)", maxHeight: "85vh", overflowY: "auto",
                background: "white", border: "1px solid #cbd5e1", borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 16, display: "grid", gap: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                {quickAdd!.id ? `업체 정보 수정 (${preferredCategory})` : `새 업체 등록 (${preferredCategory})`}
              </div>
              <input className="v50-input" placeholder="업체명 국문" value={quickAdd!.name_kr} onChange={(e) => setQuickAdd({ ...quickAdd!, name_kr: e.target.value })} />
              <input className="v50-input" placeholder="업체명 영문" value={quickAdd!.name_en} onChange={(e) => setQuickAdd({ ...quickAdd!, name_en: e.target.value })} />
              <input className="v50-input" placeholder="국가/지역 (선택)" value={quickAdd!.country} onChange={(e) => setQuickAdd({ ...quickAdd!, country: e.target.value })} />
              <input className="v50-input" placeholder="이메일 (선택)" type="email" value={quickAdd!.email} onChange={(e) => setQuickAdd({ ...quickAdd!, email: e.target.value })} />
              <input className="v50-input" placeholder="전화번호 (선택)" value={quickAdd!.phone} onChange={(e) => setQuickAdd({ ...quickAdd!, phone: e.target.value })} />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {/* 이 팝업은 createPortal로 document.body에 붙어서 .v50-root 밖으로 나가기 때문에,
                    .v50-button 등 클래스가 의존하는 CSS 변수(--blue/--text/--line)를 상속받지 못해
                    버튼이 안 보이는 문제가 있었다. 리터럴 색상값을 인라인으로 직접 지정해서 고정한다. */}
                <button
                  type="button" onClick={() => { setOpen(false); setQuickAdd(null); }}
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
                  {quickAddSaving ? "저장 중…" : quickAdd!.id ? "저장" : "등록"}
                </button>
              </div>
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
