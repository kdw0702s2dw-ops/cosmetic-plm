"use client";

import { useV50DocumentPro } from "@/hooks/useV50DocMfgPro";
import type { V50DocumentType } from "@/types/enterpriseV50DocMfg";

const docTypes: { type: V50DocumentType; label: string }[] = [
  { type: "FORMULA_SHEET", label: "처방서" },
  { type: "FULL_INGREDIENT_LIST", label: "전성분표" },
  { type: "INGREDIENT_COMPOSITION", label: "원료조성표" },
  { type: "PRODUCT_SPEC", label: "제품규격서" },
  { type: "COA", label: "COA" },
  { type: "BOM", label: "BOM" },
  { type: "MANUFACTURING_ORDER", label: "제조지시서" },
];

export default function DocumentProPanel() {
  const s = useV50DocumentPro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">문서관리 PRO</h1>
          <p className="v50-desc">처방을 선택하고 처방서, 전성분표, COA, BOM, 제조지시서를 한 번에 생성합니다.</p>
        </div>
        <button className="v50-button" onClick={s.createPackage}>전체 문서 생성</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>선택</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td>
                    <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>문서 생성</h2>
          {!s.selected ? <p>먼저 처방을 선택하세요.</p> : (
            <>
              <div className="v50-card" style={{ marginBottom: 12 }}>
                <strong>{s.selected.formula_name}</strong>
                <p style={{ color: "#64748b" }}>{s.selected.formula_code} / {s.selected.revision}</p>
              </div>
              <div className="v50-grid-2">
                {docTypes.map((d) => (
                  <button key={d.type} className="v50-button-light" onClick={() => s.createDoc(d.type)}>{d.label} 생성</button>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="v50-panel">
        <h2>생성 문서</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>문서코드</th><th>처방</th><th>문서종류</th><th>제목</th><th>상태</th><th>생성일</th></tr></thead>
            <tbody>
              {s.documents.map((doc) => (
                <tr key={doc.document_code}>
                  <td>{doc.document_code}</td><td>{doc.formula_code}/{doc.revision}</td><td>{doc.document_type}</td><td>{doc.title}</td><td>{doc.status}</td><td>{doc.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
