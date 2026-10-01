-- 생산실적 관리 개선: 완제품 출고 수량(EA/PACK) 컬럼 추가.
-- 기존 plm_production_records 테이블에 컬럼만 추가하는 것이라 RLS/권한은 그대로 재사용됨
-- (plm_production_records_write: Admin/Researcher/Production 쓰기, plm_production_records_read: +QA/Viewer 읽기).
alter table plm_production_records add column if not exists shipped_qty_ea numeric;
alter table plm_production_records add column if not exists shipped_qty_pack numeric;

comment on column plm_production_records.shipped_qty_ea is '완제품 출고 수량 (단위: EA)';
comment on column plm_production_records.shipped_qty_pack is '완제품 출고 수량 (단위: PACK)';
