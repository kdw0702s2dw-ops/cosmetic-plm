"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMPANY_CATEGORIES, deleteCompany, fetchCompanies, fetchCompanyById, saveCompany,
  type Company,
} from "@/services/sprint2/companyService";
import Toast, { type ToastState } from "@/components/common/Toast";
import "@/styles/enterprise-v50.css";

const emptyCompany: Company = {
  category: [], name_kr: "", name_en: "", country: "", phone: "", email: "", note: "", is_active: true,
};

export default function CompanyManager() {
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company>(emptyCompany);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [listLoading, setListLoading] = useState(false);

  const load = useCallback(async () => {
    setListLoading(true);
    try { setList(await fetchCompanies(keyword)); }
    catch (e: any) { setMsg("목록 조회 오류: " + e.message); }
    finally { setListLoading(false); }
  }, [keyword]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function selectCompany(item: Company) {
    setMsg("불러오는 중...");
    try {
      setCompany(await fetchCompanyById(item.id!));
      setMsg("");
    } catch (e: any) {
      setMsg("업체 조회 오류: " + e.message);
    }
  }

  function newCompany() {
    setCompany({ ...emptyCompany, category: [] });
    setMsg("새 업체 입력 모드");
  }

  function toggleCategory(cat: string) {
    setCompany((prev) => {
      const has = prev.category.includes(cat);
      return { ...prev, category: has ? prev.category.filter((c) => c !== cat) : [...prev.category, cat] };
    });
  }

  async function handleDelete(item: Company) {
    if (!confirm(`"${item.name_kr || item.name_en}"을(를) 삭제하시겠습니까?\n(이미 원료에 연결된 이력을 보존하기 위해 목록에서만 숨겨지고, 완전히 지워지진 않습니다.)`)) return;
    try {
      await deleteCompany(item.id!);
      if (company.id === item.id) newCompany();
      setMsg("삭제 완료: " + (item.name_kr || item.name_en));
      await load();
    } catch (e: any) {
      setMsg("삭제 오류: " + e.message);
    }
  }

  async function handleSave() {
    if (!company.name_kr?.trim() && !company.name_en?.trim()) {
      setMsg("업체명(국문 또는 영문)을 하나 이상 입력하세요.");
      return;
    }
    setSaving(true); setMsg("");
    try {
      const saved = await saveCompany(company);
      setCompany(saved);
      setMsg("저장 완료: " + (saved.name_kr || saved.name_en));
      setToast({ type: "success", text: "저장되었습니다: " + (saved.name_kr || saved.name_en) });
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
          <h1 className="v50-title">업체관리</h1>
          <p className="v50-desc">원료사·브랜드사·제조사·공급사 정보를 등록·관리합니다. 원료관리의 Manufacturer/Supplier 자동완성과 연동됩니다.</p>
        </div>
        <button className="v50-button" onClick={newCompany}>+ 새 업체</button>
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>업체 목록</h2>
          <button className="v50-button-light" onClick={() => load()} disabled={listLoading}>
            {listLoading ? "새로고침 중…" : "새로고침"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12 }}>
          <input className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="업체명(국문/영문)/국가/전화번호/이메일 검색" onKeyDown={(e) => e.key === "Enter" && load()} style={{ flex: 1 }} />
          <button className="v50-button" onClick={() => load()}>검색</button>
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>구분</th><th>업체명(국문)</th><th>업체명(영문)</th><th>국가</th><th>전화번호</th><th>이메일</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ background: company.id === c.id ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.category?.join(", ") || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.name_kr || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.name_en || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.country || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.phone || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectCompany(c)}>{c.email || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectCompany(c)}>수정</button>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(c)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7}>업체가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>{company.id ? `업체 편집 · ${company.name_kr || company.name_en}` : "새 업체 등록"}</h2>

        <Field label="구분 (복수 선택 가능)">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {COMPANY_CATEGORIES.map((cat) => (
              <label key={cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={company.category.includes(cat)} onChange={() => toggleCategory(cat)} />
                {cat}
              </label>
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10, marginBottom: 8 }}>
          <Field label="업체명 국문">
            <input className="v50-input" value={company.name_kr || ""} onChange={(e) => setCompany({ ...company, name_kr: e.target.value })} />
          </Field>
          <Field label="업체명 영문">
            <input className="v50-input" value={company.name_en || ""} onChange={(e) => setCompany({ ...company, name_en: e.target.value })} />
          </Field>
          <Field label="국가/지역">
            <input className="v50-input" value={company.country || ""} onChange={(e) => setCompany({ ...company, country: e.target.value })} />
          </Field>
          <Field label="전화번호">
            <input className="v50-input" value={company.phone || ""} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
          </Field>
          <Field label="이메일">
            <input className="v50-input" type="email" value={company.email || ""} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="비고">
              <textarea className="v50-textarea" rows={3}
                value={company.note || ""} onChange={(e) => setCompany({ ...company, note: e.target.value })} />
            </Field>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="v50-button" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : "업체 저장"}
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
