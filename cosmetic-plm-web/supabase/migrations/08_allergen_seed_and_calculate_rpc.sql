-- 알러젠 표기 자동계산 기능 Phase 4: 시드 데이터 + 계산 RPC

-- EU 알러젠 26종 초기 데이터 (이름만, CAS/EC는 추후 공식 자료 확인 후 입력)
INSERT INTO plm_allergen_master (allergen_name_en, allergen_name_kr) VALUES
('Amyl Cinnamal', null),
('Benzyl Alcohol', null),
('Cinnamyl Alcohol', null),
('Citral', null),
('Eugenol', null),
('Hydroxycitronellal', null),
('Isoeugenol', null),
('Amylcinnamyl Alcohol', null),
('Benzyl Salicylate', null),
('Cinnamal', null),
('Coumarin', null),
('Geraniol', null),
('Anisyl Alcohol', null),
('Benzyl Cinnamate', null),
('Farnesol', null),
('Butylphenyl Methylpropional', null),
('Linalool', null),
('Benzyl Benzoate', null),
('Citronellol', null),
('Hexyl Cinnamal', null),
('Limonene', null),
('Methyl 2-Octynoate', null),
('Alpha-Isomethyl Ionone', null),
('Evernia Prunastri (Oakmoss) Extract', null),
('Evernia Furfuracea (Treemoss) Extract', null),
('Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde', null);

-- 처방 내 알러젠 표시 대상 계산: 처방 저장 시 plm_regulatory_alerts와 같은 시점에 호출됨
CREATE OR REPLACE FUNCTION plm_calculate_allergen_alerts(p_formula_code text, p_revision text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exposure_type text;
  v_threshold numeric;
  v_count integer;
BEGIN
  IF NOT plm_is_active_user() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT exposure_type INTO v_exposure_type
  FROM plm_formulas
  WHERE formula_code = p_formula_code AND revision = p_revision;

  IF v_exposure_type IS NULL THEN
    RAISE EXCEPTION '제품 사용유형(Leave-on/Rinse-off)이 지정되지 않았습니다. 처방관리에서 먼저 설정해주세요.';
  END IF;

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
  JOIN plm_allergen_master am ON am.id = comp.allergen_id
  JOIN plm_formulas f ON f.formula_code = p_formula_code AND f.revision = p_revision
  WHERE fl.formula_code = p_formula_code AND fl.revision = p_revision
  GROUP BY am.id, am.allergen_name_kr, am.allergen_name_en, f.formula_name;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
