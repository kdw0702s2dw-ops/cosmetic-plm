-- 생산실적 관리: 같은 처방(formula_code+revision) 내 Lot No. 중복을 막던 UNIQUE 제약을 제거.
-- 사용자 요청: "추가 제조 건"처럼 같은 Lot No.로 여러 번 생산실적을 등록해야 하는 경우가 있어,
-- DB 단에서 막지 않고 애플리케이션에서 중복 시 확인(confirm) 후 등록하도록 변경한다.
alter table public.plm_production_records
  drop constraint plm_production_records_formula_lot_key;
