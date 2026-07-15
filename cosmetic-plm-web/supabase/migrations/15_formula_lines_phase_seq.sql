-- BOM 편집 표에서 Phase 내 원료 표시 순서를 사용자가 자유롭게 조정할 수 있도록
-- 정렬 전용 컬럼 추가. line_no(on_conflict 대상)는 건드리지 않는다.
-- 이미 DB에 적용 완료. 재현/백업용.

alter table plm_formula_lines add column phase_seq integer;
