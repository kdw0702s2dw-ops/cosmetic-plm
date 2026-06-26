-- Real Operation Pack Support

create table if not exists public.enterprise_quick_access_items (
  id text primary key,
  label text,
  module text,
  route_key text,
  priority text,
  usage_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_bulk_import_jobs (
  id text primary key,
  import_type text,
  file_name text,
  rows_total integer,
  rows_valid integer,
  rows_error integer,
  status text,
  next_action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_global_search_results (
  id text primary key,
  keyword text,
  result_type text,
  title text,
  summary text,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_recent_works (
  id text primary key,
  work_type text,
  title text,
  last_opened text,
  owner text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_today_tasks (
  id text primary key,
  task text,
  source_module text,
  due text,
  owner text,
  status text,
  priority text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_performance_checks (
  id text primary key,
  area text,
  current_state text,
  target_state text,
  status text,
  action text,
  created_at timestamptz default now()
);

alter table public.enterprise_quick_access_items enable row level security;
alter table public.enterprise_bulk_import_jobs enable row level security;
alter table public.enterprise_global_search_results enable row level security;
alter table public.enterprise_recent_works enable row level security;
alter table public.enterprise_today_tasks enable row level security;
alter table public.enterprise_performance_checks enable row level security;

drop policy if exists "quick_access_items_all" on public.enterprise_quick_access_items;
create policy "quick_access_items_all" on public.enterprise_quick_access_items for all to authenticated using (true) with check (true);

drop policy if exists "bulk_import_jobs_all" on public.enterprise_bulk_import_jobs;
create policy "bulk_import_jobs_all" on public.enterprise_bulk_import_jobs for all to authenticated using (true) with check (true);

drop policy if exists "global_search_results_all" on public.enterprise_global_search_results;
create policy "global_search_results_all" on public.enterprise_global_search_results for all to authenticated using (true) with check (true);

drop policy if exists "recent_works_all" on public.enterprise_recent_works;
create policy "recent_works_all" on public.enterprise_recent_works for all to authenticated using (true) with check (true);

drop policy if exists "today_tasks_all" on public.enterprise_today_tasks;
create policy "today_tasks_all" on public.enterprise_today_tasks for all to authenticated using (true) with check (true);

drop policy if exists "performance_checks_all" on public.enterprise_performance_checks;
create policy "performance_checks_all" on public.enterprise_performance_checks for all to authenticated using (true) with check (true);
