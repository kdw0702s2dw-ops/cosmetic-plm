'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocType,
  RawMaterialDocument,
  ALL_DOC_TYPES,
  DOC_TYPE_LABEL,
  getRawMaterialDocuments,
  uploadRawMaterialDocument,
  deleteRawMaterialDocument,
  downloadRawMaterialDocumentFile,
  updateRawMaterialDocumentMeta,
  getDocExpiryStatus,
  daysUntilExpiry,
} from '@/services/sprint2/rawMaterialDocumentService';

interface Props {
  rawMaterialId: string;
  rawCode: string;
  uploadedBy?: string; // 로그인 사용자 email 등 — 상위에서 주입
  canWrite?: boolean; // Admin/Researcher만 true — false면 업로드/교체 버튼을 숨기고 조회만 허용
}

const DOC_TYPES: DocType[] = ALL_DOC_TYPES;

function emptyDocsState(): Record<DocType, RawMaterialDocument | null> {
  return DOC_TYPES.reduce(
    (acc, t) => { acc[t] = null; return acc; },
    {} as Record<DocType, RawMaterialDocument | null>
  );
}

interface MetaDraft {
  issueDate: string; // <input type="date"> 값 그대로 (빈 문자열 = 미입력)
  expiryDate: string;
  docRevision: string;
}

function metaDraftFromDoc(doc: RawMaterialDocument | null): MetaDraft {
  return {
    issueDate: doc?.issue_date ?? '',
    expiryDate: doc?.expiry_date ?? '',
    docRevision: doc?.doc_revision ?? '',
  };
}

function emptyMetaDraftState(): Record<DocType, MetaDraft> {
  return DOC_TYPES.reduce(
    (acc, t) => { acc[t] = metaDraftFromDoc(null); return acc; },
    {} as Record<DocType, MetaDraft>
  );
}

/** 유통기한 상태에 따른 뱃지 - 만료(빨강)/임박(주황)만 표시하고 정상/미입력은 뱃지를 띄우지 않는다. */
function ExpiryBadge({ doc }: { doc: RawMaterialDocument | null }) {
  const status = getDocExpiryStatus(doc);
  if (status === 'expired') {
    return <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">만료</span>;
  }
  if (status === 'warning') {
    const d = daysUntilExpiry(doc?.expiry_date);
    return <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">임박 D-{d}</span>;
  }
  return null;
}

/**
 * 원료관리 상세/편집 화면에 배치하는 문서 업로드 위젯 (COA/MSDS/Composition/Allergen Sheet/IFRA).
 * 원료당 doc_type별 최신 1건만 유지 (재업로드 시 자동 교체).
 * 조회(파일 링크)는 canWrite와 무관하게 항상 보이고, 업로드/교체 버튼만 canWrite일 때만 노출한다.
 */
export default function RawMaterialDocUploader({ rawMaterialId, rawCode, uploadedBy, canWrite = false }: Props) {
  const [docs, setDocs] = useState<Record<DocType, RawMaterialDocument | null>>(emptyDocsState());
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const [deletingType, setDeletingType] = useState<DocType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 발행일/유통기한/리버전 - 저장된 값과 별개로 입력 중인 값을 docType별로 들고 있다가 "저장" 클릭 시 반영
  const [metaDrafts, setMetaDrafts] = useState<Record<DocType, MetaDraft>>(emptyMetaDraftState());
  const [savingMetaType, setSavingMetaType] = useState<DocType | null>(null);

  // 개별 서류 다운로드 - 새 탭 미리보기 대신 "COA.pdf"/"MSDS.pdf"처럼 서류 종류 이름으로 바로 다운로드시킨다.
  async function handleDownload(docType: DocType, doc: RawMaterialDocument) {
    try {
      await downloadRawMaterialDocumentFile({ storage_path: doc.storage_path, file_name: doc.file_name, doc_type: docType });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '다운로드 중 오류가 발생했습니다.');
    }
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await getRawMaterialDocuments(rawMaterialId);
      const next = emptyDocsState();
      const nextMeta = emptyMetaDraftState();
      for (const doc of list) {
        next[doc.doc_type] = doc;
        nextMeta[doc.doc_type] = metaDraftFromDoc(doc);
      }
      setDocs(next);
      setMetaDrafts(nextMeta);
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

  async function handleDelete(docType: DocType, doc: RawMaterialDocument) {
    if (!confirm(`${DOC_TYPE_LABEL[docType]} 문서(${doc.file_name})를 삭제하시겠습니까?`)) return;

    setDeletingType(docType);
    setErrorMsg(null);
    try {
      await deleteRawMaterialDocument(rawMaterialId, docType, doc.storage_path);
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingType(null);
    }
  }

  function handleMetaChange(docType: DocType, field: keyof MetaDraft, value: string) {
    setMetaDrafts((prev) => ({ ...prev, [docType]: { ...prev[docType], [field]: value } }));
  }

  // 파일 재업로드 없이 발행일/유통기한/리버전만 저장 (이미 올라간 문서에 나중에 날짜 정보를 채워 넣는 용도)
  async function handleSaveMeta(docType: DocType) {
    const draft = metaDrafts[docType];
    setSavingMetaType(docType);
    setErrorMsg(null);
    try {
      await updateRawMaterialDocumentMeta({
        rawMaterialId,
        docType,
        issueDate: draft.issueDate || null,
        expiryDate: draft.expiryDate || null,
        docRevision: draft.docRevision.trim() || null,
      });
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingMetaType(null);
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <h3 className="font-medium text-sm text-gray-700">업로드 문서</h3>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {DOC_TYPES.map((docType) => {
        const doc = docs[docType];
        const isUploading = uploadingType === docType;
        const isDeleting = deletingType === docType;
        const isSavingMeta = savingMetaType === docType;
        const draft = metaDrafts[docType];
        const metaDirty = !!doc && (
          draft.issueDate !== (doc.issue_date ?? '') ||
          draft.expiryDate !== (doc.expiry_date ?? '') ||
          draft.docRevision !== (doc.doc_revision ?? '')
        );

        return (
          <div key={docType} className="border-b last:border-b-0 pb-2 last:pb-0">
            <div className="flex items-center justify-between text-sm">
              <span className="w-28 shrink-0 font-medium">{DOC_TYPE_LABEL[docType]}</span>

              {loading ? (
                <span className="text-gray-400">불러오는 중...</span>
              ) : doc ? (
                <div className="flex items-center gap-3 flex-1 justify-between">
                  <button
                    type="button"
                    onClick={() => handleDownload(docType, doc)}
                    className="text-blue-600 hover:underline truncate max-w-[200px] text-left"
                    title={doc.file_name}
                  >
                    {doc.file_name}
                  </button>
                  <ExpiryBadge doc={doc} />
                  <span className="text-gray-400 text-xs">
                    {new Date(doc.uploaded_at).toLocaleDateString('ko-KR')}
                  </span>
                  {canWrite && (
                    <label className="text-xs text-gray-600 border rounded px-2 py-1 cursor-pointer hover:bg-gray-50">
                      {isUploading ? '업로드 중...' : '교체'}
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploading || isDeleting}
                        onChange={(e) => handleFileChange(docType, e)}
                      />
                    </label>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                      disabled={isUploading || isDeleting}
                      onClick={() => handleDelete(docType, doc)}
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
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

            {/* 발행일/유통기한/리버전 - 파일이 업로드된 서류에 한해, 최신 자료인지 확인할 수 있도록 입력/표시 */}
            {!loading && doc && (
              <div className="flex items-center gap-3 flex-wrap mt-1.5 pl-28 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  발행일
                  {canWrite ? (
                    <input
                      type="date"
                      className="border rounded px-1 py-0.5 text-xs"
                      value={draft.issueDate}
                      onChange={(e) => handleMetaChange(docType, 'issueDate', e.target.value)}
                    />
                  ) : (
                    <span>{doc.issue_date || '-'}</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  유통기한
                  {canWrite ? (
                    <input
                      type="date"
                      className="border rounded px-1 py-0.5 text-xs"
                      value={draft.expiryDate}
                      onChange={(e) => handleMetaChange(docType, 'expiryDate', e.target.value)}
                    />
                  ) : (
                    <span>{doc.expiry_date || '-'}</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  리버전
                  {canWrite ? (
                    <input
                      type="text"
                      placeholder="예: Rev.2"
                      className="border rounded px-1 py-0.5 text-xs w-20"
                      value={draft.docRevision}
                      onChange={(e) => handleMetaChange(docType, 'docRevision', e.target.value)}
                    />
                  ) : (
                    <span>{doc.doc_revision || '-'}</span>
                  )}
                </span>
                {canWrite && metaDirty && (
                  <button
                    type="button"
                    className="text-xs text-white bg-blue-600 rounded px-2 py-0.5 hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSavingMeta}
                    onClick={() => handleSaveMeta(docType)}
                  >
                    {isSavingMeta ? '저장 중...' : '저장'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
