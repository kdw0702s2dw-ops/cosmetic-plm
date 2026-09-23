'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  ALL_DOC_TYPES,
  DOC_TYPE_LABEL,
  type DocType,
  requiredDocTypesForRawCode,
  FormulaRawMaterialDocumentRow,
  getDocumentsForFormula,
  getDocumentPublicUrl,
} from '@/services/sprint2/rawMaterialDocumentService';
import { fetchFormulaLinesForPdf } from '@/services/sprint2/documentPdfService';

// Windows/Mac 파일시스템에서 폴더/파일명에 쓸 수 없는 문자를 안전하게 치환
function sanitizeFileSegment(name: string): string {
  return (name || '').replace(/[\\/:*?"<>|]/g, '_').trim() || '_';
}

// 처방 BOM(plm_formula_lines)을 line_no 순으로 조회해 raw_code별 최초 등장 순서를 매긴다 -
// 복합성분표(엑셀/PDF)의 "No." 컬럼과 동일한 로직(buildComplexGroupedRows가 raw_code 기준으로
// 그룹핑할 때 lines 배열의 첫 등장 순서를 그대로 쓰는 것)을 재사용해서, zip 폴더 번호가 복합성분표의
// No.와 항상 일치하도록 한다.
async function fetchRawCodeOrderMap(formulaCode: string, revision: string): Promise<Map<string, number>> {
  const lines = await fetchFormulaLinesForPdf(formulaCode, revision);
  const map = new Map<string, number>();
  let no = 0;
  for (const line of lines) {
    const code = (line as { raw_code?: string }).raw_code;
    if (!code || map.has(code)) continue;
    no += 1;
    map.set(code, no);
  }
  return map;
}

interface Props {
  formulaCode: string;
  revision: string;
}

interface RowGroup {
  rawMaterialId: string;
  rawCode: string;
  rawName: string;
  docs: Record<DocType, FormulaRawMaterialDocumentRow | null>;
}

function emptyDocsMap(): Record<DocType, FormulaRawMaterialDocumentRow | null> {
  const map = {} as Record<DocType, FormulaRawMaterialDocumentRow | null>;
  ALL_DOC_TYPES.forEach((t) => { map[t] = null; });
  return map;
}

function docKey(rawMaterialId: string, docType: DocType) {
  return `${rawMaterialId}:${docType}`;
}

/**
 * 문서관리 화면에서 처방 선택 후 배치하는 컴포넌트.
 * 해당 처방 BOM에 쓰인 원료들의 COA/MSDS/Composition/Allergen Sheet/IFRA를 목록으로 보여주고,
 * 원료별로 필요한 서류만 골라서(체크박스: 개별 칸/행 전체/열 전체/전체) zip으로 한번에 다운로드한다.
 */
export default function FormulaDocumentZipDownload({ formulaCode, revision }: Props) {
  const [rows, setRows] = useState<FormulaRawMaterialDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // key: `${raw_material_id}:${doc_type}`
  const [zipping, setZipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setSelected(new Set());
    try {
      const data = await getDocumentsForFormula(formulaCode, revision);
      setRows(data);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '문서 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [formulaCode, revision]);

  useEffect(() => {
    if (formulaCode && revision) refresh();
  }, [formulaCode, revision, refresh]);

  // raw_material_id 기준으로 문서 종류별(COA/MSDS/Composition/Allergen Sheet/IFRA)로 한 줄에 묶어서
  // 보여주기 위한 그룹핑
  const grouped: RowGroup[] = useMemo(() => {
    const map = new Map<string, RowGroup>();
    for (const r of rows) {
      if (!map.has(r.raw_material_id)) {
        map.set(r.raw_material_id, {
          rawMaterialId: r.raw_material_id,
          rawCode: r.raw_code,
          rawName: r.raw_name,
          docs: emptyDocsMap(),
        });
      }
      const group = map.get(r.raw_material_id)!;
      if (r.doc_type) group.docs[r.doc_type] = r;
    }
    return Array.from(map.values());
  }, [rows]);

  // 원료마다 실제로 필요한 서류(향료가 아니면 Allergen Sheet/IFRA는 제외)만 "미보유"로 집계한다 -
  // 원료관리 서류 현황과 동일한 기준.
  const missingByType = useMemo(() => {
    const result: { type: DocType; count: number }[] = [];
    for (const type of ALL_DOC_TYPES) {
      const count = grouped.filter(
        (g) => requiredDocTypesForRawCode(g.rawCode).includes(type) && !g.docs[type]?.storage_path
      ).length;
      if (count > 0) result.push({ type, count });
    }
    return result;
  }, [grouped]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function allAvailableKeys() {
    return grouped.flatMap((g) =>
      ALL_DOC_TYPES.filter((t) => g.docs[t]?.storage_path).map((t) => docKey(g.rawMaterialId, t))
    );
  }

  function toggleAll() {
    const allKeys = allAvailableKeys();
    setSelected((prev) => (allKeys.length > 0 && allKeys.every((k) => prev.has(k)) ? new Set() : new Set(allKeys)));
  }

  // 열(문서 종류) 전체 선택/해제 - 예: "Allergen Sheet 열만 전부 담기" 같은 식으로, 다른 열의 선택은
  // 그대로 둔 채 이 문서 종류만 일괄 토글한다.
  function toggleColumn(type: DocType) {
    const keys = grouped.filter((g) => g.docs[type]?.storage_path).map((g) => docKey(g.rawMaterialId, type));
    if (keys.length === 0) return;
    setSelected((prev) => {
      const allOn = keys.every((k) => prev.has(k));
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  // 행(원료) 전체 선택/해제 - 그 원료에 실제로 존재하는 서류만 대상으로 한다.
  function toggleRow(g: RowGroup) {
    const keys = ALL_DOC_TYPES.filter((t) => g.docs[t]?.storage_path).map((t) => docKey(g.rawMaterialId, t));
    if (keys.length === 0) return;
    setSelected((prev) => {
      const allOn = keys.every((k) => prev.has(k));
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  async function handleZipDownload() {
    setZipping(true);
    setErrorMsg(null);
    try {
      const zip = new JSZip();
      const targets = grouped.flatMap((g) =>
        ALL_DOC_TYPES.filter((t) => g.docs[t]?.storage_path && selected.has(docKey(g.rawMaterialId, t))).map(
          (t) => ({ row: g.docs[t]! })
        )
      );

      if (targets.length === 0) {
        setErrorMsg('선택된 파일이 없습니다.');
        return;
      }

      // 복합성분표 No. 순서와 동일한 순번으로 원료별 폴더를 만들어서, 그 원료의 선택된 서류를 해당
      // 폴더 안에 넣는다(BOM에 없는 원료 등 순번을 못 찾은 경우는 "미분류" 폴더로 모은다).
      const orderMap = await fetchRawCodeOrderMap(formulaCode, revision);
      const padLen = String(Math.max(orderMap.size, 1)).length;

      await Promise.all(
        targets.map(async ({ row }) => {
          const url = getDocumentPublicUrl(row.storage_path!);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${row.file_name} 다운로드 실패`);
          const blob = await res.blob();
          const no = orderMap.get(row.raw_code);
          const noLabel = no ? String(no).padStart(padLen, '0') : '미분류';
          const folderName = sanitizeFileSegment(`${noLabel}_${row.raw_code}_${row.raw_name}`);
          const fileName = sanitizeFileSegment(`${row.doc_type}_${row.file_name}`);
          zip.folder(folderName)!.file(fileName, blob);
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${formulaCode}_${revision}_원료문서.zip`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'zip 생성 중 오류가 발생했습니다.');
    } finally {
      setZipping(false);
    }
  }

  // 헤더/행 체크박스가 현재 선택 상태를 그대로 반영하도록(전부 선택돼 있으면 체크된 채로 보이게) 계산
  const allKeys = allAvailableKeys();
  const allChecked = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  function columnChecked(type: DocType) {
    const keys = grouped.filter((g) => g.docs[type]?.storage_path).map((g) => docKey(g.rawMaterialId, type));
    return keys.length > 0 && keys.every((k) => selected.has(k));
  }
  function rowChecked(g: RowGroup) {
    const keys = ALL_DOC_TYPES.filter((t) => g.docs[t]?.storage_path).map((t) => docKey(g.rawMaterialId, t));
    return keys.length > 0 && keys.every((k) => selected.has(k));
  }

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>;

  return (
    <div className="space-y-3">
      {missingByType.length > 0 && (
        <p className="text-xs text-amber-600">
          {missingByType.map(({ type, count }) => `${DOC_TYPE_LABEL[type]} 미보유 원료: ${count}건`).join(' · ')}
          {' '}(선택 목록에서 자동 제외됩니다)
        </p>
      )}

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: 760 }}>
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} title="전체 선택/해제" />
              </th>
              <th className="py-2 pr-2" style={{ minWidth: 110 }}>원료코드</th>
              <th className="py-2 pr-2" style={{ minWidth: 160 }}>원료명</th>
              {ALL_DOC_TYPES.map((t) => (
                <th key={t} className="py-2 pr-2" style={{ minWidth: 110 }}>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={columnChecked(t)} onChange={() => toggleColumn(t)} title={`${DOC_TYPE_LABEL[t]} 열 전체 선택/해제`} />
                    {DOC_TYPE_LABEL[t]}
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => {
              const required = requiredDocTypesForRawCode(g.rawCode);
              return (
                <tr key={g.rawMaterialId} className="border-b">
                  <td className="py-2 pr-2">
                    {ALL_DOC_TYPES.some((t) => g.docs[t]?.storage_path) && (
                      <input type="checkbox" checked={rowChecked(g)} onChange={() => toggleRow(g)} title="이 원료 전체 선택/해제" />
                    )}
                  </td>
                  <td className="py-2 pr-2">{g.rawCode}</td>
                  <td className="py-2 pr-2">{g.rawName}</td>
                  {ALL_DOC_TYPES.map((t) => {
                    const doc = g.docs[t];
                    const key = docKey(g.rawMaterialId, t);
                    return (
                      <td className="py-2 pr-2" key={t}>
                        {doc?.storage_path ? (
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} />
                            <a
                              href={getDocumentPublicUrl(doc.storage_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              다운로드
                            </a>
                          </label>
                        ) : required.includes(t) ? (
                          <span className="text-gray-400">없음</span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleZipDownload}
        disabled={zipping || selected.size === 0}
        className="text-sm bg-blue-600 text-white rounded px-4 py-2 disabled:bg-gray-300"
      >
        {zipping ? 'zip 생성 중...' : `선택 항목 zip 다운로드 (${selected.size})`}
      </button>
    </div>
  );
}
