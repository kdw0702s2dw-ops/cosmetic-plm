import { supabaseProductionFinal } from '@/lib/supabaseProductionFinalClient';

export type DocType = 'COA' | 'MSDS';

export interface RawMaterialDocument {
  id: string;
  raw_material_id: string;
  doc_type: DocType;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
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
}

const BUCKET = 'raw-material-docs';

/**
 * 원료의 storage_path 기준 public URL 반환
 */
export function getDocumentPublicUrl(storagePath: string): string {
  const { data } = supabaseProductionFinal.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * COA 또는 MSDS 업로드 (원료당 doc_type별 최신 1건 — 같은 경로에 덮어쓰기 + DB upsert)
 */
export async function uploadRawMaterialDocument(params: {
  rawMaterialId: string;
  rawCode: string;
  docType: DocType;
  file: File;
  uploadedBy?: string;
}): Promise<RawMaterialDocument> {
  const { rawMaterialId, rawCode, docType, file, uploadedBy } = params;

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
