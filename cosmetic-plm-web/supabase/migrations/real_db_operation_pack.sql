-- Real DB Operation Pack Support

create table if not exists public.enterprise_real_db_connections (
  id text primary key,
  table_name text,
  domain text,
  connection_status text,
  row_count integer,
  last_sync text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_real_db_import_executions (
  id text primary key,
  import_type text,
  source_file text,
  validation_status text,
  approval_status text,
  execution_status text,
  inserted_rows integer,
  updated_rows integer,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_real_db_operation_metrics (
  id text primary key,
  metric text,
  value text,
  source_table text,
  status text,
  insight text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_real_db_search_indexes (
  id text primary key,
  index_name text,
  target_table text,
  indexed_fields text,
  status text,
  expected_usage text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_real_db_correction_actions (
  id text primary key,
  issue_type text,
  target_table text,
  target_key text,
  severity text,
  correction text,
  status text,
  created_at timestamptz default now()
);

-- Actual operation master tables for real data import
create table if not exists public.enterprise_raw_material_master (
  id uuid primary key default gen_random_uuid(),
  raw_code text unique,
  raw_name text,
  supplier text,
  unit_price numeric,
  inci_kr text,
  inci_en text,
  inci_cn text,
  inci_jp text,
  cas_no text,
  ec_no text,
  composition_total numeric,
  document_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_inci_master (
  id uuid primary key default gen_random_uuid(),
  inci_en text,
  inci_kr text,
  inci_cn text,
  inci_jp text,
  cas_no text,
  ec_no text,
  function_kr text,
  function_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_formula_master (
  id uuid primary key default gen_random_uuid(),
  formula_code text,
  formula_name text,
  revision text,
  raw_code text,
  percentage numeric,
  phase text,
  process_note text,
  claim text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_regulation_rules (
  id uuid primary key default gen_random_uuid(),
  country text,
  inci_en text,
  rule_type text,
  limit_value text,
  warning text,
  label_requirement text,
  reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_raw_material_master_search on public.enterprise_raw_material_master(raw_code, raw_name, cas_no);
create index if not exists idx_inci_master_search on public.enterprise_inci_master(inci_en, inci_kr, cas_no);
create index if not exists idx_formula_master_search on public.enterprise_formula_master(formula_code, formula_name, raw_code);
create index if not exists idx_regulation_rules_search on public.enterprise_regulation_rules(country, inci_en, rule_type);

alter table public.enterprise_real_db_connections enable row level security;
alter table public.enterprise_real_db_import_executions enable row level security;
alter table public.enterprise_real_db_operation_metrics enable row level security;
alter table public.enterprise_real_db_search_indexes enable row level security;
alter table public.enterprise_real_db_correction_actions enable row level security;
alter table public.enterprise_raw_material_master enable row level security;
alter table public.enterprise_inci_master enable row level security;
alter table public.enterprise_formula_master enable row level security;
alter table public.enterprise_regulation_rules enable row level security;

drop policy if exists "real_db_connections_all" on public.enterprise_real_db_connections;
create policy "real_db_connections_all" on public.enterprise_real_db_connections for all to authenticated using (true) with check (true);

drop policy if exists "real_db_import_executions_all" on public.enterprise_real_db_import_executions;
create policy "real_db_import_executions_all" on public.enterprise_real_db_import_executions for all to authenticated using (true) with check (true);

drop policy if exists "real_db_operation_metrics_all" on public.enterprise_real_db_operation_metrics;
create policy "real_db_operation_metrics_all" on public.enterprise_real_db_operation_metrics for all to authenticated using (true) with check (true);

drop policy if exists "real_db_search_indexes_all" on public.enterprise_real_db_search_indexes;
create policy "real_db_search_indexes_all" on public.enterprise_real_db_search_indexes for all to authenticated using (true) with check (true);

drop policy if exists "real_db_correction_actions_all" on public.enterprise_real_db_correction_actions;
create policy "real_db_correction_actions_all" on public.enterprise_real_db_correction_actions for all to authenticated using (true) with check (true);

drop policy if exists "raw_material_master_all" on public.enterprise_raw_material_master;
create policy "raw_material_master_all" on public.enterprise_raw_material_master for all to authenticated using (true) with check (true);

drop policy if exists "inci_master_all" on public.enterprise_inci_master;
create policy "inci_master_all" on public.enterprise_inci_master for all to authenticated using (true) with check (true);

drop policy if exists "formula_master_all" on public.enterprise_formula_master;
create policy "formula_master_all" on public.enterprise_formula_master for all to authenticated using (true) with check (true);

drop policy if exists "regulation_rules_all" on public.enterprise_regulation_rules;
create policy "regulation_rules_all" on public.enterprise_regulation_rules for all to authenticated using (true) with check (true);
