-- Enterprise PLM v3.0 GOLD MASTER Pack 01
-- Live Core support migration

alter table if exists public.enterprise_raw_material_master
  add column if not exists updated_at timestamptz default now();

alter table if exists public.enterprise_formula_master
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_gold_raw_material_search
on public.enterprise_raw_material_master(raw_code, raw_name, inci_kr, inci_en, cas_no);

create index if not exists idx_gold_formula_search
on public.enterprise_formula_master(formula_code, formula_name, raw_code);

alter table public.enterprise_raw_material_master enable row level security;
alter table public.enterprise_formula_master enable row level security;

drop policy if exists "gold_raw_material_all" on public.enterprise_raw_material_master;
create policy "gold_raw_material_all"
on public.enterprise_raw_material_master
for all
to authenticated
using (true)
with check (true);

drop policy if exists "gold_formula_master_all" on public.enterprise_formula_master;
create policy "gold_formula_master_all"
on public.enterprise_formula_master
for all
to authenticated
using (true)
with check (true);
