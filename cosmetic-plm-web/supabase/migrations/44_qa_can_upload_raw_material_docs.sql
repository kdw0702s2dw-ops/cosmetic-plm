-- QA 역할도 원료관리에서 원료 문서(COA/MSDS/Composition/Allergen Sheet/IFRA)를 업로드/교체할 수 있도록
-- RLS를 완화한다.
--
-- 배경: 사용자가 "권한설정" 화면(plm_role_page_access)에서 QA에게 원료관리 메뉴를 노출시켰지만,
-- 그 화면은 메뉴 노출 여부만 바꿀 뿐 실제 쓰기 권한과는 무관하다(화면 자체의 안내 문구에도 명시됨).
-- 실제 업로드 가능 여부는 아래 두 레이어에서 각각 별도로 Admin/Researcher로 제한되어 있었다:
--   1) 프론트엔드: services/sprint1/authRbacService.ts의 canWriteMaterials() - 원료 자체의
--      생성/수정/삭제뿐 아니라 RawMaterialDocUploader의 canWrite도 이 값을 그대로 재사용하고 있었음
--   2) DB RLS: plm_raw_material_documents 테이블 + storage.objects(raw-material-docs 버킷)
--
-- 요청: "QA도 원료관리에서 자료 업로드할 수 있게 업데이트" - 원료 자체의 CRUD 권한까지 넓히는 것은
-- 과한 범위라고 판단해, canWriteMaterials와는 분리된 새 함수 canUploadMaterialDocs(Admin/Researcher/QA)를
-- 만들어 문서 업로드 UI에서만 사용하도록 프론트엔드를 수정했다(원료 신규/수정/삭제 버튼은 그대로
-- canWriteMaterials 유지, QA에게는 계속 숨김). 삭제(DELETE) 권한도 "업로드"라는 요청 범위를 벗어나므로
-- 이번 변경에서 제외하고 Admin/Researcher로 유지했다.
--
-- 아래 ALTER POLICY 4건은 Supabase MCP 도구(execute_sql)로 적용했다. 이전 작업(CREATE FUNCTION·
-- 대량 DML)에서는 안전 확인 다이얼로그 대기로 반복 타임아웃이 났었는데, 이번 ALTER POLICY는
-- 타임아웃 없이 바로 성공했다(2026-11-24). apply_migration을 거치지 않아 list_migrations에는
-- 등록되지 않은, 기록 보존용 로컬 파일이다.

alter policy plm_raw_material_documents_insert on plm_raw_material_documents
  with check (plm_has_role(array['Admin','Researcher','QA']));

alter policy plm_raw_material_documents_update on plm_raw_material_documents
  using (plm_has_role(array['Admin','Researcher','QA']));

alter policy raw_material_docs_upload on storage.objects
  with check (bucket_id = 'raw-material-docs' and plm_has_role(array['Admin','Researcher','QA']));

alter policy raw_material_docs_update on storage.objects
  using (bucket_id = 'raw-material-docs' and plm_has_role(array['Admin','Researcher','QA']));
