# Sprint 1-3 로그인/권한 적용

## 적용 기능
- `/login` 로그인 화면
- `/enterprise` 접근 시 로그인 필수
- `plm_user_profiles` 기반 역할 관리
- 역할: Admin / Researcher / QA / Viewer
- Admin 전용 사용자 권한관리
- 로그아웃

## 관리자 계정 생성
1. Supabase Authentication → Users에서 이메일/비밀번호 계정 생성
2. 해당 계정으로 `/login`에서 1회 로그인
3. SQL Editor에서 아래 실행:

```sql
update public.plm_user_profiles
set role='Admin'
where email='관리자이메일@example.com';
```

4. 다시 로그인하면 `/enterprise`에서 사용자 권한관리 메뉴가 보입니다.

## 주의
- 최초 로그인 계정은 기본 Researcher입니다.
- Admin 승격 전에는 사용자 관리 메뉴가 보이지 않습니다.
