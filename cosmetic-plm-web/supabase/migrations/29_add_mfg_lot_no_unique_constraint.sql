-- 생산실적관리: 제조(Lot No.)는 제조(벌크) 배치 번호이므로 처방과 무관하게 전체 테이블에서 유일해야 한다.
-- 선택 입력 항목이라 NULL(미입력)은 제외하는 부분 UNIQUE 인덱스로 중복을 완전히 차단한다.
-- (앱은 빈 문자열을 저장 전에 NULL로 바꿔 보낸다.) 원격 적용 마이그레이션명: add_mfg_lot_no_unique_constraint
CREATE UNIQUE INDEX plm_production_records_mfg_lot_no_unique
ON plm_production_records (mfg_lot_no)
WHERE mfg_lot_no IS NOT NULL;
