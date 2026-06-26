-- Phase 23 Backup / Monitoring / Error Center Support

create table if not exists public.enterprise_backup_jobs (
  id text primary key,
  target text,
  backup_type text,
  schedule text,
  status text default 'READY',
  last_run text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_monitoring_checks (
  id text primary key,
  category text,
  check_name text,
  status text default 'PASS',
  value text,
  action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_error_logs (
  id text primary key,
  severity text,
  module text,
  message text,
  status text default 'OPEN',
  created_at text,
  resolved_at text
);

alter table public.enterprise_backup_jobs enable row level security;
alter table public.enterprise_monitoring_checks enable row level security;
alter table public.enterprise_error_logs enable row level security;

drop policy if exists "backup_jobs_all" on public.enterprise_backup_jobs;
create policy "backup_jobs_all" on public.enterprise_backup_jobs for all to authenticated using (true) with check (true);

drop policy if exists "monitoring_checks_all" on public.enterprise_monitoring_checks;
create policy "monitoring_checks_all" on public.enterprise_monitoring_checks for all to authenticated using (true) with check (true);

drop policy if exists "error_logs_all" on public.enterprise_error_logs;
create policy "error_logs_all" on public.enterprise_error_logs for all to authenticated using (true) with check (true);
