-- 처방이 컨펌되면 결정되는 "확정 제품명"을 저장한다. 실험일지/전성분표/복합성분표/단일성분표는
-- 기존대로 처방명(formula_name)으로 발행하고, 원료발주가처방(RAW_MATERIAL_ORDER_SHEET)만 이 값을
-- 우선 사용한다(미입력이면 처방명으로 대체 - services/sprint2/documentPdfService.ts의
-- orderSheetMeta/createRawMaterialOrderSheetDocument/regenerateRawMaterialOrderSheetDocument 참고).
ALTER TABLE plm_formulas
  ADD COLUMN IF NOT EXISTS product_name text;

COMMENT ON COLUMN plm_formulas.product_name IS
  '처방 컨펌 후 확정된 제품명. 원료발주가처방 문서는 이 값을 우선 사용하고(미입력 시 처방명으로 대체), 실험일지/전성분표/복합성분표/단일성분표는 기존대로 처방명을 사용한다.';
