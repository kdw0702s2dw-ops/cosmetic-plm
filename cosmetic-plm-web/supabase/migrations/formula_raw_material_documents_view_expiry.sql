-- 문서관리 화면(원처방 기준 COA/MSDS 목록)에서도 발행일/유통기한/리버전을 보여줄 수 있도록,
-- v_plm_formula_raw_material_documents 뷰에 plm_raw_material_documents의 issue_date/expiry_date/
-- doc_revision 컬럼을 추가로 노출한다.
CREATE OR REPLACE VIEW v_plm_formula_raw_material_documents AS
SELECT DISTINCT
  fl.formula_code,
  fl.revision,
  rm.id AS raw_material_id,
  rm.raw_code,
  rm.raw_name,
  doc.doc_type,
  doc.file_name,
  doc.storage_path,
  doc.uploaded_at,
  doc.issue_date,
  doc.expiry_date,
  doc.doc_revision
FROM plm_formula_lines fl
  JOIN plm_raw_materials rm ON rm.raw_code = fl.raw_code
  LEFT JOIN plm_raw_material_documents doc ON doc.raw_material_id = rm.id;
