-- 제조는 원처방(MIX) 기준으로 진행하되, 서류(전성분표/복합성분표/단일성분표)는 공개처방(일반·PUBLIC)
-- 기준으로 발급해야 하는 예외 처방을 위한 플래그. true로 지정하면 문서관리 화면에서 해당 처방을 펼쳤을 때
-- "기준"이 자동으로 공개처방(일반)으로 선택되고, 원처방으로 바꾸면 경고가 표시되며, 원처방 기준으로
-- 생성/재생성할 때 한 번 더 확인을 받는다(서류 발급 실수를 막기 위한 안전장치).
ALTER TABLE plm_formulas
  ADD COLUMN IF NOT EXISTS requires_public_basis_docs boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN plm_formulas.requires_public_basis_docs IS
  '제조는 원처방(MIX) 기준이지만 서류는 공개처방(일반·PUBLIC) 기준으로 발급해야 하는 예외 처방 여부. 문서관리 화면의 "기준" 선택 영역에서 설정한다.';
