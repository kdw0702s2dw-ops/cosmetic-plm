-- 생산량 검토(생산관리 > 생산량 검토)의 "코팅길이" 입력 단위를 cm에서 m로 변경.
-- 기존 코드는 cm으로 입력받아 면적 계산 시 /100으로 cm->m 변환을 섞어 썼는데,
-- 실제 운영에서 코팅길이는 cm이 아니라 m 단위로 입력되어야 코팅원단 총 수(개) 계산이 맞다는
-- 사용자 확인에 따라 컬럼명/의미를 cm -> m로 변경한다.
-- 기존에 저장된 4건의 이력은 cm 단위로 입력됐던 원본 값이 그대로 남으며, 숫자 자체는 변환하지 않는다
-- (과거 이력을 "불러오기"하면 같은 숫자가 이제는 m 단위로 재해석되어 새 계산식이 적용됨 - 과거 이력을
-- 그대로 다시 쓸 경우 값 재확인이 필요함).
alter table plm_production_qty_sheets rename column coating_length_cm to coating_length_m;
comment on column plm_production_qty_sheets.coating_length_m is '코팅길이 (단위: m). 2026-10 업데이트 이전에는 coating_length_cm(cm 단위)이었음 - 이 업데이트 이전 이력은 원본 숫자가 cm 기준으로 저장되어 있음에 주의.';
