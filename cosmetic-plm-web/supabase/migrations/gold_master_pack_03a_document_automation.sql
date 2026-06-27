-- Enterprise PLM v3.0 GOLD MASTER Pack 03-A
-- Document Automation

create table if not exists public.gold_documents (
  id uuid primary key default gen_random_uuid(),
  document_code text not null unique,
  formula_code text not null,
  revision text not null,
  document_type text not null,
  title text not null,
  format text not null default 'CSV',
  status text not null default 'DRAFT',
  content_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gold_document_history (
  id uuid primary key default gen_random_uuid(),
  document_code text not null,
  action text not null,
  payload jsonb,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_gold_documents_formula
on public.gold_documents(formula_code, revision, document_type, status);

create index if not exists idx_gold_document_history_code
on public.gold_document_history(document_code, created_at);

alter table public.gold_documents enable row level security;
alter table public.gold_document_history enable row level security;

drop policy if exists "gold_documents_all" on public.gold_documents;
create policy "gold_documents_all"
on public.gold_documents
for all to authenticated
using (true)
with check (true);

drop policy if exists "gold_document_history_all" on public.gold_document_history;
create policy "gold_document_history_all"
on public.gold_document_history
for all to authenticated
using (true)
with check (true);
