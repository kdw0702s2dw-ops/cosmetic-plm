-- Enterprise PLM v3.0 GOLD MASTER Pack 05-A
-- Dashboard & Release Center

create table if not exists public.gold_release_checklists (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  checklist_item text not null,
  area text not null,
  status text not null default 'WATCH',
  action text not null,
  created_at timestamptz default now()
);

create table if not exists public.gold_release_logs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  release_status text not null,
  payload jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_gold_release_checklists_formula
on public.gold_release_checklists(formula_code, revision, area);

create index if not exists idx_gold_release_logs_formula
on public.gold_release_logs(formula_code, revision, created_at);

alter table public.gold_release_checklists enable row level security;
alter table public.gold_release_logs enable row level security;

drop policy if exists "gold_release_checklists_all" on public.gold_release_checklists;
create policy "gold_release_checklists_all"
on public.gold_release_checklists
for all to authenticated
using (true)
with check (true);

drop policy if exists "gold_release_logs_all" on public.gold_release_logs;
create policy "gold_release_logs_all"
on public.gold_release_logs
for all to authenticated
using (true)
with check (true);
