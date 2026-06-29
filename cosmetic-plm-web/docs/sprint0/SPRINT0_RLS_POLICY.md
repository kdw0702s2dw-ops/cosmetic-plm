# Sprint 0 RLS 정책

## 역할
- Admin: 전체 권한
- Researcher: 원료/처방 등록·수정·조회
- QA: 문서/검토 조회 및 승인 관련 작업
- Viewer: 조회만

## 원칙
신규 표준 테이블은 `authenticated 전체 허용`을 사용하지 않습니다.
`plm_user_profiles.role` 기반으로 접근합니다.
