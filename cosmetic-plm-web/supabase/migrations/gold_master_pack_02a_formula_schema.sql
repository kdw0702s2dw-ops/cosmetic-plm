-- Enterprise PLM v3.0 GOLD MASTER Pack 02-A
-- Formula Live Schema + Migration

create table if not exists public.gold_formula_headers (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  formula_name text not null,
  revision text not null default 'R0',
  status text not null default 'DRAFT',
  product_type text,
  customer text,
  target_country text,
  claim text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision)
);

create table if not exists public.gold_formula_lines (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null default 'R0',
  line_no integer not null,
  phase text not null default 'A',
  raw_code text not null,
  raw_name text,
  inci_en text,
  inci_kr text,
  percentage numeric not null default 0,
  function_en text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision, line_no)
);

create table if not exists public.gold_formula_revisions (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  from_revision text,
  to_revision text not null,
  reason text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.gold_formula_history (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  action text not null,
  payload jsonb,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_gold_formula_headers_search
on public.gold_formula_headers(formula_code, formula_name, customer, status);

create index if not exists idx_gold_formula_lines_search
on public.gold_formula_lines(formula_code, revision, raw_code, phase);

alter table public.gold_formula_headers enable row level security;
alter table public.gold_formula_lines enable row level security;
alter table public.gold_formula_revisions enable row level security;
alter table public.gold_formula_history enable row level security;

drop policy if exists "gold_formula_headers_all" on public.gold_formula_headers;
create policy "gold_formula_headers_all" on public.gold_formula_headers for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_lines_all" on public.gold_formula_lines;
create policy "gold_formula_lines_all" on public.gold_formula_lines for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_revisions_all" on public.gold_formula_revisions;
create policy "gold_formula_revisions_all" on public.gold_formula_revisions for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_history_all" on public.gold_formula_history;
create policy "gold_formula_history_all" on public.gold_formula_history for all to authenticated using (true) with check (true);

-- Optional seed formula for first screen check
insert into public.gold_formula_headers
(formula_code, formula_name, revision, status, product_type, customer, target_country, claim, created_by)
values
('GF-0001', 'Ceramide Barrier Cream Gold Sample', 'R0', 'DRAFT', 'Cream', 'Internal', 'KR', 'Barrier / Moisturizing', 'R&D')
on conflict (formula_code, revision) do nothing;

insert into public.gold_formula_lines
(formula_code, revision, line_no, phase, raw_code, raw_name, inci_en, inci_kr, percentage, function_en, note)
values
('GF-0001', 'R0', 1, 'A', 'RM-00001', '정제수', 'Water', '정제수', 70.00, 'Solvent', 'seed'),
('GF-0001', 'R0', 2, 'A', 'RM-00002', '글리세린', 'Glycerin', '글리세린', 5.00, 'Humectant', 'seed'),
('GF-0001', 'R0', 3, 'B', 'RM-00041', '스쿠알란', 'Squalane', '스쿠알란', 10.00, 'Emollient', 'seed'),
('GF-0001', 'R0', 4, 'B', 'RM-00034', '세라마이드엔피', 'Ceramide NP', '세라마이드엔피', 0.50, 'Skin Conditioning', 'seed'),
('GF-0001', 'R0', 5, 'C', 'RM-00163', '페녹시에탄올', 'Phenoxyethanol', '페녹시에탄올', 0.80, 'Preservative', 'seed'),
('GF-0001', 'R0', 6, 'A', 'RM-00003', '부틸렌글라이콜', 'Butylene Glycol', '부틸렌글라이콜', 13.70, 'Humectant', 'seed')
on conflict (formula_code, revision, line_no) do nothing;
