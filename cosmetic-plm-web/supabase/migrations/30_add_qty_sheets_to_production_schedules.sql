-- 생산_일정관리: "수량(kg)"을 "목표 제조량(kg)"으로 이름을 바꾸고, 장(장수) 단위 목표 생산 수량
-- "생산량/장" 입력 칸을 추가한다. quantity(kg)와는 별개 값이며 선택 입력(nullable).
-- 원격 적용 마이그레이션명: add_qty_sheets_to_production_schedules
ALTER TABLE plm_production_schedules ADD COLUMN qty_sheets numeric;
