-- Enterprise PLM Sprint 1 Enterprise Full Link
-- UI activation marker only.

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
('SPRINT1-ENTERPRISE-FULL-LINK', 'Enterprise PLM Sprint 1 Enterprise Full Link', 'Links Sprint 0 dashboard and Sprint 1 Formula Core directly into /enterprise workspace.')
on conflict (release_code) do nothing;
