-- Enterprise PLM Sprint 0 - Platform Stabilization
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

insert into public.plm_raw_materials
(raw_code, raw_name, trade_name, raw_type, manufacturer, supplier, unit_price, currency, moq, lead_time, inci_kr, inci_en, inci_cn, inci_jp, cas_no, ec_no, function_kr, function_en, note, source_table, source_id)
select
  coalesce(raw_code, 'RAW-' || id::text),
  coalesce(raw_name, trade_name, '미등록 원료'),
  trade_name,
  coalesce(raw_type, 'SINGLE'),
  manufacturer,
  supplier,
  coalesce(unit_price, 0),
  coalesce(currency, 'KRW'),
  moq,
  lead_time,
  inci_kr,
  inci_en,
  inci_cn,
  inci_jp,
  cas_no,
  ec_no,
  function_kr,
  function_en,
  note,
  'enterprise_raw_material_master',
  id::text
from public.enterprise_raw_material_master
on conflict (raw_code) do update set
  raw_name = excluded.raw_name,
  trade_name = coalesce(excluded.trade_name, public.plm_raw_materials.trade_name),
  supplier = coalesce(excluded.supplier, public.plm_raw_materials.supplier),
  manufacturer = coalesce(excluded.manufacturer, public.plm_raw_materials.manufacturer),
  unit_price = coalesce(excluded.unit_price, public.plm_raw_materials.unit_price),
  updated_at = now();

insert into public.plm_formulas
(formula_code, revision, formula_name, status, product_type, customer, target_country, claim, total_percent, created_by, source_table, source_id)
select
  formula_code,
  revision,
  coalesce(formula_name, formula_code),
  coalesce(status, 'DRAFT'),
  product_type,
  customer,
  target_country,
  claim,
  coalesce(total_percent, 0),
  created_by,
  'gold_formula_headers',
  id::text
from public.gold_formula_headers
on conflict (formula_code, revision) do update set
  formula_name = excluded.formula_name,
  status = excluded.status,
  total_percent = excluded.total_percent,
  updated_at = now();

insert into public.plm_formula_lines
(formula_code, revision, line_no, phase, raw_code, raw_name, inci_kr, inci_en, percentage, function_en, note)
select
  formula_code,
  revision,
  line_no,
  coalesce(phase, 'A'),
  raw_code,
  raw_name,
  inci_kr,
  inci_en,
  coalesce(percentage, 0),
  function_en,
  note
from public.gold_formula_lines
on conflict (formula_code, revision, line_no) do update set
  phase = excluded.phase,
  raw_code = excluded.raw_code,
  raw_name = excluded.raw_name,
  inci_kr = excluded.inci_kr,
  inci_en = excluded.inci_en,
  percentage = excluded.percentage,
  updated_at = now();

insert into public.plm_documents
(document_code, formula_code, revision, document_type, title, status, payload_json, created_by, source_table, source_id)
select
  document_code,
  formula_code,
  revision,
  document_type,
  title,
  coalesce(status, 'DRAFT'),
  coalesce(payload_json, '{}'::jsonb),
  created_by,
  'gold_documents',
  id::text
from public.gold_documents
on conflict (document_code) do update set
  title = excluded.title,
  status = excluded.status,
  payload_json = excluded.payload_json,
  updated_at = now();

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
('SPRINT0-PLATFORM-STABILIZATION', 'Enterprise PLM Sprint 0 Platform Stabilization', 'Creates canonical PLM tables, archive registry, role-based RLS baseline, and safe migration from legacy tables.')
on conflict (release_code) do nothing;
