-- Enterprise PLM Sprint 1 Enterprise Activation
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
('SPRINT1-ENTERPRISE-ACTIVATION', 'Enterprise PLM Sprint 1 Enterprise Activation', 'Connects Formula Core to /enterprise and hides non-stabilized menus.')
on conflict (release_code) do nothing;
