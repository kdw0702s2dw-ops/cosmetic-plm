-- plm_bulk_update_raw_prices는 SECURITY DEFINER라 RLS(plm_raw_materials_write: Admin/Researcher만 쓰기 허용)를
-- 우회한다. 기존에는 "활성 사용자인지"만 확인해서 QA/Viewer/Production 역할도 이 함수를 직접 호출하면
-- 원료 단가를 수정할 수 있는 구멍이 있었다(현재 화면에서는 이 함수를 호출하는 곳이 없어 실사용 영향은
-- 없음). plm_raw_materials 테이블의 쓰기 RLS 정책과 동일한 기준(Admin, Researcher만 허용)으로 맞춘다.
-- plm_has_role()이 내부적으로 plm_current_user_role()을 통해 is_active=true까지 확인하므로 기존 활성
-- 사용자 체크를 대체할 수 있다.
create or replace function public.plm_bulk_update_raw_prices(p_rows jsonb)
returns table(raw_code text, updated boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.plm_has_role(array['Admin','Researcher']) then
    raise exception 'permission denied';
  end if;

  return query
  with input as (
    select
      (x->>'raw_code')::text as raw_code,
      (x->>'unit_price')::numeric as unit_price
    from jsonb_array_elements(p_rows) as x
  ),
  upd as (
    update public.plm_raw_materials m
    set unit_price = input.unit_price,
        updated_at = now()
    from input
    where m.raw_code = input.raw_code
    returning m.raw_code
  )
  select input.raw_code, (input.raw_code in (select upd.raw_code from upd)) as updated
  from input;
end;
$function$;
