"use client";

import { useSprint2RawMaterialCore } from "@/hooks/useSprint2RawMaterialCore";
import "@/styles/enterprise-v50.css";

export default function RawMaterialCorePanel() {
  const s = useSprint2RawMaterialCore();
  const r = s.raw;
  const c = s.component;

  function updateRaw(key: string, value: any) { s.setRaw({ ...s.raw, [key]: value }); }
  function updateComp(key: string, value: any) { s.setComponent({ ...s.component, [key]: value }); }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">원료관리 Core</h1>
          <p className="v50-desc">원료 등록·수정·삭제·복사와 복합원료 구성성분을 실제 DB에 저장합니다.</p>
        </div>
        <div className="v50-flow">
          <button onClick={s.newRaw}>신규 원료</button>
          <button onClick={s.saveRaw} disabled={s.loading}>저장</button>
          <button onClick={s.copyRaw} disabled={!r.raw_code || s.loading}>복사</button>
          <button onClick={s.removeRaw} disabled={!r.raw_code || s.loading}>삭제</button>
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="검색 원료" value={`${s.rows.length}건`} hint="활성 원료" />
        <Kpi label="구성성분" value={`${s.components.length}개`} hint="복합원료" />
        <Kpi label="구성합계" value={`${s.componentTotal}%`} hint={s.componentTotal === 100 ? "정상" : "확인 필요"} />
        <Kpi label="원료유형" value={r.raw_type || "SINGLE"} hint="단일/복합" />
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>원료 목록</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="원료명, INCI, CAS, 공급사 검색" />
            <button className="v50-button" onClick={() => s.load()}>검색</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>코드</th><th>원료명</th><th>Trade</th><th>공급사</th><th>제조사</th><th>단가</th><th>열기</th></tr></thead>
              <tbody>
                {s.rows.map((x) => (
                  <tr key={x.raw_code}>
                    <td>{x.raw_code}</td><td>{x.raw_name}</td><td>{x.trade_name}</td><td>{x.supplier}</td><td>{x.manufacturer}</td><td>{Number(x.unit_price || 0).toLocaleString()}</td>
                    <td><button className="v50-button-light" onClick={() => s.openRaw(x)}>열기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>원료 기본정보</h2>
          <div className="v50-grid-2">
            <Input label="원료코드" value={r.raw_code} onChange={(v) => updateRaw("raw_code", v)} />
            <Input label="원료명" value={r.raw_name} onChange={(v) => updateRaw("raw_name", v)} />
            <Input label="Trade Name" value={r.trade_name} onChange={(v) => updateRaw("trade_name", v)} />
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>원료유형<select className="v50-input" value={r.raw_type || "SINGLE"} onChange={(e) => updateRaw("raw_type", e.target.value)}><option value="SINGLE">단일</option><option value="COMPLEX">복합</option></select></label>
            <Input label="공급사" value={r.supplier} onChange={(v) => updateRaw("supplier", v)} />
            <Input label="제조사" value={r.manufacturer} onChange={(v) => updateRaw("manufacturer", v)} />
            <Input label="단가(KRW/kg)" type="number" value={String(r.unit_price || 0)} onChange={(v) => updateRaw("unit_price", Number(v))} />
            <Input label="MOQ" value={r.moq} onChange={(v) => updateRaw("moq", v)} />
            <Input label="Lead Time" value={r.lead_time} onChange={(v) => updateRaw("lead_time", v)} />
            <Input label="원산지" value={r.origin_country} onChange={(v) => updateRaw("origin_country", v)} />
            <Input label="CAS No." value={r.cas_no} onChange={(v) => updateRaw("cas_no", v)} />
            <Input label="EC No." value={r.ec_no} onChange={(v) => updateRaw("ec_no", v)} />
          </div>
        </article>
      </section>

      <section className="v50-panel">
        <h2>INCI / 기능</h2>
        <div className="v50-grid-2">
          <Input label="INCI 국문" value={r.inci_kr} onChange={(v) => updateRaw("inci_kr", v)} />
          <Input label="INCI 영문" value={r.inci_en} onChange={(v) => updateRaw("inci_en", v)} />
          <Input label="중국명" value={r.inci_cn} onChange={(v) => updateRaw("inci_cn", v)} />
          <Input label="일본명" value={r.inci_jp} onChange={(v) => updateRaw("inci_jp", v)} />
          <Input label="기능 국문" value={r.function_kr} onChange={(v) => updateRaw("function_kr", v)} />
          <Input label="기능 영문" value={r.function_en} onChange={(v) => updateRaw("function_en", v)} />
        </div>
      </section>

      <section className="v50-panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h2>복합원료 구성성분</h2>
            <p style={{ color: "#64748b" }}>예: 정제수 72% + 부틸렌글라이콜 20% + 녹차추출물 7% + 1,2-헥산다이올 1%</p>
          </div>
          <button className="v50-button" onClick={s.syncFromComponents}>구성성분 기준 자동 반영</button>
        </div>

        <div className="v50-grid-4" style={{ marginTop: 12, marginBottom: 12 }}>
          <Input label="순번" type="number" value={String(c.component_no || 1)} onChange={(v) => updateComp("component_no", Number(v))} />
          <Input label="구성비%" type="number" value={String(c.composition_percent || 0)} onChange={(v) => updateComp("composition_percent", Number(v))} />
          <Input label="성분명 국문" value={c.component_name_kr} onChange={(v) => updateComp("component_name_kr", v)} />
          <Input label="성분명 영문" value={c.component_name_en} onChange={(v) => updateComp("component_name_en", v)} />
          <Input label="INCI 국문" value={c.inci_kr} onChange={(v) => updateComp("inci_kr", v)} />
          <Input label="INCI 영문" value={c.inci_en} onChange={(v) => updateComp("inci_en", v)} />
          <Input label="CAS No." value={c.cas_no} onChange={(v) => updateComp("cas_no", v)} />
          <Input label="기능" value={c.function_kr} onChange={(v) => updateComp("function_kr", v)} />
        </div>

        <button className="v50-button-light" onClick={s.saveComponent}>구성성분 저장</button>

        <div className="v50-table-wrap" style={{ marginTop: 12 }}>
          <table className="v50-table">
            <thead><tr><th>No</th><th>성분명</th><th>INCI</th><th>구성비</th><th>CAS</th><th>기능</th><th>삭제</th></tr></thead>
            <tbody>
              {s.components.map((x) => (
                <tr key={`${x.raw_code}-${x.component_no}`}>
                  <td>{x.component_no}</td><td>{x.component_name_kr || x.component_name_en}</td><td>{x.inci_kr || x.inci_en}</td><td>{x.composition_percent}%</td><td>{x.cas_no}</td><td>{x.function_kr || x.function_en}</td>
                  <td><button className="v50-button-light" onClick={() => s.removeComponent(x.component_no)}>삭제</button></td>
                </tr>
              ))}
              {s.components.length === 0 && <tr><td colSpan={7}>구성성분을 등록하세요.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="v50-card" style={{ marginTop: 12 }}>
          <strong>자동 전개 결과</strong>
          <p>국문 INCI: {s.componentInciKr || "-"}</p>
          <p>영문 INCI: {s.componentInciEn || "-"}</p>
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) {
  return <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>{label}<input className="v50-input" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
