-- 원료 발주관리: 진행상태 "발주전" 추가 + 발주 목록 품목명(item_names) 표시.
--
-- 원격 적용 마이그레이션명: purchase_order_pre_status_and_item_names (version 20261117070051, 이미 원격 적용됨)

-- 1) 진행상태에 "발주전"(아직 공급사에 발주서를 보내지 않은 상태) 추가.
--    기존 데이터는 모두 주문완료/부분입고/입고완료/취소 중 하나라 영향 없음.
alter table plm_raw_material_purchase_orders drop constraint if exists plm_raw_material_purchase_orders_status_check;
alter table plm_raw_material_purchase_orders add constraint plm_raw_material_purchase_orders_status_check
  check (status in ('발주전','주문완료','부분입고','입고완료','취소'));

-- 2) 발주 목록 화면에서 "무엇을 발주했는지" 바로 보이도록, 품목(원료명)을 집계해 넣은 item_names 컬럼 추가.
--    CREATE OR REPLACE VIEW는 기존 컬럼 순서/이름을 바꿀 수 없어 새 컬럼은 맨 뒤에 추가한다.
--    line_no 순서대로 콤마로 이어붙이고, 화면에서 길면 "A, B 외 N건" 형태로 줄이는 건 클라이언트에서 처리한다.
create or replace view v_plm_purchase_order_summary as
select
  po.id,
  po.order_no,
  po.supplier_company_id,
  c.name_kr as supplier_name_kr,
  c.name_en as supplier_name_en,
  po.order_date,
  po.payment_due_date,
  po.payment_date,
  po.status,
  po.payment_status,
  po.note,
  po.created_by,
  po.created_at,
  po.updated_at,
  coalesce(i.item_count, 0) as item_count,
  coalesce(i.supply_amount_sum, 0) as supply_amount_sum,
  coalesce(i.vat_amount_sum, 0) as vat_amount_sum,
  coalesce(i.total_amount_sum, 0) as total_amount_sum,
  i.item_names
from plm_raw_material_purchase_orders po
left join plm_companies c on c.id = po.supplier_company_id
left join (
  select
    poi.purchase_order_id,
    count(*) as item_count,
    string_agg(coalesce(rm.raw_name, poi.raw_code), ', ' order by poi.line_no) as item_names,
    sum(poi.supply_amount) as supply_amount_sum,
    sum(poi.vat_amount) as vat_amount_sum,
    sum(poi.total_amount) as total_amount_sum
  from plm_raw_material_purchase_order_items poi
  left join plm_raw_materials rm on rm.raw_code = poi.raw_code
  group by poi.purchase_order_id
) i on i.purchase_order_id = po.id;
