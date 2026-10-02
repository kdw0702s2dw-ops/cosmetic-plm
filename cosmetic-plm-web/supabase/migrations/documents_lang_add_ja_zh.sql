-- 문서관리(전성분표/복합성분표/단일성분표) 출력 언어에 영문+일본(EN_JA)/영문+중국(EN_ZH) 추가.
-- 기존 plm_documents.lang CHECK 제약이 'KR'/'EN'/'BOTH'만 허용하고 있어서 새 값으로 먼저 넓혀야
-- createFormulaDocument/regenerateFormulaDocument가 INSERT/UPDATE 시 막히지 않는다.
ALTER TABLE plm_documents DROP CONSTRAINT plm_documents_lang_check;
ALTER TABLE plm_documents ADD CONSTRAINT plm_documents_lang_check
  CHECK (lang = ANY (ARRAY['KR'::text, 'EN'::text, 'BOTH'::text, 'EN_JA'::text, 'EN_ZH'::text]));
