-- Enterprise PLM Sprint 1-3 Auth/RBAC
-- Supabase Auth + plm_user_profiles role model

create table if not exists public.plm_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'Researcher' check (role in ('Admin','Researcher','QA','Viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

-- Auth trigger: when Supabase Auth user is created, create default Researcher profile
create or replace function public.plm_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plm_user_profiles (id, email, display_name, role, is_active)
  values (new.id, new.email, split_part(new.email, '@', 1), 'Researcher', true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_plm_profile on auth.users;
create trigger on_auth_user_created_plm_profile
after insert on auth.users
for each row execute procedure public.plm_handle_new_user();

-- Ensure canonical table RLS policies remain role-based
alter table if exists public.plm_raw_materials enable row level security;
alter table if exists public.plm_raw_material_components enable row level security;
alter table if exists public.plm_formulas enable row level security;
alter table if exists public.plm_formula_lines enable row level security;
alter table if exists public.plm_documents enable row level security;

drop policy if exists "plm_raw_materials_read" on public.plm_raw_materials;
create policy "plm_raw_materials_read" on public.plm_raw_materials for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_raw_materials_write" on public.plm_raw_materials;
create policy "plm_raw_materials_write" on public.plm_raw_materials for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_formulas_read" on public.plm_formulas;
create policy "plm_formulas_read" on public.plm_formulas for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_formulas_write" on public.plm_formulas;
create policy "plm_formulas_write" on public.plm_formulas for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_formula_lines_read" on public.plm_formula_lines;
create policy "plm_formula_lines_read" on public.plm_formula_lines for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_formula_lines_write" on public.plm_formula_lines;
create policy "plm_formula_lines_write" on public.plm_formula_lines for all to authenticated using (public.plm_has_role(array['Admin','Researcher'])) with check (public.plm_has_role(array['Admin','Researcher']));

drop policy if exists "plm_documents_read" on public.plm_documents;
create policy "plm_documents_read" on public.plm_documents for select to authenticated using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));
drop policy if exists "plm_documents_write" on public.plm_documents;
create policy "plm_documents_write" on public.plm_documents for all to authenticated using (public.plm_has_role(array['Admin','Researcher','QA'])) with check (public.plm_has_role(array['Admin','Researcher','QA']));

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
('SPRINT1-3-AUTH-RBAC', 'Enterprise PLM Sprint 1-3 Auth/RBAC', 'Adds login gate, user profiles, role-based UI access, and admin user management.')
on conflict (release_code) do nothing;

-- 최초 Admin 승격용 예시:
-- update public.plm_user_profiles set role='Admin' where email='관리자이메일@example.com';
