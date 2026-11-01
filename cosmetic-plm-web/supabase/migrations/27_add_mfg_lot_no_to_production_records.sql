-- 생산실적 관리: 기존 lot_no(완제품/출고 단계 Lot 번호, 화면 표시는 "제품(Lot No.)")와는 별개로,
-- 제조(벌크) 단계에서 붙이는 Lot 번호를 따로 기록할 수 있게 컬럼을 추가한다. 화면 표시는 "제조(Lot No.)".
-- 제품(Lot No.)와 마찬가지로 유일성 제약은 걸지 않는다(이미 lot_no 쪽 UNIQUE 제약도 제거한 상태).
alter table public.plm_production_records
  add column mfg_lot_no text;

comment on column public.plm_production_records.mfg_lot_no is '제조(벌크) 단계 Lot 번호 - 완제품/출고 단계의 lot_no("제품(Lot No.)")와는 별개';
