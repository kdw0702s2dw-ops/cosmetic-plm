-- 원료관리 업로드 문서(COA/MSDS/Composition/Allergen Sheet/IFRA)에 발행일/유통기한/리버전 정보를
-- 추가해서, 업로드된 자료가 최신(유효한) 자료인지 화면에서 바로 확인할 수 있도록 한다.
ALTER TABLE plm_raw_material_documents
  ADD COLUMN IF NOT EXISTS issue_date date,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS doc_revision text;

COMMENT ON COLUMN plm_raw_material_documents.issue_date IS '서류 발행일';
COMMENT ON COLUMN plm_raw_material_documents.expiry_date IS '서류 유통기한(만료일) - 지나면 만료, 지정 임박일수 이내면 임박으로 화면에 표시';
COMMENT ON COLUMN plm_raw_material_documents.doc_revision IS '서류 리버전/버전 표기 (자유 텍스트, 예: Rev.2, v3)';
