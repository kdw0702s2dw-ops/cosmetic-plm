-- ============================================================
-- KOVAS 양식: 헤더 메타정보 테이블 + 복합성분표 묶음 뷰
-- (이미 적용되어 있을 수 있음. 없으면 실행)
-- ============================================================

create table if not exists public.formula_meta (
  formula_id uuid primary key references public.formulas(id) on delete cascade,
  frame_formulation_number text,
  doc_no text,
  doc_date date,
  manufacturer text default '뉴트리어드바이저',
  manufacturer_address text,
  qualified_person text,
  customer text,
  kovas_no text,
  product_name text,
  signature text,
  updated_at timestamptz default now()
);
alter table public.formula_meta enable row level security;

-- 정책 (이미 있으면 무시됨)
do $$ begin
  create policy "formula_meta_select" on public.formula_meta
    for select to authenticated using (public.plm_is_active_user());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "formula_meta_insert" on public.formula_meta
    for insert to authenticated with check (public.plm_is_active_user());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "formula_meta_update" on public.formula_meta
    for update to authenticated using (public.plm_is_active_user()) with check (public.plm_is_active_user());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "formula_meta_delete" on public.formula_meta
    for delete to authenticated using (public.plm_is_admin());
exception when duplicate_object then null; end $$;

-- KOVAS 복합성분표용 뷰: 원료 한 줄에 구성성분 묶음
create or replace view v_kovas_composite as
select
  f.id as formula_id, f.formula_code, f.formula_name,
  rm.raw_code, rm.raw_name, fi.percentage as input_pct,
  string_agg(ing.inci_name, ',  ' order by rc.percentage desc) as inci_en_group,
  string_agg(ing.korean_name, ',  ' order by rc.percentage desc) as inci_kr_group,
  case when count(*) = 1 then '-'
       else string_agg(to_char(rc.percentage,'FM990.######'), '  ' order by rc.percentage desc)
  end as ratio_group,
  string_agg(coalesce(ing.cas_no,'-'), '  ' order by rc.percentage desc) as cas_group,
  count(*) as comp_count
from formula_items fi
join formulas f          on f.id = fi.formula_id
join raw_materials rm    on rm.id = fi.raw_material_id
join raw_compositions rc on rc.raw_material_id = fi.raw_material_id
join ingredients ing     on ing.id = rc.ingredient_id
where fi.deleted_at is null and rm.deleted_at is null
group by f.id, f.formula_code, f.formula_name, rm.raw_code, rm.raw_name, fi.percentage
order by fi.percentage desc;
