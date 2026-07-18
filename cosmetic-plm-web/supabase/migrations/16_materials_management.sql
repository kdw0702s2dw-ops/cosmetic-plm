-- 부자재관리: plm_materials(부자재 마스터) + plm_material_formula_links(적용 개발번호, 다대다)
-- + plm_production_bom에 부자재명1/2/3 슬롯별 코드 컬럼 추가(생산 BOM 전개 자동완성 연동용)

create table if not exists plm_materials (
  id uuid primary key default gen_random_uuid(),
  material_code text not null unique,
  material_name text not null,
  spec text,
  supplier text,
  customer text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_plm_materials_active on plm_materials (is_active);

create table if not exists plm_material_formula_links (
  id uuid primary key default gen_random_uuid(),
  material_code text not null references plm_materials (material_code) on update cascade on delete cascade,
  formula_code text not null,
  created_at timestamptz default now(),
  unique (material_code, formula_code)
);

create index if not exists idx_plm_material_formula_links_formula on plm_material_formula_links (formula_code);

alter table plm_production_bom
  add column if not exists material_code_1 text references plm_materials (material_code) on update cascade on delete set null,
  add column if not exists material_code_2 text references plm_materials (material_code) on update cascade on delete set null,
  add column if not exists material_code_3 text references plm_materials (material_code) on update cascade on delete set null;

alter table plm_materials enable row level security;
alter table plm_material_formula_links enable row level security;

create policy plm_materials_read on plm_materials
  for select using (plm_has_role(array['Admin','Researcher','QA','Viewer']));
create policy plm_materials_write on plm_materials
  for all using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));

create policy plm_material_formula_links_read on plm_material_formula_links
  for select using (plm_has_role(array['Admin','Researcher','QA','Viewer']));
create policy plm_material_formula_links_write on plm_material_formula_links
  for all using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));
