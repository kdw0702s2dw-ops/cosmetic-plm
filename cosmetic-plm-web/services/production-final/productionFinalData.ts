import type { ProductionFinalData } from "@/types/enterpriseProductionFinal";

export function getInitialProductionFinalData(): ProductionFinalData {
  return {
    crud: [
      { id: "CRUD-001", module: "Formula", tableName: "enterprise_formula_master", crudStatus: "LIVE", operations: "LOAD / INSERT / UPDATE / DELETE / UPSERT", persistence: "Supabase DB", audit: "ON", nextAction: "실제 처방 1건 입력 후 새로고침 유지 확인" },
      { id: "CRUD-002", module: "Ingredient", tableName: "enterprise_raw_material_master / enterprise_inci_master", crudStatus: "LIVE", operations: "LOAD / INSERT / UPDATE / DELETE / UPSERT", persistence: "Supabase DB", audit: "ON", nextAction: "원료명, INCI, CAS, EC 실제 데이터 입력" },
      { id: "CRUD-003", module: "Supplier", tableName: "enterprise_suppliers", crudStatus: "READY", operations: "LOAD / INSERT / UPDATE / DELETE", persistence: "Supabase DB", audit: "ON", nextAction: "공급사 실제 데이터 입력" },
      { id: "CRUD-004", module: "Customer", tableName: "enterprise_customers", crudStatus: "READY", operations: "LOAD / INSERT / UPDATE / DELETE", persistence: "Supabase DB", audit: "ON", nextAction: "고객사 실제 데이터 입력" },
      { id: "CRUD-005", module: "Workflow", tableName: "enterprise_workflow_instances", crudStatus: "READY", operations: "CREATE / APPROVE / REJECT / HISTORY", persistence: "Supabase DB", audit: "ON", nextAction: "R&D → RA → QA 승인 흐름 테스트" },
      { id: "CRUD-006", module: "Approval", tableName: "enterprise_approval_tasks", crudStatus: "READY", operations: "APPROVE / REJECT / DELEGATE", persistence: "Supabase DB", audit: "ON", nextAction: "승인자별 권한 확인" },
      { id: "CRUD-007", module: "Document", tableName: "enterprise_live_documents", crudStatus: "LIVE", operations: "CREATE / REVIEW / APPROVE / LOCK", persistence: "Supabase DB", audit: "ON", nextAction: "문서 승인 후 잠금 테스트" },
      { id: "CRUD-008", module: "Regulation", tableName: "enterprise_regulation_rules", crudStatus: "LIVE", operations: "LOAD / INSERT / UPDATE / DELETE", persistence: "Supabase DB", audit: "ON", nextAction: "KR/EU/CN/US/JP 규제룰 입력" },
      { id: "CRUD-009", module: "QMS", tableName: "enterprise_qms_items", crudStatus: "READY", operations: "CAPA / OOS / Change Control", persistence: "Supabase DB", audit: "ON", nextAction: "실제 QA 이슈 등록 테스트" },
      { id: "CRUD-010", module: "LIMS", tableName: "enterprise_lims_samples", crudStatus: "READY", operations: "Sample / Test / Result / Approval", persistence: "Supabase DB", audit: "ON", nextAction: "시험항목과 결과 입력 테스트" },
    ],
    documents: [
      { id: "DOC-001", documentType: "Formula Sheet", format: "EXCEL", source: "Formula", status: "READY", fileName: "formula_sheet_production.xlsx" },
      { id: "DOC-002", documentType: "Ingredient Composition", format: "EXCEL", source: "Ingredient", status: "READY", fileName: "ingredient_composition_production.xlsx" },
      { id: "DOC-003", documentType: "Full Ingredient List", format: "EXCEL", source: "Formula", status: "READY", fileName: "full_ingredient_list_production.xlsx" },
      { id: "DOC-004", documentType: "Product Specification", format: "WORD", source: "Document", status: "READY", fileName: "product_specification_production.docx" },
      { id: "DOC-005", documentType: "Test Request", format: "EXCEL", source: "LIMS", status: "READY", fileName: "test_request_production.xlsx" },
      { id: "DOC-006", documentType: "COA", format: "PDF", source: "LIMS", status: "NEEDS_REVIEW", fileName: "coa_production.pdf" },
      { id: "DOC-007", documentType: "MSDS", format: "PDF", source: "Regulation", status: "NEEDS_REVIEW", fileName: "msds_production.pdf" },
      { id: "DOC-008", documentType: "Customer Summary", format: "PDF", source: "Document", status: "READY", fileName: "customer_summary_production.pdf" },
    ],
    ai: [
      { id: "AI-001", command: "미국 수출용 세라마이드 크림 만들어줘", workflow: "Formula → Ingredient → Cost → Regulation → Document → Workflow", status: "READY", confidence: 86 },
      { id: "AI-002", command: "원가를 10% 낮춰줘", workflow: "Cost → Supplier Alternative → Formula Optimization", status: "READY", confidence: 78 },
      { id: "AI-003", command: "전성분과 규제 위험 확인해줘", workflow: "Ingredient List → Regulation Engine → RA Action", status: "READY", confidence: 84 },
      { id: "AI-004", command: "고객 제출 자료 만들어줘", workflow: "Document Generator → Approval → Export", status: "READY", confidence: 82 },
      { id: "AI-005", command: "출시 가능성 판단해줘", workflow: "AI Brain → Launch Gate → Executive Summary", status: "READY", confidence: 83 },
    ],
    health: [
      { id: "H-001", area: "Build", status: "GOOD", message: "Production Final 구조는 별도 route와 모듈로 분리되어 빌드 충돌 위험을 줄였습니다.", action: "npm run build 최종 확인" },
      { id: "H-002", area: "Deploy", status: "GOOD", message: "Vercel 24시간 배포 구조를 유지합니다.", action: "git push 후 배포 완료 확인" },
      { id: "H-003", area: "Database", status: "WATCH", message: "실제 데이터 입력 후 CRUD 동작 확인이 필요합니다.", action: "원료/처방/규제 데이터부터 입력" },
      { id: "H-004", area: "Security", status: "WATCH", message: "공개된 Anon Key는 교체를 권장합니다.", action: "Supabase Key 교체 후 Vercel 환경변수 업데이트" },
      { id: "H-005", area: "Backup", status: "GOOD", message: "백업/모니터링 구조는 준비되어 있습니다.", action: "실제 데이터 입력 후 주기 백업 점검" },
      { id: "H-006", area: "Performance", status: "GOOD", message: "신규 Production Final 화면은 모듈 분리형입니다.", action: "기존 page.tsx는 추후 단계적으로 슬림화" },
      { id: "H-007", area: "Permission", status: "WATCH", message: "세부 권한은 운영 중 역할별로 조정이 필요합니다.", action: "Admin에서 R&D/QA/RA/QC 권한 확인" },
      { id: "H-008", area: "User Readiness", status: "GOOD", message: "출근 직후 업무 시작 가능한 Production Dashboard입니다.", action: "즐겨찾기 등록 후 실사용 시작" },
    ],
  };
}

export function getReadinessScore(data: ProductionFinalData) {
  const total =
    data.crud.length +
    data.documents.length +
    data.ai.length +
    data.health.length;

  const good =
    data.crud.filter((x) => x.crudStatus === "LIVE" || x.crudStatus === "READY").length +
    data.documents.filter((x) => x.status === "READY" || x.status === "GENERATED").length +
    data.ai.filter((x) => x.status === "READY" || x.status === "EXECUTED").length +
    data.health.filter((x) => x.status === "GOOD" || x.status === "WATCH").length;

  return Math.round((good / Math.max(total, 1)) * 100);
}
