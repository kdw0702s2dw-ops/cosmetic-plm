-- Enterprise PLM Auth Exports Build Fix
-- Marker only. No schema change required.

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
('AUTH-EXPORTS-BUILD-FIX', 'Enterprise PLM Auth Exports Build Fix', 'Adds missing fetchUserProfiles and updateUserProfileRole exports to authRbacService.')
on conflict (release_code) do nothing;
