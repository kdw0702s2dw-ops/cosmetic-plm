-- 사용량 이력 화면(생산관리 > 사용량 이력)의 자유 비고 - 특정 반영 건(날짜+처방)에 종속되지 않는
-- 생산 특이사항 등을 적어두는 용도. "시스템 업데이트"(system_updates)와 달리 자동 만료 없이 계속
-- 남는다(조회 시 최근 50건만 가져옴, 삭제는 DB에서 영구 제거).
-- RLS는 다른 plm_raw_material_* 테이블과 동일한 패턴(read: Admin/Researcher/QA/Viewer/Production,
-- write: Admin/Researcher/Production)을 따른다.
--
-- 참고: 이 마이그레이션은 실제 운영 DB에는 Supabase MCP(apply_migration)로 이미 적용되어 있고,
-- 이 파일은 로컬 저장소와 동기화하기 위해 사후에 추가되었다 (적용된 스키마를 직접 조회해 그대로 기록).
CREATE TABLE IF NOT EXISTS plm_raw_material_usage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plm_raw_material_usage_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_raw_material_usage_notes_read ON plm_raw_material_usage_notes
  FOR SELECT
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'QA', 'Viewer', 'Production']));

CREATE POLICY plm_raw_material_usage_notes_write ON plm_raw_material_usage_notes
  FOR ALL
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']))
  WITH CHECK (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']));
