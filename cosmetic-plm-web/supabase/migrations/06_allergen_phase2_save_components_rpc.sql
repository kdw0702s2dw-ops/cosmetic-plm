-- 알러젠 표기 자동계산 기능 Phase 2: plm_save_components RPC에 알러젠 컬럼 반영

CREATE OR REPLACE FUNCTION public.plm_save_components(p_raw_code text, p_components jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_count integer;
begin
  if not public.plm_is_active_user() then
    raise exception 'permission denied';
  end if;

  delete from plm_raw_material_components where raw_code = p_raw_code;

  insert into plm_raw_material_components
    (raw_code, component_no, inci_en, inci_kr, inci_cn, inci_jp,
     cas_no, ec_no, composition_percent, function_kr, function_en,
     is_allergen, allergen_id)
  select
    p_raw_code,
    (row_number() over ())::int,
    nullif(c->>'inci_en',''),
    nullif(c->>'inci_kr',''),
    nullif(c->>'inci_cn',''),
    nullif(c->>'inci_jp',''),
    nullif(c->>'cas_no',''),
    nullif(c->>'ec_no',''),
    nullif(c->>'composition_percent','')::numeric,
    nullif(c->>'function_kr',''),
    nullif(c->>'function_en',''),
    coalesce((c->>'is_allergen')::boolean, false),
    nullif(c->>'allergen_id','')::uuid
  from jsonb_array_elements(p_components) as c;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;
