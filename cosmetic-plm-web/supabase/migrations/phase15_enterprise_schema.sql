-- Phase 15 Enterprise Schema & RLS Kit
-- Apply in Supabase SQL Editor.
-- Safe style: uses IF NOT EXISTS where possible.

create extension if not exists "pgcrypto";

create table if not exists public.enterprise_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique not null,
  customer_name text not null,
  project_name text not null,
  researcher text,
  status text default '개발중',
  progress numeric default 0,
  launch_target date,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_formulas (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  formula_name text not null,
  version text default '1.0',
  project_code text references public.enterprise_projects(project_code),
  status text default 'Draft',
  total_percent numeric default 100,
  material_cost numeric default 0,
  is_locked boolean default false,
  revision_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, version)
);

create table if not exists public.enterprise_formula_items (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid references public.enterprise_formulas(id) on delete cascade,
  raw_code text,
  phase text,
  percentage numeric default 0,
  remark text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_raw_materials (
  id uuid primary key default gen_random_uuid(),
  raw_code text unique not null,
  raw_name text not null,
  supplier text,
  unit_price numeric default 0,
  main_inci text,
  composition_total numeric default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_material_documents (
  id uuid primary key default gen_random_uuid(),
  raw_code text references public.enterprise_raw_materials(raw_code),
  raw_name text,
  supplier text,
  document_type text,
  document_title text,
  expiry_date date,
  status text default 'OK',
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_stability_records (
  id uuid primary key default gen_random_uuid(),
  formula_code text,
  condition text,
  week text,
  result text,
  finding text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_approval_records (
  id uuid primary key default gen_random_uuid(),
  target text,
  type text,
  requester text,
  approver text,
  status text default 'Requested',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_country_regulations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  inci_name text not null,
  cas_no text,
  regulation_type text default 'Allowed',
  max_percent numeric default 0,
  note text,
  source text,
  created_at timestamptz default now(),
  unique(country_code, inci_name, cas_no)
);

create table if not exists public.enterprise_customer_portal_items (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  project_code text,
  project_name text,
  current_status text,
  sample_status text,
  submission_status text,
  visible_to_customer boolean default false,
  last_update date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_sample_feedbacks (
  id uuid primary key default gen_random_uuid(),
  sample_no text unique not null,
  customer_name text,
  project_code text,
  formula_code text,
  sent_date date default current_date,
  quantity text,
  feedback text,
  status text default 'Sent',
  created_at timestamptz default now()
);

create table if not exists public.enterprise_supplier_tasks (
  id uuid primary key default gen_random_uuid(),
  supplier text not null,
  raw_code text,
  raw_name text,
  required_document text,
  request_status text default 'Requested',
  due_date date,
  contact_email text,
  memo text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_supplier_scorecards (
  id uuid primary key default gen_random_uuid(),
  supplier text not null,
  document_score numeric default 0,
  price_score numeric default 0,
  response_score numeric default 0,
  risk_level text default 'MEDIUM',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text,
  module text,
  target text,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_enterprise_projects_code on public.enterprise_projects(project_code);
create index if not exists idx_enterprise_projects_customer on public.enterprise_projects(customer_name);
create index if not exists idx_enterprise_formulas_code_version on public.enterprise_formulas(formula_code, version);
create index if not exists idx_enterprise_raw_materials_supplier on public.enterprise_raw_materials(supplier);
create index if not exists idx_reg_country_inci_cas on public.enterprise_country_regulations(country_code, inci_name, cas_no);
create index if not exists idx_customer_portal_customer on public.enterprise_customer_portal_items(customer_name, visible_to_customer);
create index if not exists idx_supplier_tasks_supplier on public.enterprise_supplier_tasks(supplier, request_status);
create index if not exists idx_audit_module_created on public.audit_logs(module, created_at);

-- Optional indexes for existing ingredient_master_global if the table exists.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ingredient_master_global') then
    execute 'create index if not exists idx_ingredient_inci on public.ingredient_master_global(inci_name)';
    execute 'create index if not exists idx_ingredient_cas on public.ingredient_master_global(cas_no)';
    execute 'create index if not exists idx_ingredient_korean on public.ingredient_master_global(korean_name)';
  end if;
end $$;

alter table public.enterprise_projects enable row level security;
alter table public.enterprise_formulas enable row level security;
alter table public.enterprise_formula_items enable row level security;
alter table public.enterprise_raw_materials enable row level security;
alter table public.enterprise_material_documents enable row level security;
alter table public.enterprise_stability_records enable row level security;
alter table public.enterprise_approval_records enable row level security;
alter table public.enterprise_country_regulations enable row level security;
alter table public.enterprise_customer_portal_items enable row level security;
alter table public.enterprise_sample_feedbacks enable row level security;
alter table public.enterprise_supplier_tasks enable row level security;
alter table public.enterprise_supplier_scorecards enable row level security;
alter table public.audit_logs enable row level security;

-- Broad authenticated internal policies for Phase 15.
-- Tight customer/supplier-specific policies should be activated after account mapping is finalized.
do $$
declare
  t text;
begin
  foreach t in array array[
    'enterprise_projects',
    'enterprise_formulas',
    'enterprise_formula_items',
    'enterprise_raw_materials',
    'enterprise_material_documents',
    'enterprise_stability_records',
    'enterprise_approval_records',
    'enterprise_country_regulations',
    'enterprise_customer_portal_items',
    'enterprise_sample_feedbacks',
    'enterprise_supplier_tasks',
    'enterprise_supplier_scorecards',
    'audit_logs'
  ]
  loop
    execute format('drop policy if exists "enterprise_authenticated_read_%s" on public.%I', t, t);
    execute format('create policy "enterprise_authenticated_read_%s" on public.%I for select to authenticated using (true)', t, t);
  end loop;
end $$;

-- Audit insert only.
drop policy if exists "audit_authenticated_insert" on public.audit_logs;
create policy "audit_authenticated_insert"
on public.audit_logs
for insert
to authenticated
with check (true);
