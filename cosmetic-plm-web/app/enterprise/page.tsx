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

  function renderOverview() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>PLM Enterprise Edition Phase 6</h1>
          <p style={{ color: "#6b7280" }}>
            Project / Formula / Ingredient Module에 이어 AI Module을 Enterprise 구조로 분리합니다. AI 처방, 규제, 안정성, 원가, 클레임 검토 흐름을 하나의 화면에서 검증합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
            <div style={cardStyle()}><strong>프로젝트</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.total}</div></div>
            <div style={cardStyle()}><strong>처방</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{formulaStats.total}</div></div>
            <div style={cardStyle()}><strong>성분</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{ingredientStats.total}</div></div>
            <div style={cardStyle()}><strong>원료</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{ingredientStats.rawTotal}</div></div>
            <div style={cardStyle()}><strong>규제주의</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#d97706" }}>{ingredientStats.restricted}</div></div>
            <div style={cardStyle()}><strong>AI 준비도</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{ingredients.length > 5 ? 85 : 70}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 6 목표</h2>
          <ul>
            <li>AI Formula Generator 2.0 구조 검증</li>
            <li>AI Ingredient / Regulation / Stability / BOM 흐름 통합</li>
            <li>컨셉, 판매국가, 목표원가, 클레임 기반 분석</li>
            <li>다음 단계에서 실제 PLM 데이터와 Supabase 기반 AI 서비스로 분리</li>
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
                    <button onClick={() => toggleFormulaLock(formula.id)}>{formula.is_locked ? "Unlock" : "Lock"}</button>
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
    if (active === "quality") return renderSimpleModule("Quality Module", ["원료문서센터", "Supplier Portal", "안정도관리", "AI 안정성예측"]);
    if (active === "regulation") return renderSimpleModule("Regulation Module", ["규제검증", "국가별규제", "Regulation Update", "AI 규제질의", "PIF/CPSR"]);
    if (active === "customer") return renderSimpleModule("Customer Module", ["Customer Portal Lite", "고객제출패키지", "샘플 피드백", "고객별 현황"]);
    if (active === "supplier") return renderSimpleModule("Supplier Module", ["Supplier Portal Lite", "문서 요청", "만료 알림", "업로드 양식"]);
    return renderSimpleModule("Admin Module", ["사용자/권한", "Audit Log", "System Health", "Production Readiness", "Backup"]);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial", display: "grid", gridTemplateColumns: "280px 1fr" }}>
      <aside style={{ background: "#111827", color: "white", padding: "22px", height: "100vh", position: "sticky", top: 0, boxSizing: "border-box", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>PLM Enterprise</h2>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Phase 6 AI Module</p>

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
