-- Enterprise Production Final Package
-- One integrated migration for the final modular production dashboard.

create table if not exists public.enterprise_production_final_crud (
  id text primary key,
  module text,
  table_name text,
  crud_status text,
  operations text,
  persistence text,
  audit text,
  next_action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_final_documents (
  id text primary key,
  document_type text,
  format text,
  source text,
  status text,
  file_name text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_final_ai (
  id text primary key,
  command text,
  workflow text,
  status text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_final_health (
  id text primary key,
  area text,
  status text,
  message text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_production_final_audit (
  id uuid primary key default gen_random_uuid(),
  module text,
  action text,
  target text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table public.enterprise_production_final_crud enable row level security;
alter table public.enterprise_production_final_documents enable row level security;
alter table public.enterprise_production_final_ai enable row level security;
alter table public.enterprise_production_final_health enable row level security;
alter table public.enterprise_production_final_audit enable row level security;

drop policy if exists "production_final_crud_all" on public.enterprise_production_final_crud;
create policy "production_final_crud_all" on public.enterprise_production_final_crud for all to authenticated using (true) with check (true);

drop policy if exists "production_final_documents_all" on public.enterprise_production_final_documents;
create policy "production_final_documents_all" on public.enterprise_production_final_documents for all to authenticated using (true) with check (true);

drop policy if exists "production_final_ai_all" on public.enterprise_production_final_ai;
create policy "production_final_ai_all" on public.enterprise_production_final_ai for all to authenticated using (true) with check (true);

drop policy if exists "production_final_health_all" on public.enterprise_production_final_health;
create policy "production_final_health_all" on public.enterprise_production_final_health for all to authenticated using (true) with check (true);

drop policy if exists "production_final_audit_all" on public.enterprise_production_final_audit;
create policy "production_final_audit_all" on public.enterprise_production_final_audit for all to authenticated using (true) with check (true);
