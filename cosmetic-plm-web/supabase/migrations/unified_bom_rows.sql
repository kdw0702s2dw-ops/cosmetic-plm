-- 처방관리: "생산 BOM 전개"(부자재 3칸 고정, 저장된 적 없음)를 대체하는 통합 BOM 직접 입력 표.
-- 사용자가 실제로 쓰는 BOM 문서(No./내용/품번/품명/변경사항/규격, 완제품→충전품→절단품→코팅품→
-- 처방→부자재 순서로 여러 줄)와 동일한 자유 형식 표를 저장한다. 품번은 자동 생성 없이 직접 입력.
-- plm_formula_lines/plm_production_bom과 동일한 패턴: formula_code+revision으로 처방 하나에 연결.

CREATE TABLE plm_unified_bom_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_code text NOT NULL,
  revision text NOT NULL,
  row_no integer NOT NULL DEFAULT 0,
  level_label text,   -- 내용: 완제품/충전품/절단품/코팅품/처방/부자재 (고정값 아님 - 자유 입력 + 추천목록)
  item_code text,     -- 품번 (직접 타이핑, 자동 생성 없음)
  item_name text,     -- 품명
  change_note text,   -- 변경사항
  spec text,          -- 규격
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (formula_code, revision) REFERENCES plm_formulas(formula_code, revision) ON DELETE RESTRICT
);

CREATE INDEX idx_plm_unified_bom_rows_formula ON plm_unified_bom_rows(formula_code, revision, row_no);

ALTER TABLE plm_unified_bom_rows ENABLE ROW LEVEL SECURITY;

-- plm_production_bom의 실제 라이브 정책과 동일한 기준 (Production도 읽기/쓰기 모두 가능)
CREATE POLICY plm_unified_bom_rows_read ON plm_unified_bom_rows
  FOR SELECT TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','QA','Viewer','Production']));

CREATE POLICY plm_unified_bom_rows_write ON plm_unified_bom_rows
  FOR ALL TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','Production']))
  WITH CHECK (plm_has_role(ARRAY['Admin','Researcher','Production']));
