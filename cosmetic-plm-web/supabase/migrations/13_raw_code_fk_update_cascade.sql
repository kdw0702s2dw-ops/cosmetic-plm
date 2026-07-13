-- 원료코드(raw_code)를 편집 화면에서 다시 수정 가능하게 하면서, 코드가 바뀌어도
-- 참조하는 자식 행들이 고아가 되지 않도록 관련 FK에 ON UPDATE CASCADE를 건다.

-- 구성성분(plm_raw_material_components)은 원료의 하위 데이터이므로 기존과 동일하게 ON DELETE CASCADE 유지
alter table plm_raw_material_components
  drop constraint plm_raw_material_components_raw_code_fkey;

alter table plm_raw_material_components
  add constraint plm_raw_material_components_raw_code_fkey
  foreign key (raw_code) references plm_raw_materials(raw_code)
  on update cascade on delete cascade;

-- 처방 BOM 라인(plm_formula_lines)은 원료의 하위 데이터가 아니라 처방의 하위 데이터이므로,
-- 원료가 삭제된다고 처방 BOM 기록까지 함께 사라지면 안 됨 -> ON DELETE RESTRICT
alter table plm_formula_lines
  add constraint plm_formula_lines_raw_code_fkey
  foreign key (raw_code) references plm_raw_materials(raw_code)
  on update cascade on delete restrict;
