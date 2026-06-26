-- Master Data Live CRUD Pack Support

create table if not exists public.enterprise_live_crud_audit (
  id text primary key,
  module text,
  action text,
  target text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_live_crud_settings (
  id text primary key,
  setting_key text unique,
  setting_value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_live_crud_audit_module on public.enterprise_live_crud_audit(module, action, created_at);
create index if not exists idx_raw_material_master_name on public.enterprise_raw_material_master(raw_name);
create index if not exists idx_raw_material_master_supplier on public.enterprise_raw_material_master(supplier);
create index if not exists idx_inci_master_names on public.enterprise_inci_master(inci_en, inci_kr);
create index if not exists idx_formula_master_code_revision on public.enterprise_formula_master(formula_code, revision);
create index if not exists idx_regulation_rules_country_inci on public.enterprise_regulation_rules(country, inci_en);

alter table public.enterprise_live_crud_audit enable row level security;
alter table public.enterprise_live_crud_settings enable row level security;

drop policy if exists "live_crud_audit_all" on public.enterprise_live_crud_audit;
create policy "live_crud_audit_all" on public.enterprise_live_crud_audit for all to authenticated using (true) with check (true);

drop policy if exists "live_crud_settings_all" on public.enterprise_live_crud_settings;
create policy "live_crud_settings_all" on public.enterprise_live_crud_settings for all to authenticated using (true) with check (true);
