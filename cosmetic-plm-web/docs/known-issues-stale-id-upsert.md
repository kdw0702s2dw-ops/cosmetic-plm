# 알려진 이슈: upsert에 select("*")로 불러온 stale id가 실려가는 버그 (2026-07-15)

## 버그 패턴
1. 기존 행을 "열기"로 불러올 때 `select("*")` 결과를 `{...emptyState, ...row}` 형태로 그대로 상태에 넣는다 (TS 타입엔 `id`가 없어도 런타임엔 붙어 있음).
2. 화면에서 business key(예: `formula_code`, `revision`, `raw_code`)를 사용자가 수정한다.
3. 저장 시 `payload = {...state, ...}`를 그대로 `.upsert(payload, { onConflict: "<business key>" })`에 넘긴다. `id`가 함께 실려가고, `onConflict`엔 `id`가 없다.
4. 바뀐 business key 조합이 기존 행과 안 겹치면 Postgres가 새 INSERT를 시도하는데, 이때 stale `id`가 이미 다른 행의 PK라서 `23505`(duplicate key on pkey) 에러가 난다.

## 이미 수정 완료
- `services/sprint1/formulaCoreService.ts` — `upsertSprint1Formula()`, `upsertSprint1FormulaLines()` (둘 다 payload에서 `id` 제거하도록 수정, 2026-07-15)

## 같은 패턴이 남아있지만 현재 내비게이션(app/enterprise 8개 탭)에서 도달 불가능한 레거시 파일들
아래 파일들은 `/enterprise-v5*`, `/enterprise-v6*`, `/enterprise-gold-*` 같은 별도 라우트에서만 쓰이고, 지금 실제로 쓰는 화면과는 연결돼 있지 않아 이번엔 손대지 않았다. 해당 라우트를 다시 활성 내비게이션에 연결하게 되면 아래 파일들도 같은 방식(id 분리/제거)으로 고쳐야 한다.

- `services/enterprise-v60/operationalCoreService.ts` — `upsertRawMaterial` (`onConflict: "raw_code"`)
- `services/gold-formula-live/formulaLiveCrudService.ts` — `saveHeader`/`saveLine` (`onConflict: "formula_code,revision"` / `"formula_code,revision,line_no"`)
- `services/gold-formula/formulaSchemaService.ts` — 헤더/라인 upsert (`onConflict: "formula_code,revision"` / `"formula_code,revision,line_no"`)
- `services/database-live/rawMaterialLiveService.ts` — (`onConflict: "raw_code"`)
- `services/sprint2/rawMaterialCoreService.ts` — 이 파일을 감싸는 `hooks/useSprint2RawMaterialCore.ts`는 현재 어디서도 import되지 않는 죽은 코드라 실질적 위험은 없음. 나중에 다시 연결한다면 같이 확인 필요.

## 확인해서 안전하다고 판단한 파일들 (참고용)
- `services/sprint2/rawMaterialService.ts` (`saveRawMaterial`) — `rm.id`가 있으면 `.update().eq("id", rm.id)`, 없으면 `.upsert()`로 명확히 분기해서 애초에 이 버그 패턴에 안 걸림.
- `services/sprint2/ingredientDictionaryService.ts` (`saveIngredient`) — payload를 필드별로 명시적으로만 구성해서 `id`가 아예 안 들어감.
- `services/sprint1/formulaCoreService.ts` (`saveProductionBomRows`) — delete-then-insert 패턴이라 upsert/onConflict 자체를 안 씀.
- `app/api/admin/users/route.ts` — 방금 새로 만든 auth 계정의 fresh id만 upsert에 씀 (stale id 아님).
