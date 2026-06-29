-- Enterprise PLM Sprint 2-1 Raw Material Core

alter table if exists public.plm_raw_materials
  add column if not exists trade_name text,
  add column if not exists raw_type text default 'SINGLE',
  add column if not exists manufacturer text,
  add column if not exists supplier text,
  add column if not exists unit_price numeric default 0,
  add column if not exists currency text default 'KRW',
  add column if not exists moq text,
  add column if not exists lead_time text,
  add column if not exists origin_country text,
  add column if not exists inci_kr text,
  add column if not exists inci_en text,
  add column if not exists inci_cn text,
  add column if not exists inci_jp text,
  add column if not exists cas_no text,
  add column if not exists ec_no text,
  add column if not exists function_kr text,
  add column if not exists function_en text,
  add column if not exists regulatory_note text,
  add column if not exists note text,
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamptz default now();

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

create index if not exists idx_plm_raw_materials_raw_code on public.plm_raw_materials(raw_code);
create index if not exists idx_plm_raw_material_components_raw_code on public.plm_raw_material_components(raw_code);

alter table public.plm_raw_materials enable row level security;
alter table public.plm_raw_material_components enable row level security;

drop policy if exists "plm_raw_materials_read" on public.plm_raw_materials;
create policy "plm_raw_materials_read" on public.plm_raw_materials for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));

drop policy if exists "plm_raw_materials_write" on public.plm_raw_materials;
create policy "plm_raw_materials_write" on public.plm_raw_materials for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_raw_components_read" on public.plm_raw_material_components;
create policy "plm_raw_components_read" on public.plm_raw_material_components for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));

drop policy if exists "plm_raw_components_write" on public.plm_raw_material_components;
create policy "plm_raw_components_write" on public.plm_raw_material_components for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

insert into public.enterprise_release_markers (release_code, title, description)
values ('SPRINT2-1-RAW-MATERIAL-CORE', 'Enterprise PLM Sprint 2-1 Raw Material Core', 'Adds raw material CRUD, copy and complex component management.')
on conflict (release_code) do nothing;
