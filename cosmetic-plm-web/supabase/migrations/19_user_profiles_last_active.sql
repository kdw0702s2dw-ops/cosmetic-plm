-- 사용자 권한관리 화면의 "마지막 접속"이 Supabase Auth의 last_sign_in_at(=마지막으로 비밀번호를 다시 입력해
-- 로그인한 시각)만 보여주고 있었는데, 이 앱은 세션이 브라우저에 계속 유지/자동갱신되는 방식이라 매일 실제로
-- 쓰고 있어도 재로그인 이벤트 자체는 오래전에 한 번만 발생했을 수 있다(실제로 관리자 본인 계정도 last_sign_in_at은
-- 2주 전으로 찍혀있었음). "이 계정이 최근에 실제로 쓰이고 있는지" 확인하려는 관리자 목적에는 맞지 않는 지표였다.
-- 그래서 별도로 "마지막 활동" 시각을 직접 기록하는 컬럼 + 함수를 추가한다. 기존 last_sign_in_at 표시는
-- "마지막 로그인"으로 이름만 바꿔 그대로 남기고, 이 값을 나란히 보여준다.

alter table public.plm_user_profiles add column if not exists last_active_at timestamptz;

-- 로그인한 본인의 last_active_at만 갱신 가능. plm_user_profiles의 일반 UPDATE는 Admin만 가능하도록 RLS가
-- 막혀있어서(plm_user_profiles_update_admin), 일반 사용자가 role/is_active 등 다른 컬럼을 건드릴 수 없도록
-- RLS를 완화하는 대신 딱 이 용도로만 동작하는 좁은 SECURITY DEFINER 함수를 둔다.
create or replace function public.plm_touch_last_active()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.plm_user_profiles set last_active_at = now() where id = auth.uid();
end;
$function$;

revoke all on function public.plm_touch_last_active() from public;
revoke all on function public.plm_touch_last_active() from anon;
grant execute on function public.plm_touch_last_active() to authenticated;
