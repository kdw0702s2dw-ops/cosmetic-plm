-- 원료 발주관리: 발주(헤더) + 발주 품목(원료별 라인) 두 테이블로 구성한다 (처방관리의 "처방+BOM"과
-- 동일한 헤더+라인 구조). 발주 1건 = 공급사 1곳 + 품목(원료) 여러 개. 결제는 발주 단위로 관리하며,
-- 화면에서는 공급사별로 섹션을 나눠 보여줘서(예: 월말 결제일에 여러 공급사에 각각 결제할 금액을
-- 한눈에 파악) 실무 결제 프로세스에 맞춘다.

-- 발주번호 자동 생성용 시퀀스/함수 - 'PO' + 발주 처리일(YYYYMMDD) + 전역 증가 4자리 번호.
-- 날짜별로 번호를 리셋하지 않고 전역 시퀀스를 쓰는 이유는, 여러 발주를 동시에 저장해도 번호 충돌
-- (경쟁 상태) 없이 항상 고유한 번호를 보장하기 위함(날짜별로 계산하면 동시 저장 시 같은 번호가 나올 수 있음).
create sequence if not exists plm_purchase_order_no_seq;

create or replace function public.plm_next_purchase_order_no()
returns text
language sql
as $$
  select 'PO' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('plm_purchase_order_no_seq')::text, 4, '0');
$$;

create table if not exists plm_raw_material_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default public.plm_next_purchase_order_no(),
  supplier_company_id uuid references plm_companies(id),
  order_date date not null default current_date,
  payment_due_date date,
  payment_date date,
  status text not null default '주문완료' check (status in ('주문완료','입고완료','취소')),
  payment_status text not null default '미결제' check (payment_status in ('미결제','결제완료')),
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table plm_raw_material_purchase_orders is '원료 발주 헤더 - 공급사 1곳 단위. 실제 품목(원료별 단가/수량/금액)은 plm_raw_material_purchase_order_items에 있음.';

-- 발주 품목(원료별 라인) - 발주 1건 안에서 여러 원료를 한 번에 담을 수 있음.
-- unit_price/quantity 등은 저장 시점의 스냅샷이라 원료 마스터의 단가가 나중에 바뀌어도 과거 발주 기록은 그대로 유지된다.
create table if not exists plm_raw_material_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references plm_raw_material_purchase_orders(id) on delete cascade,
  line_no int not null default 1,
  -- 발주 품목은 원료의 하위 데이터가 아니라 발주의 하위 데이터이므로(13_raw_code_fk_update_cascade.sql의
  -- plm_formula_lines와 동일한 논리), 원료가 삭제된다고 발주 이력까지 함께 사라지면 안 됨 -> on delete restrict.
  -- 원료코드가 수정되는 경우는 그대로 따라가야 하므로 on update cascade.
  raw_code text not null references plm_raw_materials(raw_code) on update cascade on delete restrict,
  unit_price numeric(14,4) not null default 0 check (unit_price >= 0),
  quantity numeric(14,4) not null default 0 check (quantity >= 0),
  unit text,
  supply_amount numeric(14,2) not null default 0,
  vat_rate numeric(5,4) not null default 0.1,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  note text
);

comment on table plm_raw_material_purchase_order_items is '원료 발주 품목(원료별 라인) - 단가/수량은 발주 시점 스냅샷.';

create index if not exists idx_plm_po_items_order_id on plm_raw_material_purchase_order_items(purchase_order_id);
create index if not exists idx_plm_po_items_raw_code on plm_raw_material_purchase_order_items(raw_code);
create index if not exists idx_plm_po_supplier on plm_raw_material_purchase_orders(supplier_company_id);

alter table plm_raw_material_purchase_orders enable row level security;
alter table plm_raw_material_purchase_order_items enable row level security;

-- 원료관리(plm_raw_materials)와 동일한 역할 구성: 조회는 전 역할, 쓰기/삭제는 Admin/Researcher만.
drop policy if exists "plm_purchase_orders_read" on plm_raw_material_purchase_orders;
create policy "plm_purchase_orders_read" on plm_raw_material_purchase_orders for select to authenticated
  using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
drop policy if exists "plm_purchase_orders_write" on plm_raw_material_purchase_orders;
create policy "plm_purchase_orders_write" on plm_raw_material_purchase_orders for all to authenticated
  using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_purchase_order_items_read" on plm_raw_material_purchase_order_items;
create policy "plm_purchase_order_items_read" on plm_raw_material_purchase_order_items for select to authenticated
  using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
drop policy if exists "plm_purchase_order_items_write" on plm_raw_material_purchase_order_items;
create policy "plm_purchase_order_items_write" on plm_raw_material_purchase_order_items for all to authenticated
  using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));

-- 목록 화면(공급사별 섹션 + 합계 표시)에서 바로 쓸 수 있도록 헤더+공급사명+품목 합계를 조인/집계한 뷰.
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
  coalesce(i.total_amount_sum, 0) as total_amount_sum
from plm_raw_material_purchase_orders po
left join plm_companies c on c.id = po.supplier_company_id
left join (
  select purchase_order_id, count(*) as item_count,
    sum(supply_amount) as supply_amount_sum,
    sum(vat_amount) as vat_amount_sum,
    sum(total_amount) as total_amount_sum
  from plm_raw_material_purchase_order_items
  group by purchase_order_id
) i on i.purchase_order_id = po.id;

-- 발주 상세(품목) 편집/조회 화면에서 원료명/Trade Name을 함께 보여주기 위한 뷰.
create or replace view v_plm_purchase_order_items_detail as
select
  poi.*,
  rm.raw_name,
  rm.trade_name
from plm_raw_material_purchase_order_items poi
left join plm_raw_materials rm on rm.raw_code = poi.raw_code;

-- 발주 품목을 한 번에 교체 저장(기존 품목 전부 삭제 후 재삽입) - 원료관리 "구성성분" 저장
-- (plm_save_components)과 동일한 헤더+라인 교체 패턴. 다만 이 함수는 SECURITY DEFINER를 쓰지 않는다:
-- plm_save_components는 SECURITY DEFINER이면서 역할 체크를 plm_is_active_user()(로그인만 확인)로만
-- 해서, 실제로는 테이블 RLS(plm_raw_components_write: Admin/Researcher만)보다 느슨하게 "로그인한
-- 아무 역할이나 저장 가능"해지는 문제가 있다(추후 별도로 짚어서 고칠 예정). 이 함수는 SECURITY
-- DEFINER를 아예 빼서, 호출한 사용자의 권한이 그대로 적용되게(=RLS가 정상 작동하게) 만든다 - Admin/
-- Researcher가 아니면 INSERT가 RLS 위반으로 실패한다.
create or replace function public.plm_save_purchase_order_items(p_order_id uuid, p_items jsonb)
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  delete from plm_raw_material_purchase_order_items where purchase_order_id = p_order_id;

  insert into plm_raw_material_purchase_order_items
    (purchase_order_id, line_no, raw_code, unit_price, quantity, unit, supply_amount, vat_rate, vat_amount, total_amount, note)
  select
    p_order_id,
    (row_number() over ())::int,
    i->>'raw_code',
    coalesce((i->>'unit_price')::numeric, 0),
    coalesce((i->>'quantity')::numeric, 0),
    nullif(i->>'unit',''),
    coalesce((i->>'supply_amount')::numeric, 0),
    coalesce((i->>'vat_rate')::numeric, 0.1),
    coalesce((i->>'vat_amount')::numeric, 0),
    coalesce((i->>'total_amount')::numeric, 0),
    nullif(i->>'note','')
  from jsonb_array_elements(p_items) as i;

  get diagnostics v_count = row_count;

  update plm_raw_material_purchase_orders set updated_at = now() where id = p_order_id;

  return v_count;
end;
$function$;
