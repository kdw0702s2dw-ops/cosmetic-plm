-- 제품 MSDS 국문 양식 추가 - 문서별 작성 언어(en: 영문, ko: 국문)를 저장한다. 기존 문서는 모두
-- 영문 양식이므로 기본값 'en'으로 채워진다. PDF/엑셀 출력의 고정 문구(제목/라벨/결재란 등)는 이
-- 값에 따라 영/국문으로 분기된다(services/sprint2/productMsdsPdfService.ts, productMsdsExcelService.ts).
--
-- 원격 적용 마이그레이션명: add_language_to_plm_product_msds (version 20261110060927, 이미 원격 적용됨)
ALTER TABLE plm_product_msds ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
