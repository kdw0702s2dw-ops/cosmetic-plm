'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocType,
  RawMaterialDocument,
  getRawMaterialDocuments,
  uploadRawMaterialDocument,
  getDocumentPublicUrl,
} from '@/services/sprint2/rawMaterialDocumentService';

interface Props {
  rawMaterialId: string;
  rawCode: string;
  uploadedBy?: string; // 로그인 사용자 email 등 — 상위에서 주입
  canWrite?: boolean; // Admin/Researcher만 true — false면 업로드/교체 버튼을 숨기고 조회만 허용
}

const DOC_TYPES: DocType[] = ['COA', 'MSDS'];

/**
 * 원료관리 상세/편집 화면에 배치하는 COA/MSDS 업로드 위젯.
 * 원료당 doc_type별 최신 1건만 유지 (재업로드 시 자동 교체).
 * 조회(파일 링크)는 canWrite와 무관하게 항상 보이고, 업로드/교체 버튼만 canWrite일 때만 노출한다.
 */
export default function RawMaterialDocUploader({ rawMaterialId, rawCode, uploadedBy, canWrite = false }: Props) {
  const [docs, setDocs] = useState<Record<DocType, RawMaterialDocument | null>>({
    COA: null,
    MSDS: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await getRawMaterialDocuments(rawMaterialId);
      const next: Record<DocType, RawMaterialDocument | null> = { COA: null, MSDS: null };
      for (const doc of list) {
        next[doc.doc_type] = doc;
      }
      setDocs(next);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '문서 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [rawMaterialId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFileChange(docType: DocType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(docType);
    setErrorMsg(null);
    try {
      await uploadRawMaterialDocument({
        rawMaterialId,
        rawCode,
        docType,
        file,
        uploadedBy,
      });
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <h3 className="font-medium text-sm text-gray-700">COA / MSDS</h3>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {DOC_TYPES.map((docType) => {
        const doc = docs[docType];
        const isUploading = uploadingType === docType;

        return (
          <div key={docType} className="flex items-center justify-between text-sm">
            <span className="w-16 font-medium">{docType}</span>

            {loading ? (
              <span className="text-gray-400">불러오는 중...</span>
            ) : doc ? (
              <div className="flex items-center gap-3 flex-1 justify-between">
                <a
                  href={getDocumentPublicUrl(doc.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-[200px]"
                >
                  {doc.file_name}
                </a>
                <span className="text-gray-400 text-xs">
                  {new Date(doc.uploaded_at).toLocaleDateString('ko-KR')}
                </span>
                {canWrite && (
                  <label className="text-xs text-gray-600 border rounded px-2 py-1 cursor-pointer hover:bg-gray-50">
                    {isUploading ? '업로드 중...' : '교체'}
                    <input
                      type="file"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handleFileChange(docType, e)}
                    />
                  </label>
                )}
              </div>
            ) : canWrite ? (
              <label className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 cursor-pointer hover:bg-blue-50">
                {isUploading ? '업로드 중...' : '업로드'}
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => handleFileChange(docType, e)}
                />
              </label>
            ) : (
              <span className="text-gray-400 text-xs">없음</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
