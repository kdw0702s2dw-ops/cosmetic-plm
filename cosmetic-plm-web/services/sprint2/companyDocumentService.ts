import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 업체(공급사)별 통장사본/사업자등록증 - 발주 내부 승인 보고 때마다 공급사에 매번 다시 요청하지
// 않도록, 업체관리에서 한 번 업로드해두면 발주서 출력 화면에서 바로 다운로드할 수 있게 한다.
// DB 구조: supabase/migrations/38_add_company_documents.sql 참고.
// - plm_company_documents: 업체당 doc_type별 최신 1건 (raw_material_documents와 동일한 upsert 패턴)
// - company-documents 버킷은 비공개(public=false) - 계좌번호/사업자등록번호가 들어있는 민감한 서류라
//   rawMaterialDocumentService의 raw-material-docs(공개 버킷)와 달리 getPublicUrl을 쓰지 않고,
//   인증된 클라이언트 세션으로 직접 download()해서 RLS를 그대로 적용받는다.

export type CompanyDocType = "BANKBOOK" | "BUSINESS_REG";

export const COMPANY_DOC_TYPES: CompanyDocType[] = ["BANKBOOK", "BUSINESS_REG"];

export const COMPANY_DOC_TYPE_LABEL: Record<CompanyDocType, string> = {
  BANKBOOK: "통장사본",
  BUSINESS_REG: "사업자등록증",
};

export interface CompanyDocument {
  id: string;
  company_id: string;
  doc_type: CompanyDocType;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

const BUCKET = "company-documents";

function fileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1) : "bin";
}

function sanitizeDownloadFileName(name: string): string {
  return (name || "").replace(/[\\/:*?"<>|]/g, "_").trim() || "_";
}

// 다운로드 시 실제로 쓸 파일명 - 저장된 원본 파일명과 무관하게 "통장사본.pdf"/"사업자등록증.jpg"처럼
// 서류 종류 이름으로 통일한다(rawMaterialDocumentService.buildDocDownloadFileName과 동일한 관례).
function buildDocDownloadFileName(doc: { doc_type: CompanyDocType; file_name: string }): string {
  return sanitizeDownloadFileName(`${COMPANY_DOC_TYPE_LABEL[doc.doc_type]}.${fileExtension(doc.file_name)}`);
}

/**
 * 업체 문서 업로드(통장사본/사업자등록증 - 업체당 doc_type별 최신 1건, 같은 경로에 덮어쓰기 + DB upsert).
 * 경로에 업체명(한글) 대신 companyId(UUID)를 쓴다 - 한글 포함 경로에서 Storage가 "Invalid key" 오류를
 * 내는 기존에 확인된 문제를 피하기 위함(사진 업로드 기능에서도 같은 이유로 UUID 경로를 쓰는 관례).
 */
export async function uploadCompanyDocument(params: {
  companyId: string;
  docType: CompanyDocType;
  file: File;
  uploadedBy?: string;
}): Promise<CompanyDocument> {
  const { companyId, docType, file, uploadedBy } = params;
  const ext = fileExtension(file.name).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const storagePath = `${companyId}/${docType.toLowerCase()}.${ext}`;

  const { error: uploadError } = await supabaseProductionFinal.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true });
  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  const { data, error: upsertError } = await supabaseProductionFinal
    .from("plm_company_documents")
    .upsert(
      {
        company_id: companyId,
        doc_type: docType,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        uploaded_by: uploadedBy ?? null,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "company_id,doc_type" }
    )
    .select()
    .single();
  if (upsertError) {
    throw new Error(`문서 정보 저장 실패: ${upsertError.message}`);
  }

  return data as CompanyDocument;
}

/** 특정 업체의 통장사본/사업자등록증 조회 (없으면 빈 배열) */
export async function getCompanyDocuments(companyId: string): Promise<CompanyDocument[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_company_documents")
    .select("*")
    .eq("company_id", companyId);
  if (error) {
    throw new Error(`문서 조회 실패: ${error.message}`);
  }
  return (data ?? []) as CompanyDocument[];
}

/** 업체 문서 1건 삭제 (파일 + DB 레코드 모두 제거) */
export async function deleteCompanyDocument(
  companyId: string,
  docType: CompanyDocType,
  storagePath: string
): Promise<void> {
  const { error: storageError } = await supabaseProductionFinal.storage.from(BUCKET).remove([storagePath]);
  if (storageError) {
    throw new Error(`파일 삭제 실패: ${storageError.message}`);
  }
  const { error: dbError } = await supabaseProductionFinal
    .from("plm_company_documents")
    .delete()
    .eq("company_id", companyId)
    .eq("doc_type", docType);
  if (dbError) {
    throw new Error(`문서 정보 삭제 실패: ${dbError.message}`);
  }
}

/**
 * 업체 문서 다운로드 - 비공개 버킷이라 getPublicUrl + fetch 대신, 인증된 클라이언트로 직접
 * storage.download()를 호출해 RLS를 그대로 적용받는다. 받은 파일은 "통장사본.pdf"처럼 서류 종류
 * 이름으로 저장되도록 즉시 다운로드시킨다.
 */
export async function downloadCompanyDocumentFile(doc: {
  storage_path: string;
  file_name: string;
  doc_type: CompanyDocType;
}): Promise<void> {
  const { data, error } = await supabaseProductionFinal.storage.from(BUCKET).download(doc.storage_path);
  if (error || !data) {
    throw new Error(`${doc.file_name} 다운로드 실패: ${error?.message || "알 수 없는 오류"}`);
  }
  const fileName = buildDocDownloadFileName(doc);

  const blobUrl = URL.createObjectURL(data);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
