-- 처방관리 > 처방 기본정보에 "칼선정보"(칼선/다이컷 정보, 예: "칼판(연구)-0006") 자유 입력 칸 추가.
-- 규격화된 체계가 없어 숫자/문자 혼용 가능한 자유 텍스트라 text로 둔다.
--
-- 참고: 이 마이그레이션은 실제 운영 DB에는 Supabase MCP(apply_migration)로 이미 적용되어 있고,
-- 이 파일은 로컬 저장소와 동기화하기 위해 사후에 추가되었다 (적용된 스키마를 직접 조회해 그대로 기록).
ALTER TABLE plm_formulas
  ADD COLUMN IF NOT EXISTS cutting_line_info text;

COMMENT ON COLUMN plm_formulas.cutting_line_info IS '칼선(다이컷) 정보 - 자유 입력 텍스트';
