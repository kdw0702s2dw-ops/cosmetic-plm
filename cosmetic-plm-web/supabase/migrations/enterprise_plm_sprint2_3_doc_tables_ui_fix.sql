-- Enterprise PLM Sprint 2-3 Document Tables + UI Fix

alter table if exists public.plm_documents
  add column if not exists html_content text,
  add column if not exists payload_json jsonb default '{}'::jsonb,
  add column if not exists status text default 'DRAFT',
  add column if not exists updated_at timestamptz default now();

insert into public.enterprise_release_markers (release_code, title, description)
values ('SPRINT2-3-DOC-TABLES-UI-FIX', 'Enterprise PLM Sprint 2-3 Document Tables UI Fix', 'Adds INCI list, complex component table, single component table document generation and raw list height fix.')
on conflict (release_code) do nothing;
