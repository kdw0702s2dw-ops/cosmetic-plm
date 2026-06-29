-- Enterprise PLM Sprint 0 SAFE v2
-- 오류 원인 수정: 실제 DB에 없는 컬럼(total_percent 등)을 직접 참조하지 않습니다.
-- 모든 legacy migration은 information_schema로 컬럼 존재 여부를 확인한 뒤 동적 SQL로 실행합니다.

create extension if not exists pgcrypto;

create table if not exists public.plm_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'Researcher' check (role in ('Admin','Researcher','QA','Viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.plm_user_profiles enable row level security;

drop policy if exists "plm_user_profiles_select_self_or_admin" on public.plm_user_profiles;
create policy "plm_user_profiles_select_self_or_admin"
on public.plm_user_profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
);

drop policy if exists "plm_user_profiles_insert_self" on public.plm_user_profiles;
create policy "plm_user_profiles_insert_self"
on public.plm_user_profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists "plm_user_profiles_admin_all" on public.plm_user_profiles;
create policy "plm_user_profiles_admin_all"
on public.plm_user_profiles
for all to authenticated
using (
  exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
)
with check (
  exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
);

create or replace function public.plm_has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plm_user_profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role = any(allowed_roles)
  );
$$;

create table if not exists public.plm_raw_materials (
  id uuid primary key default gen_random_uuid(),
  raw_code text not null unique,
  raw_name text not null,
  trade_name text,
  raw_type text default 'SINGLE' check (raw_type in ('SINGLE','COMPLEX')),
  manufacturer text,
  supplier text,
  unit_price numeric default 0,
  currency text default 'KRW',
  moq text,
  lead_time text,
  origin_country text,
  inci_kr text,
  inci_en text,
  inci_cn text,
  inci_jp text,
  cas_no text,
  ec_no text,
  function_kr text,
  function_en text,
  regulatory_note text,
  note text,
  is_active boolean default true,
  source_table text,
  source_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.plm_raw_material_components (
  id uuid primary key default gen_random_uuid(),
  raw_code text not null references public.plm_raw_materials(raw_code) on delete cascade,
  component_no integer not null,
  component_name_kr text,
  component_name_en text,
  inci_kr text,
  inci_en text,
  inci_cn text,
  inci_jp text,
  cas_no text,
  ec_no text,
  composition_percent numeric default 0,
  function_kr text,
  function_en text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(raw_code, component_no)
);

create table if not exists public.plm_formulas (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null default 'R0',
  formula_name text not null,
  status text default 'DRAFT',
  product_type text,
  customer text,
  target_country text,
  claim text,
  total_percent numeric default 0,
  estimated_cost_per_kg numeric default 0,
  created_by text,
  is_active boolean default true,
  source_table text,
  source_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision)
);

create table if not exists public.plm_formula_lines (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  line_no integer not null,
  phase text default 'A',
  raw_code text,
  raw_name text,
  inci_kr text,
  inci_en text,
  percentage numeric default 0,
  function_kr text,
  function_en text,
  unit_price numeric default 0,
  cost_per_kg numeric default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision, line_no),
  foreign key (formula_code, revision) references public.plm_formulas(formula_code, revision) on delete cascade
);

create table if not exists public.plm_formula_revisions (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  from_revision text,
  to_revision text not null,
  change_summary text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.plm_documents (
  id uuid primary key default gen_random_uuid(),
  document_code text not null unique,
  formula_code text,
  revision text,
  document_type text not null,
  title text not null,
  status text default 'DRAFT',
  payload_json jsonb default '{}'::jsonb,
  html_content text,
  created_by text,
  source_table text,
  source_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.plm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  action text not null,
  table_name text,
  record_key text,
  before_json jsonb,
  after_json jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.plm_table_archive_registry (
  id uuid primary key default gen_random_uuid(),
  table_name text not null unique,
  category text,
  reason text,
  replacement_table text,
  status text default 'ARCHIVE_CANDIDATE',
  row_count_snapshot numeric,
  created_at timestamptz default now()
);

create or replace function public.plm_col_exists(p_table text, p_col text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_col
  );
$$;

-- 원료 legacy → 표준 원료
do $$
declare
  q text;
  raw_code_expr text;
  raw_name_expr text;
  trade_name_expr text;
  raw_type_expr text;
  manufacturer_expr text;
  supplier_expr text;
  unit_price_expr text;
  currency_expr text;
  moq_expr text;
  lead_time_expr text;
  inci_kr_expr text;
  inci_en_expr text;
  inci_cn_expr text;
  inci_jp_expr text;
  cas_no_expr text;
  ec_no_expr text;
  function_kr_expr text;
  function_en_expr text;
  note_expr text;
  source_id_expr text;
begin
  if to_regclass('public.enterprise_raw_material_master') is not null then
    raw_code_expr := case when public.plm_col_exists('enterprise_raw_material_master','raw_code') then 'raw_code::text' else '''RAW-'' || row_number() over ()::text' end;
    raw_name_expr := case when public.plm_col_exists('enterprise_raw_material_master','raw_name') then 'coalesce(raw_name::text, ''미등록 원료'')' when public.plm_col_exists('enterprise_raw_material_master','trade_name') then 'coalesce(trade_name::text, ''미등록 원료'')' else '''미등록 원료''' end;
    trade_name_expr := case when public.plm_col_exists('enterprise_raw_material_master','trade_name') then 'trade_name::text' else 'null::text' end;
    raw_type_expr := case when public.plm_col_exists('enterprise_raw_material_master','raw_type') then 'coalesce(raw_type::text, ''SINGLE'')' else '''SINGLE''' end;
    manufacturer_expr := case when public.plm_col_exists('enterprise_raw_material_master','manufacturer') then 'manufacturer::text' else 'null::text' end;
    supplier_expr := case when public.plm_col_exists('enterprise_raw_material_master','supplier') then 'supplier::text' else 'null::text' end;
    unit_price_expr := case when public.plm_col_exists('enterprise_raw_material_master','unit_price') then 'coalesce(unit_price::numeric,0)' else '0::numeric' end;
    currency_expr := case when public.plm_col_exists('enterprise_raw_material_master','currency') then 'coalesce(currency::text,''KRW'')' else '''KRW''' end;
    moq_expr := case when public.plm_col_exists('enterprise_raw_material_master','moq') then 'moq::text' else 'null::text' end;
    lead_time_expr := case when public.plm_col_exists('enterprise_raw_material_master','lead_time') then 'lead_time::text' else 'null::text' end;
    inci_kr_expr := case when public.plm_col_exists('enterprise_raw_material_master','inci_kr') then 'inci_kr::text' else 'null::text' end;
    inci_en_expr := case when public.plm_col_exists('enterprise_raw_material_master','inci_en') then 'inci_en::text' else 'null::text' end;
    inci_cn_expr := case when public.plm_col_exists('enterprise_raw_material_master','inci_cn') then 'inci_cn::text' else 'null::text' end;
    inci_jp_expr := case when public.plm_col_exists('enterprise_raw_material_master','inci_jp') then 'inci_jp::text' else 'null::text' end;
    cas_no_expr := case when public.plm_col_exists('enterprise_raw_material_master','cas_no') then 'cas_no::text' else 'null::text' end;
    ec_no_expr := case when public.plm_col_exists('enterprise_raw_material_master','ec_no') then 'ec_no::text' else 'null::text' end;
    function_kr_expr := case when public.plm_col_exists('enterprise_raw_material_master','function_kr') then 'function_kr::text' else 'null::text' end;
    function_en_expr := case when public.plm_col_exists('enterprise_raw_material_master','function_en') then 'function_en::text' else 'null::text' end;
    note_expr := case when public.plm_col_exists('enterprise_raw_material_master','note') then 'note::text' else 'null::text' end;
    source_id_expr := case when public.plm_col_exists('enterprise_raw_material_master','id') then 'id::text' else 'null::text' end;

    q := format($fmt$
      insert into public.plm_raw_materials
      (raw_code, raw_name, trade_name, raw_type, manufacturer, supplier, unit_price, currency, moq, lead_time, inci_kr, inci_en, inci_cn, inci_jp, cas_no, ec_no, function_kr, function_en, note, source_table, source_id)
      select %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'enterprise_raw_material_master', %s
      from public.enterprise_raw_material_master
      on conflict (raw_code) do update set
        raw_name = excluded.raw_name,
        trade_name = coalesce(excluded.trade_name, public.plm_raw_materials.trade_name),
        supplier = coalesce(excluded.supplier, public.plm_raw_materials.supplier),
        manufacturer = coalesce(excluded.manufacturer, public.plm_raw_materials.manufacturer),
        unit_price = coalesce(excluded.unit_price, public.plm_raw_materials.unit_price),
        updated_at = now()
    $fmt$, raw_code_expr, raw_name_expr, trade_name_expr, raw_type_expr, manufacturer_expr, supplier_expr, unit_price_expr, currency_expr, moq_expr, lead_time_expr, inci_kr_expr, inci_en_expr, inci_cn_expr, inci_jp_expr, cas_no_expr, ec_no_expr, function_kr_expr, function_en_expr, note_expr, source_id_expr);
    execute q;
  end if;
end $$;

-- 처방 Header legacy → 표준 처방
do $$
declare
  q text;
  formula_code_expr text;
  revision_expr text;
  formula_name_expr text;
  status_expr text;
  product_type_expr text;
  customer_expr text;
  target_country_expr text;
  claim_expr text;
  total_percent_expr text;
  created_by_expr text;
  source_id_expr text;
begin
  if to_regclass('public.gold_formula_headers') is not null then
    formula_code_expr := case when public.plm_col_exists('gold_formula_headers','formula_code') then 'formula_code::text' else '''F-'' || row_number() over ()::text' end;
    revision_expr := case when public.plm_col_exists('gold_formula_headers','revision') then 'coalesce(revision::text,''R0'')' else '''R0''' end;
    formula_name_expr := case when public.plm_col_exists('gold_formula_headers','formula_name') then 'coalesce(formula_name::text, formula_code::text)' else '''미등록 처방''' end;
    status_expr := case when public.plm_col_exists('gold_formula_headers','status') then 'coalesce(status::text,''DRAFT'')' else '''DRAFT''' end;
    product_type_expr := case when public.plm_col_exists('gold_formula_headers','product_type') then 'product_type::text' else 'null::text' end;
    customer_expr := case when public.plm_col_exists('gold_formula_headers','customer') then 'customer::text' else 'null::text' end;
    target_country_expr := case when public.plm_col_exists('gold_formula_headers','target_country') then 'target_country::text' else 'null::text' end;
    claim_expr := case when public.plm_col_exists('gold_formula_headers','claim') then 'claim::text' else 'null::text' end;
    total_percent_expr := case when public.plm_col_exists('gold_formula_headers','total_percent') then 'coalesce(total_percent::numeric,0)' else '0::numeric' end;
    created_by_expr := case when public.plm_col_exists('gold_formula_headers','created_by') then 'created_by::text' else 'null::text' end;
    source_id_expr := case when public.plm_col_exists('gold_formula_headers','id') then 'id::text' else 'null::text' end;

    q := format($fmt$
      insert into public.plm_formulas
      (formula_code, revision, formula_name, status, product_type, customer, target_country, claim, total_percent, created_by, source_table, source_id)
      select %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'gold_formula_headers', %s
      from public.gold_formula_headers
      on conflict (formula_code, revision) do update set
        formula_name = excluded.formula_name,
        status = excluded.status,
        total_percent = excluded.total_percent,
        updated_at = now()
    $fmt$, formula_code_expr, revision_expr, formula_name_expr, status_expr, product_type_expr, customer_expr, target_country_expr, claim_expr, total_percent_expr, created_by_expr, source_id_expr);
    execute q;
  end if;
end $$;

-- 처방 Line legacy → 표준 BOM
do $$
declare
  q text;
  formula_code_expr text;
  revision_expr text;
  line_no_expr text;
  phase_expr text;
  raw_code_expr text;
  raw_name_expr text;
  inci_kr_expr text;
  inci_en_expr text;
  percentage_expr text;
  function_en_expr text;
  note_expr text;
begin
  if to_regclass('public.gold_formula_lines') is not null then
    formula_code_expr := case when public.plm_col_exists('gold_formula_lines','formula_code') then 'formula_code::text' else 'null::text' end;
    revision_expr := case when public.plm_col_exists('gold_formula_lines','revision') then 'coalesce(revision::text,''R0'')' else '''R0''' end;
    line_no_expr := case when public.plm_col_exists('gold_formula_lines','line_no') then 'line_no::integer' else 'row_number() over (partition by formula_code order by formula_code)::integer' end;
    phase_expr := case when public.plm_col_exists('gold_formula_lines','phase') then 'coalesce(phase::text,''A'')' else '''A''' end;
    raw_code_expr := case when public.plm_col_exists('gold_formula_lines','raw_code') then 'raw_code::text' else 'null::text' end;
    raw_name_expr := case when public.plm_col_exists('gold_formula_lines','raw_name') then 'raw_name::text' else 'null::text' end;
    inci_kr_expr := case when public.plm_col_exists('gold_formula_lines','inci_kr') then 'inci_kr::text' else 'null::text' end;
    inci_en_expr := case when public.plm_col_exists('gold_formula_lines','inci_en') then 'inci_en::text' else 'null::text' end;
    percentage_expr := case when public.plm_col_exists('gold_formula_lines','percentage') then 'coalesce(percentage::numeric,0)' else '0::numeric' end;
    function_en_expr := case when public.plm_col_exists('gold_formula_lines','function_en') then 'function_en::text' else 'null::text' end;
    note_expr := case when public.plm_col_exists('gold_formula_lines','note') then 'note::text' else 'null::text' end;

    q := format($fmt$
      insert into public.plm_formula_lines
      (formula_code, revision, line_no, phase, raw_code, raw_name, inci_kr, inci_en, percentage, function_en, note)
      select %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
      from public.gold_formula_lines
      where %s is not null
      on conflict (formula_code, revision, line_no) do update set
        phase = excluded.phase,
        raw_code = excluded.raw_code,
        raw_name = excluded.raw_name,
        inci_kr = excluded.inci_kr,
        inci_en = excluded.inci_en,
        percentage = excluded.percentage,
        updated_at = now()
    $fmt$, formula_code_expr, revision_expr, line_no_expr, phase_expr, raw_code_expr, raw_name_expr, inci_kr_expr, inci_en_expr, percentage_expr, function_en_expr, note_expr, formula_code_expr);
    execute q;
  end if;
end $$;

-- 표준 처방 총합 재계산
update public.plm_formulas f
set total_percent = coalesce(x.total_percent,0), updated_at = now()
from (
  select formula_code, revision, sum(coalesce(percentage,0)) as total_percent
  from public.plm_formula_lines
  group by formula_code, revision
) x
where f.formula_code = x.formula_code
  and f.revision = x.revision;

-- 문서 legacy → 표준 문서
do $$
declare
  q text;
  document_code_expr text;
  formula_code_expr text;
  revision_expr text;
  document_type_expr text;
  title_expr text;
  status_expr text;
  payload_expr text;
  created_by_expr text;
  source_id_expr text;
begin
  if to_regclass('public.gold_documents') is not null then
    document_code_expr := case when public.plm_col_exists('gold_documents','document_code') then 'document_code::text' else '''DOC-'' || row_number() over ()::text' end;
    formula_code_expr := case when public.plm_col_exists('gold_documents','formula_code') then 'formula_code::text' else 'null::text' end;
    revision_expr := case when public.plm_col_exists('gold_documents','revision') then 'revision::text' else 'null::text' end;
    document_type_expr := case when public.plm_col_exists('gold_documents','document_type') then 'document_type::text' else '''DOCUMENT''' end;
    title_expr := case when public.plm_col_exists('gold_documents','title') then 'coalesce(title::text,''PLM Document'')' else '''PLM Document''' end;
    status_expr := case when public.plm_col_exists('gold_documents','status') then 'coalesce(status::text,''DRAFT'')' else '''DRAFT''' end;
    payload_expr := case when public.plm_col_exists('gold_documents','payload_json') then 'coalesce(payload_json,''{}''::jsonb)' else '''{}''::jsonb' end;
    created_by_expr := case when public.plm_col_exists('gold_documents','created_by') then 'created_by::text' else 'null::text' end;
    source_id_expr := case when public.plm_col_exists('gold_documents','id') then 'id::text' else 'null::text' end;

    q := format($fmt$
      insert into public.plm_documents
      (document_code, formula_code, revision, document_type, title, status, payload_json, created_by, source_table, source_id)
      select %s, %s, %s, %s, %s, %s, %s, %s, 'gold_documents', %s
      from public.gold_documents
      on conflict (document_code) do update set
        title = excluded.title,
        status = excluded.status,
        payload_json = excluded.payload_json,
        updated_at = now()
    $fmt$, document_code_expr, formula_code_expr, revision_expr, document_type_expr, title_expr, status_expr, payload_expr, created_by_expr, source_id_expr);
    execute q;
  end if;
end $$;

insert into public.plm_table_archive_registry
(table_name, category, reason, replacement_table)
values
('enterprise_raw_material_master', 'raw_material', 'legacy raw material source after migration', 'plm_raw_materials'),
('enterprise_raw_material_components', 'raw_material_component', 'legacy complex raw material component source after migration', 'plm_raw_material_components'),
('gold_formula_headers', 'formula', 'legacy formula header source after migration', 'plm_formulas'),
('gold_formula_lines', 'formula_line', 'legacy formula line source after migration', 'plm_formula_lines'),
('gold_documents', 'document', 'legacy document source after migration', 'plm_documents')
on conflict (table_name) do nothing;

alter table public.plm_raw_materials enable row level security;
alter table public.plm_raw_material_components enable row level security;
alter table public.plm_formulas enable row level security;
alter table public.plm_formula_lines enable row level security;
alter table public.plm_formula_revisions enable row level security;
alter table public.plm_documents enable row level security;
alter table public.plm_audit_logs enable row level security;
alter table public.plm_table_archive_registry enable row level security;

drop policy if exists "plm_raw_materials_read" on public.plm_raw_materials;
create policy "plm_raw_materials_read" on public.plm_raw_materials for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_raw_materials_write" on public.plm_raw_materials;
create policy "plm_raw_materials_write" on public.plm_raw_materials for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_raw_components_read" on public.plm_raw_material_components;
create policy "plm_raw_components_read" on public.plm_raw_material_components for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_raw_components_write" on public.plm_raw_material_components;
create policy "plm_raw_components_write" on public.plm_raw_material_components for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_formulas_read" on public.plm_formulas;
create policy "plm_formulas_read" on public.plm_formulas for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_formulas_write" on public.plm_formulas;
create policy "plm_formulas_write" on public.plm_formulas for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_formula_lines_read" on public.plm_formula_lines;
create policy "plm_formula_lines_read" on public.plm_formula_lines for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_formula_lines_write" on public.plm_formula_lines;
create policy "plm_formula_lines_write" on public.plm_formula_lines for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_documents_read" on public.plm_documents;
create policy "plm_documents_read" on public.plm_documents for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_documents_write" on public.plm_documents;
create policy "plm_documents_write" on public.plm_documents for all to authenticated using (public.plm_has_role(array['Admin','Researcher','QA'])) with check (public.plm_has_role(array['Admin','Researcher','QA']));

drop policy if exists "plm_archive_registry_read" on public.plm_table_archive_registry;
create policy "plm_archive_registry_read" on public.plm_table_archive_registry for select to authenticated using (public.plm_has_role(array['Admin']));

drop policy if exists "plm_audit_read" on public.plm_audit_logs;
create policy "plm_audit_read" on public.plm_audit_logs for select to authenticated using (public.plm_has_role(array['Admin','QA']));
drop policy if exists "plm_audit_insert" on public.plm_audit_logs;
create policy "plm_audit_insert" on public.plm_audit_logs for insert to authenticated with check (public.plm_has_role(array['Admin','Researcher','QA']));

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

insert into public.enterprise_release_markers
(release_code, title, description)
values
('SPRINT0-SAFE-V2', 'Enterprise PLM Sprint 0 SAFE v2', 'Creates canonical PLM tables with guarded dynamic migration that avoids missing-column errors.')
on conflict (release_code) do nothing;
