-- Phase 29 LIMS Test Center Support

create table if not exists public.enterprise_lims_samples (
  id text primary key,
  sample_no text unique not null,
  project_code text,
  formula_code text,
  sample_type text,
  status text default 'RECEIVED',
  received_date date default current_date,
  requester text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_lims_tests (
  id text primary key,
  sample_id text references public.enterprise_lims_samples(id) on delete cascade,
  test_name text,
  method text,
  specification text,
  result_value text,
  judgment text default 'PENDING',
  analyst text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_lims_stability (
  id text primary key,
  sample_id text references public.enterprise_lims_samples(id) on delete cascade,
  condition text,
  time_point text,
  result text default 'PENDING',
  observation text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_lims_coa (
  id uuid primary key default gen_random_uuid(),
  sample_id text references public.enterprise_lims_samples(id) on delete cascade,
  coa_no text unique,
  status text default 'DRAFT',
  issued_date text,
  summary text,
  created_at timestamptz default now()
);

create index if not exists idx_lims_samples_project on public.enterprise_lims_samples(project_code);
create index if not exists idx_lims_samples_formula on public.enterprise_lims_samples(formula_code);
create index if not exists idx_lims_tests_sample on public.enterprise_lims_tests(sample_id);
create index if not exists idx_lims_stability_sample on public.enterprise_lims_stability(sample_id);
create index if not exists idx_lims_coa_sample on public.enterprise_lims_coa(sample_id);

alter table public.enterprise_lims_samples enable row level security;
alter table public.enterprise_lims_tests enable row level security;
alter table public.enterprise_lims_stability enable row level security;
alter table public.enterprise_lims_coa enable row level security;

drop policy if exists "lims_samples_all" on public.enterprise_lims_samples;
create policy "lims_samples_all" on public.enterprise_lims_samples for all to authenticated using (true) with check (true);

drop policy if exists "lims_tests_all" on public.enterprise_lims_tests;
create policy "lims_tests_all" on public.enterprise_lims_tests for all to authenticated using (true) with check (true);

drop policy if exists "lims_stability_all" on public.enterprise_lims_stability;
create policy "lims_stability_all" on public.enterprise_lims_stability for all to authenticated using (true) with check (true);

drop policy if exists "lims_coa_all" on public.enterprise_lims_coa;
create policy "lims_coa_all" on public.enterprise_lims_coa for all to authenticated using (true) with check (true);
