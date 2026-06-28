"use client";

import { useV60RawMaterialManager } from "@/hooks/useV60RawMaterialManager";
import "@/styles/enterprise-v50.css";

export default function RawMaterialManagerPanel() {
  const s = useV60RawMaterialManager();
  const f = s.form;

  function update(key: string, value: any) {
    s.setForm({ ...s.form, [key]: value });
  }

  function updateComp(key: string, value: any) {
    s.setComponentForm({ ...s.componentForm, [key]: value });
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료관리 PRO</h1>
          <p className="v50-desc">트레이드명, 단가, 제조사, 공급사, 단일/복합 구성성분을 등록·수정·삭제합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={s.newRaw}>신규 원료</button>
          <button onClick={s.saveRaw} disabled={s.loading}>원료 저장</button>
        </div>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>원료 목록</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="원료명, 트레이드명, INCI, 공급사 검색" />
            <button className="v50-button" onClick={() => s.load()}>검색</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>코드</th><th>원료명</th><th>트레이드명</th><th>공급사</th><th>단가</th><th>작업</th></tr></thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.raw_code}>
                    <td>{r.raw_code}</td><td>{r.raw_name}</td><td>{r.trade_name}</td><td>{r.supplier}</td><td>{Number(r.unit_price || 0).toLocaleString()}</td>
                    <td>
                      <button className="v50-button-light" onClick={() => s.select(r)}>수정</button>{" "}
                      <button className="v50-button-light" onClick={() => s.removeRaw(r.raw_code)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>원료 기본정보</h2>
          <div className="v50-grid-2">
            <Input label="원료코드" value={f.raw_code} onChange={(v) => update("raw_code", v)} />
            <Input label="원료명" value={f.raw_name} onChange={(v) => update("raw_name", v)} />
            <Input label="트레이드명" value={f.trade_name} onChange={(v) => update("trade_name", v)} />
            <label>원료유형<select className="v50-input" value={f.raw_type} onChange={(e) => update("raw_type", e.target.value)}><option value="SINGLE">단일성분</option><option value="COMPLEX">복합성분</option></select></label>
            <Input label="제조사" value={f.manufacturer} onChange={(v) => update("manufacturer", v)} />
            <Input label="공급사" value={f.supplier} onChange={(v) => update("supplier", v)} />
            <Input label="단가(KRW/kg)" type="number" value={String(f.unit_price || 0)} onChange={(v) => update("unit_price", Number(v))} />
            <Input label="MOQ" value={f.moq} onChange={(v) => update("moq", v)} />
            <Input label="INCI 영문" value={f.inci_en} onChange={(v) => update("inci_en", v)} />
            <Input label="INCI 국문" value={f.inci_kr} onChange={(v) => update("inci_kr", v)} />
            <Input label="중국명" value={f.inci_cn} onChange={(v) => update("inci_cn", v)} />
            <Input label="일본명" value={f.inci_jp} onChange={(v) => update("inci_jp", v)} />
            <Input label="CAS No." value={f.cas_no} onChange={(v) => update("cas_no", v)} />
            <Input label="EC No." value={f.ec_no} onChange={(v) => update("ec_no", v)} />
            <Input label="기능 국문" value={f.function_kr} onChange={(v) => update("function_kr", v)} />
            <Input label="기능 영문" value={f.function_en} onChange={(v) => update("function_en", v)} />
          </div>
          <label>비고<textarea className="v50-textarea" value={f.note || ""} onChange={(e) => update("note", e.target.value)} /></label>
        </article>
      </section>

      <section className="v50-panel">
        <h2>복합 구성성분 관리</h2>
        <p style={{ color: "#64748b" }}>예: 녹차추출물 원료 = 정제수 70% + 부틸렌글라이콜 20% + 녹차추출물 9% + 1,2-헥산다이올 1%</p>
        <div className="v50-grid-4" style={{ marginBottom: 12 }}>
          <Input label="순번" type="number" value={String(s.componentForm.component_no || 1)} onChange={(v) => updateComp("component_no", Number(v))} />
          <Input label="구성비(%)" type="number" value={String(s.componentForm.composition_percent || 0)} onChange={(v) => updateComp("composition_percent", Number(v))} />
          <Input label="성분명 국문" value={s.componentForm.component_name_kr} onChange={(v) => updateComp("component_name_kr", v)} />
          <Input label="성분명 영문" value={s.componentForm.component_name_en} onChange={(v) => updateComp("component_name_en", v)} />
          <Input label="INCI 국문" value={s.componentForm.inci_kr} onChange={(v) => updateComp("inci_kr", v)} />
          <Input label="INCI 영문" value={s.componentForm.inci_en} onChange={(v) => updateComp("inci_en", v)} />
          <Input label="CAS No." value={s.componentForm.cas_no} onChange={(v) => updateComp("cas_no", v)} />
          <Input label="기능" value={s.componentForm.function_kr} onChange={(v) => updateComp("function_kr", v)} />
        </div>
        <div className="v50-flow" style={{ marginBottom: 12 }}>
          <button onClick={s.saveComponent}>구성성분 저장</button>
          <button onClick={s.syncInci}>구성성분 기준 INCI 자동 반영</button>
        </div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>순번</th><th>성분명</th><th>INCI</th><th>구성비</th><th>CAS</th><th>기능</th><th>삭제</th></tr></thead>
            <tbody>
              {s.components.map((c) => (
                <tr key={`${c.raw_code}-${c.component_no}`}>
                  <td>{c.component_no}</td><td>{c.component_name_kr || c.component_name_en}</td><td>{c.inci_en || c.inci_kr}</td><td>{c.composition_percent}%</td><td>{c.cas_no}</td><td>{c.function_kr}</td>
                  <td><button className="v50-button-light" onClick={() => s.removeComponent(c.component_no)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) {
  return <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>{label}<input className="v50-input" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>;
}
