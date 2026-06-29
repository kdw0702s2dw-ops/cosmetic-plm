# Enterprise PLM Login Diagnostic Stabilization Pack

목적:
- 로그인 실패 원문을 화면에 표시
- 잘못된 기본 이메일 수정
- 관리자 이메일을 `kdw0702s2dw@gmail.com`으로 고정
- app/page.tsx 중복 함수 오류 방지
- 로그인 진단 버튼 추가

적용:
1. 압축 해제
2. cosmetic-plm-web 폴더에 덮어쓰기
3. Supabase SQL Editor에서 실행:
   supabase/migrations/enterprise_plm_login_diagnostic_stabilization.sql
4. npm run build
5. git add .
6. git commit -m "stabilize login diagnostics"
7. git push

로그인 확정 절차:
1. Supabase → Authentication → Users
2. `kdw0702s2dw@gmail.com` 클릭
3. Change Password로 새 비밀번호 지정
4. /login에서 같은 이메일과 새 비밀번호 입력
5. 실패 시 화면에 표시되는 원문 오류를 확인
