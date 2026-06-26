-- Phase 28 Electronic Lab Notebook Support

create table if not exists public.enterprise_eln_experiments (
  id text primary key,
  experiment_no text unique not null,
  project_code text,
  formula_code text,
  title text,
  researcher text,
  status text default 'DRAFT',
  experiment_date date default current_date,
  objective text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_eln_observations (
  id text primary key,
  experiment_id text references public.enterprise_eln_experiments(id) on delete cascade,
  time_point text,
  observation_type text,
  value text,
  result text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_eln_attachments (
  id text primary key,
  experiment_id text references public.enterprise_eln_experiments(id) on delete cascade,
  file_name text,
  file_type text,
  status text default 'UPLOADED',
  note text,
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_eln_signatures (
  id text primary key,
  experiment_id text references public.enterprise_eln_experiments(id) on delete cascade,
  signer text,
  role text,
  status text default 'REQUESTED',
  signed_at text,
  created_at timestamptz default now()
);

create index if not exists idx_eln_experiments_project on public.enterprise_eln_experiments(project_code);
create index if not exists idx_eln_experiments_formula on public.enterprise_eln_experiments(formula_code);
create index if not exists idx_eln_observations_experiment on public.enterprise_eln_observations(experiment_id);
create index if not exists idx_eln_signatures_experiment on public.enterprise_eln_signatures(experiment_id);

alter table public.enterprise_eln_experiments enable row level security;
alter table public.enterprise_eln_observations enable row level security;
alter table public.enterprise_eln_attachments enable row level security;
alter table public.enterprise_eln_signatures enable row level security;

drop policy if exists "eln_experiments_all" on public.enterprise_eln_experiments;
create policy "eln_experiments_all" on public.enterprise_eln_experiments for all to authenticated using (true) with check (true);

drop policy if exists "eln_observations_all" on public.enterprise_eln_observations;
create policy "eln_observations_all" on public.enterprise_eln_observations for all to authenticated using (true) with check (true);

drop policy if exists "eln_attachments_all" on public.enterprise_eln_attachments;
create policy "eln_attachments_all" on public.enterprise_eln_attachments for all to authenticated using (true) with check (true);

drop policy if exists "eln_signatures_all" on public.enterprise_eln_signatures;
create policy "eln_signatures_all" on public.enterprise_eln_signatures for all to authenticated using (true) with check (true);
