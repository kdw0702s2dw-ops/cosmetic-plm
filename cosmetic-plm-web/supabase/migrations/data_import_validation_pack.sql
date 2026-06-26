-- Data Import & Validation Pack Support

create table if not exists public.enterprise_import_templates (
  id text primary key,
  template_name text,
  import_type text,
  required_columns text,
  optional_columns text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_column_mappings (
  id text primary key,
  import_type text,
  source_column text,
  target_field text,
  mapping_status text,
  rule text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_data_validation_rules (
  id text primary key,
  rule_name text,
  target text,
  severity text,
  check_logic text,
  auto_fix text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_import_validation_results (
  id text primary key,
  import_type text,
  file_name text,
  total_rows integer,
  valid_rows integer,
  warning_rows integer,
  error_rows integer,
  blocker_rows integer,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_import_error_reports (
  id text primary key,
  row_no integer,
  import_type text,
  field_name text,
  error_type text,
  message text,
  fix_suggestion text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_import_approvals (
  id text primary key,
  import_type text,
  file_name text,
  requester text,
  reviewer text,
  approval_status text,
  summary text,
  created_at timestamptz default now()
);

alter table public.enterprise_import_templates enable row level security;
alter table public.enterprise_column_mappings enable row level security;
alter table public.enterprise_data_validation_rules enable row level security;
alter table public.enterprise_import_validation_results enable row level security;
alter table public.enterprise_import_error_reports enable row level security;
alter table public.enterprise_import_approvals enable row level security;

drop policy if exists "import_templates_all" on public.enterprise_import_templates;
create policy "import_templates_all" on public.enterprise_import_templates for all to authenticated using (true) with check (true);

drop policy if exists "column_mappings_all" on public.enterprise_column_mappings;
create policy "column_mappings_all" on public.enterprise_column_mappings for all to authenticated using (true) with check (true);

drop policy if exists "data_validation_rules_all" on public.enterprise_data_validation_rules;
create policy "data_validation_rules_all" on public.enterprise_data_validation_rules for all to authenticated using (true) with check (true);

drop policy if exists "import_validation_results_all" on public.enterprise_import_validation_results;
create policy "import_validation_results_all" on public.enterprise_import_validation_results for all to authenticated using (true) with check (true);

drop policy if exists "import_error_reports_all" on public.enterprise_import_error_reports;
create policy "import_error_reports_all" on public.enterprise_import_error_reports for all to authenticated using (true) with check (true);

drop policy if exists "import_approvals_all" on public.enterprise_import_approvals;
create policy "import_approvals_all" on public.enterprise_import_approvals for all to authenticated using (true) with check (true);
