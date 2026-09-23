-- 원료 문서 업로드 항목을 COA/MSDS 2종에서 Composition, Allergen Sheet, IFRA를 포함한 5종으로 확장.
-- plm_raw_material_documents.doc_type CHECK 제약이 COA/MSDS만 허용하고 있어서, 새 doc_type 값으로
-- 업로드를 시도하면 제약 위반으로 실패한다 - 그래서 이 제약부터 넓혀야 한다.
--
-- 참고: 이 마이그레이션은 2026-09-23에 Supabase 프로젝트(ztzitdhngdtfwmfqusbb)에 이미 적용되어
-- 있습니다. 이 파일은 로컬 저장소의 supabase/migrations/ 이력을 실제 DB 상태와 맞추기 위한
-- 기록용입니다 - 다시 실행해도 안전합니다(같은 이름의 제약을 지우고 다시 만들 뿐이라 멱등).

alter table public.plm_raw_material_documents
  drop constraint if exists plm_raw_material_documents_doc_type_check;

alter table public.plm_raw_material_documents
  add constraint plm_raw_material_documents_doc_type_check
  check (doc_type = any (array['COA'::text, 'MSDS'::text, 'COMPOSITION'::text, 'ALLERGEN_SHEET'::text, 'IFRA'::text]));
