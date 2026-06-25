"use client";

import { useMemo, useState } from "react";

type ProjectStatus = "개발중" | "샘플발송" | "양산승인" | "출시" | "보류";
type FormulaStatus = "Draft" | "Review" | "Approved" | "Released" | "Locked";
type ModuleKey =
  | "overview"
  | "project"
  | "formula"
  | "ingredient"
  | "ai"
  | "quality"
  | "regulation"
  | "customer"
  | "supplier"
  | "admin";

type EnterpriseProject = {
  id: string;
  project_code: string;
  customer_name: string;
  project_name: string;
  researcher: string;
  status: ProjectStatus;
  progress: number;
  launch_target: string;
  memo: string;
};

type EnterpriseFormula = {
  id: string;
  formula_code: string;
  formula_name: string;
  version: string;
  project_code: string;
  status: FormulaStatus;
  total_percent: number;
  material_cost: number;
  is_locked: boolean;
  revision_note: string;
};

type EnterpriseIngredient = {
  id: string;
  inci_name: string;
  korean_name: string;
  cas_no: string;
  ec_no: string;
  function_ko: string;
  function_en: string;
  eu_status: string;
  china_status: string;
  ewg_grade: string;
  source: string;
};

type EnterpriseRawMaterial = {
  id: string;
  raw_code: string;
  raw_name: string;
  supplier: string;
  unit_price: number;
  main_inci: string;
  composition_total: number;
};

type AiAnalysisResult = {
  formula_concept: string;
  target_countries: string;
  target_cost: number;
  suggested_formula_type: string;
  expected_cost: number;
  regulation_risk: "LOW" | "MEDIUM" | "HIGH";
  stability_risk: "LOW" | "MEDIUM" | "HIGH";
  claim_score: number;
  recommended_ingredients: string[];
  warnings: string[];
  next_actions: string[];
};

type QualityDocument = {
  id: string;
  raw_code: string;
  raw_name: string;
  supplier: string;
  document_type: string;
  document_title: string;
  expiry_date: string;
  status: "OK" | "EXPIRING" | "EXPIRED" | "MISSING";
};

type StabilityRecord = {
  id: string;
  formula_code: string;
  condition: string;
  week: string;
  result: "PASS" | "WATCH" | "FAIL";
  finding: string;
};

type ApprovalRecord = {
  id: string;
  target: string;
  type: "Formula" | "Document" | "Launch";
  requester: string;
  approver: string;
  status: "Requested" | "Approved" | "Rejected";
};

type RegulationRecord = {
  id: string;
  country_code: string;
  inci_name: string;
  cas_no: string;
  regulation_type: "Allowed" | "Restricted" | "Prohibited" | "Warning";
  max_percent: number;
  note: string;
  source: string;
};

type RegulationImpact = {
  formula_code: string;
  country_code: string;
  ingredient: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  issue: string;
  action: string;
};

type CustomerPortalItem = {
  id: string;
  customer_name: string;
  project_code: string;
  project_name: string;
  current_status: string;
  sample_status: "Not Sent" | "Sent" | "Feedback Received" | "Approved";
  submission_status: "Not Prepared" | "Prepared" | "Sent" | "Approved";
  visible_to_customer: boolean;
  last_update: string;
};

type SampleFeedback = {
  id: string;
  sample_no: string;
  customer_name: string;
  project_code: string;
  formula_code: string;
  sent_date: string;
  quantity: string;
  feedback: string;
  status: "Sent" | "Feedback Received" | "Revision Needed" | "Approved";
};

type SupplierPortalTask = {
  id: string;
  supplier: string;
  raw_code: string;
  raw_name: string;
  required_document: string;
  request_status: "Not Requested" | "Requested" | "Received" | "Overdue";
  due_date: string;
  contact_email: string;
  memo: string;
};

type SupplierScoreCard = {
  supplier: string;
  document_score: number;
  price_score: number;
  response_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  note: string;
};

type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  role: "manager" | "senior" | "researcher" | "qa" | "ra" | "viewer" | "supplier" | "customer";
  is_active: boolean;
  last_login: string;
};

type AdminAudit = {
  id: string;
  actor: string;
  action: string;
  module: string;
  target: string;
  created_at: string;
};

type SystemHealthItem = {
  category: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
  action: string;
};

type EnterpriseKpi = {
  label: string;
  value: string | number;
  status: "GOOD" | "WATCH" | "RISK";
  note: string;
};

type LaunchGateItem = {
  category: string;
  status: "PASS" | "PENDING" | "BLOCK";
  owner: string;
  detail: string;
  action: string;
};

const menus: { key: ModuleKey; label: string }[] = [
  { key: "overview", label: "Enterprise Overview" },
  { key: "project", label: "Project Module" },
  { key: "formula", label: "Formula Module" },
  { key: "ingredient", label: "Ingredient Module" },
  { key: "ai", label: "AI Module" },
  { key: "quality", label: "Quality Module" },
  { key: "regulation", label: "Regulation Module" },
  { key: "customer", label: "Customer Module" },
  { key: "supplier", label: "Supplier Module" },
  { key: "admin", label: "Admin Module" },
];

const initialProjects: EnterpriseProject[] = [
  {
    id: "P-001",
    project_code: "26A001",
    customer_name: "ABC 브랜드",
    project_name: "고보습 비건 크림",
    researcher: "홍길동",
    status: "개발중",
    progress: 35,
    launch_target: "2026-08-30",
    memo: "1차 제형 개발 중",
  },
  {
    id: "P-002",
    project_code: "26A002",
    customer_name: "DEF 코스메틱",
    project_name: "저자극 장벽 세럼",
    researcher: "김동욱",
    status: "샘플발송",
    progress: 55,
    launch_target: "2026-09-15",
    memo: "2차 샘플 피드백 대기",
  },
];

const initialFormulas: EnterpriseFormula[] = [
  {
    id: "F-001",
    formula_code: "FC-001",
    formula_name: "고보습 비건 크림 1차",
    version: "1.0",
    project_code: "26A001",
    status: "Draft",
    total_percent: 100,
    material_cost: 4280,
    is_locked: false,
    revision_note: "초기 처방",
  },
  {
    id: "F-002",
    formula_code: "FC-002",
    formula_name: "저자극 장벽 세럼 2차",
    version: "2.0",
    project_code: "26A002",
    status: "Review",
    total_percent: 100,
    material_cost: 5150,
    is_locked: false,
    revision_note: "고객 피드백 반영",
  },
];

const initialIngredients: EnterpriseIngredient[] = [
  {
    id: "I-001",
    inci_name: "Glycerin",
    korean_name: "글리세린",
    cas_no: "56-81-5",
    ec_no: "200-289-5",
    function_ko: "보습제",
    function_en: "Humectant",
    eu_status: "Allowed",
    china_status: "Listed",
    ewg_grade: "1",
    source: "Seed DB",
  },
  {
    id: "I-002",
    inci_name: "Niacinamide",
    korean_name: "나이아신아마이드",
    cas_no: "98-92-0",
    ec_no: "202-713-4",
    function_ko: "미백/피부컨디셔닝",
    function_en: "Skin Conditioning",
    eu_status: "Allowed",
    china_status: "Listed",
    ewg_grade: "1",
    source: "Seed DB",
  },
  {
    id: "I-003",
    inci_name: "Panthenol",
    korean_name: "판테놀",
    cas_no: "81-13-0",
    ec_no: "201-327-3",
    function_ko: "보습/진정",
    function_en: "Humectant",
    eu_status: "Allowed",
    china_status: "Listed",
    ewg_grade: "1",
    source: "Seed DB",
  },
  {
    id: "I-004",
    inci_name: "Phenoxyethanol",
    korean_name: "페녹시에탄올",
    cas_no: "122-99-6",
    ec_no: "204-589-7",
    function_ko: "보존제",
    function_en: "Preservative",
    eu_status: "Restricted 1%",
    china_status: "Listed",
    ewg_grade: "2-4",
    source: "Regulation DB",
  },
];

const initialRawMaterials: EnterpriseRawMaterial[] = [
  {
    id: "R-001",
    raw_code: "RM-001",
    raw_name: "Glycerin 99.5%",
    supplier: "A Supplier",
    unit_price: 1800,
    main_inci: "Glycerin",
    composition_total: 100,
  },
  {
    id: "R-002",
    raw_code: "RM-002",
    raw_name: "Niacinamide USP",
    supplier: "B Supplier",
    unit_price: 12500,
    main_inci: "Niacinamide",
    composition_total: 100,
  },
  {
    id: "R-003",
    raw_code: "RM-003",
    raw_name: "Panthenol 75%",
    supplier: "C Supplier",
    unit_price: 22000,
    main_inci: "Panthenol",
    composition_total: 75,
  },
];

const initialQualityDocuments: QualityDocument[] = [
  {
    id: "QD-001",
    raw_code: "RM-001",
    raw_name: "Glycerin 99.5%",
    supplier: "A Supplier",
    document_type: "MSDS",
    document_title: "MSDS 2026",
    expiry_date: "2027-01-01",
    status: "OK",
  },
  {
    id: "QD-002",
    raw_code: "RM-002",
    raw_name: "Niacinamide USP",
    supplier: "B Supplier",
    document_type: "COA",
    document_title: "COA Lot 2026-01",
    expiry_date: "2026-07-30",
    status: "EXPIRING",
  },
];

const initialStabilityRecords: StabilityRecord[] = [
  {
    id: "ST-001",
    formula_code: "FC-001",
    condition: "45℃",
    week: "4W",
    result: "PASS",
    finding: "색/취/점도 특이사항 없음",
  },
  {
    id: "ST-002",
    formula_code: "FC-002",
    condition: "Cycle",
    week: "2W",
    result: "WATCH",
    finding: "점도 8% 감소, 추가 관찰 필요",
  },
];

const initialApprovals: ApprovalRecord[] = [
  {
    id: "AP-001",
    target: "FC-002 v2.0",
    type: "Formula",
    requester: "연구팀",
    approver: "QA Manager",
    status: "Requested",
  },
];

const initialRegulations: RegulationRecord[] = [
  {
    id: "REG-001",
    country_code: "EU",
    inci_name: "Phenoxyethanol",
    cas_no: "122-99-6",
    regulation_type: "Restricted",
    max_percent: 1,
    note: "Preservative restriction",
    source: "Seed Regulation DB",
  },
  {
    id: "REG-002",
    country_code: "CN",
    inci_name: "Niacinamide",
    cas_no: "98-92-0",
    regulation_type: "Allowed",
    max_percent: 0,
    note: "IECIC Listed",
    source: "Seed Regulation DB",
  },
  {
    id: "REG-003",
    country_code: "EU",
    inci_name: "Hydroquinone",
    cas_no: "123-31-9",
    regulation_type: "Prohibited",
    max_percent: 0,
    note: "Prohibited ingredient example",
    source: "Seed Regulation DB",
  },
];


const initialCustomerPortalItems: CustomerPortalItem[] = [
  {
    id: "CP-001",
    customer_name: "ABC 브랜드",
    project_code: "26A001",
    project_name: "고보습 비건 크림",
    current_status: "개발중",
    sample_status: "Sent",
    submission_status: "Prepared",
    visible_to_customer: true,
    last_update: "2026-06-25",
  },
  {
    id: "CP-002",
    customer_name: "DEF 코스메틱",
    project_code: "26A002",
    project_name: "저자극 장벽 세럼",
    current_status: "샘플발송",
    sample_status: "Feedback Received",
    submission_status: "Not Prepared",
    visible_to_customer: true,
    last_update: "2026-06-25",
  },
];

const initialSampleFeedbacks: SampleFeedback[] = [
  {
    id: "SF-001",
    sample_no: "S-2026-001",
    customer_name: "ABC 브랜드",
    project_code: "26A001",
    formula_code: "FC-001",
    sent_date: "2026-06-20",
    quantity: "20EA",
    feedback: "보습감 우수, 향을 조금 약하게 요청",
    status: "Feedback Received",
  },
];


const initialSupplierTasks: SupplierPortalTask[] = [
  {
    id: "SP-001",
    supplier: "A Supplier",
    raw_code: "RM-001",
    raw_name: "Glycerin 99.5%",
    required_document: "COA",
    request_status: "Requested",
    due_date: "2026-07-10",
    contact_email: "qa@asupplier.com",
    memo: "신규 Lot COA 요청",
  },
  {
    id: "SP-002",
    supplier: "B Supplier",
    raw_code: "RM-002",
    raw_name: "Niacinamide USP",
    required_document: "MSDS",
    request_status: "Received",
    due_date: "2026-06-30",
    contact_email: "sales@bsupplier.com",
    memo: "2026 MSDS 수령 완료",
  },
];

const initialSupplierScores: SupplierScoreCard[] = [
  {
    supplier: "A Supplier",
    document_score: 80,
    price_score: 75,
    response_score: 70,
    risk_level: "MEDIUM",
    note: "문서 회신 속도 개선 필요",
  },
  {
    supplier: "B Supplier",
    document_score: 92,
    price_score: 85,
    response_score: 90,
    risk_level: "LOW",
    note: "우수 공급사",
  },
];


const initialAdminUsers: AdminUser[] = [
  {
    id: "U-001",
    email: "manager@plm.local",
    display_name: "관리자",
    role: "manager",
    is_active: true,
    last_login: "2026-06-25",
  },
  {
    id: "U-002",
    email: "researcher@plm.local",
    display_name: "연구원",
    role: "researcher",
    is_active: true,
    last_login: "2026-06-24",
  },
  {
    id: "U-003",
    email: "qa@plm.local",
    display_name: "QA 담당",
    role: "qa",
    is_active: true,
    last_login: "2026-06-23",
  },
];

const initialAdminAudits: AdminAudit[] = [
  {
    id: "AUD-001",
    actor: "관리자",
    action: "LOGIN",
    module: "Auth",
    target: "manager@plm.local",
    created_at: "2026-06-25 09:00",
  },
  {
    id: "AUD-002",
    actor: "연구원",
    action: "CREATE",
    module: "Formula",
    target: "FC-001",
    created_at: "2026-06-25 10:30",
  },
];

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "white",
    padding: "18px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
}

function tableCellStyle(header = false): React.CSSProperties {
  return {
    border: "1px solid #d1d5db",
    padding: "10px",
    textAlign: "left",
    verticalAlign: "top",
    background: header ? "#f3f4f6" : "white",
    fontWeight: header ? "bold" : "normal",
  };
}

function progressByStatus(status: ProjectStatus) {
  if (status === "개발중") return 30;
  if (status === "샘플발송") return 55;
  if (status === "양산승인") return 80;
  if (status === "출시") return 100;
  return 10;
}

function nextProjectCode(projects: EnterpriseProject[]) {
  const year = String(new Date().getFullYear()).slice(2);
  const count = projects.length + 1;
  return `${year}A${String(count).padStart(3, "0")}`;
}

function nextFormulaCode(formulas: EnterpriseFormula[]) {
  return `FC-${String(formulas.length + 1).padStart(3, "0")}`;
}

function nextIngredientId(ingredients: EnterpriseIngredient[]) {
  return `I-${String(ingredients.length + 1).padStart(3, "0")}`;
}

function nextRawCode(rawMaterials: EnterpriseRawMaterial[]) {
  return `RM-${String(rawMaterials.length + 1).padStart(3, "0")}`;
}

export default function EnterprisePage() {
  const [active, setActive] = useState<ModuleKey>("overview");

  const [projects, setProjects] = useState<EnterpriseProject[]>(initialProjects);
  const [projectSearch, setProjectSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [researcher, setResearcher] = useState("");
  const [projectMemo, setProjectMemo] = useState("");
  const [launchTarget, setLaunchTarget] = useState("");

  const [formulas, setFormulas] = useState<EnterpriseFormula[]>(initialFormulas);
  const [formulaSearch, setFormulaSearch] = useState("");
  const [formulaProjectCode, setFormulaProjectCode] = useState("26A001");
  const [formulaName, setFormulaName] = useState("");
  const [formulaCost, setFormulaCost] = useState("");
  const [formulaNote, setFormulaNote] = useState("");

  const [ingredients, setIngredients] = useState<EnterpriseIngredient[]>(initialIngredients);
  const [rawMaterials, setRawMaterials] = useState<EnterpriseRawMaterial[]>(initialRawMaterials);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientPage, setIngredientPage] = useState(1);
  const [ingredientPageSize, setIngredientPageSize] = useState(10);
  const [newInci, setNewInci] = useState("");
  const [newKoreanName, setNewKoreanName] = useState("");
  const [newCas, setNewCas] = useState("");
  const [newEc, setNewEc] = useState("");
  const [newFunctionKo, setNewFunctionKo] = useState("");
  const [rawName, setRawName] = useState("");
  const [rawSupplier, setRawSupplier] = useState("");
  const [rawPrice, setRawPrice] = useState("");
  const [rawMainInci, setRawMainInci] = useState("");

  const [aiConcept, setAiConcept] = useState("고보습 비건 장벽 크림");
  const [aiCountries, setAiCountries] = useState("EU, KR");
  const [aiTargetCost, setAiTargetCost] = useState("5000");
  const [aiClaims, setAiClaims] = useState("보습, 진정, 비건, 저자극");
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);

  const [qualityDocuments, setQualityDocuments] = useState<QualityDocument[]>(initialQualityDocuments);
  const [stabilityRecords, setStabilityRecords] = useState<StabilityRecord[]>(initialStabilityRecords);
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>(initialApprovals);
  const [qualityFilter, setQualityFilter] = useState("ALL");
  const [newDocRawCode, setNewDocRawCode] = useState("RM-001");
  const [newDocType, setNewDocType] = useState("COA");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocExpiry, setNewDocExpiry] = useState("");
  const [newStabilityFormulaCode, setNewStabilityFormulaCode] = useState("FC-001");
  const [newStabilityCondition, setNewStabilityCondition] = useState("45℃");
  const [newStabilityFinding, setNewStabilityFinding] = useState("");

  const [regulations, setRegulations] = useState<RegulationRecord[]>(initialRegulations);
  const [regCountry, setRegCountry] = useState("EU");
  const [regInci, setRegInci] = useState("");
  const [regCas, setRegCas] = useState("");
  const [regType, setRegType] = useState<RegulationRecord["regulation_type"]>("Restricted");
  const [regMaxPercent, setRegMaxPercent] = useState("");
  const [regNote, setRegNote] = useState("");
  const [regSearch, setRegSearch] = useState("");
  const [regImpactCountry, setRegImpactCountry] = useState("EU");
  const [regImpacts, setRegImpacts] = useState<RegulationImpact[]>([]);

  const [customerPortalItems, setCustomerPortalItems] = useState<CustomerPortalItem[]>(initialCustomerPortalItems);
  const [sampleFeedbacks, setSampleFeedbacks] = useState<SampleFeedback[]>(initialSampleFeedbacks);
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [newSampleCustomer, setNewSampleCustomer] = useState("ABC 브랜드");
  const [newSampleProjectCode, setNewSampleProjectCode] = useState("26A001");
  const [newSampleFormulaCode, setNewSampleFormulaCode] = useState("FC-001");
  const [newSampleQuantity, setNewSampleQuantity] = useState("20EA");
  const [newSampleFeedback, setNewSampleFeedback] = useState("");

  const [supplierTasks, setSupplierTasks] = useState<SupplierPortalTask[]>(initialSupplierTasks);
  const [supplierScores, setSupplierScores] = useState<SupplierScoreCard[]>(initialSupplierScores);
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [supplierRawCode, setSupplierRawCode] = useState("RM-001");
  const [supplierDocType, setSupplierDocType] = useState("COA");
  const [supplierDueDate, setSupplierDueDate] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierMemo, setSupplierMemo] = useState("");

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [adminAudits, setAdminAudits] = useState<AdminAudit[]>(initialAdminAudits);
  const [healthItems, setHealthItems] = useState<SystemHealthItem[]>([]);
  const [adminUserEmail, setAdminUserEmail] = useState("");
  const [adminUserName, setAdminUserName] = useState("");
  const [adminUserRole, setAdminUserRole] = useState<AdminUser["role"]>("researcher");
  const [adminFilter, setAdminFilter] = useState("ALL");
  const [productionMode, setProductionMode] = useState("Production");
  const [launchGateItems, setLaunchGateItems] = useState<LaunchGateItem[]>([]);
  const [dashboardStatus, setDashboardStatus] = useState("");

  const [migrationNote, setMigrationNote] = useState("");

  const filteredProjects = useMemo(() => {
    const keyword = projectSearch.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter((project) =>
      [project.project_code, project.customer_name, project.project_name, project.researcher, project.status, project.memo]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [projectSearch, projects]);

  const filteredFormulas = useMemo(() => {
    const keyword = formulaSearch.trim().toLowerCase();
    if (!keyword) return formulas;
    return formulas.filter((formula) =>
      [formula.formula_code, formula.formula_name, formula.version, formula.project_code, formula.status, formula.revision_note]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [formulaSearch, formulas]);

  const filteredIngredients = useMemo(() => {
    const keyword = ingredientSearch.trim().toLowerCase();
    if (!keyword) return ingredients;
    return ingredients.filter((item) =>
      [
        item.inci_name,
        item.korean_name,
        item.cas_no,
        item.ec_no,
        item.function_ko,
        item.function_en,
        item.eu_status,
        item.china_status,
        item.ewg_grade,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [ingredientSearch, ingredients]);

  const paginatedIngredients = useMemo(() => {
    const start = (ingredientPage - 1) * ingredientPageSize;
    return filteredIngredients.slice(start, start + ingredientPageSize);
  }, [filteredIngredients, ingredientPage, ingredientPageSize]);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      developing: projects.filter((item) => item.status === "개발중").length,
      sample: projects.filter((item) => item.status === "샘플발송").length,
      approved: projects.filter((item) => item.status === "양산승인").length,
      launched: projects.filter((item) => item.status === "출시").length,
    };
  }, [projects]);

  const formulaStats = useMemo(() => {
    return {
      total: formulas.length,
      review: formulas.filter((item) => item.status === "Review").length,
      locked: formulas.filter((item) => item.is_locked).length,
      avgCost: formulas.length ? formulas.reduce((sum, item) => sum + item.material_cost, 0) / formulas.length : 0,
    };
  }, [formulas]);

  const ingredientStats = useMemo(() => {
    return {
      total: ingredients.length,
      missingCas: ingredients.filter((item) => !item.cas_no).length,
      restricted: ingredients.filter((item) => item.eu_status.toLowerCase().includes("restricted")).length,
      rawTotal: rawMaterials.length,
      invalidComposition: rawMaterials.filter((item) => Math.abs(item.composition_total - 100) > 0.0001).length,
    };
  }, [ingredients, rawMaterials]);

  const qualityStats = useMemo(() => {
    return {
      documents: qualityDocuments.length,
      expiring: qualityDocuments.filter((item) => item.status === "EXPIRING").length,
      expired: qualityDocuments.filter((item) => item.status === "EXPIRED").length,
      stabilityWatch: stabilityRecords.filter((item) => item.result === "WATCH").length,
      stabilityFail: stabilityRecords.filter((item) => item.result === "FAIL").length,
      approvalPending: approvalRecords.filter((item) => item.status === "Requested").length,
    };
  }, [qualityDocuments, stabilityRecords, approvalRecords]);

  const filteredQualityDocuments = useMemo(() => {
    if (qualityFilter === "ALL") return qualityDocuments;
    return qualityDocuments.filter((item) => item.status === qualityFilter);
  }, [qualityFilter, qualityDocuments]);

  const filteredRegulations = useMemo(() => {
    const keyword = regSearch.trim().toLowerCase();
    if (!keyword) return regulations;

    return regulations.filter((item) =>
      [
        item.country_code,
        item.inci_name,
        item.cas_no,
        item.regulation_type,
        item.note,
        item.source,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [regSearch, regulations]);

  const regulationStats = useMemo(() => {
    return {
      total: regulations.length,
      restricted: regulations.filter((item) => item.regulation_type === "Restricted").length,
      prohibited: regulations.filter((item) => item.regulation_type === "Prohibited").length,
      warning: regulations.filter((item) => item.regulation_type === "Warning").length,
      impacts: regImpacts.length,
      high: regImpacts.filter((item) => item.risk === "HIGH").length,
    };
  }, [regulations, regImpacts]);

  const filteredCustomerPortalItems = useMemo(() => {
    if (customerFilter === "ALL") return customerPortalItems;
    return customerPortalItems.filter((item) => item.customer_name === customerFilter);
  }, [customerPortalItems, customerFilter]);

  const customerStats = useMemo(() => {
    return {
      customers: new Set(customerPortalItems.map((item) => item.customer_name)).size,
      visible: customerPortalItems.filter((item) => item.visible_to_customer).length,
      samples: sampleFeedbacks.length,
      feedback: sampleFeedbacks.filter((item) => item.status === "Feedback Received" || item.status === "Revision Needed").length,
      submissionPrepared: customerPortalItems.filter((item) => item.submission_status === "Prepared" || item.submission_status === "Sent" || item.submission_status === "Approved").length,
    };
  }, [customerPortalItems, sampleFeedbacks]);

  const filteredSupplierTasks = useMemo(() => {
    if (supplierFilter === "ALL") return supplierTasks;
    return supplierTasks.filter((item) => item.supplier === supplierFilter);
  }, [supplierTasks, supplierFilter]);

  const supplierStats = useMemo(() => {
    return {
      suppliers: new Set(rawMaterials.map((item) => item.supplier)).size,
      tasks: supplierTasks.length,
      requested: supplierTasks.filter((item) => item.request_status === "Requested").length,
      received: supplierTasks.filter((item) => item.request_status === "Received").length,
      overdue: supplierTasks.filter((item) => item.request_status === "Overdue").length,
      highRisk: supplierScores.filter((item) => item.risk_level === "HIGH").length,
    };
  }, [rawMaterials, supplierTasks, supplierScores]);

  const filteredAdminUsers = useMemo(() => {
    if (adminFilter === "ALL") return adminUsers;
    return adminUsers.filter((item) => item.role === adminFilter || String(item.is_active) === adminFilter);
  }, [adminUsers, adminFilter]);

  const adminStats = useMemo(() => {
    return {
      users: adminUsers.length,
      active: adminUsers.filter((item) => item.is_active).length,
      inactive: adminUsers.filter((item) => !item.is_active).length,
      audits: adminAudits.length,
      healthFail: healthItems.filter((item) => item.status === "FAIL").length,
      healthWarn: healthItems.filter((item) => item.status === "WARN").length,
    };
  }, [adminUsers, adminAudits, healthItems]);

  const executiveKpis = useMemo<EnterpriseKpi[]>(() => {
    return [
      {
        label: "Active Projects",
        value: projects.length,
        status: projects.length > 0 ? "GOOD" : "RISK",
        note: "진행 프로젝트 수",
      },
      {
        label: "Formula Ready",
        value: formulas.filter((item) => Math.abs(item.total_percent - 100) < 0.0001).length,
        status: formulas.every((item) => Math.abs(item.total_percent - 100) < 0.0001) ? "GOOD" : "RISK",
        note: "처방 총합 100% 기준",
      },
      {
        label: "Ingredient DB",
        value: ingredients.length,
        status: ingredients.length >= 10 ? "GOOD" : ingredients.length >= 5 ? "WATCH" : "RISK",
        note: "성분 DB 규모",
      },
      {
        label: "QA Pending",
        value: approvalRecords.filter((item) => item.status === "Requested").length,
        status: approvalRecords.some((item) => item.status === "Requested") ? "WATCH" : "GOOD",
        note: "승인 대기 건수",
      },
      {
        label: "RA High Risk",
        value: regImpacts.filter((item) => item.risk === "HIGH").length,
        status: regImpacts.some((item) => item.risk === "HIGH") ? "RISK" : "GOOD",
        note: "규제 영향도 HIGH",
      },
      {
        label: "Supplier Overdue",
        value: supplierTasks.filter((item) => item.request_status === "Overdue").length,
        status: supplierTasks.some((item) => item.request_status === "Overdue") ? "RISK" : "GOOD",
        note: "공급사 문서 지연",
      },
      {
        label: "Customer Feedback",
        value: sampleFeedbacks.filter((item) => item.status === "Feedback Received" || item.status === "Revision Needed").length,
        status: sampleFeedbacks.some((item) => item.status === "Revision Needed") ? "WATCH" : "GOOD",
        note: "피드백 및 Revision 필요",
      },
      {
        label: "System Health",
        value: healthItems.length ? `${healthItems.filter((item) => item.status === "PASS").length}/${healthItems.length}` : "Not Run",
        status: healthItems.some((item) => item.status === "FAIL") ? "RISK" : healthItems.some((item) => item.status === "WARN") ? "WATCH" : "GOOD",
        note: "Admin Health Check 기준",
      },
    ];
  }, [projects, formulas, ingredients, approvalRecords, regImpacts, supplierTasks, sampleFeedbacks, healthItems]);

  function addEnterpriseProject() {
    if (!customerName || !projectName) {
      alert("고객사와 프로젝트명을 입력하세요.");
      return;
    }

    const newProject: EnterpriseProject = {
      id: crypto.randomUUID(),
      project_code: nextProjectCode(projects),
      customer_name: customerName,
      project_name: projectName,
      researcher: researcher || "미지정",
      status: "개발중",
      progress: 30,
      launch_target: launchTarget || "",
      memo: projectMemo || "",
    };

    setProjects([newProject, ...projects]);
    setCustomerName("");
    setProjectName("");
    setResearcher("");
    setProjectMemo("");
    setLaunchTarget("");
  }

  function updateProjectStatus(projectId: string, status: ProjectStatus) {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, status, progress: progressByStatus(status) } : project
      )
    );
  }

  function addEnterpriseFormula() {
    if (!formulaName) {
      alert("처방명을 입력하세요.");
      return;
    }

    const newFormula: EnterpriseFormula = {
      id: crypto.randomUUID(),
      formula_code: nextFormulaCode(formulas),
      formula_name: formulaName,
      version: "1.0",
      project_code: formulaProjectCode,
      status: "Draft",
      total_percent: 100,
      material_cost: Number(formulaCost || 0),
      is_locked: false,
      revision_note: formulaNote || "신규 처방",
    };

    setFormulas([newFormula, ...formulas]);
    setFormulaName("");
    setFormulaCost("");
    setFormulaNote("");
  }

  function updateFormulaStatus(formulaId: string, status: FormulaStatus) {
    setFormulas((prev) =>
      prev.map((formula) =>
        formula.id === formulaId
          ? {
              ...formula,
              status,
              is_locked: status === "Locked" || status === "Released" ? true : formula.is_locked,
            }
          : formula
      )
    );
  }

  function cloneFormula(formulaId: string) {
    const source = formulas.find((formula) => formula.id === formulaId);
    if (!source) return;

    const nextVersionNumber = Number(source.version || "1") + 0.1;

    const cloned: EnterpriseFormula = {
      ...source,
      id: crypto.randomUUID(),
      formula_code: nextFormulaCode(formulas),
      version: nextVersionNumber.toFixed(1),
      status: "Draft",
      is_locked: false,
      revision_note: `Clone from ${source.formula_code} v${source.version}`,
    };

    setFormulas([cloned, ...formulas]);
  }

  function toggleFormulaLock(formulaId: string) {
    setFormulas((prev) =>
      prev.map((formula) =>
        formula.id === formulaId
          ? {
              ...formula,
              is_locked: !formula.is_locked,
              status: !formula.is_locked ? "Locked" : "Draft",
            }
          : formula
      )
    );
  }

  function addEnterpriseIngredient() {
    if (!newInci || !newKoreanName) {
      alert("INCI와 국문명을 입력하세요.");
      return;
    }

    const newIngredient: EnterpriseIngredient = {
      id: nextIngredientId(ingredients),
      inci_name: newInci,
      korean_name: newKoreanName,
      cas_no: newCas,
      ec_no: newEc,
      function_ko: newFunctionKo,
      function_en: newFunctionKo === "보습제" ? "Humectant" : newFunctionKo === "보존제" ? "Preservative" : "",
      eu_status: "Allowed",
      china_status: "Listed",
      ewg_grade: "",
      source: "Manual",
    };

    setIngredients([newIngredient, ...ingredients]);
    setNewInci("");
    setNewKoreanName("");
    setNewCas("");
    setNewEc("");
    setNewFunctionKo("");
    setIngredientPage(1);
  }

  function addEnterpriseRawMaterial() {
    if (!rawName) {
      alert("원료명을 입력하세요.");
      return;
    }

    const newRaw: EnterpriseRawMaterial = {
      id: crypto.randomUUID(),
      raw_code: nextRawCode(rawMaterials),
      raw_name: rawName,
      supplier: rawSupplier || "미지정",
      unit_price: Number(rawPrice || 0),
      main_inci: rawMainInci || "",
      composition_total: 100,
    };

    setRawMaterials([newRaw, ...rawMaterials]);
    setRawName("");
    setRawSupplier("");
    setRawPrice("");
    setRawMainInci("");
  }

  function importSeedIngredients() {
    const seedNames = [
      ["Betaine", "베타인", "107-43-7", "203-490-6", "보습제", "Humectant"],
      ["Allantoin", "알란토인", "97-59-6", "202-592-8", "진정", "Skin Protecting"],
      ["Sodium Hyaluronate", "소듐하이알루로네이트", "9067-32-7", "", "보습제", "Humectant"],
      ["Ceramide NP", "세라마이드엔피", "100403-19-8", "", "피부컨디셔닝", "Skin Conditioning"],
      ["Caprylyl Glycol", "카프릴릴글라이콜", "1117-86-8", "214-254-7", "보습/방부보조", "Humectant"],
    ];

    const existing = new Set(ingredients.map((item) => item.inci_name.toLowerCase()));
    const newRows = seedNames
      .filter((row) => !existing.has(row[0].toLowerCase()))
      .map((row, index) => ({
        id: `I-SEED-${Date.now()}-${index}`,
        inci_name: row[0],
        korean_name: row[1],
        cas_no: row[2],
        ec_no: row[3],
        function_ko: row[4],
        function_en: row[5],
        eu_status: "Allowed",
        china_status: "Listed",
        ewg_grade: "",
        source: "Seed Import",
      }));

    setIngredients([...newRows, ...ingredients]);
    setIngredientPage(1);
  }

  function exportCsv(filename: string, rows: (string | number | boolean)[][]) {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportProjectCsv() {
    exportCsv("enterprise_project_module.csv", [
      ["project_code", "customer_name", "project_name", "researcher", "status", "progress", "launch_target", "memo"],
      ...filteredProjects.map((project) => [
        project.project_code,
        project.customer_name,
        project.project_name,
        project.researcher,
        project.status,
        project.progress,
        project.launch_target,
        project.memo,
      ]),
    ]);
  }

  function exportFormulaCsv() {
    exportCsv("enterprise_formula_module.csv", [
      ["formula_code", "formula_name", "version", "project_code", "status", "total_percent", "material_cost", "is_locked", "revision_note"],
      ...filteredFormulas.map((formula) => [
        formula.formula_code,
        formula.formula_name,
        formula.version,
        formula.project_code,
        formula.status,
        formula.total_percent,
        formula.material_cost,
        formula.is_locked,
        formula.revision_note,
      ]),
    ]);
  }

  function exportIngredientCsv() {
    exportCsv("enterprise_ingredient_module.csv", [
      ["inci_name", "korean_name", "cas_no", "ec_no", "function_ko", "function_en", "eu_status", "china_status", "ewg_grade", "source"],
      ...filteredIngredients.map((item) => [
        item.inci_name,
        item.korean_name,
        item.cas_no,
        item.ec_no,
        item.function_ko,
        item.function_en,
        item.eu_status,
        item.china_status,
        item.ewg_grade,
        item.source,
      ]),
    ]);
  }

  function exportRawCsv() {
    exportCsv("enterprise_raw_material_module.csv", [
      ["raw_code", "raw_name", "supplier", "unit_price", "main_inci", "composition_total"],
      ...rawMaterials.map((item) => [
        item.raw_code,
        item.raw_name,
        item.supplier,
        item.unit_price,
        item.main_inci,
        item.composition_total,
      ]),
    ]);
  }

  function runAiEnterpriseAnalysis() {
    const targetCost = Number(aiTargetCost || 0);
    const conceptText = `${aiConcept} ${aiClaims}`.toLowerCase();

    const recommended = ingredients
      .filter((item) => {
        const text = `${item.inci_name} ${item.korean_name} ${item.function_ko} ${item.function_en}`.toLowerCase();

        if (conceptText.includes("보습") || conceptText.includes("moisture")) {
          if (text.includes("glycerin") || text.includes("hyaluronate") || text.includes("betaine") || text.includes("panthenol") || text.includes("보습")) return true;
        }

        if (conceptText.includes("진정") || conceptText.includes("soothing")) {
          if (text.includes("panthenol") || text.includes("allantoin") || text.includes("진정")) return true;
        }

        if (conceptText.includes("비건") || conceptText.includes("vegan")) {
          if (!text.includes("animal")) return true;
        }

        return false;
      })
      .slice(0, 8)
      .map((item) => item.inci_name);

    const hasPreservative = ingredients.some((item) => item.function_ko.includes("보존") || item.function_en.toLowerCase().includes("preservative"));
    const restrictedCount = ingredients.filter((item) => item.eu_status.toLowerCase().includes("restricted")).length;
    const expectedCost = Math.round((targetCost || 5000) * (conceptText.includes("비건") ? 1.08 : 0.96));
    const regulationRisk: AiAnalysisResult["regulation_risk"] = restrictedCount >= 2 ? "HIGH" : restrictedCount === 1 ? "MEDIUM" : "LOW";
    const stabilityRisk: AiAnalysisResult["stability_risk"] = conceptText.includes("크림") ? "MEDIUM" : "LOW";

    const warnings: string[] = [];

    if (!hasPreservative) warnings.push("보존 시스템 후보가 부족합니다. 보존제/방부부스터 검토가 필요합니다.");
    if (expectedCost > targetCost && targetCost > 0) warnings.push(`예상 원가 ${expectedCost.toLocaleString()}원/kg이 목표 원가 ${targetCost.toLocaleString()}원/kg을 초과할 수 있습니다.`);
    if (regulationRisk !== "LOW") warnings.push("EU Restricted 성분이 포함될 가능성이 있어 RA 검토가 필요합니다.");
    if (conceptText.includes("저자극")) warnings.push("저자극 클레임은 인체적용/피부자극 시험 근거가 필요합니다.");

    setAiResult({
      formula_concept: aiConcept,
      target_countries: aiCountries,
      target_cost: targetCost,
      suggested_formula_type: conceptText.includes("세럼") ? "Serum" : conceptText.includes("크림") ? "Cream" : "Emulsion",
      expected_cost: expectedCost,
      regulation_risk: regulationRisk,
      stability_risk: stabilityRisk,
      claim_score: Math.max(50, 90 - warnings.length * 10),
      recommended_ingredients: recommended.length ? recommended : ["Glycerin", "Panthenol", "Betaine"],
      warnings,
      next_actions: [
        "AI 처방 초안 생성 후 Formula Module에 Draft로 등록",
        "Ingredient Module에서 추천 성분의 CAS/규제 정보 확인",
        "Regulation Module에서 판매국가별 제한 여부 검토",
        "Quality Module에서 안정성 예측 및 시험 조건 설정",
        "BOM 시뮬레이터에서 목표원가 달성 여부 확인",
      ],
    });
  }

  function saveAiDraftAsFormula() {
    if (!aiResult) {
      alert("먼저 AI 분석을 실행하세요.");
      return;
    }

    const newFormula: EnterpriseFormula = {
      id: crypto.randomUUID(),
      formula_code: nextFormulaCode(formulas),
      formula_name: `${aiResult.formula_concept} AI Draft`,
      version: "0.1",
      project_code: projects[0]?.project_code || "UNLINKED",
      status: "Draft",
      total_percent: 100,
      material_cost: aiResult.expected_cost,
      is_locked: false,
      revision_note: `AI Draft / ${aiResult.target_countries} / Claim Score ${aiResult.claim_score}`,
    };

    setFormulas([newFormula, ...formulas]);
    setActive("formula");
  }

  function exportAiResultCsv() {
    if (!aiResult) {
      alert("AI 분석 결과가 없습니다.");
      return;
    }

    exportCsv("enterprise_ai_analysis.csv", [
      ["item", "value"],
      ["concept", aiResult.formula_concept],
      ["countries", aiResult.target_countries],
      ["target_cost", aiResult.target_cost],
      ["expected_cost", aiResult.expected_cost],
      ["formula_type", aiResult.suggested_formula_type],
      ["regulation_risk", aiResult.regulation_risk],
      ["stability_risk", aiResult.stability_risk],
      ["claim_score", aiResult.claim_score],
      ["recommended_ingredients", aiResult.recommended_ingredients.join(" / ")],
      ["warnings", aiResult.warnings.join(" / ")],
    ]);
  }

  function getDocumentStatusByExpiry(expiry: string): QualityDocument["status"] {
    if (!expiry) return "MISSING";

    const today = new Date();
    const expiryDate = new Date(expiry);
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= 60) return "EXPIRING";
    return "OK";
  }

  function addQualityDocument() {
    if (!newDocTitle) {
      alert("문서명을 입력하세요.");
      return;
    }

    const raw = rawMaterials.find((item) => item.raw_code === newDocRawCode);

    const doc: QualityDocument = {
      id: crypto.randomUUID(),
      raw_code: newDocRawCode,
      raw_name: raw?.raw_name || "-",
      supplier: raw?.supplier || "-",
      document_type: newDocType,
      document_title: newDocTitle,
      expiry_date: newDocExpiry,
      status: getDocumentStatusByExpiry(newDocExpiry),
    };

    setQualityDocuments([doc, ...qualityDocuments]);
    setNewDocTitle("");
    setNewDocExpiry("");
  }

  function addStabilityRecord() {
    if (!newStabilityFinding) {
      alert("안정도 관찰 내용을 입력하세요.");
      return;
    }

    const record: StabilityRecord = {
      id: crypto.randomUUID(),
      formula_code: newStabilityFormulaCode,
      condition: newStabilityCondition,
      week: "Initial",
      result: newStabilityFinding.includes("분리") || newStabilityFinding.includes("변색") ? "WATCH" : "PASS",
      finding: newStabilityFinding,
    };

    setStabilityRecords([record, ...stabilityRecords]);
    setNewStabilityFinding("");
  }

  function approveRecord(id: string) {
    setApprovalRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    );
  }

  function rejectRecord(id: string) {
    setApprovalRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Rejected" } : item
      )
    );
  }

  function requestFormulaApproval(formulaCode: string) {
    const record: ApprovalRecord = {
      id: crypto.randomUUID(),
      target: formulaCode,
      type: "Formula",
      requester: "R&D",
      approver: "QA Manager",
      status: "Requested",
    };

    setApprovalRecords([record, ...approvalRecords]);
    setActive("quality");
  }

  function exportQualityCsv() {
    exportCsv("enterprise_quality_module.csv", [
      ["section", "id", "target", "type", "status", "detail"],
      ...qualityDocuments.map((doc) => ["document", doc.id, doc.raw_code, doc.document_type, doc.status, `${doc.document_title} / ${doc.expiry_date}`]),
      ...stabilityRecords.map((record) => ["stability", record.id, record.formula_code, record.condition, record.result, record.finding]),
      ...approvalRecords.map((record) => ["approval", record.id, record.target, record.type, record.status, `${record.requester} -> ${record.approver}`]),
    ]);
  }

  function addRegulationRecord() {
    if (!regCountry || !regInci) {
      alert("국가코드와 INCI를 입력하세요.");
      return;
    }

    const record: RegulationRecord = {
      id: crypto.randomUUID(),
      country_code: regCountry.toUpperCase(),
      inci_name: regInci,
      cas_no: regCas,
      regulation_type: regType,
      max_percent: Number(regMaxPercent || 0),
      note: regNote || "Manual regulation record",
      source: "Manual",
    };

    setRegulations([record, ...regulations]);
    setRegInci("");
    setRegCas("");
    setRegMaxPercent("");
    setRegNote("");
  }

  function runRegulationImpactAnalysis() {
    const targetRegs = regulations.filter((item) => item.country_code === regImpactCountry);
    const impacts: RegulationImpact[] = [];

    formulas.forEach((formula) => {
      const conceptIngredients = ingredients.filter((ingredient) => {
        const formulaText = `${formula.formula_name} ${formula.revision_note}`.toLowerCase();
        return (
          formulaText.includes(ingredient.korean_name.toLowerCase()) ||
          formulaText.includes(ingredient.inci_name.toLowerCase()) ||
          formulaText.includes(ingredient.function_ko.toLowerCase())
        );
      });

      const fallbackIngredients = conceptIngredients.length ? conceptIngredients : ingredients.slice(0, 3);

      fallbackIngredients.forEach((ingredient) => {
        const matched = targetRegs.find((reg) => {
          const sameInci = reg.inci_name.toLowerCase() === ingredient.inci_name.toLowerCase();
          const sameCas = reg.cas_no && reg.cas_no === ingredient.cas_no;
          return sameInci || sameCas;
        });

        if (!matched) return;

        if (matched.regulation_type === "Prohibited") {
          impacts.push({
            formula_code: formula.formula_code,
            country_code: matched.country_code,
            ingredient: ingredient.inci_name,
            risk: "HIGH",
            issue: "금지 성분 가능성",
            action: "처방에서 제외하거나 대체 성분 검토",
          });
        } else if (matched.regulation_type === "Restricted") {
          impacts.push({
            formula_code: formula.formula_code,
            country_code: matched.country_code,
            ingredient: ingredient.inci_name,
            risk: "MEDIUM",
            issue: `제한 성분 / 최대 ${matched.max_percent || "-"}%`,
            action: "최종 함량 계산 후 RA 검토",
          });
        } else if (matched.regulation_type === "Warning") {
          impacts.push({
            formula_code: formula.formula_code,
            country_code: matched.country_code,
            ingredient: ingredient.inci_name,
            risk: "LOW",
            issue: "주의 성분",
            action: "표시/클레임/사용범위 확인",
          });
        }
      });
    });

    setRegImpacts(impacts);
  }

  function importRegulationSeed() {
    const seeds: RegulationRecord[] = [
      {
        id: crypto.randomUUID(),
        country_code: "ASEAN",
        inci_name: "Phenoxyethanol",
        cas_no: "122-99-6",
        regulation_type: "Restricted",
        max_percent: 1,
        note: "ASEAN preservative limit example",
        source: "Seed Import",
      },
      {
        id: crypto.randomUUID(),
        country_code: "JP",
        inci_name: "Salicylic Acid",
        cas_no: "69-72-7",
        regulation_type: "Restricted",
        max_percent: 0.2,
        note: "Japan restriction example",
        source: "Seed Import",
      },
      {
        id: crypto.randomUUID(),
        country_code: "US",
        inci_name: "Mercury Compounds",
        cas_no: "",
        regulation_type: "Prohibited",
        max_percent: 0,
        note: "US prohibited ingredient example",
        source: "Seed Import",
      },
    ];

    const existingKeys = new Set(regulations.map((item) => `${item.country_code}-${item.inci_name}`.toLowerCase()));
    const filtered = seeds.filter((item) => !existingKeys.has(`${item.country_code}-${item.inci_name}`.toLowerCase()));

    setRegulations([...filtered, ...regulations]);
  }

  function exportRegulationCsv() {
    exportCsv("enterprise_regulation_module.csv", [
      ["country_code", "inci_name", "cas_no", "regulation_type", "max_percent", "note", "source"],
      ...filteredRegulations.map((item) => [
        item.country_code,
        item.inci_name,
        item.cas_no,
        item.regulation_type,
        item.max_percent,
        item.note,
        item.source,
      ]),
    ]);
  }

  function exportRegulationImpactCsv() {
    exportCsv("enterprise_regulation_impact.csv", [
      ["formula_code", "country_code", "ingredient", "risk", "issue", "action"],
      ...regImpacts.map((item) => [
        item.formula_code,
        item.country_code,
        item.ingredient,
        item.risk,
        item.issue,
        item.action,
      ]),
    ]);
  }

  function toggleCustomerVisibility(id: string) {
    setCustomerPortalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible_to_customer: !item.visible_to_customer, last_update: new Date().toISOString().slice(0, 10) } : item
      )
    );
  }

  function updateCustomerSubmissionStatus(id: string, status: CustomerPortalItem["submission_status"]) {
    setCustomerPortalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, submission_status: status, last_update: new Date().toISOString().slice(0, 10) } : item
      )
    );
  }

  function nextSampleNo() {
    return `S-${new Date().getFullYear()}-${String(sampleFeedbacks.length + 1).padStart(3, "0")}`;
  }

  function addSampleFeedback() {
    const sample: SampleFeedback = {
      id: crypto.randomUUID(),
      sample_no: nextSampleNo(),
      customer_name: newSampleCustomer,
      project_code: newSampleProjectCode,
      formula_code: newSampleFormulaCode,
      sent_date: new Date().toISOString().slice(0, 10),
      quantity: newSampleQuantity,
      feedback: newSampleFeedback,
      status: newSampleFeedback ? "Feedback Received" : "Sent",
    };

    setSampleFeedbacks([sample, ...sampleFeedbacks]);

    setCustomerPortalItems((prev) =>
      prev.map((item) =>
        item.project_code === newSampleProjectCode
          ? {
              ...item,
              sample_status: newSampleFeedback ? "Feedback Received" : "Sent",
              current_status: "샘플발송",
              last_update: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );

    setNewSampleFeedback("");
  }

  function createRevisionFromFeedback(sample: SampleFeedback) {
    const sourceFormula = formulas.find((formula) => formula.formula_code === sample.formula_code);
    const nextCode = nextFormulaCode(formulas);

    const newFormula: EnterpriseFormula = {
      id: crypto.randomUUID(),
      formula_code: nextCode,
      formula_name: `${sourceFormula?.formula_name || sample.formula_code} 피드백 Revision`,
      version: sourceFormula ? (Number(sourceFormula.version || "1") + 0.1).toFixed(1) : "1.1",
      project_code: sample.project_code,
      status: "Draft",
      total_percent: 100,
      material_cost: sourceFormula?.material_cost || 0,
      is_locked: false,
      revision_note: `Customer Feedback ${sample.sample_no}: ${sample.feedback || "피드백 기반 수정"}`,
    };

    setFormulas([newFormula, ...formulas]);
    setSampleFeedbacks((prev) =>
      prev.map((item) =>
        item.id === sample.id ? { ...item, status: "Revision Needed" } : item
      )
    );
    setActive("formula");
  }

  function exportCustomerPortalCsv() {
    exportCsv("enterprise_customer_portal.csv", [
      ["customer_name", "project_code", "project_name", "current_status", "sample_status", "submission_status", "visible_to_customer", "last_update"],
      ...filteredCustomerPortalItems.map((item) => [
        item.customer_name,
        item.project_code,
        item.project_name,
        item.current_status,
        item.sample_status,
        item.submission_status,
        item.visible_to_customer,
        item.last_update,
      ]),
    ]);
  }

  function exportSampleFeedbackCsv() {
    exportCsv("enterprise_sample_feedback.csv", [
      ["sample_no", "customer_name", "project_code", "formula_code", "sent_date", "quantity", "feedback", "status"],
      ...sampleFeedbacks.map((item) => [
        item.sample_no,
        item.customer_name,
        item.project_code,
        item.formula_code,
        item.sent_date,
        item.quantity,
        item.feedback,
        item.status,
      ]),
    ]);
  }

  function addSupplierTask() {
    const raw = rawMaterials.find((item) => item.raw_code === supplierRawCode);

    if (!raw) {
      alert("원료를 선택하세요.");
      return;
    }

    const task: SupplierPortalTask = {
      id: crypto.randomUUID(),
      supplier: raw.supplier,
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      required_document: supplierDocType,
      request_status: "Requested",
      due_date: supplierDueDate || "",
      contact_email: supplierEmail || "",
      memo: supplierMemo || "공급사 문서 요청",
    };

    setSupplierTasks([task, ...supplierTasks]);
    setSupplierMemo("");
    setSupplierDueDate("");
    setSupplierEmail("");
  }

  function updateSupplierTaskStatus(id: string, status: SupplierPortalTask["request_status"]) {
    setSupplierTasks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, request_status: status } : item
      )
    );
  }

  function generateSupplierScorecards() {
    const supplierNames = Array.from(new Set(rawMaterials.map((item) => item.supplier)));

    const scorecards = supplierNames.map((supplier) => {
      const supplierTaskRows = supplierTasks.filter((item) => item.supplier === supplier);
      const received = supplierTaskRows.filter((item) => item.request_status === "Received").length;
      const overdue = supplierTaskRows.filter((item) => item.request_status === "Overdue").length;
      const documentScore = supplierTaskRows.length ? Math.round((received / supplierTaskRows.length) * 100) : 70;
      const responseScore = Math.max(40, 90 - overdue * 20);
      const supplierRawMaterials = rawMaterials.filter((item) => item.supplier === supplier);
      const avgPrice = supplierRawMaterials.length ? supplierRawMaterials.reduce((sum, item) => sum + item.unit_price, 0) / supplierRawMaterials.length : 0;
      const priceScore = avgPrice > 15000 ? 65 : avgPrice > 8000 ? 78 : 90;
      const totalScore = (documentScore + responseScore + priceScore) / 3;
      const riskLevel: SupplierScoreCard["risk_level"] = totalScore >= 80 ? "LOW" : totalScore >= 60 ? "MEDIUM" : "HIGH";

      return {
        supplier,
        document_score: documentScore,
        price_score: priceScore,
        response_score: responseScore,
        risk_level: riskLevel,
        note: riskLevel === "LOW" ? "우수 공급사" : riskLevel === "MEDIUM" ? "관리 필요" : "대체 공급사 검토 필요",
      };
    });

    setSupplierScores(scorecards);
  }

  function exportSupplierTaskCsv() {
    exportCsv("enterprise_supplier_tasks.csv", [
      ["supplier", "raw_code", "raw_name", "required_document", "request_status", "due_date", "contact_email", "memo"],
      ...filteredSupplierTasks.map((item) => [
        item.supplier,
        item.raw_code,
        item.raw_name,
        item.required_document,
        item.request_status,
        item.due_date,
        item.contact_email,
        item.memo,
      ]),
    ]);
  }

  function exportSupplierUploadTemplateCsv() {
    exportCsv("supplier_upload_template.csv", [
      ["supplier", "raw_code", "raw_name", "document_type", "document_title", "issue_date", "expiry_date", "document_url", "remark"],
      ["공급사명", "RM-001", "원료명", "COA", "COA 2026", "2026-01-01", "2027-01-01", "https://", "공급사 회신용"],
    ]);
  }

  function exportSupplierScoreCsv() {
    exportCsv("enterprise_supplier_scorecards.csv", [
      ["supplier", "document_score", "price_score", "response_score", "risk_level", "note"],
      ...supplierScores.map((item) => [
        item.supplier,
        item.document_score,
        item.price_score,
        item.response_score,
        item.risk_level,
        item.note,
      ]),
    ]);
  }

  function addAdminUser() {
    if (!adminUserEmail || !adminUserName) {
      alert("이메일과 이름을 입력하세요.");
      return;
    }

    const user: AdminUser = {
      id: crypto.randomUUID(),
      email: adminUserEmail,
      display_name: adminUserName,
      role: adminUserRole,
      is_active: true,
      last_login: "-",
    };

    setAdminUsers([user, ...adminUsers]);
    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "CREATE_USER",
        module: "Admin",
        target: adminUserEmail,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setAdminUserEmail("");
    setAdminUserName("");
    setAdminUserRole("researcher");
  }

  function toggleAdminUserActive(id: string) {
    setAdminUsers((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item
      )
    );
  }

  function updateAdminUserRole(id: string, role: AdminUser["role"]) {
    const user = adminUsers.find((item) => item.id === id);
    setAdminUsers((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, role } : item
      )
    );

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "CHANGE_ROLE",
        module: "Admin",
        target: `${user?.email || id} -> ${role}`,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);
  }

  function runEnterpriseHealthCheck() {
    const items: SystemHealthItem[] = [
      {
        category: "Project",
        status: projects.length > 0 ? "PASS" : "FAIL",
        detail: `프로젝트 ${projects.length}건`,
        action: projects.length > 0 ? "정상" : "Project Module에서 프로젝트를 등록하세요.",
      },
      {
        category: "Formula",
        status: formulas.every((item) => Math.abs(item.total_percent - 100) < 0.0001) ? "PASS" : "FAIL",
        detail: `처방 ${formulas.length}건 / 총합 100% 검증`,
        action: "총합 오류 처방을 Formula Module에서 수정하세요.",
      },
      {
        category: "Ingredient",
        status: ingredients.length >= 5 ? "PASS" : "WARN",
        detail: `성분 ${ingredients.length}건`,
        action: ingredients.length >= 5 ? "정상" : "Ingredient Module에서 Seed Import를 진행하세요.",
      },
      {
        category: "Quality",
        status: qualityStats.expired > 0 ? "FAIL" : qualityStats.expiring > 0 ? "WARN" : "PASS",
        detail: `만료 ${qualityStats.expired}건 / 만료임박 ${qualityStats.expiring}건`,
        action: "Quality Module에서 문서 갱신 요청을 진행하세요.",
      },
      {
        category: "Regulation",
        status: regulationStats.prohibited > 0 ? "WARN" : "PASS",
        detail: `규제 DB ${regulationStats.total}건 / 금지 예시 ${regulationStats.prohibited}건`,
        action: "Regulation Module에서 영향도 분석을 실행하세요.",
      },
      {
        category: "Supplier",
        status: supplierStats.overdue > 0 ? "WARN" : "PASS",
        detail: `공급사 요청 ${supplierStats.tasks}건 / 지연 ${supplierStats.overdue}건`,
        action: "Supplier Module에서 지연 요청을 확인하세요.",
      },
      {
        category: "Auth",
        status: adminUsers.some((item) => item.role === "manager" && item.is_active) ? "PASS" : "FAIL",
        detail: `활성 관리자 ${adminUsers.filter((item) => item.role === "manager" && item.is_active).length}명`,
        action: "최소 1명 이상의 활성 manager가 필요합니다.",
      },
    ];

    setHealthItems(items);
    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "RUN_HEALTH_CHECK",
        module: "Admin",
        target: `FAIL ${items.filter((item) => item.status === "FAIL").length} / WARN ${items.filter((item) => item.status === "WARN").length}`,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);
  }

  function exportAdminUsersCsv() {
    exportCsv("enterprise_admin_users.csv", [
      ["email", "display_name", "role", "is_active", "last_login"],
      ...filteredAdminUsers.map((item) => [
        item.email,
        item.display_name,
        item.role,
        item.is_active,
        item.last_login,
      ]),
    ]);
  }

  function exportAuditCsv() {
    exportCsv("enterprise_audit_logs.csv", [
      ["actor", "action", "module", "target", "created_at"],
      ...adminAudits.map((item) => [
        item.actor,
        item.action,
        item.module,
        item.target,
        item.created_at,
      ]),
    ]);
  }

  function exportEnterpriseBackupSummaryCsv() {
    exportCsv("enterprise_backup_summary.csv", [
      ["table", "record_count"],
      ["projects", projects.length],
      ["formulas", formulas.length],
      ["ingredients", ingredients.length],
      ["raw_materials", rawMaterials.length],
      ["quality_documents", qualityDocuments.length],
      ["stability_records", stabilityRecords.length],
      ["regulations", regulations.length],
      ["customer_portal_items", customerPortalItems.length],
      ["sample_feedbacks", sampleFeedbacks.length],
      ["supplier_tasks", supplierTasks.length],
      ["admin_users", adminUsers.length],
      ["audit_logs", adminAudits.length],
    ]);
  }

  function runLaunchGateCheck() {
    const items: LaunchGateItem[] = [
      {
        category: "Project",
        status: projects.some((item) => item.status === "양산승인" || item.status === "출시") ? "PASS" : "PENDING",
        owner: "R&D",
        detail: "양산승인 또는 출시 상태 프로젝트 필요",
        action: "Project Module에서 상태를 양산승인 이상으로 변경",
      },
      {
        category: "Formula",
        status: formulas.some((item) => item.status === "Released" || item.is_locked) ? "PASS" : "BLOCK",
        owner: "R&D / QA",
        detail: "Released 또는 Locked 처방 필요",
        action: "Formula Module에서 최종 처방 Lock/Release 처리",
      },
      {
        category: "QA Approval",
        status: approvalRecords.some((item) => item.status === "Approved") ? "PASS" : "PENDING",
        owner: "QA",
        detail: "QA 승인 완료 필요",
        action: "Quality Module에서 승인 처리",
      },
      {
        category: "Ingredient",
        status: ingredients.length >= 5 && rawMaterials.every((item) => Math.abs(item.composition_total - 100) < 0.0001) ? "PASS" : "BLOCK",
        owner: "R&D",
        detail: "성분 DB 및 원료조성 100% 확인",
        action: "Ingredient Module에서 성분/원료조성 보완",
      },
      {
        category: "Documents",
        status: qualityStats.expired > 0 ? "BLOCK" : qualityStats.expiring > 0 ? "PENDING" : "PASS",
        owner: "QC",
        detail: `만료 ${qualityStats.expired}건 / 만료임박 ${qualityStats.expiring}건`,
        action: "Quality 또는 Supplier Module에서 문서 갱신",
      },
      {
        category: "Regulation",
        status: regImpacts.some((item) => item.risk === "HIGH") ? "BLOCK" : regImpacts.length > 0 ? "PASS" : "PENDING",
        owner: "RA",
        detail: "규제 영향도 분석 필요",
        action: "Regulation Module에서 영향도 분석 실행",
      },
      {
        category: "Customer",
        status: customerPortalItems.some((item) => item.submission_status === "Approved") ? "PASS" : "PENDING",
        owner: "Sales",
        detail: "고객 제출자료 승인 여부",
        action: "Customer Module에서 제출자료 상태 확인",
      },
      {
        category: "Supplier",
        status: supplierStats.overdue > 0 ? "BLOCK" : supplierStats.requested > 0 ? "PENDING" : "PASS",
        owner: "QC / SCM",
        detail: `요청중 ${supplierStats.requested}건 / 지연 ${supplierStats.overdue}건`,
        action: "Supplier Module에서 지연 문서 처리",
      },
    ];

    setLaunchGateItems(items);
    setDashboardStatus(
      `Launch Gate 완료: PASS ${items.filter((item) => item.status === "PASS").length} / PENDING ${items.filter((item) => item.status === "PENDING").length} / BLOCK ${items.filter((item) => item.status === "BLOCK").length}`
    );

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "RUN_LAUNCH_GATE",
        module: "Executive Dashboard",
        target: `BLOCK ${items.filter((item) => item.status === "BLOCK").length}`,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);
  }

  function exportExecutiveDashboardCsv() {
    exportCsv("enterprise_executive_dashboard.csv", [
      ["kpi", "value", "status", "note"],
      ...executiveKpis.map((item) => [
        item.label,
        item.value,
        item.status,
        item.note,
      ]),
    ]);
  }

  function exportLaunchGateCsv() {
    exportCsv("enterprise_launch_gate.csv", [
      ["category", "status", "owner", "detail", "action"],
      ...launchGateItems.map((item) => [
        item.category,
        item.status,
        item.owner,
        item.detail,
        item.action,
      ]),
    ]);
  }

  function renderOverview() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>PLM Enterprise Edition Phase 12</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise 1차 모듈 전환을 바탕으로 Executive Dashboard와 Final Launch Gate를 구성합니다. 경영 KPI, 출시 준비도, Blocker, 모듈별 운영 현황을 한 화면에서 검증합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
            <div style={cardStyle()}><strong>프로젝트</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.total}</div></div>
            <div style={cardStyle()}><strong>처방</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{formulaStats.total}</div></div>
            <div style={cardStyle()}><strong>성분</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{ingredientStats.total}</div></div>
            <div style={cardStyle()}><strong>원료</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{ingredientStats.rawTotal}</div></div>
            <div style={cardStyle()}><strong>규제주의</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#d97706" }}>{ingredientStats.restricted}</div></div>
            <div style={cardStyle()}><strong>AI 준비도</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{ingredients.length > 5 ? 85 : 70}</div></div>
            <div style={cardStyle()}><strong>품질 문서</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>{qualityDocuments.length}</div></div>
            <div style={cardStyle()}><strong>규제 DB</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>{regulations.length}</div></div>
            <div style={cardStyle()}><strong>고객공유</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{customerPortalItems.filter((item) => item.visible_to_customer).length}</div></div>
            <div style={cardStyle()}><strong>공급사요청</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{supplierTasks.length}</div></div>
            <div style={cardStyle()}><strong>Admin Users</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#111827" }}>{adminUsers.length}</div></div>
            <div style={cardStyle()}><strong>Launch Ready</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{launchGateItems.filter((item) => item.status === "PASS").length}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>Executive KPI</h2>
            <button onClick={exportExecutiveDashboardCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              KPI CSV
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
            {executiveKpis.map((kpi) => (
              <div key={kpi.label} style={cardStyle()}>
                <strong>{kpi.label}</strong>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: kpi.status === "GOOD" ? "#059669" : kpi.status === "WATCH" ? "#d97706" : "#dc2626" }}>{kpi.value}</div>
                <div style={{ color: "#6b7280", fontSize: "13px" }}>{kpi.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>Final Launch Readiness Gate</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={runLaunchGateCheck} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Launch Gate Check
              </button>
              <button onClick={exportLaunchGateCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Gate CSV
              </button>
            </div>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{dashboardStatus}</p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Category</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Detail</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {launchGateItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Launch Gate Check를 실행하세요.</td></tr>}
              {launchGateItems.map((item) => (
                <tr key={item.category}>
                  <td style={tableCellStyle()}>{item.category}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "PENDING" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 12 목표</h2>
          <ul>
            <li>Executive Dashboard 독립 UI 검증</li>
            <li>Project / Formula / Ingredient / QA / RA / Supplier / Customer / Admin KPI 통합</li>
            <li>Final Launch Readiness Gate와 출시 Blocker 관리</li>
            <li>다음 단계에서 실제 Supabase 데이터 기반 KPI API로 분리</li>
          </ul>
        </section>
      </>
    );
  }

  function renderProjectModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Project Module</h1>
          <h2>프로젝트 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="고객사" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={researcher} onChange={(e) => setResearcher(e.target.value)} placeholder="담당 연구원" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={launchTarget} onChange={(e) => setLaunchTarget(e.target.value)} placeholder="목표 출시일 예: 2026-09-30" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={projectMemo} onChange={(e) => setProjectMemo(e.target.value)} placeholder="메모" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addEnterpriseProject} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              프로젝트 등록
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>프로젝트 목록</h2>
            <button onClick={exportProjectCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              CSV Export
            </button>
          </div>

          <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="프로젝트 코드, 고객사, 프로젝트명, 담당자 검색" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>프로젝트 코드</th>
                <th style={tableCellStyle(true)}>고객사</th>
                <th style={tableCellStyle(true)}>프로젝트명</th>
                <th style={tableCellStyle(true)}>담당</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>진행률</th>
                <th style={tableCellStyle(true)}>목표출시</th>
                <th style={tableCellStyle(true)}>메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td style={tableCellStyle()}>{project.project_code}</td>
                  <td style={tableCellStyle()}>{project.customer_name}</td>
                  <td style={tableCellStyle()}>{project.project_name}</td>
                  <td style={tableCellStyle()}>{project.researcher}</td>
                  <td style={tableCellStyle()}>
                    <select value={project.status} onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}>
                      <option value="개발중">개발중</option>
                      <option value="샘플발송">샘플발송</option>
                      <option value="양산승인">양산승인</option>
                      <option value="출시">출시</option>
                      <option value="보류">보류</option>
                    </select>
                  </td>
                  <td style={tableCellStyle()}>
                    <div style={{ background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", height: "10px" }}>
                      <div style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#059669" : "#2563eb", height: "10px" }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{project.progress}%</div>
                  </td>
                  <td style={tableCellStyle()}>{project.launch_target || "-"}</td>
                  <td style={tableCellStyle()}>{project.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderFormulaModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Formula Module</h1>
          <h2>처방 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <select value={formulaProjectCode} onChange={(e) => setFormulaProjectCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {projects.map((project) => (
                <option key={project.id} value={project.project_code}>
                  {project.project_code} / {project.customer_name} / {project.project_name}
                </option>
              ))}
            </select>
            <input value={formulaName} onChange={(e) => setFormulaName(e.target.value)} placeholder="처방명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={formulaCost} onChange={(e) => setFormulaCost(e.target.value)} placeholder="원료원가 원/kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={formulaNote} onChange={(e) => setFormulaNote(e.target.value)} placeholder="Revision Note" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addEnterpriseFormula} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              처방 등록
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>처방 목록</h2>
            <button onClick={exportFormulaCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              CSV Export
            </button>
          </div>

          <input value={formulaSearch} onChange={(e) => setFormulaSearch(e.target.value)} placeholder="처방코드, 처방명, 프로젝트코드 검색" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>처방코드</th>
                <th style={tableCellStyle(true)}>처방명</th>
                <th style={tableCellStyle(true)}>Version</th>
                <th style={tableCellStyle(true)}>프로젝트</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>총합%</th>
                <th style={tableCellStyle(true)}>원료원가</th>
                <th style={tableCellStyle(true)}>LOCK</th>
                <th style={tableCellStyle(true)}>Revision Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormulas.map((formula) => (
                <tr key={formula.id}>
                  <td style={tableCellStyle()}>{formula.formula_code}</td>
                  <td style={tableCellStyle()}>{formula.formula_name}</td>
                  <td style={tableCellStyle()}>{formula.version}</td>
                  <td style={tableCellStyle()}>{formula.project_code}</td>
                  <td style={tableCellStyle()}>
                    <select value={formula.status} onChange={(e) => updateFormulaStatus(formula.id, e.target.value as FormulaStatus)}>
                      <option value="Draft">Draft</option>
                      <option value="Review">Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Released">Released</option>
                      <option value="Locked">Locked</option>
                    </select>
                  </td>
                  <td style={{ ...tableCellStyle(), color: Math.abs(formula.total_percent - 100) < 0.0001 ? "green" : "red", fontWeight: "bold" }}>
                    {formula.total_percent.toFixed(4)}
                  </td>
                  <td style={tableCellStyle()}>{formula.material_cost.toLocaleString()}</td>
                  <td style={{ ...tableCellStyle(), color: formula.is_locked ? "red" : "green", fontWeight: "bold" }}>
                    {formula.is_locked ? "LOCKED" : "EDITABLE"}
                  </td>
                  <td style={tableCellStyle()}>{formula.revision_note}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => cloneFormula(formula.id)} style={{ marginRight: "6px" }}>Clone</button>
                    <button onClick={() => toggleFormulaLock(formula.id)} style={{ marginRight: "6px" }}>{formula.is_locked ? "Unlock" : "Lock"}</button>
                    <button onClick={() => requestFormulaApproval(`${formula.formula_code} v${formula.version}`)}>Approval</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderIngredientModule() {
    const maxPage = Math.max(1, Math.ceil(filteredIngredients.length / ingredientPageSize));

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Ingredient Module</h1>
          <p style={{ color: "#6b7280" }}>
            원료마스터, 성분마스터, Global Ingredient Master를 분리하기 위한 검증 화면입니다.
            대량 성분 데이터 대응을 위해 검색 + 페이지네이션 구조를 적용했습니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>성분 수</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ingredientStats.total}</div></div>
            <div style={cardStyle()}><strong>CAS 누락</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{ingredientStats.missingCas}</div></div>
            <div style={cardStyle()}><strong>규제주의</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{ingredientStats.restricted}</div></div>
            <div style={cardStyle()}><strong>원료 수</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ingredientStats.rawTotal}</div></div>
            <div style={cardStyle()}><strong>조성 오류</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{ingredientStats.invalidComposition}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Global Ingredient 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <input value={newInci} onChange={(e) => setNewInci(e.target.value)} placeholder="INCI" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={newKoreanName} onChange={(e) => setNewKoreanName(e.target.value)} placeholder="국문명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={newCas} onChange={(e) => setNewCas(e.target.value)} placeholder="CAS No." style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={newEc} onChange={(e) => setNewEc(e.target.value)} placeholder="EC No." style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={newFunctionKo} onChange={(e) => setNewFunctionKo(e.target.value)} placeholder="기능 예: 보습제, 보존제" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addEnterpriseIngredient} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                성분 등록
              </button>
              <button onClick={importSeedIngredients} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Seed 5건 추가
              </button>
              <button onClick={exportIngredientCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                성분 CSV Export
              </button>
            </div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>성분 검색 / 페이지네이션</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <input
              value={ingredientSearch}
              onChange={(e) => {
                setIngredientSearch(e.target.value);
                setIngredientPage(1);
              }}
              placeholder="INCI, 국문명, CAS, EC, 기능, 규제 검색"
              style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", minWidth: "360px" }}
            />
            <select value={ingredientPageSize} onChange={(e) => { setIngredientPageSize(Number(e.target.value)); setIngredientPage(1); }}>
              <option value={5}>5개씩</option>
              <option value={10}>10개씩</option>
              <option value={20}>20개씩</option>
              <option value={50}>50개씩</option>
            </select>
            <button onClick={() => setIngredientPage(Math.max(1, ingredientPage - 1))}>이전</button>
            <button onClick={() => setIngredientPage(Math.min(maxPage, ingredientPage + 1))}>다음</button>
            <span style={{ alignSelf: "center", color: "#6b7280" }}>Page {ingredientPage} / {maxPage} · 검색결과 {filteredIngredients.length}건</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>INCI</th>
                <th style={tableCellStyle(true)}>국문명</th>
                <th style={tableCellStyle(true)}>CAS</th>
                <th style={tableCellStyle(true)}>EC</th>
                <th style={tableCellStyle(true)}>기능</th>
                <th style={tableCellStyle(true)}>Function EN</th>
                <th style={tableCellStyle(true)}>EU</th>
                <th style={tableCellStyle(true)}>China</th>
                <th style={tableCellStyle(true)}>EWG</th>
                <th style={tableCellStyle(true)}>Source</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIngredients.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.inci_name}</td>
                  <td style={tableCellStyle()}>{item.korean_name}</td>
                  <td style={tableCellStyle()}>{item.cas_no}</td>
                  <td style={tableCellStyle()}>{item.ec_no}</td>
                  <td style={tableCellStyle()}>{item.function_ko}</td>
                  <td style={tableCellStyle()}>{item.function_en}</td>
                  <td style={{ ...tableCellStyle(), color: item.eu_status.toLowerCase().includes("restricted") ? "#dc2626" : "#059669", fontWeight: "bold" }}>{item.eu_status}</td>
                  <td style={tableCellStyle()}>{item.china_status}</td>
                  <td style={tableCellStyle()}>{item.ewg_grade}</td>
                  <td style={tableCellStyle()}>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>원료마스터 등록 / 성분 연결</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <input value={rawName} onChange={(e) => setRawName(e.target.value)} placeholder="원료명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={rawSupplier} onChange={(e) => setRawSupplier(e.target.value)} placeholder="공급사" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={rawPrice} onChange={(e) => setRawPrice(e.target.value)} placeholder="단가 원/kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={rawMainInci} onChange={(e) => setRawMainInci(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="">대표 INCI 선택</option>
              {ingredients.map((item) => (
                <option key={item.id} value={item.inci_name}>{item.inci_name} / {item.korean_name}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addEnterpriseRawMaterial} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                원료 등록
              </button>
              <button onClick={exportRawCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                원료 CSV Export
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>원료코드</th>
                <th style={tableCellStyle(true)}>원료명</th>
                <th style={tableCellStyle(true)}>공급사</th>
                <th style={tableCellStyle(true)}>단가</th>
                <th style={tableCellStyle(true)}>대표 INCI</th>
                <th style={tableCellStyle(true)}>조성합계</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.raw_code}</td>
                  <td style={tableCellStyle()}>{item.raw_name}</td>
                  <td style={tableCellStyle()}>{item.supplier}</td>
                  <td style={tableCellStyle()}>{item.unit_price.toLocaleString()}</td>
                  <td style={tableCellStyle()}>{item.main_inci}</td>
                  <td style={{ ...tableCellStyle(), color: Math.abs(item.composition_total - 100) < 0.0001 ? "green" : "red", fontWeight: "bold" }}>{item.composition_total}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderAiModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>AI Module</h1>
          <p style={{ color: "#6b7280" }}>
            AI Formula Generator 2.0, AI Ingredient, AI Regulation, AI Stability, AI BOM을 하나의 Enterprise 흐름으로 통합합니다.
          </p>

          <h2>AI 처방/검토 조건</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <input value={aiConcept} onChange={(e) => setAiConcept(e.target.value)} placeholder="제품 컨셉 예: 고보습 비건 장벽 크림" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={aiCountries} onChange={(e) => setAiCountries(e.target.value)} placeholder="판매 국가 예: EU, KR, CN" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={aiTargetCost} onChange={(e) => setAiTargetCost(e.target.value)} placeholder="목표 원가 원/kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={aiClaims} onChange={(e) => setAiClaims(e.target.value)} placeholder="희망 클레임 예: 보습, 진정, 비건, 저자극" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={runAiEnterpriseAnalysis} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                AI Enterprise 분석
              </button>
              <button onClick={saveAiDraftAsFormula} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                AI Draft를 Formula로 저장
              </button>
              <button onClick={exportAiResultCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                AI 결과 CSV Export
              </button>
            </div>
          </div>
        </section>

        {aiResult && (
          <>
            <section style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>AI 분석 결과</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                <div style={cardStyle()}><strong>제형</strong><div style={{ fontSize: "24px", fontWeight: "bold" }}>{aiResult.suggested_formula_type}</div></div>
                <div style={cardStyle()}><strong>예상원가</strong><div style={{ fontSize: "24px", fontWeight: "bold" }}>{aiResult.expected_cost.toLocaleString()}</div></div>
                <div style={cardStyle()}><strong>규제 Risk</strong><div style={{ fontSize: "24px", fontWeight: "bold", color: aiResult.regulation_risk === "HIGH" ? "#dc2626" : aiResult.regulation_risk === "MEDIUM" ? "#d97706" : "#059669" }}>{aiResult.regulation_risk}</div></div>
                <div style={cardStyle()}><strong>안정성 Risk</strong><div style={{ fontSize: "24px", fontWeight: "bold", color: aiResult.stability_risk === "HIGH" ? "#dc2626" : aiResult.stability_risk === "MEDIUM" ? "#d97706" : "#059669" }}>{aiResult.stability_risk}</div></div>
                <div style={cardStyle()}><strong>Claim Score</strong><div style={{ fontSize: "24px", fontWeight: "bold", color: aiResult.claim_score >= 80 ? "#059669" : "#d97706" }}>{aiResult.claim_score}/100</div></div>
              </div>
            </section>

            <section style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>추천 성분</h2>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {aiResult.recommended_ingredients.map((item) => (
                  <span key={item} style={{ background: "#eef2ff", color: "#3730a3", padding: "7px 11px", borderRadius: "999px", fontWeight: "bold" }}>{item}</span>
                ))}
              </div>

              <h2>경고/검토사항</h2>
              <ul>
                {aiResult.warnings.length === 0 && <li>현재 조건 기준 주요 경고 없음</li>}
                {aiResult.warnings.map((item) => <li key={item}>{item}</li>)}
              </ul>

              <h2>다음 Action</h2>
              <ol>
                {aiResult.next_actions.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
          </>
        )}
      </>
    );
  }

  function renderQualityModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Quality Module</h1>
          <p style={{ color: "#6b7280" }}>
            원료문서, Supplier Portal, 안정도, 승인관리 흐름을 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>문서</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{qualityStats.documents}</div></div>
            <div style={cardStyle()}><strong>만료임박</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{qualityStats.expiring}</div></div>
            <div style={cardStyle()}><strong>만료</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{qualityStats.expired}</div></div>
            <div style={cardStyle()}><strong>안정도 Watch</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{qualityStats.stabilityWatch}</div></div>
            <div style={cardStyle()}><strong>승인대기</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{qualityStats.approvalPending}</div></div>
          </div>

          <button onClick={exportQualityCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
            Quality CSV Export
          </button>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>원료문서 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <select value={newDocRawCode} onChange={(e) => setNewDocRawCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {rawMaterials.map((raw) => (
                <option key={raw.id} value={raw.raw_code}>{raw.raw_code} / {raw.raw_name} / {raw.supplier}</option>
              ))}
            </select>
            <select value={newDocType} onChange={(e) => setNewDocType(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="COA">COA</option>
              <option value="MSDS">MSDS</option>
              <option value="TDS">TDS</option>
              <option value="Specification">Specification</option>
              <option value="Allergen Statement">Allergen Statement</option>
              <option value="Vegan Statement">Vegan Statement</option>
              <option value="Halal Statement">Halal Statement</option>
              <option value="RSPO Statement">RSPO Statement</option>
            </select>
            <input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="문서명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={newDocExpiry} onChange={(e) => setNewDocExpiry(e.target.value)} placeholder="만료일 예: 2027-01-01" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addQualityDocument} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              문서 등록
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value)}>
              <option value="ALL">전체</option>
              <option value="OK">OK</option>
              <option value="EXPIRING">EXPIRING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="MISSING">MISSING</option>
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>원료코드</th>
                <th style={tableCellStyle(true)}>원료명</th>
                <th style={tableCellStyle(true)}>공급사</th>
                <th style={tableCellStyle(true)}>문서유형</th>
                <th style={tableCellStyle(true)}>문서명</th>
                <th style={tableCellStyle(true)}>만료일</th>
                <th style={tableCellStyle(true)}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredQualityDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td style={tableCellStyle()}>{doc.raw_code}</td>
                  <td style={tableCellStyle()}>{doc.raw_name}</td>
                  <td style={tableCellStyle()}>{doc.supplier}</td>
                  <td style={tableCellStyle()}>{doc.document_type}</td>
                  <td style={tableCellStyle()}>{doc.document_title}</td>
                  <td style={tableCellStyle()}>{doc.expiry_date || "-"}</td>
                  <td style={{ ...tableCellStyle(), color: doc.status === "OK" ? "#059669" : doc.status === "EXPIRING" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{doc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>안정도 기록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <select value={newStabilityFormulaCode} onChange={(e) => setNewStabilityFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name} v{formula.version}</option>
              ))}
            </select>
            <select value={newStabilityCondition} onChange={(e) => setNewStabilityCondition(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="4℃">4℃</option>
              <option value="RT">RT</option>
              <option value="45℃">45℃</option>
              <option value="50℃">50℃</option>
              <option value="Cycle">Cycle</option>
              <option value="Centrifuge">Centrifuge</option>
            </select>
            <textarea value={newStabilityFinding} onChange={(e) => setNewStabilityFinding(e.target.value)} placeholder="관찰 내용 예: 특이사항 없음 / 점도 감소 / 분리 발생" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addStabilityRecord} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              안정도 기록 추가
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>처방</th>
                <th style={tableCellStyle(true)}>조건</th>
                <th style={tableCellStyle(true)}>시점</th>
                <th style={tableCellStyle(true)}>결과</th>
                <th style={tableCellStyle(true)}>관찰</th>
              </tr>
            </thead>
            <tbody>
              {stabilityRecords.map((record) => (
                <tr key={record.id}>
                  <td style={tableCellStyle()}>{record.formula_code}</td>
                  <td style={tableCellStyle()}>{record.condition}</td>
                  <td style={tableCellStyle()}>{record.week}</td>
                  <td style={{ ...tableCellStyle(), color: record.result === "PASS" ? "#059669" : record.result === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{record.result}</td>
                  <td style={tableCellStyle()}>{record.finding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>승인관리</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>대상</th>
                <th style={tableCellStyle(true)}>유형</th>
                <th style={tableCellStyle(true)}>요청자</th>
                <th style={tableCellStyle(true)}>승인자</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvalRecords.map((record) => (
                <tr key={record.id}>
                  <td style={tableCellStyle()}>{record.target}</td>
                  <td style={tableCellStyle()}>{record.type}</td>
                  <td style={tableCellStyle()}>{record.requester}</td>
                  <td style={tableCellStyle()}>{record.approver}</td>
                  <td style={{ ...tableCellStyle(), color: record.status === "Approved" ? "#059669" : record.status === "Rejected" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{record.status}</td>
                  <td style={tableCellStyle()}>
                    {record.status === "Requested" ? (
                      <>
                        <button onClick={() => approveRecord(record.id)} style={{ marginRight: "6px" }}>Approve</button>
                        <button onClick={() => rejectRecord(record.id)}>Reject</button>
                      </>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderRegulationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Regulation Module</h1>
          <p style={{ color: "#6b7280" }}>
            국가별 규제 DB, 공식자료 업데이트, 규제 영향도 분석, PIF/CPSR 준비 흐름을 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>규제 DB</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{regulationStats.total}</div></div>
            <div style={cardStyle()}><strong>Restricted</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{regulationStats.restricted}</div></div>
            <div style={cardStyle()}><strong>Prohibited</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{regulationStats.prohibited}</div></div>
            <div style={cardStyle()}><strong>Impact</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{regulationStats.impacts}</div></div>
            <div style={cardStyle()}><strong>HIGH</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{regulationStats.high}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>국가별 규제 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <input value={regCountry} onChange={(e) => setRegCountry(e.target.value.toUpperCase())} placeholder="국가코드 예: EU, CN, US, JP, ASEAN" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={regInci} onChange={(e) => setRegInci(e.target.value)} placeholder="INCI" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={regCas} onChange={(e) => setRegCas(e.target.value)} placeholder="CAS No." style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={regType} onChange={(e) => setRegType(e.target.value as RegulationRecord["regulation_type"])} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="Allowed">Allowed</option>
              <option value="Restricted">Restricted</option>
              <option value="Prohibited">Prohibited</option>
              <option value="Warning">Warning</option>
            </select>
            <input value={regMaxPercent} onChange={(e) => setRegMaxPercent(e.target.value)} placeholder="최대 사용한도 % / 없으면 0" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={regNote} onChange={(e) => setRegNote(e.target.value)} placeholder="규제 Note / 근거" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addRegulationRecord} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                규제 등록
              </button>
              <button onClick={importRegulationSeed} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Seed 규제 추가
              </button>
              <button onClick={exportRegulationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                규제 CSV Export
              </button>
            </div>
          </div>

          <input value={regSearch} onChange={(e) => setRegSearch(e.target.value)} placeholder="국가, INCI, CAS, 규제유형 검색" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>국가</th>
                <th style={tableCellStyle(true)}>INCI</th>
                <th style={tableCellStyle(true)}>CAS</th>
                <th style={tableCellStyle(true)}>규제유형</th>
                <th style={tableCellStyle(true)}>한도%</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegulations.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.country_code}</td>
                  <td style={tableCellStyle()}>{item.inci_name}</td>
                  <td style={tableCellStyle()}>{item.cas_no}</td>
                  <td style={{ ...tableCellStyle(), color: item.regulation_type === "Prohibited" ? "#dc2626" : item.regulation_type === "Restricted" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.regulation_type}</td>
                  <td style={tableCellStyle()}>{item.max_percent}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>규제 영향도 분석</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <select value={regImpactCountry} onChange={(e) => setRegImpactCountry(e.target.value)}>
              {Array.from(new Set(regulations.map((item) => item.country_code))).map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <button onClick={runRegulationImpactAnalysis} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              영향도 분석 실행
            </button>
            <button onClick={exportRegulationImpactCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              영향도 CSV Export
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>처방</th>
                <th style={tableCellStyle(true)}>국가</th>
                <th style={tableCellStyle(true)}>성분</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Issue</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {regImpacts.length === 0 && (
                <tr><td style={tableCellStyle()} colSpan={6}>영향도 분석을 실행하세요.</td></tr>
              )}
              {regImpacts.map((item, index) => (
                <tr key={`${item.formula_code}-${item.ingredient}-${index}`}>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.country_code}</td>
                  <td style={tableCellStyle()}>{item.ingredient}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk === "HIGH" ? "#dc2626" : item.risk === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk}</td>
                  <td style={tableCellStyle()}>{item.issue}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>PIF / CPSR 준비 체크</h2>
          <ul>
            <li>Formula Sheet 준비: {formulas.length > 0 ? "READY" : "MISSING"}</li>
            <li>Full IL / Breakdown IL 준비: {ingredients.length > 0 ? "READY" : "MISSING"}</li>
            <li>원료문서 준비: {qualityDocuments.length > 0 ? "READY" : "MISSING"}</li>
            <li>규제 영향도 분석: {regImpacts.length > 0 ? "READY" : "PENDING"}</li>
            <li>CPSR 세부 독성/노출 평가는 다음 Phase에서 확장</li>
          </ul>
        </section>
      </>
    );
  }

  function renderCustomerModule() {
    const customerList = Array.from(new Set(customerPortalItems.map((item) => item.customer_name)));

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Customer Module</h1>
          <p style={{ color: "#6b7280" }}>
            고객 포털, 프로젝트 공유, 샘플 발송, 피드백, 고객 제출 패키지를 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>고객사</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{customerStats.customers}</div></div>
            <div style={cardStyle()}><strong>공개 프로젝트</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{customerStats.visible}</div></div>
            <div style={cardStyle()}><strong>샘플</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{customerStats.samples}</div></div>
            <div style={cardStyle()}><strong>피드백</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{customerStats.feedback}</div></div>
            <div style={cardStyle()}><strong>제출준비</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{customerStats.submissionPrepared}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>Customer Portal Lite</h2>
            <button onClick={exportCustomerPortalCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              고객포털 CSV Export
            </button>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
              <option value="ALL">전체 고객</option>
              {customerList.map((customer) => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>고객사</th>
                <th style={tableCellStyle(true)}>프로젝트</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>샘플</th>
                <th style={tableCellStyle(true)}>제출자료</th>
                <th style={tableCellStyle(true)}>고객공개</th>
                <th style={tableCellStyle(true)}>업데이트</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomerPortalItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.customer_name}</td>
                  <td style={tableCellStyle()}>{item.project_code}<br />{item.project_name}</td>
                  <td style={tableCellStyle()}>{item.current_status}</td>
                  <td style={tableCellStyle()}>{item.sample_status}</td>
                  <td style={tableCellStyle()}>
                    <select value={item.submission_status} onChange={(e) => updateCustomerSubmissionStatus(item.id, e.target.value as CustomerPortalItem["submission_status"])}>
                      <option value="Not Prepared">Not Prepared</option>
                      <option value="Prepared">Prepared</option>
                      <option value="Sent">Sent</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </td>
                  <td style={{ ...tableCellStyle(), color: item.visible_to_customer ? "#059669" : "#dc2626", fontWeight: "bold" }}>{item.visible_to_customer ? "VISIBLE" : "HIDDEN"}</td>
                  <td style={tableCellStyle()}>{item.last_update}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => toggleCustomerVisibility(item.id)}>
                      {item.visible_to_customer ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Sample Request & Feedback</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <select value={newSampleCustomer} onChange={(e) => setNewSampleCustomer(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {customerList.map((customer) => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
            <select value={newSampleProjectCode} onChange={(e) => setNewSampleProjectCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {projects.map((project) => (
                <option key={project.id} value={project.project_code}>{project.project_code} / {project.project_name}</option>
              ))}
            </select>
            <select value={newSampleFormulaCode} onChange={(e) => setNewSampleFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <input value={newSampleQuantity} onChange={(e) => setNewSampleQuantity(e.target.value)} placeholder="수량 예: 20EA" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={newSampleFeedback} onChange={(e) => setNewSampleFeedback(e.target.value)} placeholder="고객 피드백. 없으면 발송 기록만 생성됩니다." rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addSampleFeedback} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                샘플 발송/피드백 등록
              </button>
              <button onClick={exportSampleFeedbackCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                샘플 CSV Export
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>샘플번호</th>
                <th style={tableCellStyle(true)}>고객사</th>
                <th style={tableCellStyle(true)}>프로젝트</th>
                <th style={tableCellStyle(true)}>처방</th>
                <th style={tableCellStyle(true)}>발송일</th>
                <th style={tableCellStyle(true)}>수량</th>
                <th style={tableCellStyle(true)}>피드백</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleFeedbacks.map((sample) => (
                <tr key={sample.id}>
                  <td style={tableCellStyle()}>{sample.sample_no}</td>
                  <td style={tableCellStyle()}>{sample.customer_name}</td>
                  <td style={tableCellStyle()}>{sample.project_code}</td>
                  <td style={tableCellStyle()}>{sample.formula_code}</td>
                  <td style={tableCellStyle()}>{sample.sent_date}</td>
                  <td style={tableCellStyle()}>{sample.quantity}</td>
                  <td style={tableCellStyle()}>{sample.feedback || "-"}</td>
                  <td style={{ ...tableCellStyle(), color: sample.status === "Approved" ? "#059669" : sample.status === "Revision Needed" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{sample.status}</td>
                  <td style={tableCellStyle()}>
                    {sample.feedback ? <button onClick={() => createRevisionFromFeedback(sample)}>Revision 생성</button> : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>고객 제출 패키지 연결</h2>
          <ul>
            <li>Formula Sheet: Formula Module과 연결</li>
            <li>Breakdown IL / Full IL: Ingredient + Regulation Module과 연결</li>
            <li>문서 체크리스트: Quality Module과 연결</li>
            <li>Risk Check: Regulation Impact와 연결</li>
            <li>다음 Phase에서 실제 고객 제출 패키지 이력 테이블로 확장</li>
          </ul>
        </section>
      </>
    );
  }

  function renderSupplierModule() {
    const supplierList = Array.from(new Set(rawMaterials.map((item) => item.supplier)));

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Supplier Module</h1>
          <p style={{ color: "#6b7280" }}>
            Supplier Portal Lite, 원료문서 요청, 업로드 양식, 공급사 평가를 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>공급사</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{supplierStats.suppliers}</div></div>
            <div style={cardStyle()}><strong>문서요청</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{supplierStats.tasks}</div></div>
            <div style={cardStyle()}><strong>요청중</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{supplierStats.requested}</div></div>
            <div style={cardStyle()}><strong>수령완료</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{supplierStats.received}</div></div>
            <div style={cardStyle()}><strong>지연</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{supplierStats.overdue}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>공급사 문서 요청</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <select value={supplierRawCode} onChange={(e) => setSupplierRawCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {rawMaterials.map((raw) => (
                <option key={raw.id} value={raw.raw_code}>{raw.raw_code} / {raw.raw_name} / {raw.supplier}</option>
              ))}
            </select>
            <select value={supplierDocType} onChange={(e) => setSupplierDocType(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="COA">COA</option>
              <option value="MSDS">MSDS</option>
              <option value="TDS">TDS</option>
              <option value="Specification">Specification</option>
              <option value="Allergen Statement">Allergen Statement</option>
              <option value="Vegan Statement">Vegan Statement</option>
              <option value="Halal Statement">Halal Statement</option>
              <option value="RSPO Statement">RSPO Statement</option>
            </select>
            <input value={supplierDueDate} onChange={(e) => setSupplierDueDate(e.target.value)} placeholder="요청 마감일 예: 2026-07-30" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="공급사 담당자 이메일" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={supplierMemo} onChange={(e) => setSupplierMemo(e.target.value)} placeholder="요청 메모" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addSupplierTask} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                문서 요청 생성
              </button>
              <button onClick={exportSupplierTaskCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                요청 리스트 CSV
              </button>
              <button onClick={exportSupplierUploadTemplateCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                업로드 양식 CSV
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="ALL">전체 공급사</option>
              {supplierList.map((supplier) => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>공급사</th>
                <th style={tableCellStyle(true)}>원료</th>
                <th style={tableCellStyle(true)}>필수문서</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>마감일</th>
                <th style={tableCellStyle(true)}>담당자</th>
                <th style={tableCellStyle(true)}>메모</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupplierTasks.map((task) => (
                <tr key={task.id}>
                  <td style={tableCellStyle()}>{task.supplier}</td>
                  <td style={tableCellStyle()}>{task.raw_code}<br />{task.raw_name}</td>
                  <td style={tableCellStyle()}>{task.required_document}</td>
                  <td style={{ ...tableCellStyle(), color: task.request_status === "Received" ? "#059669" : task.request_status === "Overdue" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{task.request_status}</td>
                  <td style={tableCellStyle()}>{task.due_date || "-"}</td>
                  <td style={tableCellStyle()}>{task.contact_email || "-"}</td>
                  <td style={tableCellStyle()}>{task.memo}</td>
                  <td style={tableCellStyle()}>
                    <select value={task.request_status} onChange={(e) => updateSupplierTaskStatus(task.id, e.target.value as SupplierPortalTask["request_status"])}>
                      <option value="Not Requested">Not Requested</option>
                      <option value="Requested">Requested</option>
                      <option value="Received">Received</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>Supplier Scorecard</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={generateSupplierScorecards} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                공급사 평가 갱신
              </button>
              <button onClick={exportSupplierScoreCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                평가 CSV
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>공급사</th>
                <th style={tableCellStyle(true)}>문서점수</th>
                <th style={tableCellStyle(true)}>가격점수</th>
                <th style={tableCellStyle(true)}>응답점수</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {supplierScores.map((score) => (
                <tr key={score.supplier}>
                  <td style={tableCellStyle()}>{score.supplier}</td>
                  <td style={tableCellStyle()}>{score.document_score}</td>
                  <td style={tableCellStyle()}>{score.price_score}</td>
                  <td style={tableCellStyle()}>{score.response_score}</td>
                  <td style={{ ...tableCellStyle(), color: score.risk_level === "HIGH" ? "#dc2626" : score.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{score.risk_level}</td>
                  <td style={tableCellStyle()}>{score.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>원료/문서 연결 흐름</h2>
          <ul>
            <li>Ingredient Module의 원료마스터에서 공급사와 원료 정보를 가져옵니다.</li>
            <li>Quality Module의 원료문서센터와 연결해 COA/MSDS/TDS 상태를 관리합니다.</li>
            <li>Supplier Module은 공급사별 문서 요청과 평가를 담당합니다.</li>
            <li>다음 Phase에서 실제 공급사 전용 로그인/업로드 권한으로 확장할 수 있습니다.</li>
          </ul>
        </section>
      </>
    );
  }

  function renderAdminModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Admin Module</h1>
          <p style={{ color: "#6b7280" }}>
            사용자/권한, Audit Log, System Health, Production Readiness, Backup/Restore를 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Users</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{adminStats.users}</div></div>
            <div style={cardStyle()}><strong>Active</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{adminStats.active}</div></div>
            <div style={cardStyle()}><strong>Inactive</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{adminStats.inactive}</div></div>
            <div style={cardStyle()}><strong>Audit</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{adminStats.audits}</div></div>
            <div style={cardStyle()}><strong>Health Warn</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{adminStats.healthWarn}</div></div>
            <div style={cardStyle()}><strong>Health Fail</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{adminStats.healthFail}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select value={productionMode} onChange={(e) => setProductionMode(e.target.value)}>
              <option value="Development">Development</option>
              <option value="Training">Training</option>
              <option value="Production">Production</option>
            </select>
            <button onClick={runEnterpriseHealthCheck} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              System Health Check
            </button>
            <button onClick={exportEnterpriseBackupSummaryCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Backup Summary CSV
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>사용자 / 권한 관리</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <input value={adminUserEmail} onChange={(e) => setAdminUserEmail(e.target.value)} placeholder="사용자 이메일" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={adminUserName} onChange={(e) => setAdminUserName(e.target.value)} placeholder="사용자명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={adminUserRole} onChange={(e) => setAdminUserRole(e.target.value as AdminUser["role"])} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="manager">manager</option>
              <option value="senior">senior</option>
              <option value="researcher">researcher</option>
              <option value="qa">qa</option>
              <option value="ra">ra</option>
              <option value="viewer">viewer</option>
              <option value="supplier">supplier</option>
              <option value="customer">customer</option>
            </select>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={addAdminUser} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                사용자 추가
              </button>
              <button onClick={exportAdminUsersCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                사용자 CSV
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
              <option value="ALL">전체</option>
              <option value="manager">manager</option>
              <option value="senior">senior</option>
              <option value="researcher">researcher</option>
              <option value="qa">qa</option>
              <option value="ra">ra</option>
              <option value="viewer">viewer</option>
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>이메일</th>
                <th style={tableCellStyle(true)}>이름</th>
                <th style={tableCellStyle(true)}>Role</th>
                <th style={tableCellStyle(true)}>Active</th>
                <th style={tableCellStyle(true)}>Last Login</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdminUsers.map((user) => (
                <tr key={user.id}>
                  <td style={tableCellStyle()}>{user.email}</td>
                  <td style={tableCellStyle()}>{user.display_name}</td>
                  <td style={tableCellStyle()}>
                    <select value={user.role} onChange={(e) => updateAdminUserRole(user.id, e.target.value as AdminUser["role"])}>
                      <option value="manager">manager</option>
                      <option value="senior">senior</option>
                      <option value="researcher">researcher</option>
                      <option value="qa">qa</option>
                      <option value="ra">ra</option>
                      <option value="viewer">viewer</option>
                      <option value="supplier">supplier</option>
                      <option value="customer">customer</option>
                    </select>
                  </td>
                  <td style={{ ...tableCellStyle(), color: user.is_active ? "#059669" : "#dc2626", fontWeight: "bold" }}>{user.is_active ? "ACTIVE" : "INACTIVE"}</td>
                  <td style={tableCellStyle()}>{user.last_login}</td>
                  <td style={tableCellStyle()}><button onClick={() => toggleAdminUserActive(user.id)}>{user.is_active ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>System Health</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Category</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Detail</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {healthItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>System Health Check를 실행하세요.</td></tr>}
              {healthItems.map((item) => (
                <tr key={item.category}>
                  <td style={tableCellStyle()}>{item.category}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>Audit Log</h2>
            <button onClick={exportAuditCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Audit CSV
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Actor</th>
                <th style={tableCellStyle(true)}>Action</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {adminAudits.map((audit) => (
                <tr key={audit.id}>
                  <td style={tableCellStyle()}>{audit.actor}</td>
                  <td style={tableCellStyle()}>{audit.action}</td>
                  <td style={tableCellStyle()}>{audit.module}</td>
                  <td style={tableCellStyle()}>{audit.target}</td>
                  <td style={tableCellStyle()}>{audit.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderSimpleModule(title: string, items: string[]) {
    return (
      <section style={cardStyle()}>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p style={{ color: "#6b7280" }}>다음 Phase에서 실제 데이터 연동과 모듈 분리를 진행합니다.</p>
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    );
  }

  function renderActive() {
    if (active === "overview") return renderOverview();
    if (active === "project") return renderProjectModule();
    if (active === "formula") return renderFormulaModule();
    if (active === "ingredient") return renderIngredientModule();
    if (active === "ai") return renderAiModule();
    if (active === "quality") return renderQualityModule();
    if (active === "regulation") return renderRegulationModule();
    if (active === "customer") return renderCustomerModule();
    if (active === "supplier") return renderSupplierModule();
    return renderAdminModule();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial", display: "grid", gridTemplateColumns: "280px 1fr" }}>
      <aside style={{ background: "#111827", color: "white", padding: "22px", height: "100vh", position: "sticky", top: 0, boxSizing: "border-box", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>PLM Enterprise</h2>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Phase 12 Executive Dashboard & Launch Gate</p>

        {menus.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              border: 0,
              borderRadius: "10px",
              padding: "10px",
              marginBottom: "8px",
              cursor: "pointer",
              background: active === item.key ? "#2563eb" : "#374151",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {item.label}
          </button>
        ))}

        <textarea
          value={migrationNote}
          onChange={(e) => setMigrationNote(e.target.value)}
          placeholder="전환 메모"
          rows={5}
          style={{ marginTop: "14px", width: "100%", boxSizing: "border-box", borderRadius: "8px", padding: "8px" }}
        />
      </aside>

      <section style={{ padding: "28px", display: "grid", gap: "18px", alignContent: "start", overflowX: "auto" }}>
        {renderActive()}
      </section>
    </main>
  );
}
