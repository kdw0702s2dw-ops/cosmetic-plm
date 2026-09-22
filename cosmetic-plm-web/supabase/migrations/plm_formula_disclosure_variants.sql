-- 공개처방(일반)/공개처방(건조)를 원처방과 독립적으로 편집·저장할 수 있게 하기 위한 추가.
-- 기존 plm_formula_lines(원처방)는 전혀 건드리지 않는다 - 규제검증/알러젠계산/실험일지 등
-- 기존에 plm_formula_lines를 참조하는 모든 기능은 이 변경의 영향을 받지 않는다.
--
-- 참고: 이 마이그레이션은 2026-09-22에 Supabase 프로젝트(ztzitdhngdtfwmfqusbb)에 이미 적용되어
-- 있습니다. 이 파일은 로컬 저장소의 supabase/migrations/ 이력을 실제 DB 상태와 맞추기 위한
-- 기록용입니다 - 다시 실행해도 안전하도록 if not exists / if not exists 가드를 넣어뒀습니다.

alter table plm_formulas
  add column if not exists public_bom_customized boolean not null default false,
  add column if not exists dry_bom_customized boolean not null default false;

comment on column plm_formulas.public_bom_customized is '공개처방(일반) BOM을 별도로 저장했는지 여부. false면 문서/미리보기 모두 원처방(plm_formula_lines) 값을 그대로 보여준다.';
comment on column plm_formulas.dry_bom_customized is '공개처방(건조) BOM을 사람이 직접 저장했는지 여부. false면 지금처럼 실측 수분율 기반 자동계산 값을 그대로 보여준다.';

create table if not exists plm_formula_lines_public (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  line_no integer not null,
  phase text default 'A',
  raw_code text references plm_raw_materials(raw_code) on update cascade on delete restrict,
  raw_name text,
  inci_kr text,
  inci_en text,
  percentage numeric default 0,
  function_kr text,
  function_en text,
  unit_price numeric default 0,
  cost_per_kg numeric default 0,
  note text,
  phase_seq integer,
  cas_no text,
  ec_no text,
  moq text,
  is_new_material boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint plm_formula_lines_public_formula_fkey foreign key (formula_code, revision) references plm_formulas(formula_code, revision) on delete cascade,
  constraint plm_formula_lines_public_unique unique (formula_code, revision, line_no)
);

create table if not exists plm_formula_lines_dry (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  line_no integer not null,
  phase text default 'A',
  raw_code text references plm_raw_materials(raw_code) on update cascade on delete restrict,
  raw_name text,
  inci_kr text,
  inci_en text,
  percentage numeric default 0,
  function_kr text,
  function_en text,
  unit_price numeric default 0,
  cost_per_kg numeric default 0,
  note text,
  phase_seq integer,
  cas_no text,
  ec_no text,
  moq text,
  is_new_material boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint plm_formula_lines_dry_formula_fkey foreign key (formula_code, revision) references plm_formulas(formula_code, revision) on delete cascade,
  constraint plm_formula_lines_dry_unique unique (formula_code, revision, line_no)
);

alter table plm_formula_lines_public enable row level security;
alter table plm_formula_lines_dry enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'plm_formula_lines_public' and policyname = 'plm_formula_lines_public_read') then
    create policy plm_formula_lines_public_read on plm_formula_lines_public for select to authenticated
      using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'plm_formula_lines_public' and policyname = 'plm_formula_lines_public_write') then
    create policy plm_formula_lines_public_write on plm_formula_lines_public for all to authenticated
      using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'plm_formula_lines_dry' and policyname = 'plm_formula_lines_dry_read') then
    create policy plm_formula_lines_dry_read on plm_formula_lines_dry for select to authenticated
      using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'plm_formula_lines_dry' and policyname = 'plm_formula_lines_dry_write') then
    create policy plm_formula_lines_dry_write on plm_formula_lines_dry for all to authenticated
      using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));
  end if;
end $$;
