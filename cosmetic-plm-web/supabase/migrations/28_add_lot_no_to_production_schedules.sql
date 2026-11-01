-- 생산_일정관리: 일정 등록 단계에서도 제조(Lot No.)/제품(Lot No.)를 미리 입력해둘 수 있게 컬럼을
-- 추가한다. 생산실적(plm_production_records)의 lot_no/mfg_lot_no와 이름은 같지만 별도 테이블의
-- 독립된 값이다(일정 단계 예정 값과 실제 생산실적 값이 다를 수 있음). 둘 다 선택 입력, 유일성 제약 없음.
alter table public.plm_production_schedules
  add column lot_no text,
  add column mfg_lot_no text;

comment on column public.plm_production_schedules.lot_no is '제품(Lot No.) - 완제품/출고 단계 Lot 번호 예정값(선택 입력)';
comment on column public.plm_production_schedules.mfg_lot_no is '제조(Lot No.) - 제조(벌크) 단계 Lot 번호 예정값(선택 입력)';
