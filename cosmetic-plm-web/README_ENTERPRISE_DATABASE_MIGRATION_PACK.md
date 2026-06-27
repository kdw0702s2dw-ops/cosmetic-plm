# Enterprise Production Database Migration Pack

목적:
- 더미 데이터가 아닌 Supabase 실제 DB 기반 원료마스터 화면 제공
- `/enterprise-db-live` 신규 화면 추가
- enterprise_raw_material_master 10,000개 데이터 조회/검색/수정/삭제 가능

추가 화면:
- /enterprise-db-live

포함 파일:
- app/enterprise-db-live/page.tsx
- components/enterprise-db-live/*
- hooks/useRawMaterialsLive.ts
- hooks/useDatabaseHealthLive.ts
- services/database-live/*
- lib/supabaseBrowserClient.ts
- types/databaseLive.ts
- supabase/migrations/enterprise_database_live_support.sql

적용 방법:
1. 압축 해제
2. cosmetic-plm-web 폴더에 그대로 덮어쓰기
3. Supabase SQL Editor에서 실행:
   supabase/migrations/enterprise_database_live_support.sql
4. npm run build
5. git add .
6. git commit -m "add enterprise production database migration pack"
7. git push

확인 방법:
- 로컬: http://localhost:3000/enterprise-db-live
- 배포: https://도메인/enterprise-db-live
- 검색창에 RM-05000 또는 글리세린 입력
