-- plm_allergen_master / plm_allergen_alerts에 RLS 적용
-- 각각 가장 구조적으로 유사한 기존 테이블(plm_regulatory_rules / plm_regulatory_alerts)과 동일한 패턴

-- plm_allergen_master: 규제 마스터 데이터 (읽기 전체 역할, 쓰기 Admin/QA)
ALTER TABLE plm_allergen_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_allergen_master_read ON plm_allergen_master
  FOR SELECT TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','QA','Viewer']));

CREATE POLICY plm_allergen_master_write ON plm_allergen_master
  FOR ALL TO authenticated
  USING (plm_has_role(ARRAY['Admin','QA']))
  WITH CHECK (plm_has_role(ARRAY['Admin','QA']));

-- plm_allergen_alerts: 계산 결과 (읽기 전체 역할, 쓰기 Admin/Researcher/QA)
ALTER TABLE plm_allergen_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_allergen_alerts_read ON plm_allergen_alerts
  FOR SELECT TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','QA','Viewer']));

CREATE POLICY plm_allergen_alerts_write ON plm_allergen_alerts
  FOR ALL TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','QA']))
  WITH CHECK (plm_has_role(ARRAY['Admin','Researcher','QA']));
