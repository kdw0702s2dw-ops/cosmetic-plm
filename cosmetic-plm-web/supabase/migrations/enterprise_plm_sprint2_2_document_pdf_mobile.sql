-- Enterprise PLM Sprint 2-2 Document PDF + Mobile

alter table if exists public.plm_documents
  add column if not exists html_content text,
  add column if not exists payload_json jsonb default '{}'::jsonb,
  add column if not exists status text default 'DRAFT',
  add column if not exists updated_at timestamptz default now();

alter table public.plm_documents enable row level security;

drop policy if exists "plm_documents_read" on public.plm_documents;
create policy "plm_documents_read" on public.plm_documents
for select to authenticated
using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));

drop policy if exists "plm_documents_write" on public.plm_documents;
create policy "plm_documents_write" on public.plm_documents
for all to authenticated
using (public.plm_has_role(array['Admin','Researcher','QA']))
with check (public.plm_has_role(array['Admin','Researcher','QA']));

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

insert into public.enterprise_release_markers
(release_code, title, description)
values
('SPRINT2-2-DOCUMENT-PDF-MOBILE', 'Enterprise PLM Sprint 2-2 Document PDF Mobile', 'Adds Formula Sheet PDF/print document generation and mobile responsive optimization.')
on conflict (release_code) do nothing;
