-- Enterprise Production Database Migration Pack
-- This migration makes raw material live CRUD safer.

alter table if exists public.enterprise_raw_material_master
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_enterprise_raw_material_master_search
on public.enterprise_raw_material_master(raw_code, raw_name, inci_kr, inci_en, cas_no);

alter table public.enterprise_raw_material_master enable row level security;

drop policy if exists "enterprise_raw_material_master_all" on public.enterprise_raw_material_master;
create policy "enterprise_raw_material_master_all"
on public.enterprise_raw_material_master
for all
to authenticated
using (true)
with check (true);
