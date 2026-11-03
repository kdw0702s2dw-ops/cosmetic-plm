-- 처방관리: 제품유형 이름 수정. plm_product_types.name과 plm_formulas.product_type은 FK가 아닌 문자열
-- 복사본이라, 마스터 이름 변경과 그 옛 이름을 쓰던 모든 처방의 product_type 변경을 한 트랜잭션으로 처리한다.
-- 역할 검사(Admin/Researcher)는 함수 안에서 직접 한다(security definer라 RLS를 거치지 않음).
-- 원격 적용 마이그레이션명: add_plm_rename_product_type_rpc
create or replace function public.plm_rename_product_type(p_id uuid, p_new_name text)
returns table(renamed_formula_count integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_old_name text;
  v_new_name text := trim(p_new_name);
  v_count integer;
begin
  if not public.plm_has_role(array['Admin','Researcher']) then
    raise exception 'permission denied';
  end if;

  if v_new_name = '' then
    raise exception '이름을 입력해주세요';
  end if;

  select name into v_old_name from public.plm_product_types where id = p_id;
  if v_old_name is null then
    raise exception '해당 제품유형을 찾을 수 없습니다';
  end if;

  if v_old_name = v_new_name then
    return query select 0;
    return;
  end if;

  -- 대소문자/앞뒤 공백만 다른 이름은 같은 값으로 취급(plm_product_types_name_unique와 동일 기준)해서
  -- 중복 생성을 막는다.
  if exists (
    select 1 from public.plm_product_types
    where id <> p_id and lower(trim(name)) = lower(v_new_name)
  ) then
    raise exception '이미 같은 이름의 제품유형이 있습니다';
  end if;

  update public.plm_product_types set name = v_new_name where id = p_id;

  update public.plm_formulas set product_type = v_new_name where product_type = v_old_name;
  get diagnostics v_count = row_count;

  return query select v_count;
end;
$function$;

revoke all on function public.plm_rename_product_type(uuid, text) from public;
-- Supabase는 anon에게 EXECUTE를 직접 부여하므로 public revoke만으로는 빠지지 않는다 - 명시적으로 회수.
revoke execute on function public.plm_rename_product_type(uuid, text) from anon;
grant execute on function public.plm_rename_product_type(uuid, text) to authenticated;
