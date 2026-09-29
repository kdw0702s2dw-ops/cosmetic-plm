-- create_plm_system_updates.sql의 테이블 코멘트가 "2일"로 남아있었는데, 표시 기간이 3일로 바뀌면서
-- (services/home/systemUpdateService.ts의 SYSTEM_UPDATE_VISIBLE_DAYS) 실제 동작과 어긋나게 됐다.
-- 원래 마이그레이션 파일은 이력 기록이라 그대로 두고, 라이브 DB의 테이블 코멘트만 현재 값에 맞게 갱신한다.
comment on table public.plm_system_updates is '연구원 홈에 표시되는 "시스템 업데이트" 안내 - 등록 후 3일이 지나면 화면에서 자동으로 사라진다(조회 시 created_at 기준으로 필터링, 행 자체는 삭제하지 않음). 표시 기간은 services/home/systemUpdateService.ts의 SYSTEM_UPDATE_VISIBLE_DAYS 상수로 관리됨.';
