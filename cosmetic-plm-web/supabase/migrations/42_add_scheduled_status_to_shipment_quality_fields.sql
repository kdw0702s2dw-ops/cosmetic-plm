-- 원격 적용 마이그레이션명: add_scheduled_status_to_shipment_quality_fields (version 20261117085138, 이미 원격 적용됨)
-- 생산실적관리/출고관리의 기능성·중금속·미생물 칸에 "진행예정"(시험 예정, 아직 시작 전) 값 추가.
-- 기존 값 체계(기능성: 해당없음/주름기능성/미백기능성/이중기능성, 중금속·미생물: 해당없음/진행중/완료)는
-- 그대로 유지하고 선택지만 늘린다 - 기존 데이터는 전부 기존 값 중 하나라 영향 없음.
-- plm_production_records.functional_claim/heavy_metal_status/microbial_status는 체크 제약이 없어(31_add_quality_fields_to_production_records.sql)
-- DB 쪽은 plm_shipment_records만 수정하면 된다.
alter table plm_shipment_records drop constraint if exists plm_shipment_records_functional_claim_check;
alter table plm_shipment_records add constraint plm_shipment_records_functional_claim_check
  check (functional_claim in ('해당없음','진행예정','주름기능성','미백기능성','이중기능성'));

alter table plm_shipment_records drop constraint if exists plm_shipment_records_heavy_metal_status_check;
alter table plm_shipment_records add constraint plm_shipment_records_heavy_metal_status_check
  check (heavy_metal_status in ('해당없음','진행예정','진행중','완료'));

alter table plm_shipment_records drop constraint if exists plm_shipment_records_microbial_status_check;
alter table plm_shipment_records add constraint plm_shipment_records_microbial_status_check
  check (microbial_status in ('해당없음','진행예정','진행중','완료'));
