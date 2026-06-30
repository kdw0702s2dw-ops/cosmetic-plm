-- Enterprise PLM Sprint 2-1 Enterprise Raw Link
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
('SPRINT2-1-ENTERPRISE-RAW-LINK', 'Enterprise PLM Sprint 2-1 Enterprise Raw Link', 'Links Raw Material Core directly into /enterprise workspace.')
on conflict (release_code) do nothing;
