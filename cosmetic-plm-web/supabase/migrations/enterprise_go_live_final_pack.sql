-- Enterprise Go-Live Final Pack

create table if not exists public.enterprise_go_live_checklist (
  id text primary key,
  area text,
  task text,
  status text,
  owner text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_go_live_data_seed (
  id text primary key,
  data_domain text,
  priority text,
  minimum_rows integer,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_go_live_issues (
  id text primary key,
  issue text,
  severity text,
  workaround text,
  status text,
  created_at timestamptz default now()
);

alter table public.enterprise_go_live_checklist enable row level security;
alter table public.enterprise_go_live_data_seed enable row level security;
alter table public.enterprise_go_live_issues enable row level security;

drop policy if exists "go_live_checklist_all" on public.enterprise_go_live_checklist;
create policy "go_live_checklist_all" on public.enterprise_go_live_checklist for all to authenticated using (true) with check (true);

drop policy if exists "go_live_data_seed_all" on public.enterprise_go_live_data_seed;
create policy "go_live_data_seed_all" on public.enterprise_go_live_data_seed for all to authenticated using (true) with check (true);

drop policy if exists "go_live_issues_all" on public.enterprise_go_live_issues;
create policy "go_live_issues_all" on public.enterprise_go_live_issues for all to authenticated using (true) with check (true);
