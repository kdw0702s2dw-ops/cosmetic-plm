<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 화장품 PLM (cosmetic-plm)

Next.js 16 (App Router) + Supabase 기반 화장품 PLM 웹앱. 배포: Vercel (cosmetic-plm.vercel.app), 메인 화면은 `/enterprise` 라우트.

## 스택 / 명령어
- `npm run dev` / `npm run build` / `npm run lint` (eslint), 타입체크는 `npx tsc --noEmit`
- Supabase 프로젝트 ref: `ztzitdhngdtfwmfqusbb` (region ap-northeast-1). 클라이언트는 `lib/supabaseProductionFinalClient.ts` 등 `lib/supabase*.ts` 여러 개 존재 — 화면별로 다른 클라이언트를 쓰는 경우가 있으니 어떤 걸 쓰는지 확인 후 수정.

## 핵심 화면 구조 (`/enterprise`)
- `components/sprint1/EnterpriseSprint1Workspace.tsx` — 사이드바/탭 셸. 역할별로 보이는 메뉴가 다르면 여기서 필터링.
- `hooks/useSprint1Auth.ts` + `services/sprint1/authRbacService.ts` — 로그인 세션, 현재 사용자 role, 권한 판별 함수(`canView`, `canWriteFormula`, `canWriteMaterials`, `canManageUsers`, `canExportData`, `isProductionRole` 등)가 여기 모여있음. **역할(role)을 추가/변경할 때는 반드시 이 파일부터 확인.**
- `components/sprint1/UserAdminPanel.tsx` — 사용자 권한관리 화면 (Admin 전용, "사용자 추가" 폼의 역할 드롭다운 `roles` 배열).
- `app/api/admin/users/route.ts` — 사용자 생성/삭제 서버 API. `ALLOWED_ROLES` 배열이 `authRbacService.ts`의 `PlmRole`과 반드시 동기화되어 있어야 함 (안 맞으면 계정 생성 시 400 에러).
- `components/sprint2/MaterialManager.tsx` (부자재관리), `components/sprint2/RawMaterialManager.tsx` (원료관리), `components/sprint2/ProductionManagementPanel.tsx` (생산관리) 등 도메인별 화면은 `components/sprint2/`.

## 역할(Role) / 권한 모델
- 역할: `Admin`, `Researcher`, `QA`, `Viewer`, `Production` (plm_user_profiles.role, DB에 CHECK 제약 있음).
- **이중 방어**: 권한은 (1) 프론트엔드에서 버튼/탭 숨김, (2) Supabase RLS 정책에서 실제 쓰기 차단, 두 군데 모두 맞춰야 함. 프론트만 고치고 RLS를 안 고치면 버튼은 안 보여도 다른 경로(직접 API 호출 등)로 뚫릴 수 있고, RLS만 고치면 화면에 에러만 뜨고 UX가 나쁨.
- RLS 정책은 테이블별로 `<table>_read` (SELECT), `<table>_write` (ALL) 두 개 policy 쌍으로 되어 있고 `plm_has_role(text[])` 함수로 role을 체크하는 패턴이 `plm_*` 테이블 전반에 일관되게 적용돼 있음. 새 role 추가 시 이 패턴을 따라 Supabase MCP(`apply_migration`)로 적용.
- Production 역할: 부자재관리·원료관리·생산관리 탭만 보임, 부자재/원료는 열람 전용(생성/수정/삭제 버튼 숨김 + RLS도 read-only), 생산관리는 읽기/쓰기 모두 허용.

## 작업 시 주의
- 로컬 저장소 인코딩은 LF(유닉스 개행)로 통일되어 있음. 파일 저장 도구에 따라 CRLF로 바뀌면 git diff가 파일 전체를 바꾼 것처럼 나오니, 커밋 전에 `git diff --stat`으로 변경 범위가 의도한 줄만 포함하는지 확인.
- `backups/`, `seed-data/` 밑 CSV는 실제 데이터 백업/시드 파일이므로 임의로 덮어쓰지 말 것.
