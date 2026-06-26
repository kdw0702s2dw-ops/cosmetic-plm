-- Phase 21 UAT & Data Migration Support

create table if not exists public.enterprise_uat_scenarios (
  id text primary key,
  team text,
  scenario text,
  expected_result text,
  status text default 'TODO',
  owner text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_migration_batches (
  id text primary key,
  source text,
  target_table text,
  data_type text,
  estimated_rows integer default 0,
  status text default 'READY',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_training_items (
  id uuid primary key default gen_random_uuid(),
  role text,
  training_topic text,
  status text default 'TODO',
  material text,
  created_at timestamptz default now()
);

alter table public.enterprise_uat_scenarios enable row level security;
alter table public.enterprise_migration_batches enable row level security;
alter table public.enterprise_training_items enable row level security;

drop policy if exists "uat_scenarios_all" on public.enterprise_uat_scenarios;
create policy "uat_scenarios_all" on public.enterprise_uat_scenarios for all to authenticated using (true) with check (true);

drop policy if exists "migration_batches_all" on public.enterprise_migration_batches;
create policy "migration_batches_all" on public.enterprise_migration_batches for all to authenticated using (true) with check (true);

drop policy if exists "training_items_all" on public.enterprise_training_items;
create policy "training_items_all" on public.enterprise_training_items for all to authenticated using (true) with check (true);
