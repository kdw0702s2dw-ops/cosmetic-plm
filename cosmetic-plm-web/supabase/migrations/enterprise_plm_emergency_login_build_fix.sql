-- Enterprise PLM Emergency Login + Build Fix SQL

create table if not exists public.plm_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'Researcher' check (role in ('Admin','Researcher','QA','Viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.plm_user_profiles (id, email, display_name, role, is_active)
select
  u.id,
  u.email,
  split_part(u.email, '@', 1),
  case when u.email = 'kdw0702sdw@gmail.com' then 'Admin' else 'Researcher' end,
  true
from auth.users u
where u.email is not null
on conflict (id) do update set
  email = excluded.email,
  display_name = coalesce(public.plm_user_profiles.display_name, excluded.display_name),
  is_active = true,
  updated_at = now();

update public.plm_user_profiles
set role = 'Admin', is_active = true, updated_at = now()
where email = 'kdw0702sdw@gmail.com';

alter table public.plm_user_profiles enable row level security;

drop policy if exists "plm_user_profiles_select_self_or_admin" on public.plm_user_profiles;
create policy "plm_user_profiles_select_self_or_admin"
on public.plm_user_profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
);

drop policy if exists "plm_user_profiles_insert_self" on public.plm_user_profiles;
create policy "plm_user_profiles_insert_self"
on public.plm_user_profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists "plm_user_profiles_update_admin" on public.plm_user_profiles;
create policy "plm_user_profiles_update_admin"
on public.plm_user_profiles
for update to authenticated
using (
  exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
)
with check (
  exists (
    select 1 from public.plm_user_profiles p
    where p.id = auth.uid() and p.role = 'Admin' and p.is_active = true
  )
);

create or replace function public.plm_has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plm_user_profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role = any(allowed_roles)
  );
$$;

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
('EMERGENCY-LOGIN-BUILD-FIX', 'Enterprise PLM Emergency Login Build Fix', 'Resets app/page.tsx to redirect, syncs Auth users to profiles, and sets admin profile.')
on conflict (release_code) do nothing;
