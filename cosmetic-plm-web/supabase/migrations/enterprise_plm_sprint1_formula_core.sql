-- Enterprise PLM Sprint 1 Formula Core
-- Works only with Sprint 0 canonical plm_* tables.

create or replace function public.plm_recalc_formula(p_formula_code text, p_revision text)
returns table(total_percent numeric, estimated_cost_per_kg numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.plm_formula_lines
  set cost_per_kg = round((coalesce(percentage,0) / 100) * coalesce(unit_price,0), 4),
      updated_at = now()
  where formula_code = p_formula_code and revision = p_revision;

  update public.plm_formulas f
  set total_percent = coalesce(x.total_percent,0),
      estimated_cost_per_kg = coalesce(x.estimated_cost_per_kg,0),
      updated_at = now()
  from (
    select
      formula_code,
      revision,
      round(sum(coalesce(percentage,0)), 4) as total_percent,
      round(sum(coalesce(cost_per_kg,0)), 4) as estimated_cost_per_kg
    from public.plm_formula_lines
    where formula_code = p_formula_code and revision = p_revision
    group by formula_code, revision
  ) x
  where f.formula_code = x.formula_code and f.revision = x.revision;

  return query
  select f.total_percent, f.estimated_cost_per_kg
  from public.plm_formulas f
  where f.formula_code = p_formula_code and f.revision = p_revision;
end;
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
('SPRINT1-FORMULA-CORE', 'Enterprise PLM Sprint 1 Formula Core', 'Adds canonical formula CRUD/BOM core using plm_* tables only.')
on conflict (release_code) do nothing;
