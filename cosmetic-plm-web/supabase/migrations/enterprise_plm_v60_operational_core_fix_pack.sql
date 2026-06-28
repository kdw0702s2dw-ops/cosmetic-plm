-- Enterprise PLM v6.0 Operational Core Fix Pack
-- Adds practical raw material CRUD support, complex raw material composition, document export support marker, and auth-oriented RLS baseline.

alter table if exists public.enterprise_raw_material_master
  add column if not exists trade_name text,
  add column if not exists raw_type text default 'SINGLE',
  add column if not exists manufacturer text,
  add column if not exists supplier text,
  add column if not exists unit_price numeric default 0,
  add column if not exists currency text default 'KRW',
  add column if not exists moq text,
  add column if not exists lead_time text,
  add column if not exists inci_kr text,
  add column if not exists inci_en text,
  add column if not exists inci_cn text,
  add column if not exists inci_jp text,
  add column if not exists cas_no text,
  add column if not exists ec_no text,
  add column if not exists function_kr text,
  add column if not exists function_en text,
  add column if not exists note text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.enterprise_raw_material_components (
  id uuid primary key default gen_random_uuid(),
  raw_code text not null,
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

create index if not exists idx_enterprise_raw_material_components_raw_code
on public.enterprise_raw_material_components(raw_code);

alter table public.enterprise_raw_material_components enable row level security;

drop policy if exists "enterprise_raw_material_components_all" on public.enterprise_raw_material_components;
create policy "enterprise_raw_material_components_all"
on public.enterprise_raw_material_components
for all to authenticated
using (true)
with check (true);

alter table if exists public.enterprise_raw_material_master enable row level security;

drop policy if exists "enterprise_raw_material_master_authenticated_all" on public.enterprise_raw_material_master;
create policy "enterprise_raw_material_master_authenticated_all"
on public.enterprise_raw_material_master
for all to authenticated
using (true)
with check (true);

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.enterprise_release_markers enable row level security;

drop policy if exists "enterprise_release_markers_all" on public.enterprise_release_markers;
create policy "enterprise_release_markers_all"
on public.enterprise_release_markers
for all to authenticated
using (true)
with check (true);

insert into public.enterprise_release_markers
(release_code, title, description)
values
('V6.0-OPERATIONAL-CORE-FIX', 'Enterprise PLM v6.0 Operational Core Fix Pack', 'Adds practical raw material CRUD, complex composition management, login page and document center export features.')
on conflict (release_code) do nothing;
