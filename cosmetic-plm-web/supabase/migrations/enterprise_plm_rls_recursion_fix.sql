-- Enterprise PLM RLS Recursion Fix
-- Problem: infinite recursion detected in policy for relation "plm_user_profiles"

create or replace function public.plm_current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.plm_user_profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.plm_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.plm_current_user_role() = 'Admin', false);
$$;

create or replace function public.plm_has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.plm_current_user_role() = any(allowed_roles), false);
$$;

alter table public.plm_user_profiles enable row level security;

drop policy if exists "plm_user_profiles_select_self_or_admin" on public.plm_user_profiles;
drop policy if exists "plm_user_profiles_insert_self" on public.plm_user_profiles;
drop policy if exists "plm_user_profiles_update_admin" on public.plm_user_profiles;
drop policy if exists "plm_user_profiles_admin_all" on public.plm_user_profiles;
drop policy if exists "plm_user_profiles_delete_admin" on public.plm_user_profiles;

create policy "plm_user_profiles_select_self_or_admin"
on public.plm_user_profiles
for select to authenticated
using (
  id = auth.uid()
  or public.plm_is_admin()
);

create policy "plm_user_profiles_insert_self"
on public.plm_user_profiles
for insert to authenticated
with check (id = auth.uid());

create policy "plm_user_profiles_update_admin"
on public.plm_user_profiles
for update to authenticated
using (public.plm_is_admin())
with check (public.plm_is_admin());

create policy "plm_user_profiles_delete_admin"
on public.plm_user_profiles
for delete to authenticated
using (public.plm_is_admin());

insert into public.plm_user_profiles (id, email, display_name, role, is_active)
select
  u.id,
  u.email,
  split_part(u.email, '@', 1),
  'Admin',
  true
from auth.users u
where lower(u.email) = 'kdw0702s2dw@gmail.com'
on conflict (id) do update set
  email = excluded.email,
  role = 'Admin',
  is_active = true,
  updated_at = now();

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
('RLS-RECURSION-FIX', 'Enterprise PLM RLS Recursion Fix', 'Fixes infinite recursion in plm_user_profiles RLS policies.')
on conflict (release_code) do nothing;
