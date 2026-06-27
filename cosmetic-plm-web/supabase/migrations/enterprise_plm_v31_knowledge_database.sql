-- Enterprise PLM v3.1 Knowledge Database Master Pack

create table if not exists public.knowledge_global_inci_master (
  id uuid primary key default gen_random_uuid(),
  inci_code text not null unique,
  inci_en text not null,
  inci_kr text,
  inci_cn text,
  inci_jp text,
  function_en text,
  cas_no text,
  ec_no text,
  category text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.knowledge_regulation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  country text not null,
  keyword text not null,
  risk_type text not null,
  rule_summary text not null,
  recommended_action text not null,
  created_at timestamptz default now()
);

create table if not exists public.knowledge_formula_library (
  id uuid primary key default gen_random_uuid(),
  library_code text not null unique,
  formula_name text not null,
  product_type text not null,
  claim text,
  key_ingredients text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.knowledge_compatibility_matrix (
  id uuid primary key default gen_random_uuid(),
  compat_code text not null unique,
  ingredient_a text not null,
  ingredient_b text not null,
  status text not null,
  risk_summary text not null,
  recommendation text not null,
  created_at timestamptz default now()
);

create index if not exists idx_knowledge_global_inci_search on public.knowledge_global_inci_master(inci_en, inci_kr, cas_no);
create index if not exists idx_knowledge_regulation_search on public.knowledge_regulation_rules(country, keyword, risk_type);
create index if not exists idx_knowledge_formula_library_search on public.knowledge_formula_library(product_type, claim);
create index if not exists idx_knowledge_compatibility_search on public.knowledge_compatibility_matrix(ingredient_a, ingredient_b, status);

alter table public.knowledge_global_inci_master enable row level security;
alter table public.knowledge_regulation_rules enable row level security;
alter table public.knowledge_formula_library enable row level security;
alter table public.knowledge_compatibility_matrix enable row level security;

drop policy if exists "knowledge_global_inci_master_all" on public.knowledge_global_inci_master;
create policy "knowledge_global_inci_master_all" on public.knowledge_global_inci_master for all to authenticated using (true) with check (true);

drop policy if exists "knowledge_regulation_rules_all" on public.knowledge_regulation_rules;
create policy "knowledge_regulation_rules_all" on public.knowledge_regulation_rules for all to authenticated using (true) with check (true);

drop policy if exists "knowledge_formula_library_all" on public.knowledge_formula_library;
create policy "knowledge_formula_library_all" on public.knowledge_formula_library for all to authenticated using (true) with check (true);

drop policy if exists "knowledge_compatibility_matrix_all" on public.knowledge_compatibility_matrix;
create policy "knowledge_compatibility_matrix_all" on public.knowledge_compatibility_matrix for all to authenticated using (true) with check (true);

-- Initial seed data
insert into public.knowledge_global_inci_master
(inci_code, inci_en, inci_kr, inci_cn, inci_jp, function_en, cas_no, ec_no, category, notes)
values
('INCI-00001','Water','정제수','水','水','Solvent','7732-18-5','231-791-2','COMMON','General solvent'),
('INCI-00002','Glycerin','글리세린','甘油','グリセリン','Humectant','56-81-5','200-289-5','COMMON','Humectant'),
('INCI-00003','Butylene Glycol','부틸렌글라이콜','丁二醇','BG','Humectant','107-88-0','203-529-7','COMMON','Humectant/Solvent'),
('INCI-00004','Niacinamide','나이아신아마이드','烟酰胺','ナイアシンアミド','Skin Conditioning','98-92-0','202-713-4','ACTIVE','Brightening care'),
('INCI-00005','Panthenol','판테놀','泛醇','パンテノール','Skin Conditioning','81-13-0','201-327-3','ACTIVE','Soothing care'),
('INCI-00006','Allantoin','알란토인','尿囊素','アラントイン','Skin Protecting','97-59-6','202-592-8','ACTIVE','Soothing'),
('INCI-00007','Ceramide NP','세라마이드엔피','神经酰胺NP','セラミドNP','Skin Conditioning','100403-19-8','','ACTIVE','Barrier'),
('INCI-00008','Sodium Hyaluronate','소듐하이알루로네이트','透明质酸钠','ヒアルロン酸Na','Humectant','9067-32-7','','ACTIVE','Moisturizing'),
('INCI-00009','Carbomer','카보머','卡波姆','カルボマー','Viscosity Increasing','9003-01-4','','POLYMER','Gel thickener'),
('INCI-00010','Xanthan Gum','잔탄검','黄原胶','キサンタンガム','Viscosity Increasing','11138-66-2','234-394-2','POLYMER','Natural gum'),
('INCI-00011','Phenoxyethanol','페녹시에탄올','苯氧乙醇','フェノキシエタノール','Preservative','122-99-6','204-589-7','PRESERVATIVE','Preservative'),
('INCI-00012','Ethylhexylglycerin','에틸헥실글리세린','乙基己基甘油','エチルヘキシルグリセリン','Skin Conditioning','70445-33-9','408-080-2','PRESERVATIVE BOOSTER','Preservative booster')
on conflict (inci_code) do nothing;

insert into public.knowledge_regulation_rules
(rule_code, country, keyword, risk_type, rule_summary, recommended_action)
values
('REG-00001','EU','Retinol','RESTRICTED','Verify current EU vitamin A limits before launch','RA review required'),
('REG-00002','EU','Salicylic Acid','RESTRICTED','Use restriction depends on product type and age group','Check final concentration'),
('REG-00003','CN','Niacinamide','WATCH','Check IECIC/name matching and claim compliance','NMPA review'),
('REG-00004','JP','Quasi-drug Active','WATCH','Check quasi-drug category if efficacy claim is used','Japan launch review'),
('REG-00005','ASEAN','Preservative','WATCH','Check ASEAN cosmetic directive preservative list','RA review'),
('REG-00006','US','Sunscreen Filter','RESTRICTED','OTC sunscreen monograph review required','US launch review')
on conflict (rule_code) do nothing;

insert into public.knowledge_formula_library
(library_code, formula_name, product_type, claim, key_ingredients, notes)
values
('LIB-0001','Basic Hydrating Toner','Toner','Moisturizing','Water, Glycerin, Butylene Glycol, Panthenol','Beginner base toner'),
('LIB-0002','Barrier Cream Base','Cream','Barrier','Water, Glycerin, Squalane, Ceramide NP, Panthenol','Ceramide cream base'),
('LIB-0003','Soothing Gel Cream','Gel Cream','Soothing','Water, Butylene Glycol, Carbomer, Allantoin, Panthenol','Light soothing gel cream'),
('LIB-0004','Brightening Serum','Serum','Brightening','Water, Niacinamide, Glycerin, Sodium Hyaluronate','Niacinamide serum base'),
('LIB-0005','Mild Cleanser','Cleanser','Mild cleansing','Water, Cocamidopropyl Betaine, Sodium Cocoyl Glutamate','Low irritation cleanser base')
on conflict (library_code) do nothing;

insert into public.knowledge_compatibility_matrix
(compat_code, ingredient_a, ingredient_b, status, risk_summary, recommendation)
values
('COMP-0001','Retinol','Ascorbic Acid','WATCH','pH/stability conflict risk','Separate system or stabilized derivatives recommended'),
('COMP-0002','Niacinamide','Low pH AHA','WATCH','Irritation and stability review','Check final pH and irritation target'),
('COMP-0003','Carbomer','High Electrolyte','WATCH','Viscosity loss risk','Use electrolyte tolerant polymer'),
('COMP-0004','Fragrance','Sensitive Skin','WATCH','Irritation/allergen risk','Use allergen review and low fragrance level'),
('COMP-0005','Ceramide NP','Cholesterol/Fatty Acid','GOOD','Barrier synergy','Recommended lipid system')
on conflict (compat_code) do nothing;
