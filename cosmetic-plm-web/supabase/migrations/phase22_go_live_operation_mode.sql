-- Phase 22 Go-Live Operation Mode Support

create table if not exists public.enterprise_go_live_operations (
  id text primary key,
  area text,
  operation text,
  status text default 'READY',
  owner text,
  check_point text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_go_live_issues (
  id text primary key,
  severity text,
  module text,
  issue text,
  status text default 'OPEN',
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_daily_operation_metrics (
  id uuid primary key default gen_random_uuid(),
  metric text,
  value text,
  status text,
  note text,
  metric_date date default current_date,
  created_at timestamptz default now()
);

alter table public.enterprise_go_live_operations enable row level security;
alter table public.enterprise_go_live_issues enable row level security;
alter table public.enterprise_daily_operation_metrics enable row level security;

drop policy if exists "go_live_operations_all" on public.enterprise_go_live_operations;
create policy "go_live_operations_all" on public.enterprise_go_live_operations for all to authenticated using (true) with check (true);

drop policy if exists "go_live_issues_all" on public.enterprise_go_live_issues;
create policy "go_live_issues_all" on public.enterprise_go_live_issues for all to authenticated using (true) with check (true);

drop policy if exists "daily_operation_metrics_all" on public.enterprise_daily_operation_metrics;
create policy "daily_operation_metrics_all" on public.enterprise_daily_operation_metrics for all to authenticated using (true) with check (true);
