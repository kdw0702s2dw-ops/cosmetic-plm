-- Final Sprint C+D+E Support

create table if not exists public.enterprise_export_generators (
  id text primary key,
  export_type text,
  format text,
  source_module text,
  status text,
  file_name text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_performance_refactors (
  id text primary key,
  area text,
  current_state text,
  target_state text,
  status text,
  expected_effect text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_release_candidate_checks (
  id text primary key,
  check_area text,
  result text,
  message text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_release_gates (
  id text primary key,
  gate text,
  score numeric,
  decision text,
  required_action text,
  created_at timestamptz default now()
);

create index if not exists idx_export_generators_type on public.enterprise_export_generators(export_type, status);
create index if not exists idx_release_candidate_checks_result on public.enterprise_release_candidate_checks(check_area, result);
create index if not exists idx_release_gates_decision on public.enterprise_release_gates(gate, decision);

alter table public.enterprise_export_generators enable row level security;
alter table public.enterprise_performance_refactors enable row level security;
alter table public.enterprise_release_candidate_checks enable row level security;
alter table public.enterprise_release_gates enable row level security;

drop policy if exists "export_generators_all" on public.enterprise_export_generators;
create policy "export_generators_all" on public.enterprise_export_generators for all to authenticated using (true) with check (true);

drop policy if exists "performance_refactors_all" on public.enterprise_performance_refactors;
create policy "performance_refactors_all" on public.enterprise_performance_refactors for all to authenticated using (true) with check (true);

drop policy if exists "release_candidate_checks_all" on public.enterprise_release_candidate_checks;
create policy "release_candidate_checks_all" on public.enterprise_release_candidate_checks for all to authenticated using (true) with check (true);

drop policy if exists "release_gates_all" on public.enterprise_release_gates;
create policy "release_gates_all" on public.enterprise_release_gates for all to authenticated using (true) with check (true);
