'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FormulaRawMaterialDocumentRow,
  getDocumentsForFormula,
  getDocumentPublicUrl,
} from '@/services/sprint2/rawMaterialDocumentService';

interface Props {
  formulaCode: string;
  revision: string;
}

interface RowGroup {
  rawMaterialId: string;
  rawCode: string;
  rawName: string;
  coa: FormulaRawMaterialDocumentRow | null;
  msds: FormulaRawMaterialDocumentRow | null;
}

/**
 * 문서관리 화면에서 처방 선택 후 배치하는 컴포넌트.
 * 해당 처방 BOM에 쓰인 원료들의 COA/MSDS를 목록으로 보여주고,
 * 체크박스로 선택한 파일들을 zip으로 한번에 다운로드한다.
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

  // raw_material_id 기준으로 COA/MSDS를 한 줄에 묶어서 보여주기 위한 그룹핑
  const grouped: RowGroup[] = useMemo(() => {
    const map = new Map<string, RowGroup>();
    for (const r of rows) {
      if (!map.has(r.raw_material_id)) {
        map.set(r.raw_material_id, {
          rawMaterialId: r.raw_material_id,
          rawCode: r.raw_code,
          rawName: r.raw_name,
          coa: null,
          msds: null,
        });
      }
      const group = map.get(r.raw_material_id)!;
      if (r.doc_type === 'COA') group.coa = r;
      if (r.doc_type === 'MSDS') group.msds = r;
    }
    return Array.from(map.values());
  }, [rows]);

  const missingCoaCount = grouped.filter((g) => !g.coa || !g.coa.storage_path).length;
  const missingMsdsCount = grouped.filter((g) => !g.msds || !g.msds.storage_path).length;

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    const allKeys = grouped.flatMap((g) => {
      const keys: string[] = [];
      if (g.coa?.storage_path) keys.push(`${g.rawMaterialId}:COA`);
      if (g.msds?.storage_path) keys.push(`${g.rawMaterialId}:MSDS`);
      return keys;
    });
    setSelected((prev) => (prev.size === allKeys.length ? new Set() : new Set(allKeys)));
  }

  async function handleZipDownload() {
    setZipping(true);
    setErrorMsg(null);
    try {
      const zip = new JSZip();
      const targets = grouped.flatMap((g) => {
        const items: { row: FormulaRawMaterialDocumentRow; key: string }[] = [];
        if (g.coa?.storage_path && selected.has(`${g.rawMaterialId}:COA`)) {
          items.push({ row: g.coa, key: `${g.rawMaterialId}:COA` });
        }
        if (g.msds?.storage_path && selected.has(`${g.rawMaterialId}:MSDS`)) {
          items.push({ row: g.msds, key: `${g.rawMaterialId}:MSDS` });
        }
        return items;
      });

      if (targets.length === 0) {
        setErrorMsg('선택된 파일이 없습니다.');
        return;
      }

      await Promise.all(
        targets.map(async ({ row }) => {
          const url = getDocumentPublicUrl(row.storage_path!);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${row.file_name} 다운로드 실패`);
          const blob = await res.blob();
          // 파일명 중복 방지를 위해 원료코드 접두어를 붙인다
          zip.file(`${row.raw_code}_${row.file_name}`, blob);
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${formulaCode}_${revision}_COA_MSDS.zip`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'zip 생성 중 오류가 발생했습니다.');
    } finally {
      setZipping(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>;

  return (
    <div className="space-y-3">
      {(missingCoaCount > 0 || missingMsdsCount > 0) && (
        <p className="text-xs text-amber-600">
          COA 미보유 원료: {missingCoaCount}건 · MSDS 미보유 원료: {missingMsdsCount}건 (선택 목록에서 자동 제외됩니다)
        </p>
      )}

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-2">
              <input type="checkbox" onChange={toggleAll} />
            </th>
            <th className="py-2 pr-2">원료코드</th>
            <th className="py-2 pr-2">원료명</th>
            <th className="py-2 pr-2">COA</th>
            <th className="py-2 pr-2">MSDS</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => {
            const coaKey = `${g.rawMaterialId}:COA`;
            const msdsKey = `${g.rawMaterialId}:MSDS`;
            return (
              <tr key={g.rawMaterialId} className="border-b">
                <td className="py-2 pr-2">
                  {(g.coa?.storage_path || g.msds?.storage_path) && (
                    <input
                      type="checkbox"
                      checked={
                        (!!g.coa?.storage_path && selected.has(coaKey)) ||
                        (!!g.msds?.storage_path && selected.has(msdsKey))
                      }
                      onChange={() => {
                        if (g.coa?.storage_path) toggle(coaKey);
                        if (g.msds?.storage_path) toggle(msdsKey);
                      }}
                    />
                  )}
                </td>
                <td className="py-2 pr-2">{g.rawCode}</td>
                <td className="py-2 pr-2">{g.rawName}</td>
                <td className="py-2 pr-2">
                  {g.coa?.storage_path ? (
                    <a
                      href={getDocumentPublicUrl(g.coa.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      다운로드
                    </a>
                  ) : (
                    <span className="text-gray-400">없음</span>
                  )}
                </td>
                <td className="py-2 pr-2">
                  {g.msds?.storage_path ? (
                    <a
                      href={getDocumentPublicUrl(g.msds.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      다운로드
                    </a>
                  ) : (
                    <span className="text-gray-400">없음</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
