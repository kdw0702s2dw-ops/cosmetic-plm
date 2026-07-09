-- 알러젠 표기 자동계산 기능 Phase 6: 시장별(국가별) 알러젠 목록 관리 기반

-- 1) 알러젠 마스터에 시장/규정 구분 컬럼 추가
ALTER TABLE plm_allergen_master
  ADD COLUMN market text,
  ADD COLUMN regulation_version text,
  ADD COLUMN effective_date date;

-- 2) 기존 26종은 KR 규정 기준으로 백필
UPDATE plm_allergen_master
SET market = 'KR', regulation_version = 'KR_26'
WHERE market IS NULL;

-- 3) 처방에 대상 시장 필드 추가 (exposure_type과 동일한 CHECK 제약 패턴)
ALTER TABLE plm_formulas
  ADD COLUMN target_market text CHECK (target_market IN ('KR','EU','UK'));

-- 4) 계산 RPC: target_market에 해당하는 알러젠만 필터링 (미지정 시 KR 기본값, exposure_type과 달리 저장을 막지 않음)
CREATE OR REPLACE FUNCTION plm_calculate_allergen_alerts(p_formula_code text, p_revision text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exposure_type text;
  v_target_market text;
  v_threshold numeric;
  v_count integer;
BEGIN
  IF NOT plm_is_active_user() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT exposure_type, target_market INTO v_exposure_type, v_target_market
  FROM plm_formulas
  WHERE formula_code = p_formula_code AND revision = p_revision;

  IF v_exposure_type IS NULL THEN
    RAISE EXCEPTION '제품 사용유형(Leave-on/Rinse-off)이 지정되지 않았습니다. 처방관리에서 먼저 설정해주세요.';
  END IF;

  v_target_market := COALESCE(v_target_market, 'KR');

  v_threshold := CASE WHEN v_exposure_type = 'LEAVE_ON' THEN 0.001 ELSE 0.01 END;

  DELETE FROM plm_allergen_alerts
  WHERE formula_code = p_formula_code AND revision = p_revision;

  INSERT INTO plm_allergen_alerts
    (formula_code, revision, formula_name, exposure_type, allergen_id,
     allergen_name_kr, allergen_name_en, formula_percent, threshold_percent, label_required)
  SELECT
    p_formula_code,
    p_revision,
    f.formula_name,
    v_exposure_type,
    am.id,
    am.allergen_name_kr,
    am.allergen_name_en,
    SUM(fl.percentage * comp.composition_percent / 100.0) AS formula_percent,
    v_threshold,
    SUM(fl.percentage * comp.composition_percent / 100.0) >= v_threshold AS label_required
  FROM plm_formula_lines fl
  JOIN plm_raw_material_components comp ON comp.raw_code = fl.raw_code AND comp.is_allergen = true
  JOIN plm_allergen_master am ON am.id = comp.allergen_id AND am.market = v_target_market
  JOIN plm_formulas f ON f.formula_code = p_formula_code AND f.revision = p_revision
  WHERE fl.formula_code = p_formula_code AND fl.revision = p_revision
  GROUP BY am.id, am.allergen_name_kr, am.allergen_name_en, f.formula_name;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
