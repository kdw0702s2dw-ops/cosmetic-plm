-- 생산실적관리: 품질관리 출고관리(plm_shipment_records)와 같은 기능성·중금속·미생물 칸을 추가한다.
-- 값 체계는 출고관리와 동일(기능성: 해당없음/주름기능성/미백기능성/이중기능성, 중금속·미생물: 해당없음/진행중/완료).
-- 원격 적용 마이그레이션명: add_quality_fields_to_production_records
ALTER TABLE plm_production_records
  ADD COLUMN functional_claim text NOT NULL DEFAULT '해당없음',
  ADD COLUMN heavy_metal_status text NOT NULL DEFAULT '해당없음',
  ADD COLUMN microbial_status text NOT NULL DEFAULT '해당없음';
