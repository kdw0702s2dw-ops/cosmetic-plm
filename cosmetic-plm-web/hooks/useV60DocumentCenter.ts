"use client";

import { useEffect, useState } from "react";
import { buildDocumentHtml, fetchDocumentCenter } from "@/services/enterprise-v60/operationalCoreService";

export function useV60DocumentCenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("문서센터 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchDocumentCenter();
      setDocuments(data);
      setMessage(`문서 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function preview(doc: any) {
    setSelected(doc);
    setMessage(`${doc.title || doc.document_code} 미리보기 준비 완료`);
  }

  function downloadHtml(doc: any) {
    const payload = buildDocumentHtml(doc);
    const blob = new Blob([payload.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${payload.document_code || "PLM-DOCUMENT"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPrint(doc: any) {
    const payload = buildDocumentHtml(doc);
    const win = window.open("", "_blank");
    if (!win) {
      setMessage("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도하세요.");
      return;
    }
    win.document.open();
    win.document.write(payload.html);
    win.document.close();
  }

  useEffect(() => { load(); }, []);

  return { documents, selected, message, loading, load, preview, downloadHtml, openPrint };
}
