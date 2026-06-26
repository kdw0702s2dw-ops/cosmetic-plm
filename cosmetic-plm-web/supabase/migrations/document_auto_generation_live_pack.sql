-- Document Auto Generation Live Pack Support

create table if not exists public.enterprise_live_documents (
  id text primary key,
  document_no text unique,
  document_type text,
  title text,
  source_formula text,
  status text,
  owner text,
  version text,
  file_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_live_document_sections (
  id text primary key,
  document_no text,
  section_name text,
  section_order integer,
  content_summary text,
  source_module text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_live_document_approvals (
  id text primary key,
  document_no text,
  approver text,
  approval_status text,
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_live_document_downloads (
  id text primary key,
  document_no text,
  file_name text,
  format text,
  generated_at text,
  download_status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_live_document_risks (
  id text primary key,
  document_no text,
  risk_type text,
  severity text,
  message text,
  action text,
  created_at timestamptz default now()
);

create index if not exists idx_live_documents_formula on public.enterprise_live_documents(source_formula, document_type);
create index if not exists idx_live_document_sections_no on public.enterprise_live_document_sections(document_no);
create index if not exists idx_live_document_approvals_no on public.enterprise_live_document_approvals(document_no);

alter table public.enterprise_live_documents enable row level security;
alter table public.enterprise_live_document_sections enable row level security;
alter table public.enterprise_live_document_approvals enable row level security;
alter table public.enterprise_live_document_downloads enable row level security;
alter table public.enterprise_live_document_risks enable row level security;

drop policy if exists "live_documents_all" on public.enterprise_live_documents;
create policy "live_documents_all" on public.enterprise_live_documents for all to authenticated using (true) with check (true);

drop policy if exists "live_document_sections_all" on public.enterprise_live_document_sections;
create policy "live_document_sections_all" on public.enterprise_live_document_sections for all to authenticated using (true) with check (true);

drop policy if exists "live_document_approvals_all" on public.enterprise_live_document_approvals;
create policy "live_document_approvals_all" on public.enterprise_live_document_approvals for all to authenticated using (true) with check (true);

drop policy if exists "live_document_downloads_all" on public.enterprise_live_document_downloads;
create policy "live_document_downloads_all" on public.enterprise_live_document_downloads for all to authenticated using (true) with check (true);

drop policy if exists "live_document_risks_all" on public.enterprise_live_document_risks;
create policy "live_document_risks_all" on public.enterprise_live_document_risks for all to authenticated using (true) with check (true);
