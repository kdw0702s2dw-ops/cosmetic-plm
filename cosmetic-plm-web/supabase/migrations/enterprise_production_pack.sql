-- Enterprise Production Pack Support

create table if not exists public.enterprise_production_crud_readiness (
  id text primary key,
  module text,
  table_name text,
  crud_status text,
  persistence text,
  audit text,
  next_action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_export_readiness (
  id text primary key,
  document text,
  output text,
  status text,
  file_name text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_ai_copilot (
  id text primary key,
  command text,
  flow text,
  status text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_health (
  id text primary key,
  area text,
  status text,
  message text,
  action text,
  created_at timestamptz default now()
);

alter table public.enterprise_production_crud_readiness enable row level security;
alter table public.enterprise_production_export_readiness enable row level security;
alter table public.enterprise_production_ai_copilot enable row level security;
alter table public.enterprise_production_health enable row level security;

drop policy if exists "production_crud_readiness_all" on public.enterprise_production_crud_readiness;
create policy "production_crud_readiness_all" on public.enterprise_production_crud_readiness for all to authenticated using (true) with check (true);

drop policy if exists "production_export_readiness_all" on public.enterprise_production_export_readiness;
create policy "production_export_readiness_all" on public.enterprise_production_export_readiness for all to authenticated using (true) with check (true);

drop policy if exists "production_ai_copilot_all" on public.enterprise_production_ai_copilot;
create policy "production_ai_copilot_all" on public.enterprise_production_ai_copilot for all to authenticated using (true) with check (true);

drop policy if exists "production_health_all" on public.enterprise_production_health;
create policy "production_health_all" on public.enterprise_production_health for all to authenticated using (true) with check (true);
