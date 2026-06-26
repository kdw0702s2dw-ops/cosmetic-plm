import type { GoLiveChecklistItem, GoLiveDataSeedItem, GoLiveIssueItem, GoLiveQuickStartItem } from "@/types/goLiveFinal";

export function getGoLiveChecklist(): GoLiveChecklistItem[] {
  return [
    { id: "GL-001", area: "Build", task: "npm run build 성공 확인", status: "PASS", owner: "Admin", action: "빌드 성공 화면 확인" },
    { id: "GL-002", area: "Deploy", task: "Vercel 자동 배포 확인", status: "PASS", owner: "Admin", action: "git push 후 배포 완료 확인" },
    { id: "GL-003", area: "Database", task: "Supabase migration 실행 완료", status: "PASS", owner: "Admin", action: "SQL Editor 실행 완료 여부 확인" },
    { id: "GL-004", area: "Login", task: "사용자 로그인 및 권한 확인", status: "WATCH", owner: "Admin", action: "R&D/QA/RA/QC 계정별 접근 확인" },
    { id: "GL-005", area: "CRUD", task: "원료/처방 실제 저장 테스트", status: "WATCH", owner: "R&D", action: "원료 1건, 처방 1건 입력 후 새로고침" },
    { id: "GL-006", area: "Document", task: "처방서/전성분표 출력 확인", status: "WATCH", owner: "QA", action: "Production Final에서 Generate 실행" },
    { id: "GL-007", area: "AI", task: "AI Copilot 명령 실행 확인", status: "WATCH", owner: "R&D", action: "세라마이드 크림 명령 실행" },
    { id: "GL-008", area: "Backup", task: "운영 데이터 백업 준비", status: "PASS", owner: "Admin", action: "Supabase 백업 정책 확인" },
    { id: "GL-009", area: "User", task: "출근 후 사용 URL 공유", status: "PASS", owner: "Admin", action: "/enterprise-production-final 즐겨찾기" },
  ];
}

export function getGoLiveQuickStart(): GoLiveQuickStartItem[] {
  return [
    { id: "QS-001", order: 1, title: "운영 대시보드 접속", description: "최종 운영 화면에서 전체 상태를 확인합니다.", url: "/enterprise-production-final" },
    { id: "QS-002", order: 2, title: "Go-Live 체크", description: "빌드, 배포, DB, 로그인, CRUD 상태를 확인합니다.", url: "/enterprise-go-live" },
    { id: "QS-003", order: 3, title: "원료마스터 입력", description: "원료명, INCI, CAS, EC, 공급사를 우선 입력합니다.", url: "/enterprise-production-final" },
    { id: "QS-004", order: 4, title: "처방 작성/계산", description: "처방 함량, 원가, Breakdown, 전성분을 계산합니다.", url: "/enterprise" },
    { id: "QS-005", order: 5, title: "문서 생성", description: "처방서, 원료조성표, 전성분표, 고객요약을 생성합니다.", url: "/enterprise-production-final" },
    { id: "QS-006", order: 6, title: "AI Copilot 실행", description: "자연어 명령으로 개선안과 출시 가능성을 확인합니다.", url: "/enterprise-production-final" },
  ];
}

export function getGoLiveDataSeeds(): GoLiveDataSeedItem[] {
  return [
    { id: "SEED-001", dataDomain: "Raw Material", priority: "P0", minimumRows: 20, status: "NEEDS_INPUT" },
    { id: "SEED-002", dataDomain: "INCI", priority: "P0", minimumRows: 50, status: "NEEDS_INPUT" },
    { id: "SEED-003", dataDomain: "Formula", priority: "P0", minimumRows: 3, status: "NEEDS_INPUT" },
    { id: "SEED-004", dataDomain: "Regulation", priority: "P1", minimumRows: 30, status: "NEEDS_INPUT" },
    { id: "SEED-005", dataDomain: "Supplier", priority: "P1", minimumRows: 5, status: "NEEDS_INPUT" },
    { id: "SEED-006", dataDomain: "Customer", priority: "P2", minimumRows: 3, status: "NEEDS_INPUT" },
    { id: "SEED-007", dataDomain: "LIMS", priority: "P2", minimumRows: 10, status: "READY" },
    { id: "SEED-008", dataDomain: "Document", priority: "P1", minimumRows: 5, status: "READY" },
  ];
}

export function getGoLiveIssues(): GoLiveIssueItem[] {
  return [
    { id: "ISS-001", issue: "실제 데이터가 부족하면 AI 추천 정확도가 낮을 수 있음", severity: "MEDIUM", workaround: "원료/INCI/처방 데이터를 먼저 입력", status: "OPEN" },
    { id: "ISS-002", issue: "권한별 세부 접근제어는 운영 중 추가 조정 필요", severity: "LOW", workaround: "Admin 계정으로 시작 후 역할별 테스트", status: "OPEN" },
    { id: "ISS-003", issue: "대량 데이터 입력 전 검색 속도 확인 필요", severity: "LOW", workaround: "초기에는 핵심 원료부터 입력", status: "OPEN" },
  ];
}

export function getGoLiveDecision(pass: number, block: number) {
  if (block > 0) return "HOLD";
  if (pass >= 7) return "GO";
  return "WATCH";
}
