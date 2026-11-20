-- 원격 적용: Supabase MCP의 apply_migration 도구가 승인창 응답 타임아웃으로 반복 실패해서,
-- 아래 SQL을 Supabase 대시보드 SQL Editor에서 직접 실행해 원격에 적용함 (2026-11-20, 정식
-- 마이그레이션 트래킹 테이블에는 등록되지 않음 - list_migrations에 별도 version 없음).
-- 로컬 Claude Code 리뷰로 발견된 2가지 보완(2026-11-20 2차 적용, 현재 데이터에는 영향 없음):
--  1) group by에 이름(coalesce) 표현식까지 포함되어 있어서, 같은 allergen_key라도 영문/국문
--     표기가 글자 하나라도 다른 두 원료가 있으면 합계가 둘로 쪼개져 기준치 미만으로 잘못
--     판정될 수 있었음 - group by를 allergen_key, f.formula_name만으로 줄이고 이름은 max()로.
--  2) 미매칭 알러젠의 식별 키에 component_name_kr/en까지 폴백에 포함돼 있어서, JS 쪽
--     allergenKey()(inci_kr/inci_en만 사용)와 키가 어긋날 수 있었음 - 식별 키 폴백에서
--     component_name_kr/en 제거(표시용 이름 폴백에는 그대로 유지).
--
-- 알러젠 표시 판정을 "시장(target_market)별 공식 리스트 매칭" 방식에서 "원료관리에서 수동
-- 체크한 is_allergen + 처방의 실제 계산 함량이 노출기준(threshold)을 넘는지"로 전면 변경.
-- 배경: plm_allergen_master에 KR 26종만 들어있어서, EU/UK처럼 market이 다른 처방은
-- allergen_id가 매칭돼도 market이 안 맞으면 plm_calculate_allergen_alerts RPC와
-- documentPdfService.ts의 computeBasisAllergenAlerts 양쪽 모두에서 통째로 결과에서
-- 빠지는 버그가 있었음(사용자 실측 보고로 확인: UK 처방 P2026-011에서 Citronellol 1건만
-- 표시돼야 하는데 전혀 안 뜸). EU가 83종, UK/KR이 26종으로 시장마다 공식 리스트가 달라
-- 계속 최신화해야 하는 데이터 의존을 없애기 위해, 시장 매칭 없이 is_allergen+계산값만으로
-- 판단하도록 단순화함(사용자 결정).

-- 1) plm_allergen_alerts.allergen_id를 uuid -> text로 변경 (공식 목록에 매칭 안 된 알러젠도
--    JS allergenKey()와 동일한 "name:..." 식별자로 저장할 수 있게 하기 위함)
alter table plm_allergen_alerts drop constraint if exists plm_allergen_alerts_allergen_id_fkey;
alter table plm_allergen_alerts alter column allergen_id type text using allergen_id::text;

-- 2) plm_calculate_allergen_alerts RPC 재작성: target_market/market 필터링 제거, 공식 목록에
--    매칭되지 않는 is_allergen 성분도 포함(LEFT JOIN), label_required는 항상 계산된 함량 >= threshold로 판단
create or replace function public.plm_calculate_allergen_alerts(p_formula_code text, p_revision text)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_exposure_type text;
  v_threshold numeric;
  v_count integer;
begin
  if not plm_is_active_user() then
    raise exception 'permission denied';
  end if;

  select exposure_type into v_exposure_type
  from plm_formulas
  where formula_code = p_formula_code and revision = p_revision;

  if v_exposure_type is null then
    raise exception '제품 사용유형(Leave-on/Rinse-off)이 지정되지 않았습니다. 처방관리에서 먼저 설정해주세요.';
  end if;

  v_threshold := case when v_exposure_type = 'LEAVE_ON' then 0.001 else 0.01 end;

  delete from plm_allergen_alerts
  where formula_code = p_formula_code and revision = p_revision;

  insert into plm_allergen_alerts
    (formula_code, revision, formula_name, exposure_type, allergen_id,
     allergen_name_kr, allergen_name_en, formula_percent, threshold_percent, label_required)
  select
    p_formula_code,
    p_revision,
    f.formula_name,
    v_exposure_type,
    coalesce(comp.allergen_id::text,
      'name:' || lower(trim(regexp_replace(coalesce(comp.inci_kr, comp.inci_en, ''), '\s+', ' ', 'g')))
    ) as allergen_key,
    max(coalesce(am.allergen_name_kr, comp.inci_kr, comp.component_name_kr)) as allergen_name_kr,
    max(coalesce(am.allergen_name_en, comp.inci_en, comp.component_name_en, '(unnamed)')) as allergen_name_en,
    sum(fl.percentage * comp.composition_percent / 100.0) as formula_percent,
    v_threshold,
    sum(fl.percentage * comp.composition_percent / 100.0) >= v_threshold as label_required
  from plm_formula_lines fl
  join plm_raw_material_components comp on comp.raw_code = fl.raw_code and comp.is_allergen = true
  left join plm_allergen_master am on am.id = comp.allergen_id
  join plm_formulas f on f.formula_code = p_formula_code and f.revision = p_revision
  where fl.formula_code = p_formula_code and fl.revision = p_revision
  group by allergen_key, f.formula_name;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- 3) 백필: exposure_type이 지정된 기존 처방(330건) 전체를 새 RPC와 동일한 로직으로 재계산.
--    (RPC 자체는 plm_is_active_user() 체크 때문에 SQL Editor/서비스 role에서 직접 호출 불가해서,
--    RPC 본문과 동일한 SELECT를 전체 처방 대상으로 한 번에 실행)
delete from plm_allergen_alerts
where (formula_code, revision) in (
  select formula_code, revision from plm_formulas where exposure_type is not null
);

insert into plm_allergen_alerts
  (formula_code, revision, formula_name, exposure_type, allergen_id,
   allergen_name_kr, allergen_name_en, formula_percent, threshold_percent, label_required)
select
  f.formula_code,
  f.revision,
  f.formula_name,
  f.exposure_type,
  coalesce(comp.allergen_id::text,
    'name:' || lower(trim(regexp_replace(coalesce(comp.inci_kr, comp.inci_en, ''), '\s+', ' ', 'g')))
  ) as allergen_key,
  max(coalesce(am.allergen_name_kr, comp.inci_kr, comp.component_name_kr)) as allergen_name_kr,
  max(coalesce(am.allergen_name_en, comp.inci_en, comp.component_name_en, '(unnamed)')) as allergen_name_en,
  sum(fl.percentage * comp.composition_percent / 100.0) as formula_percent,
  (case when f.exposure_type = 'LEAVE_ON' then 0.001 else 0.01 end) as threshold_percent,
  sum(fl.percentage * comp.composition_percent / 100.0) >= (case when f.exposure_type = 'LEAVE_ON' then 0.001 else 0.01 end) as label_required
from plm_formulas f
join plm_formula_lines fl on fl.formula_code = f.formula_code and fl.revision = f.revision
join plm_raw_material_components comp on comp.raw_code = fl.raw_code and comp.is_allergen = true
left join plm_allergen_master am on am.id = comp.allergen_id
where f.exposure_type is not null
group by f.formula_code, f.revision, f.formula_name, f.exposure_type, allergen_key;
