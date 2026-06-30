-- Enterprise PLM Sprint 2-7 Global Regulation Engine
-- Initial practical regulatory workflow for KR/EU/CN/US/JP/ASEAN.
-- Seed rules below are starter/sample rules for workflow verification.
-- Replace and maintain with confirmed official regulatory data before business use.

create table if not exists public.plm_regulatory_rules (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region in ('KR','EU','CN','US','JP','ASEAN')),
  rule_code text not null unique,
  ingredient_keyword text not null,
  ingredient_name_kr text,
  ingredient_name_en text,
  max_percent numeric,
  allowed_status text not null default 'REVIEW_REQUIRED' check (allowed_status in ('ALLOWED','LIMITED','BANNED','REVIEW_REQUIRED')),
  warning_level text not null default 'WARNING' check (warning_level in ('INFO','WARNING','CRITICAL')),
  rule_title text not null,
  rule_description text,
  source_note text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.plm_regulatory_alerts (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  formula_name text,
  region text not null check (region in ('KR','EU','CN','US','JP','ASEAN')),
  rule_code text,
  warning_level text not null default 'WARNING',
  ingredient_keyword text,
  raw_name text,
  inci_kr text,
  inci_en text,
  cas_no text,
  formula_percent numeric,
  max_percent numeric,
  issue text,
  action_suggestion text,
  status text default 'OPEN' check (status in ('OPEN','CONFIRMED','RESOLVED','IGNORED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_plm_regulatory_rules_region on public.plm_regulatory_rules(region);
create index if not exists idx_plm_regulatory_alerts_formula on public.plm_regulatory_alerts(formula_code, revision);
create index if not exists idx_plm_regulatory_alerts_region on public.plm_regulatory_alerts(region);
create index if not exists idx_plm_regulatory_alerts_status on public.plm_regulatory_alerts(status);

alter table public.plm_regulatory_rules enable row level security;
alter table public.plm_regulatory_alerts enable row level security;

drop policy if exists "plm_reg_rules_read" on public.plm_regulatory_rules;
create policy "plm_reg_rules_read" on public.plm_regulatory_rules
for select to authenticated
using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));

drop policy if exists "plm_reg_rules_write" on public.plm_regulatory_rules;
create policy "plm_reg_rules_write" on public.plm_regulatory_rules
for all to authenticated
using (public.plm_has_role(array['Admin','QA']))
with check (public.plm_has_role(array['Admin','QA']));

drop policy if exists "plm_reg_alerts_read" on public.plm_regulatory_alerts;
create policy "plm_reg_alerts_read" on public.plm_regulatory_alerts
for select to authenticated
using (public.plm_has_role(array['Admin','Researcher','QA','Viewer']));

drop policy if exists "plm_reg_alerts_write" on public.plm_regulatory_alerts;
create policy "plm_reg_alerts_write" on public.plm_regulatory_alerts
for all to authenticated
using (public.plm_has_role(array['Admin','Researcher','QA']))
with check (public.plm_has_role(array['Admin','Researcher','QA']));

insert into public.plm_regulatory_rules
(region, rule_code, ingredient_keyword, ingredient_name_kr, ingredient_name_en, max_percent, allowed_status, warning_level, rule_title, rule_description, source_note)
values
('KR','KR-PHENOXYETHANOL-STARTER','phenoxyethanol','페녹시에탄올','Phenoxyethanol',1,'LIMITED','WARNING','보존제 함량 확인','페녹시에탄올 함량 기준 확인이 필요합니다.','초기 검증용 샘플 규칙'),
('EU','EU-PHENOXYETHANOL-STARTER','phenoxyethanol','페녹시에탄올','Phenoxyethanol',1,'LIMITED','WARNING','보존제 함량 확인','EU 출시 처방의 페녹시에탄올 함량 확인이 필요합니다.','초기 검증용 샘플 규칙'),
('CN','CN-NEW-INGREDIENT-REVIEW','pdrn','피디알엔','PDRN',null,'REVIEW_REQUIRED','WARNING','중국 신원료/원료 검토','중국 출시 시 원료 등록/사용 가능 여부 검토가 필요합니다.','초기 검증용 샘플 규칙'),
('US','US-LABEL-REVIEW-FRAGRANCE','fragrance','향료','Fragrance',null,'REVIEW_REQUIRED','INFO','미국 라벨 표시 검토','향료/알러젠/라벨 표시 검토가 필요할 수 있습니다.','초기 검증용 샘플 규칙'),
('KR','KR-HYDROQUINONE-STARTER','hydroquinone','하이드로퀴논','Hydroquinone',null,'BANNED','CRITICAL','사용금지 검토','해당 성분 사용 가능 여부를 즉시 확인하세요.','초기 검증용 샘플 규칙'),
('EU','EU-HYDROQUINONE-STARTER','hydroquinone','하이드로퀴논','Hydroquinone',null,'BANNED','CRITICAL','사용금지 검토','해당 성분 사용 가능 여부를 즉시 확인하세요.','초기 검증용 샘플 규칙'),
('JP','JP-PHENOXYETHANOL-STARTER','phenoxyethanol','페녹시에탄올','Phenoxyethanol',1,'LIMITED','WARNING','보존제 함량 확인','일본 출시 처방의 페녹시에탄올 함량 확인이 필요합니다.','초기 검증용 샘플 규칙'),
('ASEAN','ASEAN-PHENOXYETHANOL-STARTER','phenoxyethanol','페녹시에탄올','Phenoxyethanol',1,'LIMITED','WARNING','보존제 함량 확인','ASEAN 출시 처방의 페녹시에탄올 함량 확인이 필요합니다.','초기 검증용 샘플 규칙')
on conflict (rule_code) do update set
  ingredient_keyword = excluded.ingredient_keyword,
  ingredient_name_kr = excluded.ingredient_name_kr,
  ingredient_name_en = excluded.ingredient_name_en,
  max_percent = excluded.max_percent,
  allowed_status = excluded.allowed_status,
  warning_level = excluded.warning_level,
  rule_title = excluded.rule_title,
  rule_description = excluded.rule_description,
  source_note = excluded.source_note,
  is_active = true,
  updated_at = now();

insert into public.enterprise_release_markers (release_code, title, description)
values (
  'SPRINT2-7-GLOBAL-REGULATION',
  'Enterprise PLM Sprint 2-7 Global Regulation Engine',
  'Adds global regulation workflow for KR, EU, China, US, Japan and ASEAN with rules, alerts, formula validation and Enterprise UI.'
)
on conflict (release_code) do nothing;
