"use client";

import { useV60DocumentCenter } from "@/hooks/useV60DocumentCenter";
import { buildDocumentHtml } from "@/services/enterprise-v60/operationalCoreService";
import "@/styles/enterprise-v50.css";

export default function DocumentCenterPanel() {
  const s = useV60DocumentCenter();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">문서센터 PRO</h1>
          <p className="v50-desc">생성 문서를 바이어/내부 공유용 양식으로 미리보기, HTML 다운로드, PDF 저장/인쇄합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load}>새로고침</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>생성 문서 목록</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>문서코드</th><th>처방</th><th>종류</th><th>제목</th><th>작업</th></tr></thead>
              <tbody>
                {s.documents.map((d) => (
                  <tr key={d.document_code}>
                    <td>{d.document_code}</td><td>{d.formula_code}/{d.revision}</td><td>{d.document_type}</td><td>{d.title}</td>
                    <td>
                      <button className="v50-button-light" onClick={() => s.preview(d)}>미리보기</button>{" "}
                      <button className="v50-button-light" onClick={() => s.downloadHtml(d)}>HTML 다운로드</button>{" "}
                      <button className="v50-button" onClick={() => s.openPrint(d)}>PDF 저장/인쇄</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>문서 미리보기</h2>
          {!s.selected ? <p>문서를 선택하세요.</p> : (
            <iframe
              title="document-preview"
              style={{ width: "100%", height: 720, border: "1px solid #e2e8f0", borderRadius: 14, background: "white" }}
              srcDoc={buildDocumentHtml(s.selected).html}
            />
          )}
        </article>
      </section>
    </div>
  );
}
