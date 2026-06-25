-- Phase 19 External Customer/Supplier Portal RLS
-- Apply after Phase 15/18 migrations.
-- This creates account mapping table and drafts safer external access policies.

create table if not exists public.enterprise_external_account_mappings (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('customer', 'supplier')),
  email text not null,
  company_name text not null,
  mapped_key text not null,
  access_scope text default 'portal_only',
  status text default 'READY',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(account_type, email)
);

create index if not exists idx_external_mapping_email on public.enterprise_external_account_mappings(email);
create index if not exists idx_external_mapping_type_key on public.enterprise_external_account_mappings(account_type, mapped_key);

alter table public.enterprise_external_account_mappings enable row level security;

drop policy if exists "external_mapping_internal_read" on public.enterprise_external_account_mappings;
create policy "external_mapping_internal_read"
on public.enterprise_external_account_mappings
for select
to authenticated
using (true);

drop policy if exists "external_mapping_internal_insert" on public.enterprise_external_account_mappings;
create policy "external_mapping_internal_insert"
on public.enterprise_external_account_mappings
for insert
to authenticated
with check (true);

-- Replace broad customer portal read policy with mapping-based policy.
-- Keep broad internal policy from previous phase only if your internal users depend on it.
-- For stricter production, remove broad policies manually after confirming manager/researcher policies.

drop policy if exists "customer_can_read_own_visible_projects" on public.enterprise_customer_portal_items;
create policy "customer_can_read_own_visible_projects"
on public.enterprise_customer_portal_items
for select
to authenticated
using (
  visible_to_customer = true
  and exists (
    select 1
    from public.enterprise_external_account_mappings m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.account_type = 'customer'
      and m.status = 'ACTIVE'
      and m.mapped_key = enterprise_customer_portal_items.customer_name
  )
);

drop policy if exists "customer_can_read_own_samples" on public.enterprise_sample_feedbacks;
create policy "customer_can_read_own_samples"
on public.enterprise_sample_feedbacks
for select
to authenticated
using (
  exists (
    select 1
    from public.enterprise_external_account_mappings m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.account_type = 'customer'
      and m.status = 'ACTIVE'
      and m.mapped_key = enterprise_sample_feedbacks.customer_name
  )
);

drop policy if exists "supplier_can_read_own_tasks" on public.enterprise_supplier_tasks;
create policy "supplier_can_read_own_tasks"
on public.enterprise_supplier_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.enterprise_external_account_mappings m
    where lower(m.email) = lower(auth.jwt() ->> 'email')
      and m.account_type = 'supplier'
      and m.status = 'ACTIVE'
      and m.mapped_key = enterprise_supplier_tasks.supplier
  )
);
