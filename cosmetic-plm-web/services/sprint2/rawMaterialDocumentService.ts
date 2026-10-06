import { supabaseProductionFinal } from '@/lib/supabaseProductionFinalClient';

export type DocType = 'COA' | 'MSDS' | 'COMPOSITION' | 'ALLERGEN_SHEET' | 'IFRA';

export const ALL_DOC_TYPES: DocType[] = ['COA', 'MSDS', 'COMPOSITION', 'ALLERGEN_SHEET', 'IFRA'];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  COA: 'COA',
  MSDS: 'MSDS',
  COMPOSITION: 'Composition',
  ALLERGEN_SHEET: 'Allergen Sheet',
  IFRA: 'IFRA',
};

// 향료 원료 판별: 원료코드가 "1FRA"로 시작하거나, "Z"로 시작하면서 "F"로 끝나면 향료다.
// 향료만 실제로 Allergen Sheet/IFRA 서류가 발급되므로(일반 추출물 등 다른 원료는 이 두 서류 자체가
// 없음), 서류 현황의 "누락" 판단은 원료가 향료인지 아닌지에 따라 필요한 서류 종류를 다르게 본다.
export function isFragranceRawCode(rawCode: string): boolean {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return false;
  if (code.startsWith('1FRA')) return true;
  if (code.startsWith('Z') && code.endsWith('F')) return true;
  return false;
}

// 원료코드 기준으로 이 원료에 실제로 필요한 문서 종류만 반환한다.
// 향료가 아니면 Allergen Sheet/IFRA는 제외 - 발급되지 않는 서류라 "누락"으로 집계하지 않기 위함.
export function requiredDocTypesForRawCode(rawCode: string): DocType[] {
  if (isFragranceRawCode(rawCode)) return ALL_DOC_TYPES;
  return ALL_DOC_TYPES.filter((t) => t !== 'ALLERGEN_SHEET' && t !== 'IFRA');
}

export interface RawMaterialDocument {
  id: string;
  raw_material_id: string;
  doc_type: DocType;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  doc_revision: string | null;
}

// 유통기한이 이 일수 이내로 남았으면 "임박"으로 표시한다(지나면 "만료"). 서류 현황 화면과 원료 상세
// 업로드 문서 섹션이 같은 기준을 쓰도록 여기 한 곳에서만 관리한다.
export const DOC_EXPIRY_WARNING_DAYS = 30;

export type DocExpiryStatus = "expired" | "warning" | "ok" | "none";

/**
 * 문서의 유통기한(expiry_date) 기준 상태 판정. expiry_date가 비어있으면 "none"(유효기간 개념이
 * 없거나 아직 입력 안 한 서류 - 미보유와는 다르므로 별도 상태로 구분).
 */
export function getDocExpiryStatus(doc: { expiry_date?: string | null } | null | undefined): DocExpiryStatus {
  if (!doc?.expiry_date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(doc.expiry_date);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.round((exp.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= DOC_EXPIRY_WARNING_DAYS) return "warning";
  return "ok";
}

/** 유통기한까지 남은 일수(지났으면 음수). expiry_date가 없으면 null. */
export function daysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

export interface FormulaRawMaterialDocumentRow {
  formula_code: string;
  revision: string;
  raw_material_id: string;
  raw_code: string;
  raw_name: string;
  doc_type: DocType | null;
  file_name: string | null;
  storage_path: string | null;
  uploaded_at: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  doc_revision: string | null;
}

const BUCKET = 'raw-material-docs';

/**
 * 원료의 storage_path 기준 public URL 반환
 */
export function getDocumentPublicUrl(storagePath: string): string {
  const { data } = supabaseProductionFinal.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function fileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx + 1) : 'bin';
}

export function sanitizeDownloadFileName(name: string): string {
  return (name || '').replace(/[\\/:*?"<>|]/g, '_').trim() || '_';
}

/**
 * 다운로드 시 실제로 사용할 파일명 - 저장된 원본 파일명이 무엇이든(예: "국문_msds_v3.pdf") 관계없이
 * 항상 서류 종류 라벨명("COA.pdf"/"MSDS.pdf"/"Composition.xlsx")으로 통일한다. 개별 다운로드
 * (downloadRawMaterialDocumentFile)와 zip 다운로드(FormulaDocumentZipDownload의 handleZipDownload)가
 * 이 함수를 공통으로 써서, 어느 경로로 받든 파일명 규칙이 같게 유지되도록 한다.
 */
export function buildDocDownloadFileName(doc: { doc_type: DocType; file_name: string }): string {
  return sanitizeDownloadFileName(`${DOC_TYPE_LABEL[doc.doc_type]}.${fileExtension(doc.file_name)}`);
}

/**
 * 원료 문서(COA/MSDS/Composition/Allergen Sheet/IFRA) 다운로드 - 링크를 새 탭에서 여는 대신 파일을
 * 직접 blob으로 받아 "COA.pdf"/"MSDS.pdf"처럼 서류 종류 이름으로 다운로드시킨다.
 */
export async function downloadRawMaterialDocumentFile(doc: {
  storage_path: string;
  file_name: string;
  doc_type: DocType;
}): Promise<void> {
  const url = getDocumentPublicUrl(doc.storage_path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${doc.file_name} 다운로드 실패`);
  const blob = await res.blob();
  const fileName = buildDocDownloadFileName(doc);

  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * 원료 문서 업로드 (COA/MSDS/Composition/Allergen Sheet/IFRA — 원료당 doc_type별 최신 1건, 같은
 * 경로에 덮어쓰기 + DB upsert)
 */
export async function uploadRawMaterialDocument(params: {
  rawMaterialId: string;
  rawCode: string;
  docType: DocType;
  file: File;
  uploadedBy?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  docRevision?: string | null;
}): Promise<RawMaterialDocument> {
  const { rawMaterialId, rawCode, docType, file, uploadedBy, issueDate, expiryDate, docRevision } = params;

  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${rawCode}/${docType.toLowerCase()}.${ext}`;

  const { error: uploadError } = await supabaseProductionFinal.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  const { data, error: upsertError } = await supabaseProductionFinal
    .from('plm_raw_material_documents')
    .upsert(
      {
        raw_material_id: rawMaterialId,
        doc_type: docType,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        uploaded_by: uploadedBy ?? null,
        uploaded_at: new Date().toISOString(),
        // 교체 업로드 시 발행일/유통기한/리버전을 비워서 보내면(재업로드 폼에서 입력 안 함) 이전 값을
        // 날려버리게 되므로, undefined일 때만 컬럼을 생략(upsert가 기존 값 유지)하고 null은 명시적
        // "비움"으로 그대로 반영한다.
        ...(issueDate !== undefined ? { issue_date: issueDate } : {}),
        ...(expiryDate !== undefined ? { expiry_date: expiryDate } : {}),
        ...(docRevision !== undefined ? { doc_revision: docRevision } : {}),
      },
      { onConflict: 'raw_material_id,doc_type' }
    )
    .select()
    .single();

  if (upsertError) {
    throw new Error(`문서 정보 저장 실패: ${upsertError.message}`);
  }

  return data as RawMaterialDocument;
}

/**
 * 파일 재업로드 없이 발행일/유통기한/리버전만 수정한다(이미 올라간 COA/MSDS 등에 나중에 날짜 정보만
 * 채워 넣는 경우를 위함).
 */
export async function updateRawMaterialDocumentMeta(params: {
  rawMaterialId: string;
  docType: DocType;
  issueDate?: string | null;
  expiryDate?: string | null;
  docRevision?: string | null;
}): Promise<RawMaterialDocument> {
  const { rawMaterialId, docType, issueDate, expiryDate, docRevision } = params;

  const { data, error } = await supabaseProductionFinal
    .from('plm_raw_material_documents')
    .update({
      ...(issueDate !== undefined ? { issue_date: issueDate } : {}),
      ...(expiryDate !== undefined ? { expiry_date: expiryDate } : {}),
      ...(docRevision !== undefined ? { doc_revision: docRevision } : {}),
    })
    .eq('raw_material_id', rawMaterialId)
    .eq('doc_type', docType)
    .select()
    .single();

  if (error) {
    throw new Error(`문서 정보 수정 실패: ${error.message}`);
  }

  return data as RawMaterialDocument;
}

/**
 * 특정 원료의 COA/MSDS 문서 조회 (없으면 빈 배열)
 */
export async function getRawMaterialDocuments(
  rawMaterialId: string
): Promise<RawMaterialDocument[]> {
  const { data, error } = await supabaseProductionFinal
    .from('plm_raw_material_documents')
    .select('*')
    .eq('raw_material_id', rawMaterialId);

  if (error) {
    throw new Error(`문서 조회 실패: ${error.message}`);
  }

  return (data ?? []) as RawMaterialDocument[];
}

/**
 * 특정 원료의 문서 1건 삭제 (교체 아닌 완전 삭제가 필요할 때)
 */
export async function deleteRawMaterialDocument(
  rawMaterialId: string,
  docType: DocType,
  storagePath: string
): Promise<void> {
  const { error: storageError } = await supabaseProductionFinal.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(`파일 삭제 실패: ${storageError.message}`);
  }

  const { error: dbError } = await supabaseProductionFinal
    .from('plm_raw_material_documents')
    .delete()
    .eq('raw_material_id', rawMaterialId)
    .eq('doc_type', docType);

  if (dbError) {
    throw new Error(`문서 정보 삭제 실패: ${dbError.message}`);
  }
}

/**
 * 처방(formula_code + revision) 기준으로 BOM에 쓰인 원료들의 COA/MSDS 목록 조회
 * v_plm_formula_raw_material_documents 뷰 사용 — doc_type/file_name이 null이면 미보유
 */
export async function getDocumentsForFormula(
  formulaCode: string,
  revision: string
): Promise<FormulaRawMaterialDocumentRow[]> {
  const { data, error } = await supabaseProductionFinal
    .from('v_plm_formula_raw_material_documents')
    .select('*')
    .eq('formula_code', formulaCode)
    .eq('revision', revision)
    .order('raw_code', { ascending: true });

  if (error) {
    throw new Error(`처방 문서 조회 실패: ${error.message}`);
  }

  return (data ?? []) as FormulaRawMaterialDocumentRow[];
}

/**
 * raw_code 목록 기준으로 COA/MSDS/Composition/Allergen Sheet/IFRA 보유 여부를 조회한다.
 * getDocumentsForFormula(원처방 전용, v_plm_formula_raw_material_documents 뷰 사용)와 달리, 이 함수는
 * "이 처방에 어떤 원료가 쓰였는지"를 뷰가 아니라 호출부가 직접 정한 raw_code 목록으로 받는다 -
 * 공개처방(일반)/(건조)은 별도로 저장된 BOM(plm_formula_lines_public/dry)을 쓸 수도 있어서, 원처방
 * 고정인 뷰만으로는 그 기준의 실제 원료 구성을 반영할 수 없기 때문이다(문서관리 화면에서 "기준" 선택에
 * 따라 COA/MSDS 목록이 독립적으로 보이도록 하기 위해 도입).
 */
export async function getDocumentsForRawCodes(
  formulaCode: string,
  revision: string,
  rawCodes: string[]
): Promise<FormulaRawMaterialDocumentRow[]> {
  const uniqueCodes = Array.from(new Set(rawCodes.filter(Boolean)));
  if (uniqueCodes.length === 0) return [];

  const { data: materials, error: materialsError } = await supabaseProductionFinal
    .from('plm_raw_materials')
    .select('id, raw_code, raw_name')
    .in('raw_code', uniqueCodes);
  if (materialsError) {
    throw new Error(`원료 조회 실패: ${materialsError.message}`);
  }

  const materialRows = (materials ?? []) as { id: string; raw_code: string; raw_name: string }[];
  const docsByMaterial = new Map<string, RawMaterialDocument[]>();
  if (materialRows.length > 0) {
    const { data: docs, error: docsError } = await supabaseProductionFinal
      .from('plm_raw_material_documents')
      .select('*')
      .in('raw_material_id', materialRows.map((m) => m.id));
    if (docsError) {
      throw new Error(`문서 조회 실패: ${docsError.message}`);
    }
    for (const d of (docs ?? []) as RawMaterialDocument[]) {
      if (!docsByMaterial.has(d.raw_material_id)) docsByMaterial.set(d.raw_material_id, []);
      docsByMaterial.get(d.raw_material_id)!.push(d);
    }
  }

  const rows: FormulaRawMaterialDocumentRow[] = [];
  for (const m of materialRows) {
    const matDocs = docsByMaterial.get(m.id) ?? [];
    if (matDocs.length === 0) {
      rows.push({
        formula_code: formulaCode,
        revision,
        raw_material_id: m.id,
        raw_code: m.raw_code,
        raw_name: m.raw_name,
        doc_type: null,
        file_name: null,
        storage_path: null,
        uploaded_at: null,
        issue_date: null,
        expiry_date: null,
        doc_revision: null,
      });
    } else {
      for (const d of matDocs) {
        rows.push({
          formula_code: formulaCode,
          revision,
          raw_material_id: m.id,
          raw_code: m.raw_code,
          raw_name: m.raw_name,
          doc_type: d.doc_type,
          file_name: d.file_name,
          storage_path: d.storage_path,
          uploaded_at: d.uploaded_at,
          issue_date: d.issue_date,
          expiry_date: d.expiry_date,
          doc_revision: d.doc_revision,
        });
      }
    }
  }
  rows.sort((a, b) => a.raw_code.localeCompare(b.raw_code));
  return rows;
}

/**
 * raw_code 목록에 대한 공급사 조회. fetchRawMaterialDocumentStatus와 동일하게 v_plm_raw_material_list
 * 뷰를 사용한다 - 업체관리(plm_companies)와 연동된 canonical 공급사명을 얻기 위함(원본
 * plm_raw_materials.supplier는 연동 전 텍스트가 남아있을 수 있음). 문서관리 화면에서 "자료가 없는
 * 원료를 공급사 단위로 묶어서 한 번에 요청"할 수 있도록 원료명 옆에 공급사를 표시하는 데 쓰인다.
 */
export async function fetchSupplierMapByRawCode(rawCodes: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const uniqueCodes = Array.from(new Set(rawCodes.filter(Boolean)));
  if (uniqueCodes.length === 0) return map;

  const { data, error } = await supabaseProductionFinal
    .from('v_plm_raw_material_list')
    .select('raw_code, supplier')
    .in('raw_code', uniqueCodes);
  if (error) {
    throw new Error(`공급사 조회 실패: ${error.message}`);
  }
  for (const row of (data ?? []) as { raw_code: string; supplier: string | null }[]) {
    map.set(row.raw_code, row.supplier ?? null);
  }
  return map;
}

/**
 * raw_code 목록에 대한 Trade Name(원료관리에 등록된 원료 자체의 영문 Trade Name) 조회.
 * 문서관리 zip 다운로드(FormulaDocumentZipDownload)의 폴더명에 쓰인다 - 외국 공급사/바이어에게
 * zip을 보낼 수도 있어서, 한글 원료명 대신 "복합성분표(Trade Name)" 문서와 동일한 영문 Trade Name으로
 * 폴더명을 표시한다. Trade Name이 등록 안 된 원료는 호출부에서 원료명(raw_name)으로 대체한다.
 */
export async function fetchTradeNameMapByRawCode(rawCodes: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const uniqueCodes = Array.from(new Set(rawCodes.filter(Boolean)));
  if (uniqueCodes.length === 0) return map;

  const { data, error } = await supabaseProductionFinal
    .from('v_plm_raw_material_list')
    .select('raw_code, trade_name')
    .in('raw_code', uniqueCodes);
  if (error) {
    throw new Error(`Trade Name 조회 실패: ${error.message}`);
  }
  for (const row of (data ?? []) as { raw_code: string; trade_name: string | null }[]) {
    map.set(row.raw_code, row.trade_name ?? null);
  }
  return map;
}

export interface RawMaterialDocumentStatusRow {
  id: string;
  raw_code: string;
  raw_name: string;
  supplier: string | null;
  docs: Record<DocType, RawMaterialDocument | null>;
}

function emptyDocsRecord(): Record<DocType, RawMaterialDocument | null> {
  return ALL_DOC_TYPES.reduce(
    (acc, t) => { acc[t] = null; return acc; },
    {} as Record<DocType, RawMaterialDocument | null>
  );
}

/**
 * 원료관리 > 서류 현황 화면용: 활성 원료 전체 + 원료별 문서(COA/MSDS/Composition/Allergen Sheet/IFRA)
 * 업로드 여부를 한 번에 조회한다. 목록 화면(fetchRawMaterials)의 100건 제한과 달리, 서류 누락 점검이
 * 목적이라 활성 원료 전체를 대상으로 한다.
 * v_plm_raw_material_list 뷰를 사용하는 이유: 공급사명을 업체관리(plm_companies)와 연동된 canonical
 * 이름 기준으로 검색할 수 있게 하기 위함 (원본 plm_raw_materials.supplier는 연동 전 텍스트가 남아있을 수 있음).
 */
export async function fetchRawMaterialDocumentStatus(): Promise<RawMaterialDocumentStatusRow[]> {
  const { data: materials, error: materialsError } = await supabaseProductionFinal
    .from('v_plm_raw_material_list')
    .select('id, raw_code, raw_name, supplier')
    .order('raw_code', { ascending: true });
  if (materialsError) {
    throw new Error(`원료 목록 조회 실패: ${materialsError.message}`);
  }

  const { data: docs, error: docsError } = await supabaseProductionFinal
    .from('plm_raw_material_documents')
    .select('*');
  if (docsError) {
    throw new Error(`문서 목록 조회 실패: ${docsError.message}`);
  }

  const docsByMaterial = new Map<string, Record<DocType, RawMaterialDocument | null>>();
  for (const m of materials ?? []) {
    docsByMaterial.set(m.id, emptyDocsRecord());
  }
  for (const d of (docs ?? []) as RawMaterialDocument[]) {
    const bucket = docsByMaterial.get(d.raw_material_id);
    if (bucket) bucket[d.doc_type] = d;
  }

  return (materials ?? []).map((m) => ({
    id: m.id,
    raw_code: m.raw_code,
    raw_name: m.raw_name,
    supplier: m.supplier ?? null,
    docs: docsByMaterial.get(m.id) ?? emptyDocsRecord(),
  }));
}
