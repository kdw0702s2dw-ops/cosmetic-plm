-- Enterprise PLM v3.0 GOLD MASTER Pack 02-B
-- Formula Live CRUD support

create or replace view public.gold_formula_summary as
select
  h.formula_code,
  h.revision,
  h.formula_name,
  h.status,
  coalesce(round(sum(l.percentage)::numeric, 4), 0) as total_percent,
  count(l.id)::int as line_count,
  count(distinct l.raw_code)::int as ingredient_count,
  case when abs(coalesce(sum(l.percentage), 0) - 100) < 0.0001 then 'PASS' else 'FAIL' end as validation_status
from public.gold_formula_headers h
left join public.gold_formula_lines l
  on h.formula_code = l.formula_code
 and h.revision = l.revision
group by h.formula_code, h.revision, h.formula_name, h.status;

create index if not exists idx_gold_formula_lines_raw_code
on public.gold_formula_lines(raw_code);

create index if not exists idx_gold_formula_history_formula
on public.gold_formula_history(formula_code, revision, created_at);

grant select on public.gold_formula_summary to authenticated;

-- Ensure RLS policies remain active
alter table public.gold_formula_headers enable row level security;
alter table public.gold_formula_lines enable row level security;
alter table public.gold_formula_revisions enable row level security;
alter table public.gold_formula_history enable row level security;
