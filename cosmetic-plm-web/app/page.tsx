"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type RawMaterial = {
  id: string;
  raw_code: string;
  raw_name: string;
  supplier: string;
  unit_price: number;
  currency: string;
  moq: number;
  deleted_at?: string;
  deleted_by?: string;
};

type MaterialDocument = {
  id: string;
  document_type: string;
  document_title: string;
  document_url: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  issue_date: string;
  expiry_date: string;
  uploaded_by?: string;
  remark: string;
  raw_materials: RawMaterial;
};

type Ingredient = {
  id: string;
  inci_name: string;
  korean_name: string;
  chinese_name: string;
  japanese_name: string;
  cas_no: string;
  ec_no: string;
  function_ko: string;
  iecic_status: string;
  cosmos_status: string;
  vegan_status: string;
  max_use_level: string;
  regulation_note: string;
  ewg_grade: string;
  allergen_note: string;
};

type GlobalIngredient = {
  id: string;
  inci_name: string;
  korean_name: string;
  chinese_name: string;
  japanese_name: string;
  cas_no: string;
  ec_no: string;
  function_ko: string;
  function_en: string;
  iecic_status: string;
  cosmos_status: string;
  vegan_status: string;
  halal_status?: string;
  rspo_status?: string;
  eu_status?: string;
  china_status?: string;
  japan_status?: string;
  asean_status?: string;
  max_use_level: string;
  max_use_percent?: number;
  regulation_note: string;
  ewg_grade: string;
  allergen_note: string;
  reference_source?: string;
  update_cycle?: string;
  last_verified_at?: string;
  deleted_at?: string;
  deleted_by?: string;
};

type Composition = {
  id: string;
  percentage: number;
  raw_materials: RawMaterial;
  ingredients: Ingredient;
};

type Formula = {
  id: string;
  formula_code: string;
  formula_name: string;
  version: string;
  parent_formula_id: string | null;
  revision_no: number;
  revision_note: string | null;
  target_cost: number;
  selling_price: number;
  deleted_at?: string;
  deleted_by?: string;
  is_locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  lock_reason?: string;
  prepared_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  approved_at?: string;
};

type Project = {
  id: string;
  project_code: string;
  customer_name: string;
  project_name: string;
  researcher: string;
  status: string;
  target_launch_date: string;
  description: string;
  product_type: string;
  dosage_form: string;
  target_user: string;
  concept_keywords: string;
  target_price: number;
  forbidden_ingredients: string;
  required_ingredients: string;
  customer_brief: string;
};

type ProjectFormula = {
  id: string;
  is_current: boolean;
  projects: Project;
  formulas: Formula;
};

type StabilityTest = {
  id: string;
  test_code: string;
  test_type: string;
  start_date: string;
  week_1_result: string;
  week_2_result: string;
  week_4_result: string;
  week_8_result: string;
  week_12_result: string;
  appearance_result: string;
  color_result: string;
  odor_result: string;
  viscosity_result: string;
  ph_result: string;
  specific_gravity_result: string;
  final_result: string;
  remark: string;
  projects: Project;
  formulas: Formula;
};

type ApprovalRequest = {
  id: string;
  request_type: string;
  status: string;
  requester: string;
  reviewer: string;
  request_note: string;
  review_note: string;
  created_at: string;
  reviewed_at: string;
  senior_reviewer?: string;
  qa_reviewer?: string;
  ra_reviewer?: string;
  manager_approver?: string;
  senior_approved_at?: string;
  qa_approved_at?: string;
  ra_approved_at?: string;
  manager_approved_at?: string;
  release_note?: string;
  projects: Project;
  formulas: Formula;
};

type BomCost = {
  id: string;
  packaging_cost: number;
  filling_cost: number;
  labor_cost: number;
  logistics_cost: number;
  overhead_rate: number;
  target_margin_rate: number;
  remark: string;
  formulas: Formula;
  deleted_at?: string;
  deleted_by?: string;
};

type AuditLog = {
  id: string;
  module_name: string;
  record_id: string;
  action_type: string;
  before_data: any;
  after_data: any;
  field_name?: string;
  before_value?: string;
  after_value?: string;
  change_summary?: string;
  diff_data?: any;
  user_name: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active?: boolean;
};

type CountryRegulation = {
  id: string;
  country_code: string;
  country_name: string;
  inci_name: string;
  cas_no: string;
  regulation_type: string;
  max_percentage: number;
  is_prohibited: boolean;
  warning_message: string;
  reference_note: string;
  updated_at: string;
};

type RegulationUpdateRow = {
  country_code: string;
  country_name: string;
  inci_name: string;
  cas_no: string;
  regulation_type: string;
  max_percentage: number;
  is_prohibited: boolean;
  warning_message: string;
  reference_note: string;
  source_name?: string;
  source_url?: string;
  update_type?: string;
  matched_existing_id?: string;
  raw_text?: string;
  confidence?: number;
};

type ProjectStage = {
  id: string;
  stage_name: string;
  stage_status: string;
  planned_date: string;
  actual_date: string;
  remark: string;
  projects: Project;
};

type FormulaItem = {
  id: string;
  percentage: number;
  phase: string;
  remark: string;
  formulas: Formula;
  raw_materials: RawMaterial;
  deleted_at?: string;
  deleted_by?: string;
};

type ProcessStep = {
  id: string;
  phase: string;
  step_no: number;
  process_name: string;
  temperature: string;
  rpm: string;
  time_min: string;
  instruction: string;
  formulas: Formula;
};

type BreakdownItem = {
  inci_name: string;
  korean_name: string;
  cas_no: string;
  ec_no: string;
  function_ko: string;
  iecic_status?: string;
  cosmos_status?: string;
  vegan_status?: string;
  regulation_note?: string;
  final_percentage: number;
};

type FullIlItem = {
  formula_code: string;
  formula_name: string;
  raw_code: string;
  raw_name: string;
  raw_input_percentage: number;
  inci_name: string;
  korean_name: string;
  composition_percentage: number;
  final_percentage: number;
  cas_no: string;
  ec_no: string;
  function_ko: string;
};

type AiFormulaSuggestion = {
  phase: string;
  inci_name: string;
  korean_name: string;
  purpose: string;
  recommended_percent: number;
  min_percent: number;
  max_percent: number;
  raw_material_id?: string;
  raw_material_name?: string;
  unit_price?: number;
  cost?: number;
  note: string;
};

type AiFormulaResult = {
  formula_type: string;
  concept: string;
  target_ph: string;
  target_viscosity: string;
  total_percent: number;
  estimated_cost: number;
  risk_notes: string[];
  suggestions: AiFormulaSuggestion[];
};

type AiIntelligenceResult = {
  moisture_score: number;
  soothing_score: number;
  cost_score: number;
  regulation_score: number;
  stability_score: number;
  phase_balance: Record<string, number>;
  problem_notes: string[];
  cost_saving_notes: string[];
  regulation_summary: string[];
};

type AiIngredientAnalysis = {
  ingredient: GlobalIngredient;
  matched_raw_materials: RawMaterial[];
  regulation_rows: CountryRegulation[];
  recommended_range: string;
  stability_notes: string[];
  formulation_notes: string[];
  substitute_candidates: GlobalIngredient[];
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  score: number;
};

export default function Home() {
  const [menu, setMenu] = useState("dashboard");

  const [authUser, setAuthUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authLoading, setAuthLoading] = useState(true);
  const inputStyle = {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const buttonStyle = {
    padding: "10px 14px",
    border: "0",
    borderRadius: "6px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "10px",
    marginBottom: "24px",
    fontSize: "14px",
  };

  const thStyle = {
    border: "1px solid #d1d5db",
    padding: "10px",
    background: "#f3f4f6",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
  };

  const tdStyle = {
    border: "1px solid #d1d5db",
    padding: "10px",
    verticalAlign: "top" as const,
  };

  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "18px",
    background: "white",
    marginBottom: "20px",
  };



  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [globalIngredients, setGlobalIngredients] = useState<GlobalIngredient[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFormulas, setProjectFormulas] = useState<ProjectFormula[]>([]);
  const [stabilityTests, setStabilityTests] = useState<StabilityTest[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
  const [bomCosts, setBomCosts] = useState<BomCost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [countryRegulations, setCountryRegulations] = useState<CountryRegulation[]>([]);
  const [trashMaterials, setTrashMaterials] = useState<RawMaterial[]>([]);
  const [trashGlobalIngredients, setTrashGlobalIngredients] = useState<GlobalIngredient[]>([]);
  const [trashFormulas, setTrashFormulas] = useState<Formula[]>([]);
  const [trashFormulaItems, setTrashFormulaItems] = useState<FormulaItem[]>([]);
  const [trashBomCosts, setTrashBomCosts] = useState<BomCost[]>([]);
  const [formulaItems, setFormulaItems] = useState<FormulaItem[]>([]);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [materialDocuments, setMaterialDocuments] = useState<MaterialDocument[]>([]);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);
  const [fullIlItems, setFullIlItems] = useState<FullIlItem[]>([]);

  const [rawCode, setRawCode] = useState("");
  const [rawName, setRawName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [rawUnitPrice, setRawUnitPrice] = useState("");
  const [rawCurrency, setRawCurrency] = useState("KRW");
  const [rawMoq, setRawMoq] = useState("");
  const [rawGlobalSearch, setRawGlobalSearch] = useState("");
  const [rawGlobalIngredientId, setRawGlobalIngredientId] = useState("");
  const [rawAutoComposition, setRawAutoComposition] = useState(true);

  const [inciName, setInciName] = useState("");
  const [koreanName, setKoreanName] = useState("");
  const [casNo, setCasNo] = useState("");
  const [ecNo, setEcNo] = useState("");
  const [functionKo, setFunctionKo] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [japaneseName, setJapaneseName] = useState("");
  const [iecicStatus, setIecicStatus] = useState("");
  const [cosmosStatus, setCosmosStatus] = useState("");
  const [veganStatus, setVeganStatus] = useState("");
  const [maxUseLevel, setMaxUseLevel] = useState("");
  const [regulationNote, setRegulationNote] = useState("");
  const [ewgGrade, setEwgGrade] = useState("");
  const [allergenNote, setAllergenNote] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalIngredientPage, setGlobalIngredientPage] = useState(1);
  const [globalIngredientPageSize, setGlobalIngredientPageSize] = useState(50);
  const [selectedGlobalIngredientId, setSelectedGlobalIngredientId] = useState("");
  const [globalInciName, setGlobalInciName] = useState("");
  const [globalKoreanName, setGlobalKoreanName] = useState("");
  const [globalChineseName, setGlobalChineseName] = useState("");
  const [globalJapaneseName, setGlobalJapaneseName] = useState("");
  const [globalCasNo, setGlobalCasNo] = useState("");
  const [globalEcNo, setGlobalEcNo] = useState("");
  const [globalFunctionKo, setGlobalFunctionKo] = useState("");
  const [globalFunctionEn, setGlobalFunctionEn] = useState("");
  const [globalIecicStatus, setGlobalIecicStatus] = useState("");
  const [globalCosmosStatus, setGlobalCosmosStatus] = useState("");
  const [globalVeganStatus, setGlobalVeganStatus] = useState("");
  const [globalMaxUseLevel, setGlobalMaxUseLevel] = useState("");
  const [globalRegulationNote, setGlobalRegulationNote] = useState("");
  const [globalEwgGrade, setGlobalEwgGrade] = useState("");
  const [globalAllergenNote, setGlobalAllergenNote] = useState("");
  const [globalUploadStatus, setGlobalUploadStatus] = useState("");
  const [bulkWizardRows, setBulkWizardRows] = useState<Record<string, string>[]>([]);
  const [bulkWizardHeaders, setBulkWizardHeaders] = useState<string[]>([]);
  const [bulkWizardMappedCount, setBulkWizardMappedCount] = useState(0);
  const [bulkWizardStatus, setBulkWizardStatus] = useState("");

  const [rawMaterialId, setRawMaterialId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [percentage, setPercentage] = useState("");

  const [compositionGlobalSearch, setCompositionGlobalSearch] = useState("");
  const [compositionGlobalId, setCompositionGlobalId] = useState("");
  const [compositionRawId, setCompositionRawId] = useState("");
  const [compositionPercent, setCompositionPercent] = useState("");

  const [formulaCode, setFormulaCode] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [formulaVersion, setFormulaVersion] = useState("1.0");
  const [formulaTargetCost, setFormulaTargetCost] = useState("");
  const [formulaSellingPrice, setFormulaSellingPrice] = useState("");

  const [formulaId, setFormulaId] = useState("");
  const [formulaRawMaterialId, setFormulaRawMaterialId] = useState("");
  const [formulaItemPercentage, setFormulaItemPercentage] = useState("");
  const [formulaItemPhase, setFormulaItemPhase] = useState("Phase A");
  const [formulaItemRemark, setFormulaItemRemark] = useState("");

  const [formulaSearch, setFormulaSearch] = useState("");
  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [formulaTab, setFormulaTab] = useState("basic");
  const [compareFormulaIdA, setCompareFormulaIdA] = useState("");
  const [compareFormulaIdB, setCompareFormulaIdB] = useState("");

  const [aiFormulaType, setAiFormulaType] = useState("수분크림");
  const [aiConcept, setAiConcept] = useState("고보습, 저자극");
  const [aiTargetCost, setAiTargetCost] = useState("5000");
  const [aiTargetCountries, setAiTargetCountries] = useState("KR,EU,CN,US,JP,ASEAN");
  const [aiAvoidIngredients, setAiAvoidIngredients] = useState("");
  const [aiRequiredIngredients, setAiRequiredIngredients] = useState("");
  const [aiDraftCode, setAiDraftCode] = useState("");
  const [aiDraftName, setAiDraftName] = useState("");
  const [aiResult, setAiResult] = useState<AiFormulaResult | null>(null);
  const [aiIntelligence, setAiIntelligence] = useState<AiIntelligenceResult | null>(null);
  const [aiIngredientSearch, setAiIngredientSearch] = useState("");
  const [aiIngredientId, setAiIngredientId] = useState("");
  const [aiIngredientAnalysis, setAiIngredientAnalysis] = useState<AiIngredientAnalysis | null>(null);

  const [breakdownFormulaId, setBreakdownFormulaId] = useState("");
  const [fullIlFormulaId, setFullIlFormulaId] = useState("");
  const [costFormulaId, setCostFormulaId] = useState("");
  const [batchFormulaId, setBatchFormulaId] = useState("");
  const [batchSize, setBatchSize] = useState("100");

  const [processFormulaId, setProcessFormulaId] = useState("");
  const [processPhase, setProcessPhase] = useState("Phase A");
  const [processStepNo, setProcessStepNo] = useState("");
  const [processName, setProcessName] = useState("");
  const [processTemperature, setProcessTemperature] = useState("");
  const [processRpm, setProcessRpm] = useState("");
  const [processTimeMin, setProcessTimeMin] = useState("");
  const [processInstruction, setProcessInstruction] = useState("");

  const [docRawMaterialId, setDocRawMaterialId] = useState("");
  const [docType, setDocType] = useState("COA");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docIssueDate, setDocIssueDate] = useState("");
  const [docExpiryDate, setDocExpiryDate] = useState("");
  const [docRemark, setDocRemark] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploadStatus, setDocUploadStatus] = useState("");
  const [sheetFormulaId, setSheetFormulaId] = useState("");
  const [labelFormulaId, setLabelFormulaId] = useState("");
  const [validationFormulaId, setValidationFormulaId] = useState("");
  const [regulationFormulaId, setRegulationFormulaId] = useState("");
  const [globalRegFormulaId, setGlobalRegFormulaId] = useState("");
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(["KR", "EU", "CN", "US", "JP", "ASEAN"]);
  const [countryCodeInput, setCountryCodeInput] = useState("EU");
  const [countryNameInput, setCountryNameInput] = useState("European Union");
  const [regInciInput, setRegInciInput] = useState("");
  const [regCasInput, setRegCasInput] = useState("");
  const [regTypeInput, setRegTypeInput] = useState("Restricted");
  const [regMaxInput, setRegMaxInput] = useState("");
  const [regProhibitedInput, setRegProhibitedInput] = useState(false);
  const [regWarningInput, setRegWarningInput] = useState("");
  const [regReferenceInput, setRegReferenceInput] = useState("");
  const [regSeedStatus, setRegSeedStatus] = useState("");
  const [regUpdateSourceName, setRegUpdateSourceName] = useState("EU CosIng / Annex Update");
  const [regUpdateSourceUrl, setRegUpdateSourceUrl] = useState("");
  const [regUpdateRows, setRegUpdateRows] = useState<RegulationUpdateRow[]>([]);
  const [regUpdateStatus, setRegUpdateStatus] = useState("");
  const [regUpdateFilter, setRegUpdateFilter] = useState("ALL");
  const [regOfficialText, setRegOfficialText] = useState("");
  const [regAutoCountryCode, setRegAutoCountryCode] = useState("EU");
  const [regAutoCountryName, setRegAutoCountryName] = useState("European Union");
  const [regAutoParseStatus, setRegAutoParseStatus] = useState("");
  const [regAutoReviewOnly, setRegAutoReviewOnly] = useState(true);
  const [packageFormulaId, setPackageFormulaId] = useState("");

  const [lockFormulaId, setLockFormulaId] = useState("");
  const [lockReason, setLockReason] = useState("승인 완료");
  const [preparedBy, setPreparedBy] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const [projectCode, setProjectCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [researcher, setResearcher] = useState("");
  const [projectStatus, setProjectStatus] = useState("개발중");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [productType, setProductType] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [conceptKeywords, setConceptKeywords] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [forbiddenIngredients, setForbiddenIngredients] = useState("");
  const [requiredIngredients, setRequiredIngredients] = useState("");
  const [customerBrief, setCustomerBrief] = useState("");

  const [mappingProjectId, setMappingProjectId] = useState("");
  const [mappingFormulaId, setMappingFormulaId] = useState("");
  const [mappingIsCurrent, setMappingIsCurrent] = useState(false);

  const [stabilityTestCode, setStabilityTestCode] = useState("");
  const [stabilityProjectId, setStabilityProjectId] = useState("");
  const [stabilityFormulaId, setStabilityFormulaId] = useState("");
  const [stabilityTestType, setStabilityTestType] = useState("가속");
  const [stabilityStartDate, setStabilityStartDate] = useState("");
  const [week1Result, setWeek1Result] = useState("");
  const [week2Result, setWeek2Result] = useState("");
  const [week4Result, setWeek4Result] = useState("");
  const [week8Result, setWeek8Result] = useState("");
  const [week12Result, setWeek12Result] = useState("");
  const [appearanceResult, setAppearanceResult] = useState("");
  const [colorResult, setColorResult] = useState("");
  const [odorResult, setOdorResult] = useState("");
  const [viscosityResult, setViscosityResult] = useState("");
  const [phResult, setPhResult] = useState("");
  const [specificGravityResult, setSpecificGravityResult] = useState("");
  const [stabilityFinalResult, setStabilityFinalResult] = useState("진행중");
  const [stabilityRemark, setStabilityRemark] = useState("");

  const [approvalProjectId, setApprovalProjectId] = useState("");
  const [approvalFormulaId, setApprovalFormulaId] = useState("");
  const [approvalRequestType, setApprovalRequestType] = useState("처방승인");
  const [approvalRequester, setApprovalRequester] = useState("");
  const [approvalReviewer, setApprovalReviewer] = useState("");
  const [approvalRequestNote, setApprovalRequestNote] = useState("");

  const [stageProjectId, setStageProjectId] = useState("");
  const [stageName, setStageName] = useState("고객문의");
  const [stageStatus, setStageStatus] = useState("대기");
  const [plannedDate, setPlannedDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [stageRemark, setStageRemark] = useState("");

  const [bomFormulaId, setBomFormulaId] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [fillingCost, setFillingCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [logisticsCost, setLogisticsCost] = useState("");
  const [overheadRate, setOverheadRate] = useState("10");
  const [targetMarginRate, setTargetMarginRate] = useState("30");
  const [bomRemark, setBomRemark] = useState("");

  const [auditUserName, setAuditUserName] = useState("PLM User");

  async function loadUserProfile(user: any) {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setUserProfile(data as UserProfile);
      setAuditUserName((data as UserProfile).display_name || user.email || "PLM User");
      return;
    }

    const profilePayload = {
      id: user.id,
      email: user.email || "",
      display_name: user.email || "PLM User",
      role: "Researcher",
    };

    await supabase.from("user_profiles").insert([profilePayload]);
    setUserProfile(profilePayload);
    setAuditUserName(profilePayload.display_name);
  }

  async function signIn() {
    if (!authEmail || !authPassword) {
      alert("이메일과 비밀번호를 입력하세요.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      alert("로그인 오류: " + error.message);
      return;
    }
  }

  async function signUp() {
    if (!authEmail || !authPassword) {
      alert("이메일과 비밀번호를 입력하세요.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      alert("회원가입 오류: " + error.message);
      return;
    }

    if (data.user) {
      const profilePayload = {
        id: data.user.id,
        email: authEmail,
        display_name: authDisplayName || authEmail,
        role: "Researcher",
      };

      await supabase.from("user_profiles").upsert([profilePayload]);
      alert("회원가입이 완료되었습니다. 이메일 확인 설정이 켜져 있으면 메일 인증 후 로그인하세요.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setUserProfile(null);
  }

  function getUserRole() {
    return String(userProfile?.role || "viewer").toLowerCase();
  }

  function getUserRoleLabel() {
    const role = getUserRole();

    if (role === "admin") return "Admin";
    if (role === "manager") return "Manager";
    if (role === "qa") return "QA";
    if (role === "ra") return "RA";
    if (role === "senior") return "Senior";
    if (role === "researcher") return "Researcher";
    if (role === "viewer") return "Viewer";

    return role;
  }

  function isAdmin() {
    return getUserRole() === "admin";
  }

  function canEdit() {
    return ["admin", "manager", "senior", "researcher", "qa", "ra"].includes(getUserRole());
  }

  function canDelete() {
    return ["admin", "manager"].includes(getUserRole());
  }

  function canApprove() {
    return ["admin", "manager", "senior", "qa", "ra"].includes(getUserRole());
  }

  function assertCanEdit() {
    if (!canEdit()) {
      alert("수정/등록 권한이 없습니다. 관리자에게 권한을 요청하세요.");
      return false;
    }

    return true;
  }

  function assertCanDelete() {
    if (!canDelete()) {
      alert("삭제 권한이 없습니다. 관리자 또는 팀장 권한이 필요합니다.");
      return false;
    }

    return true;
  }

  function assertCanApprove() {
    if (!canApprove()) {
      alert("승인 처리 권한이 없습니다. 선임/팀장/관리자 권한이 필요합니다.");
      return false;
    }

    return true;
  }

  async function loadAll() {
    const { data: rawData } = await supabase
      .from("raw_materials")
      .select("*")
      .is("deleted_at", null)
      .order("raw_code");

    const { data: trashRawData } = await supabase
      .from("raw_materials")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const { data: ingData } = await supabase
      .from("ingredients")
      .select("*")
      .order("inci_name");

    const { data: globalIngData } = await supabase
      .from("ingredient_master_global")
      .select("*")
      .is("deleted_at", null)
      .order("inci_name");

    const { data: trashGlobalIngData } = await supabase
      .from("ingredient_master_global")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const { data: compData } = await supabase
      .from("raw_compositions")
      .select(`
        id,
        percentage,
        raw_materials ( id, raw_code, raw_name, supplier, unit_price, currency, moq ),
        ingredients ( id, inci_name, korean_name, chinese_name, japanese_name, cas_no, ec_no, function_ko, iecic_status, cosmos_status, vegan_status, max_use_level, regulation_note, ewg_grade, allergen_note )
      `);

    const { data: formulaData } = await supabase
      .from("formulas")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const { data: trashFormulaData } = await supabase
      .from("formulas")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: projectFormulaData } = await supabase
      .from("project_formulas")
      .select(`
        id,
        is_current,
        projects ( id, project_code, customer_name, project_name, researcher, status, target_launch_date, description, product_type, dosage_form, target_user, concept_keywords, target_price, forbidden_ingredients, required_ingredients, customer_brief ),
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .order("created_at", { ascending: false });

    const { data: stabilityData } = await supabase
      .from("stability_tests")
      .select(`
        id,
        test_code,
        test_type,
        start_date,
        week_1_result,
        week_2_result,
        week_4_result,
        week_8_result,
        week_12_result,
        appearance_result,
        color_result,
        odor_result,
        viscosity_result,
        ph_result,
        specific_gravity_result,
        final_result,
        remark,
        projects ( id, project_code, customer_name, project_name, researcher, status, target_launch_date, description, product_type, dosage_form, target_user, concept_keywords, target_price, forbidden_ingredients, required_ingredients, customer_brief ),
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .order("created_at", { ascending: false });

    const { data: approvalData } = await supabase
      .from("approval_requests")
      .select(`
        id,
        request_type,
        status,
        requester,
        reviewer,
        request_note,
        review_note,
        created_at,
        reviewed_at,
        senior_reviewer,
        qa_reviewer,
        ra_reviewer,
        manager_approver,
        senior_approved_at,
        qa_approved_at,
        ra_approved_at,
        manager_approved_at,
        release_note,
        projects ( id, project_code, customer_name, project_name, researcher, status, target_launch_date, description, product_type, dosage_form, target_user, concept_keywords, target_price, forbidden_ingredients, required_ingredients, customer_brief ),
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .order("created_at", { ascending: false });

    const { data: stageData } = await supabase
      .from("project_stages")
      .select(`
        id,
        stage_name,
        stage_status,
        planned_date,
        actual_date,
        remark,
        projects ( id, project_code, customer_name, project_name, researcher, status, target_launch_date, description, product_type, dosage_form, target_user, concept_keywords, target_price, forbidden_ingredients, required_ingredients, customer_brief )
      `)
      .order("created_at", { ascending: false });

    const { data: bomData } = await supabase
      .from("bom_costs")
      .select(`
        id,
        packaging_cost,
        filling_cost,
        labor_cost,
        logistics_cost,
        overhead_rate,
        target_margin_rate,
        remark,
        deleted_at,
        deleted_by,
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const { data: trashBomData } = await supabase
      .from("bom_costs")
      .select(`
        id,
        packaging_cost,
        filling_cost,
        labor_cost,
        logistics_cost,
        overhead_rate,
        target_margin_rate,
        remark,
        deleted_at,
        deleted_by,
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const { data: auditData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: countryRegData } = await supabase
      .from("country_regulations")
      .select("*")
      .order("country_code");

    const { data: formulaItemData } = await supabase
      .from("formula_items")
      .select(`
        id,
        percentage,
        phase,
        remark,
        deleted_at,
        deleted_by,
        formulas ( id, formula_code, formula_name, version, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at ),
        raw_materials ( id, raw_code, raw_name, supplier, unit_price, currency, moq )
      `)
      .is("deleted_at", null);

    const { data: trashFormulaItemData } = await supabase
      .from("formula_items")
      .select(`
        id,
        percentage,
        phase,
        remark,
        deleted_at,
        deleted_by,
        formulas ( id, formula_code, formula_name, version, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at ),
        raw_materials ( id, raw_code, raw_name, supplier, unit_price, currency, moq )
      `)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const { data: processStepData } = await supabase
      .from("process_steps")
      .select(`
        id,
        phase,
        step_no,
        process_name,
        temperature,
        rpm,
        time_min,
        instruction,
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price, is_locked, locked_at, locked_by, lock_reason, prepared_by, reviewed_by, approved_by, approved_at )
      `)
      .order("phase")
      .order("step_no");

    const { data: materialDocumentData } = await supabase
      .from("material_documents")
      .select(`
        id,
        document_type,
        document_title,
        document_url,
        file_path,
        file_name,
        file_size,
        mime_type,
        issue_date,
        expiry_date,
        uploaded_by,
        remark,
        raw_materials ( id, raw_code, raw_name, supplier, unit_price, currency, moq )
      `)
      .order("created_at", { ascending: false });

    setMaterials(rawData || []);
    setIngredients(ingData || []);
    setGlobalIngredients(globalIngData || []);
    setCompositions((compData as unknown as Composition[]) || []);
    setFormulas(formulaData || []);
    setProjects(projectData || []);
    setProjectFormulas((projectFormulaData as unknown as ProjectFormula[]) || []);
    setStabilityTests((stabilityData as unknown as StabilityTest[]) || []);
    setApprovalRequests((approvalData as unknown as ApprovalRequest[]) || []);
    setProjectStages((stageData as unknown as ProjectStage[]) || []);
    setBomCosts((bomData as unknown as BomCost[]) || []);
    setAuditLogs((auditData as unknown as AuditLog[]) || []);
    setCountryRegulations((countryRegData as unknown as CountryRegulation[]) || []);
    setTrashMaterials((trashRawData as unknown as RawMaterial[]) || []);
    setTrashGlobalIngredients((trashGlobalIngData as unknown as GlobalIngredient[]) || []);
    setTrashFormulas((trashFormulaData as unknown as Formula[]) || []);
    setTrashFormulaItems((trashFormulaItemData as unknown as FormulaItem[]) || []);
    setTrashBomCosts((trashBomData as unknown as BomCost[]) || []);
    setFormulaItems((formulaItemData as unknown as FormulaItem[]) || []);
    setProcessSteps((processStepData as unknown as ProcessStep[]) || []);
    setMaterialDocuments((materialDocumentData as unknown as MaterialDocument[]) || []);
  }

  function getFilteredGlobalIngredients() {
    const keyword = globalSearch.trim().toLowerCase();

    if (!keyword) {
      return globalIngredients;
    }

    return globalIngredients.filter((item) => {
      const searchableText = [
        item.inci_name,
        item.korean_name,
        item.chinese_name,
        item.japanese_name,
        item.cas_no,
        item.ec_no,
        item.function_ko,
        item.function_en,
        item.iecic_status,
        item.cosmos_status,
        item.vegan_status,
        item.halal_status,
        item.rspo_status,
        item.eu_status,
        item.china_status,
        item.japan_status,
        item.asean_status,
        item.ewg_grade,
        item.allergen_note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }

  function getPaginatedGlobalIngredients() {
    const filtered = getFilteredGlobalIngredients();
    const start = (globalIngredientPage - 1) * globalIngredientPageSize;

    return filtered.slice(start, start + globalIngredientPageSize);
  }

  function getGlobalIngredientTotalPages() {
    return Math.max(1, Math.ceil(getFilteredGlobalIngredients().length / globalIngredientPageSize));
  }

  function resetGlobalIngredientPage() {
    setGlobalIngredientPage(1);
  }

  function fillIngredientFromGlobal(item: GlobalIngredient) {
    setSelectedGlobalIngredientId(item.id);
    setInciName(item.inci_name || "");
    setKoreanName(item.korean_name || "");
    setChineseName(item.chinese_name || "");
    setJapaneseName(item.japanese_name || "");
    setCasNo(item.cas_no || "");
    setEcNo(item.ec_no || "");
    setFunctionKo(item.function_ko || "");
    setIecicStatus(item.iecic_status || "");
    setCosmosStatus(item.cosmos_status || "");
    setVeganStatus(item.vegan_status || "");
    setMaxUseLevel(item.max_use_level || "");
    setRegulationNote(item.regulation_note || "");
    setEwgGrade(item.ewg_grade || "");
    setAllergenNote(item.allergen_note || "");
  }

  function parseCsvLine(line: string) {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && insideQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result;
  }

  function getGlobalIngredientCsvHeaders() {
    return [
      "inci_name",
      "korean_name",
      "chinese_name",
      "japanese_name",
      "cas_no",
      "ec_no",
      "function_ko",
      "function_en",
      "iecic_status",
      "cosmos_status",
      "vegan_status",
      "halal_status",
      "rspo_status",
      "eu_status",
      "china_status",
      "japan_status",
      "asean_status",
      "max_use_level",
      "max_use_percent",
      "regulation_note",
      "ewg_grade",
      "allergen_note",
      "reference_source",
      "update_cycle",
      "last_verified_at",
    ];
  }

  function downloadGlobalCsvTemplate() {
    const headers = getGlobalIngredientCsvHeaders();

    const sample = [
      "Glycerin",
      "글리세린",
      "甘油",
      "グリセリン",
      "56-81-5",
      "200-289-5",
      "보습제",
      "Humectant",
      "Listed",
      "Approved",
      "Vegan",
      "Allowed",
      "RSPO MB",
      "Allowed",
      "Listed",
      "Allowed",
      "Allowed",
      "제한 없음",
      "",
      "사용제한 원료 아님",
      "1",
      "해당 없음",
      "Internal Master",
      "Quarterly",
      "",
    ];

    downloadCsv("global_ingredient_master_template_v20.csv", headers, [sample]);
  }

  function exportGlobalIngredientMasterCsv() {
    const headers = getGlobalIngredientCsvHeaders();

    const rows = globalIngredients.map((item) => [
      item.inci_name || "",
      item.korean_name || "",
      item.chinese_name || "",
      item.japanese_name || "",
      item.cas_no || "",
      item.ec_no || "",
      item.function_ko || "",
      item.function_en || "",
      item.iecic_status || "",
      item.cosmos_status || "",
      item.vegan_status || "",
      item.halal_status || "",
      item.rspo_status || "",
      item.eu_status || "",
      item.china_status || "",
      item.japan_status || "",
      item.asean_status || "",
      item.max_use_level || "",
      item.max_use_percent ?? "",
      item.regulation_note || "",
      item.ewg_grade || "",
      item.allergen_note || "",
      item.reference_source || "",
      item.update_cycle || "",
      item.last_verified_at || "",
    ]);

    downloadCsv("global_ingredient_master_export_v20.csv", headers, rows);
  }

  function normalizeColumnName(name: string) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[()\[\]{}]/g, "")
      .replace(/[-/]/g, "_");
  }

  function getGlobalIngredientColumnAliases() {
    return {
      inci_name: ["inci", "inci_name", "inci명", "inci_name_en", "ingredient", "ingredient_name", "성분명", "영문명"],
      korean_name: ["korean", "korean_name", "국문", "국문명", "kor_name", "name_ko"],
      chinese_name: ["chinese", "chinese_name", "중문", "중문명", "name_cn"],
      japanese_name: ["japanese", "japanese_name", "일문", "일문명", "name_jp"],
      cas_no: ["cas", "cas_no", "cas_number", "cas번호", "cas_no."],
      ec_no: ["ec", "ec_no", "ec_number", "einecs", "ec번호"],
      function_ko: ["function_ko", "기능", "기능국문", "효능", "용도"],
      function_en: ["function_en", "function", "function_english", "기능영문"],
      iecic_status: ["iecic", "iecic_status", "중국iecic", "china_iecic"],
      cosmos_status: ["cosmos", "cosmos_status"],
      vegan_status: ["vegan", "vegan_status", "비건"],
      halal_status: ["halal", "halal_status", "할랄"],
      rspo_status: ["rspo", "rspo_status"],
      eu_status: ["eu", "eu_status", "europe", "유럽"],
      china_status: ["china", "china_status", "cn_status", "중국"],
      japan_status: ["japan", "japan_status", "jp_status", "일본"],
      asean_status: ["asean", "asean_status"],
      max_use_level: ["max_use_level", "max_use", "배합한도", "사용한도", "limit"],
      max_use_percent: ["max_use_percent", "max_percent", "max_percentage", "최대사용량", "최대함량"],
      regulation_note: ["regulation_note", "regulation", "규제", "규제사항", "note"],
      ewg_grade: ["ewg", "ewg_grade", "ewg등급"],
      allergen_note: ["allergen", "allergen_note", "알러젠", "알레르겐"],
      reference_source: ["reference", "reference_source", "source", "출처", "근거"],
      update_cycle: ["update_cycle", "cycle", "업데이트주기"],
      last_verified_at: ["last_verified_at", "verified", "verified_at", "검증일", "확인일"],
    } as Record<string, string[]>;
  }

  function mapCsvRecordToGlobalIngredient(headers: string[], row: string[]) {
    const aliases = getGlobalIngredientColumnAliases();
    const normalizedHeaders = headers.map((header) => normalizeColumnName(header));

    const getValue = (targetKey: string) => {
      const candidates = aliases[targetKey] || [targetKey];
      const normalizedCandidates = candidates.map((item) => normalizeColumnName(item));
      const index = normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));

      return index >= 0 ? row[index] || "" : "";
    };

    return {
      inci_name: getValue("inci_name"),
      korean_name: getValue("korean_name"),
      chinese_name: getValue("chinese_name"),
      japanese_name: getValue("japanese_name"),
      cas_no: getValue("cas_no"),
      ec_no: getValue("ec_no"),
      function_ko: getValue("function_ko"),
      function_en: getValue("function_en"),
      iecic_status: getValue("iecic_status"),
      cosmos_status: getValue("cosmos_status"),
      vegan_status: getValue("vegan_status"),
      halal_status: getValue("halal_status"),
      rspo_status: getValue("rspo_status"),
      eu_status: getValue("eu_status"),
      china_status: getValue("china_status"),
      japan_status: getValue("japan_status"),
      asean_status: getValue("asean_status"),
      max_use_level: getValue("max_use_level"),
      max_use_percent: getValue("max_use_percent") ? Number(getValue("max_use_percent")) : null,
      regulation_note: getValue("regulation_note"),
      ewg_grade: getValue("ewg_grade"),
      allergen_note: getValue("allergen_note"),
      reference_source: getValue("reference_source"),
      update_cycle: getValue("update_cycle"),
      last_verified_at: getValue("last_verified_at") || null,
    };
  }

  async function previewBulkIngredientCsv(file: File) {
    setBulkWizardStatus("CSV 미리보기를 생성하는 중입니다...");

    const text = await file.text();
    const lines = text
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV에 데이터가 없습니다.");
      setBulkWizardStatus("");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const rows = lines.slice(1).map((line) => parseCsvLine(line));
    const mappedRows = rows
      .map((row) => mapCsvRecordToGlobalIngredient(headers, row))
      .filter((record) => record.inci_name);

    setBulkWizardHeaders(headers);
    setBulkWizardRows(mappedRows as unknown as Record<string, string>[]);
    setBulkWizardMappedCount(mappedRows.length);
    setBulkWizardStatus(`미리보기 완료: ${mappedRows.length}개 INCI 인식`);
  }

  async function importBulkWizardRows() {
    if (!assertCanEdit()) return;

    if (bulkWizardRows.length === 0) {
      alert("먼저 CSV 미리보기를 생성하세요.");
      return;
    }

    const ok = window.confirm(`${bulkWizardRows.length}개 성분을 Global Ingredient Master에 업로드/업데이트할까요?`);

    if (!ok) return;

    const chunkSize = 300;
    let uploadedCount = 0;

    for (let start = 0; start < bulkWizardRows.length; start += chunkSize) {
      const chunk = bulkWizardRows.slice(start, start + chunkSize);

      setBulkWizardStatus(`Bulk Import 중: ${Math.min(start + chunk.length, bulkWizardRows.length)} / ${bulkWizardRows.length}`);

      const { error } = await supabase
        .from("ingredient_master_global")
        .upsert(chunk, {
          onConflict: "inci_name",
          ignoreDuplicates: false,
        });

      if (error) {
        alert("Bulk Import 오류: " + error.message);
        setBulkWizardStatus("Bulk Import 실패");
        return;
      }

      uploadedCount += chunk.length;
    }

    await logAudit("Global Ingredient Seed DB", "Bulk Import", "IMPORT", null, {
      uploaded_count: uploadedCount,
    });

    setBulkWizardStatus(`Bulk Import 완료: ${uploadedCount}개 처리`);
    setBulkWizardRows([]);
    setBulkWizardHeaders([]);
    setBulkWizardMappedCount(0);
    loadAll();
  }

  function downloadSeedIngredientCsv() {
    const headers = getGlobalIngredientCsvHeaders();

    const seedRows = [
      ["Glycerin", "글리세린", "甘油", "グリセリン", "56-81-5", "200-289-5", "보습제", "Humectant", "Listed", "Approved", "Vegan", "Allowed", "RSPO Available", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "일반 보습 원료", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Niacinamide", "나이아신아마이드", "烟酰胺", "ナイアシンアミド", "98-92-0", "202-713-4", "미백/피부컨디셔닝", "Skin Conditioning", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "국가별 기능성 기준 확인", "", "미백 기능성 원료로 사용 시 국가별 기준 확인", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Panthenol", "판테놀", "泛醇", "パンテノール", "81-13-0", "201-327-3", "보습/진정", "Humectant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "보습 및 피부 컨디셔닝", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Betaine", "베타인", "甜菜碱", "ベタイン", "107-43-7", "203-490-6", "보습제", "Humectant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "보습 보조", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["1,2-Hexanediol", "1,2-헥산다이올", "1,2-己二醇", "1,2-ヘキサンジオール", "6920-22-5", "", "보습/보존보조", "Humectant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "보존 보조 원료", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Allantoin", "알란토인", "尿囊素", "アラントイン", "97-59-6", "202-592-8", "진정", "Skin Protecting", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "국가별 한도 확인", "", "진정/보호", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Adenosine", "아데노신", "腺苷", "アデノシン", "58-61-7", "200-389-9", "주름개선", "Skin Conditioning", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "국가별 기능성 기준 확인", "", "주름개선 기능성 원료", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Tocopherol", "토코페롤", "生育酚", "トコフェロール", "59-02-9", "200-412-2", "항산화제", "Antioxidant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "산화방지", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Sodium Hyaluronate", "소듐하이알루로네이트", "透明质酸钠", "ヒアルロン酸Na", "9067-32-7", "", "보습제", "Humectant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "고보습 원료", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Ceramide NP", "세라마이드엔피", "神经酰胺NP", "セラミドNP", "100403-19-8", "", "피부장벽", "Skin Conditioning", "Listed", "Allowed", "Vegan Check", "Check", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "장벽 케어", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Butylene Glycol", "부틸렌글라이콜", "丁二醇", "BG", "107-88-0", "203-529-7", "보습제/용제", "Humectant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "보습 및 용제", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Caprylic/Capric Triglyceride", "카프릴릭/카프릭트라이글리세라이드", "辛酸/癸酸甘油三酯", "トリ(カプリル酸/カプリン酸)グリセリル", "73398-61-5", "277-452-2", "에몰리언트", "Emollient", "Listed", "Allowed", "Vegan", "Allowed", "RSPO Available", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "유분감/사용감 개선", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Squalane", "스쿠알란", "角鲨烷", "スクワラン", "111-01-3", "203-825-6", "에몰리언트", "Emollient", "Listed", "Allowed", "Source Check", "Check", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "식물성/동물성 출처 확인 필요", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Carbomer", "카보머", "卡波姆", "カルボマー", "9003-01-4", "", "점증제", "Viscosity Controlling", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "겔 점증", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Xanthan Gum", "잔탄검", "黄原胶", "キサンタンガム", "11138-66-2", "234-394-2", "점증제", "Viscosity Controlling", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "천연계 점증", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Phenoxyethanol", "페녹시에탄올", "苯氧乙醇", "フェノキシエタノール", "122-99-6", "204-589-7", "보존제", "Preservative", "Listed", "Allowed", "Vegan", "Allowed", "", "Restricted", "Listed", "Allowed", "Allowed", "국가별 한도 확인", "1", "보존제 한도 확인 필요", "2-4", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Ethylhexylglycerin", "에틸헥실글리세린", "乙基己基甘油", "エチルヘキシルグリセリン", "70445-33-9", "408-080-2", "보존보조", "Skin Conditioning", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "보존 보조", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Salicylic Acid", "살리실릭애씨드", "水杨酸", "サリチル酸", "69-72-7", "200-712-3", "각질케어", "Keratolytic", "Listed", "Allowed", "Vegan", "Allowed", "", "Restricted", "Listed", "Restricted", "Restricted", "국가별 사용한도 확인", "", "BHA 제한 원료", "3-4", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Retinol", "레티놀", "视黄醇", "レチノール", "68-26-8", "200-683-7", "피부컨디셔닝", "Skin Conditioning", "Listed", "Allowed", "Source Check", "Check", "", "Restricted", "Listed", "Restricted", "Restricted", "국가별 사용한도 확인", "", "비타민A 계열 제한 확인", "5", "해당 없음", "PLM Seed DB", "Quarterly", ""],
      ["Ascorbic Acid", "아스코빅애씨드", "抗坏血酸", "アスコルビン酸", "50-81-7", "200-066-2", "항산화", "Antioxidant", "Listed", "Allowed", "Vegan", "Allowed", "", "Allowed", "Listed", "Allowed", "Allowed", "제한 없음", "", "비타민C", "1", "해당 없음", "PLM Seed DB", "Quarterly", ""],
    ];

    downloadCsv("global_ingredient_seed_db_v22_sample.csv", headers, seedRows);
  }

  async function importGlobalCsv(file: File) {
    if (!assertCanEdit()) return;

    setGlobalUploadStatus("CSV 파일을 읽는 중입니다...");

    const text = await file.text();
    const lines = text
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV에 데이터가 없습니다.");
      setGlobalUploadStatus("");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    const records = rows
      .map((row) => {
        const record: Record<string, string> = {};

        headers.forEach((header, index) => {
          record[header] = row[index] || "";
        });

        return {
          inci_name: record.inci_name || "",
          korean_name: record.korean_name || "",
          chinese_name: record.chinese_name || "",
          japanese_name: record.japanese_name || "",
          cas_no: record.cas_no || "",
          ec_no: record.ec_no || "",
          function_ko: record.function_ko || "",
          function_en: record.function_en || "",
          iecic_status: record.iecic_status || "",
          cosmos_status: record.cosmos_status || "",
          vegan_status: record.vegan_status || "",
          halal_status: record.halal_status || "",
          rspo_status: record.rspo_status || "",
          eu_status: record.eu_status || "",
          china_status: record.china_status || "",
          japan_status: record.japan_status || "",
          asean_status: record.asean_status || "",
          max_use_level: record.max_use_level || "",
          max_use_percent: record.max_use_percent ? Number(record.max_use_percent) : null,
          regulation_note: record.regulation_note || "",
          ewg_grade: record.ewg_grade || "",
          allergen_note: record.allergen_note || "",
          reference_source: record.reference_source || "",
          update_cycle: record.update_cycle || "",
          last_verified_at: record.last_verified_at || null,
        };
      })
      .filter((record) => record.inci_name);

    if (records.length === 0) {
      alert("업로드할 INCI 데이터가 없습니다.");
      setGlobalUploadStatus("");
      return;
    }

    const duplicateInciNames = records
      .map((record) => record.inci_name.trim().toLowerCase())
      .filter((name, index, arr) => name && arr.indexOf(name) !== index);

    if (duplicateInciNames.length > 0) {
      const ok = window.confirm(
        `CSV 안에 중복 INCI가 있습니다. 마지막 데이터 기준으로 업데이트됩니다. 계속할까요?\n${Array.from(new Set(duplicateInciNames)).slice(0, 10).join(", ")}`
      );

      if (!ok) {
        setGlobalUploadStatus("업로드 취소");
        return;
      }
    }

    const chunkSize = 300;
    let uploadedCount = 0;

    for (let start = 0; start < records.length; start += chunkSize) {
      const chunk = records.slice(start, start + chunkSize);

      setGlobalUploadStatus(
        `업로드 중: ${Math.min(start + chunk.length, records.length)} / ${records.length}`
      );

      const { error } = await supabase
        .from("ingredient_master_global")
        .upsert(chunk, {
          onConflict: "inci_name",
          ignoreDuplicates: false,
        });

      if (error) {
        alert("CSV 업로드 오류: " + error.message);
        setGlobalUploadStatus("업로드 실패");
        return;
      }

      uploadedCount += chunk.length;
    }

    await logAudit("Global Ingredient Master", "CSV", "IMPORT", null, {
      file_name: file.name,
      uploaded_count: uploadedCount,
    });

    setGlobalUploadStatus(`업로드 완료: ${uploadedCount}개 처리`);
    alert(`${uploadedCount}개 Global Ingredient Master 데이터 업로드/업데이트 완료`);
    loadAll();
  }

  async function registerGlobalToIngredient(item: GlobalIngredient) {
    const existing = ingredients.find((ingredient) => {
      return (
        ingredient.inci_name?.toLowerCase() === item.inci_name?.toLowerCase() ||
        (item.cas_no && ingredient.cas_no === item.cas_no)
      );
    });

    if (existing) {
      alert(`이미 성분관리에 등록되어 있습니다: ${existing.inci_name}`);
      return;
    }

    const { error } = await supabase.from("ingredients").insert([
      {
        inci_name: item.inci_name || "",
        korean_name: item.korean_name || "",
        chinese_name: item.chinese_name || "",
        japanese_name: item.japanese_name || "",
        cas_no: item.cas_no || "",
        ec_no: item.ec_no || "",
        function_ko: item.function_ko || "",
        iecic_status: item.iecic_status || "",
        cosmos_status: item.cosmos_status || "",
        vegan_status: item.vegan_status || "",
        max_use_level: item.max_use_level || "",
        regulation_note: item.regulation_note || "",
        ewg_grade: item.ewg_grade || "",
        allergen_note: item.allergen_note || "",
      },
    ]);

    if (error) {
      alert("성분관리 등록 오류: " + error.message);
      return;
    }

    alert(`성분관리 등록 완료: ${item.inci_name}`);
    loadAll();
  }

  async function addGlobalIngredient() {
    if (!assertCanEdit()) return;
    if (!globalInciName || !globalKoreanName) {
      alert("INCI명과 국문명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("ingredient_master_global").insert([
      {
        inci_name: globalInciName,
        korean_name: globalKoreanName,
        chinese_name: globalChineseName,
        japanese_name: globalJapaneseName,
        cas_no: globalCasNo,
        ec_no: globalEcNo,
        function_ko: globalFunctionKo,
        function_en: globalFunctionEn,
        iecic_status: globalIecicStatus,
        cosmos_status: globalCosmosStatus,
        vegan_status: globalVeganStatus,
        halal_status: "",
        rspo_status: "",
        eu_status: "",
        china_status: "",
        japan_status: "",
        asean_status: "",
        max_use_level: globalMaxUseLevel,
        max_use_percent: globalMaxUseLevel ? Number(String(globalMaxUseLevel).replace("%", "")) || null : null,
        regulation_note: globalRegulationNote,
        ewg_grade: globalEwgGrade,
        allergen_note: globalAllergenNote,
      },
    ]);

    if (error) {
      alert("글로벌 성분 저장 오류: " + error.message);
      return;
    }

    setGlobalInciName("");
    setGlobalKoreanName("");
    setGlobalChineseName("");
    setGlobalJapaneseName("");
    setGlobalCasNo("");
    setGlobalEcNo("");
    setGlobalFunctionKo("");
    setGlobalFunctionEn("");
    setGlobalIecicStatus("");
    setGlobalCosmosStatus("");
    setGlobalVeganStatus("");
    setGlobalMaxUseLevel("");
    setGlobalRegulationNote("");
    setGlobalEwgGrade("");
    setGlobalAllergenNote("");
    await logAudit("성분관리", globalInciName, "등록", null, {
      inci_name: globalInciName,
      korean_name: globalKoreanName,
      chinese_name: globalChineseName,
      japanese_name: globalJapaneseName,
      cas_no: globalCasNo,
      ec_no: globalEcNo,
      function_ko: globalFunctionKo,
      function_en: globalFunctionEn,
      iecic_status: globalIecicStatus,
      cosmos_status: globalCosmosStatus,
      vegan_status: globalVeganStatus,
    });
    loadAll();
  }

  function getProjectStatusOptions() {
    return ["개발중", "샘플발송", "고객검토", "안정도진행", "양산승인", "출시", "보류"];
  }

  function generateProjectCode() {
    const year = new Date().getFullYear().toString();

    const sameYearNumbers = projects
      .map((project) => project.project_code || "")
      .filter((code) => code.startsWith(`${year}-`))
      .map((code) => Number(code.split("-")[1] || 0))
      .filter((num) => !Number.isNaN(num));

    const nextNumber = sameYearNumbers.length > 0 ? Math.max(...sameYearNumbers) + 1 : 1;

    return `${year}-${String(nextNumber).padStart(3, "0")}`;
  }

  async function updateProjectStatus(project: Project, nextStatus: string) {
    if (!assertCanEdit()) return;

    const beforeData = { ...project };
    const afterData = { ...project, status: nextStatus };

    const { error } = await supabase
      .from("projects")
      .update({ status: nextStatus })
      .eq("id", project.id);

    if (error) {
      alert("프로젝트 상태 변경 오류: " + error.message);
      return;
    }

    await logAudit("프로젝트관리", project.id, "상태변경", beforeData, afterData);
    loadAll();
  }

  async function addProject() {
    if (!projectName) {
      alert("프로젝트명을 입력하세요.");
      return;
    }

    const autoProjectCode = generateProjectCode();

    const payload = {
      project_code: autoProjectCode,
      customer_name: customerName,
      project_name: projectName,
      researcher,
      status: projectStatus || "개발중",
      target_launch_date: null,
      description: projectDescription,
      product_type: "",
      dosage_form: dosageForm,
      target_user: "",
      concept_keywords: conceptKeywords,
      target_price: Number(targetPrice || 0),
      forbidden_ingredients: forbiddenIngredients,
      required_ingredients: requiredIngredients,
      customer_brief: customerBrief,
    };

    const { error } = await supabase.from("projects").insert([payload]);

    if (error) {
      alert("프로젝트 저장 오류: " + error.message);
      return;
    }

    await logAudit("프로젝트관리", autoProjectCode, "등록", null, payload);

    setProjectCode("");
    setCustomerName("");
    setProjectName("");
    setResearcher("");
    setProjectStatus("개발중");
    setTargetLaunchDate("");
    setProjectDescription("");
    setProductType("");
    setDosageForm("");
    setTargetUser("");
    setConceptKeywords("");
    setTargetPrice("");
    setForbiddenIngredients("");
    setRequiredIngredients("");
    setCustomerBrief("");
    loadAll();
  }

  async function addProjectFormula() {
    if (!mappingProjectId || !mappingFormulaId) {
      alert("프로젝트와 처방을 선택하세요.");
      return;
    }

    const duplicate = projectFormulas.some((mapping) => {
      return mapping.projects?.id === mappingProjectId && mapping.formulas?.id === mappingFormulaId;
    });

    if (duplicate) {
      alert("이미 해당 프로젝트에 연결된 처방입니다.");
      return;
    }

    if (mappingIsCurrent) {
      const { error: updateError } = await supabase
        .from("project_formulas")
        .update({ is_current: false })
        .eq("project_id", mappingProjectId);

      if (updateError) {
        alert("현재버전 초기화 오류: " + updateError.message);
        return;
      }
    }

    const { error } = await supabase.from("project_formulas").insert([
      {
        project_id: mappingProjectId,
        formula_id: mappingFormulaId,
        is_current: mappingIsCurrent,
      },
    ]);

    if (error) {
      alert("프로젝트-처방 연결 오류: " + error.message);
      return;
    }

    setMappingProjectId("");
    setMappingFormulaId("");
    setMappingIsCurrent(false);
    loadAll();
  }

  function getProjectFormulaRows(projectId: string) {
    return projectFormulas.filter((mapping) => mapping.projects?.id === projectId);
  }

  async function addStabilityTest() {
    if (!stabilityTestCode || !stabilityProjectId || !stabilityFormulaId) {
      alert("시험번호, 프로젝트, 처방을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("stability_tests").insert([
      {
        test_code: stabilityTestCode,
        project_id: stabilityProjectId,
        formula_id: stabilityFormulaId,
        test_type: stabilityTestType,
        start_date: stabilityStartDate || null,
        week_1_result: week1Result,
        week_2_result: week2Result,
        week_4_result: week4Result,
        week_8_result: week8Result,
        week_12_result: week12Result,
        appearance_result: appearanceResult,
        color_result: colorResult,
        odor_result: odorResult,
        viscosity_result: viscosityResult,
        ph_result: phResult,
        specific_gravity_result: specificGravityResult,
        final_result: stabilityFinalResult,
        remark: stabilityRemark,
      },
    ]);

    if (error) {
      alert("안정도 시험 저장 오류: " + error.message);
      return;
    }

    setStabilityTestCode("");
    setStabilityProjectId("");
    setStabilityFormulaId("");
    setStabilityTestType("가속");
    setStabilityStartDate("");
    setWeek1Result("");
    setWeek2Result("");
    setWeek4Result("");
    setWeek8Result("");
    setWeek12Result("");
    setAppearanceResult("");
    setColorResult("");
    setOdorResult("");
    setViscosityResult("");
    setPhResult("");
    setSpecificGravityResult("");
    setStabilityFinalResult("진행중");
    setStabilityRemark("");
    loadAll();
  }

  async function addApprovalRequest() {
    if (!approvalProjectId || !approvalFormulaId) {
      alert("프로젝트와 처방을 선택하세요.");
      return;
    }

    const requesterName = approvalRequester || userProfile?.display_name || authUser?.email || "Requester";

    const payload = {
      project_id: approvalProjectId,
      formula_id: approvalFormulaId,
      request_type: approvalRequestType,
      status: "Senior Review",
      requester: requesterName,
      reviewer: approvalReviewer,
      request_note: approvalRequestNote,
      senior_reviewer: approvalReviewer || "",
      qa_reviewer: "",
      ra_reviewer: "",
      manager_approver: "",
      release_note: "",
    };

    const { error } = await supabase.from("approval_requests").insert([payload]);

    if (error) {
      alert("승인요청 저장 오류: " + error.message);
      return;
    }

    await logAudit("승인Workflow", approvalFormulaId, "승인요청", null, payload);

    setApprovalProjectId("");
    setApprovalFormulaId("");
    setApprovalRequestType("처방승인");
    setApprovalRequester("");
    setApprovalReviewer("");
    setApprovalRequestNote("");
    loadAll();
  }

  function getApprovalWorkflowSteps() {
    return ["Senior Review", "QA Review", "RA Review", "Manager Approval", "Approved", "Released"];
  }

  function getApprovalStatusLabel(status: string) {
    const labels: Record<string, string> = {
      Review: "검토중",
      "Senior Review": "선임 검토",
      "QA Review": "QA 검토",
      "RA Review": "RA 검토",
      "Manager Approval": "팀장 승인",
      Approved: "최종 승인",
      Released: "배포 완료",
      Rejected: "반려",
    };

    return labels[status] || status;
  }

  function getApprovalStatusColor(status: string) {
    if (status === "Released" || status === "Approved") return "green";
    if (status === "Rejected") return "red";
    if (status === "Manager Approval") return "#7c3aed";
    if (status === "QA Review" || status === "RA Review") return "#d97706";
    return "#2563eb";
  }

  function getApprovalProgress(status: string) {
    const steps = getApprovalWorkflowSteps();
    const index = steps.indexOf(status);

    if (status === "Rejected") return 0;
    if (index < 0) return 10;

    return Math.round(((index + 1) / steps.length) * 100);
  }

  function getNextApprovalStatus(status: string) {
    if (status === "Review") return "Senior Review";
    if (status === "Senior Review") return "QA Review";
    if (status === "QA Review") return "RA Review";
    if (status === "RA Review") return "Manager Approval";
    if (status === "Manager Approval") return "Approved";
    if (status === "Approved") return "Released";

    return "";
  }

  function getApprovalActionLabel(status: string) {
    if (status === "Review" || status === "Senior Review") return "선임 승인";
    if (status === "QA Review") return "QA 승인";
    if (status === "RA Review") return "RA 승인";
    if (status === "Manager Approval") return "최종 승인";
    if (status === "Approved") return "배포";
    return "처리";
  }

  async function updateApprovalStatus(id: string, status: string) {
    if (!assertCanApprove()) return;

    const target = approvalRequests.find((request) => request.id === id);
    const reviewNote = window.prompt(`${getApprovalStatusLabel(status)} 처리 사유 또는 코멘트를 입력하세요.`) || "";

    const payload: any = {
      status,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    };

    if (status === "QA Review") {
      payload.senior_reviewer = userProfile?.display_name || authUser?.email || "";
      payload.senior_approved_at = new Date().toISOString();
    }

    if (status === "RA Review") {
      payload.qa_reviewer = userProfile?.display_name || authUser?.email || "";
      payload.qa_approved_at = new Date().toISOString();
    }

    if (status === "Manager Approval") {
      payload.ra_reviewer = userProfile?.display_name || authUser?.email || "";
      payload.ra_approved_at = new Date().toISOString();
    }

    if (status === "Approved") {
      payload.manager_approver = userProfile?.display_name || authUser?.email || "";
      payload.manager_approved_at = new Date().toISOString();
    }

    if (status === "Released") {
      payload.release_note = reviewNote;
    }

    const { error } = await supabase
      .from("approval_requests")
      .update(payload)
      .eq("id", id);

    if (error) {
      alert("승인상태 변경 오류: " + error.message);
      return;
    }

    if (target?.formulas?.id && status === "Approved") {
      const formula = target.formulas;

      await supabase
        .from("formulas")
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: userProfile?.display_name || authUser?.email || "",
          lock_reason: "Approval Workflow Final Approved",
          approved_by: userProfile?.display_name || authUser?.email || "",
          approved_at: new Date().toISOString(),
        })
        .eq("id", formula.id);
    }

    await logAudit("승인Workflow", id, getApprovalStatusLabel(status), target || null, payload);
    loadAll();
  }

  async function processNextApprovalStep(request: ApprovalRequest) {
    const nextStatus = getNextApprovalStatus(request.status);

    if (!nextStatus) {
      alert("더 이상 진행할 단계가 없습니다.");
      return;
    }

    await updateApprovalStatus(request.id, nextStatus);
  }

  async function rejectApprovalRequest(request: ApprovalRequest) {
    if (!assertCanApprove()) return;

    const reviewNote = window.prompt("반려 사유를 입력하세요.") || "";

    const payload = {
      status: "Rejected",
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("approval_requests")
      .update(payload)
      .eq("id", request.id);

    if (error) {
      alert("반려 처리 오류: " + error.message);
      return;
    }

    await logAudit("승인Workflow", request.id, "반려", request, payload);
    loadAll();
  }

  async function addProjectStage() {
    if (!stageProjectId || !stageName) {
      alert("프로젝트와 단계를 선택하세요.");
      return;
    }

    const { error } = await supabase.from("project_stages").insert([
      {
        project_id: stageProjectId,
        stage_name: stageName,
        stage_status: stageStatus,
        planned_date: plannedDate || null,
        actual_date: actualDate || null,
        remark: stageRemark,
      },
    ]);

    if (error) {
      alert("개발일정 저장 오류: " + error.message);
      return;
    }

    setStageProjectId("");
    setStageName("고객문의");
    setStageStatus("대기");
    setPlannedDate("");
    setActualDate("");
    setStageRemark("");
    loadAll();
  }

  function getProjectProgress(projectId: string) {
    const rows = projectStages.filter((stage) => stage.projects?.id === projectId);

    if (rows.length === 0) {
      return "0.0";
    }

    const completed = rows.filter((stage) => stage.stage_status === "완료").length;
    return ((completed / rows.length) * 100).toFixed(1);
  }

  function getCurrentProjectStage(projectId: string) {
    const rows = projectStages.filter((stage) => stage.projects?.id === projectId);

    const inProgress = rows.find((stage) => stage.stage_status === "진행중");
    if (inProgress) {
      return inProgress.stage_name;
    }

    const waiting = rows.find((stage) => stage.stage_status === "대기");
    if (waiting) {
      return waiting.stage_name;
    }

    if (rows.length > 0 && rows.every((stage) => stage.stage_status === "완료")) {
      return "완료";
    }

    return "-";
  }

  async function saveBomCost() {
    if (!assertCanEdit()) return;
    if (!assertFormulaEditable(bomFormulaId)) return;
    if (!bomFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    const existing = getBomByFormula(bomFormulaId);

    const payload = {
      formula_id: bomFormulaId,
      packaging_cost: Number(packagingCost || 0),
      filling_cost: Number(fillingCost || 0),
      labor_cost: Number(laborCost || 0),
      logistics_cost: Number(logisticsCost || 0),
      overhead_rate: Number(overheadRate || 0),
      target_margin_rate: Number(targetMarginRate || 0),
      remark: bomRemark,
    };

    const { error } = existing
      ? await supabase.from("bom_costs").update(payload).eq("id", existing.id)
      : await supabase.from("bom_costs").insert([payload]);

    if (error) {
      alert("BOM 원가 저장 오류: " + error.message);
      return;
    }

    setBomFormulaId("");
    setPackagingCost("");
    setFillingCost("");
    setLaborCost("");
    setLogisticsCost("");
    setOverheadRate("10");
    setTargetMarginRate("30");
    setBomRemark("");
    await logAudit("BOM원가", bomFormulaId, existing ? "수정" : "등록", existing, payload);
    loadAll();
  }

  async function deleteBomCost(item: BomCost) {
    if (!assertCanDelete()) return;
    const ok = window.confirm(`${item.formulas?.formula_code} BOM 원가 정보를 삭제할까요?`);

    if (!ok) return;

    const okMove = await softDeleteRecord("bom_costs", item.id, "BOM원가", item);
    if (okMove) loadAll();
  }

  function loadBomToForm(item: BomCost) {
    setBomFormulaId(item.formulas?.id || "");
    setPackagingCost(String(item.packaging_cost || 0));
    setFillingCost(String(item.filling_cost || 0));
    setLaborCost(String(item.labor_cost || 0));
    setLogisticsCost(String(item.logistics_cost || 0));
    setOverheadRate(String(item.overhead_rate || 0));
    setTargetMarginRate(String(item.target_margin_rate || 0));
    setBomRemark(item.remark || "");
  }

  async function updateRawMaterial(item: RawMaterial) {
    if (!assertCanEdit()) return;
    const input = window.prompt(
      "원료 정보를 수정하세요. 순서: 원료코드 | 원료명 | 공급사 | 구매단가 | 통화 | MOQ",
      [
        item.raw_code || "",
        item.raw_name || "",
        item.supplier || "",
        String(item.unit_price || 0),
        item.currency || "KRW",
        String(item.moq || 0),
      ].join(" | ")
    );

    if (input === null) return;

    const [rawCodeValue, rawNameValue, supplierValue, unitPriceValue, currencyValue, moqValue] =
      input.split("|").map((value) => value.trim());

    if (!rawCodeValue || !rawNameValue) {
      alert("원료코드와 원료명은 필수입니다.");
      return;
    }

    const { error } = await supabase
      .from("raw_materials")
      .update({
        raw_code: rawCodeValue,
        raw_name: rawNameValue,
        supplier: supplierValue || "",
        unit_price: Number(unitPriceValue || 0),
        currency: currencyValue || "KRW",
        moq: Number(moqValue || 0),
      })
      .eq("id", item.id);

    if (error) {
      alert("원료 수정 오류: " + error.message);
      return;
    }

    await logAudit("원료관리", item.id, "수정", item, {
      raw_code: rawCodeValue,
      raw_name: rawNameValue,
      supplier: supplierValue || "",
      unit_price: Number(unitPriceValue || 0),
      currency: currencyValue || "KRW",
      moq: Number(moqValue || 0),
    });
    loadAll();
  }

  async function deleteRawMaterial(item: RawMaterial) {
    if (!assertCanDelete()) return;
    const ok = window.confirm(`${item.raw_code} / ${item.raw_name} 원료를 삭제할까요? 연결된 조성/처방 데이터에 영향이 있을 수 있습니다.`);

    if (!ok) return;

    const okMove = await softDeleteRecord("raw_materials", item.id, "원료관리", item);
    if (okMove) loadAll();
  }

  async function updateGlobalIngredient(item: GlobalIngredient) {
    if (!assertCanEdit()) return;
    const input = window.prompt(
      "성분 정보를 수정하세요. 순서: INCI | 국문명 | 중문명 | 일문명 | CAS | EC | 기능국문 | 기능영문 | IECIC | COSMOS | VEGAN | 배합한도 | 규제사항 | EWG | 알러젠",
      [
        item.inci_name || "",
        item.korean_name || "",
        item.chinese_name || "",
        item.japanese_name || "",
        item.cas_no || "",
        item.ec_no || "",
        item.function_ko || "",
        item.function_en || "",
        item.iecic_status || "",
        item.cosmos_status || "",
        item.vegan_status || "",
        item.max_use_level || "",
        item.regulation_note || "",
        item.ewg_grade || "",
        item.allergen_note || "",
      ].join(" | ")
    );

    if (input === null) return;

    const [
      inciName,
      koreanNameValue,
      chineseNameValue,
      japaneseNameValue,
      casNoValue,
      ecNoValue,
      functionKoValue,
      functionEnValue,
      iecicValue,
      cosmosValue,
      veganValue,
      maxUseValue,
      regulationValue,
      ewgValue,
      allergenValue,
    ] = input.split("|").map((value) => value.trim());

    if (!inciName) {
      alert("INCI는 필수입니다.");
      return;
    }

    const { error } = await supabase
      .from("ingredient_master_global")
      .update({
        inci_name: inciName,
        korean_name: koreanNameValue || "",
        chinese_name: chineseNameValue || "",
        japanese_name: japaneseNameValue || "",
        cas_no: casNoValue || "",
        ec_no: ecNoValue || "",
        function_ko: functionKoValue || "",
        function_en: functionEnValue || "",
        iecic_status: iecicValue || "",
        cosmos_status: cosmosValue || "",
        vegan_status: veganValue || "",
        max_use_level: maxUseValue || "",
        regulation_note: regulationValue || "",
        ewg_grade: ewgValue || "",
        allergen_note: allergenValue || "",
      })
      .eq("id", item.id);

    if (error) {
      alert("성분 수정 오류: " + error.message);
      return;
    }

    await logAudit("성분관리", item.id, "수정", item, {
      inci_name: inciName,
      korean_name: koreanNameValue || "",
      chinese_name: chineseNameValue || "",
      japanese_name: japaneseNameValue || "",
      cas_no: casNoValue || "",
      ec_no: ecNoValue || "",
      function_ko: functionKoValue || "",
      function_en: functionEnValue || "",
      iecic_status: iecicValue || "",
      cosmos_status: cosmosValue || "",
      vegan_status: veganValue || "",
      max_use_level: maxUseValue || "",
      regulation_note: regulationValue || "",
      ewg_grade: ewgValue || "",
      allergen_note: allergenValue || "",
    });
    loadAll();
  }

  async function deleteGlobalIngredient(item: GlobalIngredient) {
    if (!assertCanDelete()) return;
    const ok = window.confirm(`${item.inci_name} / ${item.korean_name} 성분을 삭제할까요?`);

    if (!ok) return;

    const okMove = await softDeleteRecord("ingredient_master_global", item.id, "성분관리", item);
    if (okMove) loadAll();
  }

  async function updateFormulaBasic(item: Formula) {
    if (!assertCanEdit()) return;
    if (!assertFormulaEditable(item.id)) return;
    const formulaCodeValue = window.prompt("처방코드", item.formula_code || "");
    if (formulaCodeValue === null) return;

    const formulaNameValue = window.prompt("처방명", item.formula_name || "");
    if (formulaNameValue === null) return;

    const versionValue = window.prompt("버전", item.version || "1.0");
    if (versionValue === null) return;

    const targetCostValue = window.prompt("목표원가(원/kg)", String(item.target_cost || 0));
    if (targetCostValue === null) return;

    const sellingPriceValue = window.prompt("공급가(원/kg)", String(item.selling_price || 0));
    if (sellingPriceValue === null) return;

    const { error } = await supabase
      .from("formulas")
      .update({
        formula_code: formulaCodeValue,
        formula_name: formulaNameValue,
        version: versionValue,
        target_cost: Number(targetCostValue || 0),
        selling_price: Number(sellingPriceValue || 0),
      })
      .eq("id", item.id);

    if (error) {
      alert("처방 수정 오류: " + error.message);
      return;
    }

    await logAudit("처방관리", item.id, "수정", item, {
      formula_code: formulaCodeValue,
      formula_name: formulaNameValue,
      version: versionValue,
      target_cost: Number(targetCostValue || 0),
      selling_price: Number(sellingPriceValue || 0),
    });
    loadAll();
  }

  async function deleteFormulaBasic(item: Formula) {
    if (!assertCanDelete()) return;
    if (!assertFormulaEditable(item.id)) return;
    const ok = window.confirm(`${item.formula_code} / ${item.formula_name} 처방을 삭제할까요? 연결된 처방 원료, 프로젝트 연결, 승인/안정도 연결 데이터도 함께 정리됩니다.`);

    if (!ok) return;

    const okMove = await softDeleteRecord("formulas", item.id, "처방관리", item);

    if (selectedFormulaId === item.id) {
      setSelectedFormulaId("");
    }

    if (okMove) loadAll();
  }

  function getFilteredRawGlobalIngredients() {
    const keyword = rawGlobalSearch.trim().toLowerCase();

    if (!keyword) {
      return globalIngredients;
    }

    return globalIngredients.filter((item) => {
      const searchableText = [
        item.inci_name,
        item.korean_name,
        item.chinese_name,
        item.japanese_name,
        item.cas_no,
        item.ec_no,
        item.function_ko,
        item.function_en,
        item.iecic_status,
        item.cosmos_status,
        item.vegan_status,
        item.halal_status,
        item.rspo_status,
        item.eu_status,
        item.china_status,
        item.japan_status,
        item.asean_status,
        item.ewg_grade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }

  function getSelectedRawGlobalIngredient() {
    return globalIngredients.find((item) => item.id === rawGlobalIngredientId) || null;
  }

  function fillRawMaterialFromGlobal(item: GlobalIngredient) {
    setRawGlobalIngredientId(item.id);
    setRawGlobalSearch(`${item.inci_name || ""} ${item.korean_name || ""} ${item.cas_no || ""}`.trim());

    if (!rawName) {
      setRawName(item.korean_name || item.inci_name || "");
    }

    if (!rawCode) {
      const nextNumber = materials.length + 1;
      setRawCode(`RM${String(nextNumber).padStart(4, "0")}`);
    }
  }

  async function addMaterial() {
    if (!assertCanEdit()) return;
    if (!rawCode || !rawName) {
      alert("원료코드와 원료명을 입력하세요.");
      return;
    }

    const selectedGlobal = getSelectedRawGlobalIngredient();

    const { data, error } = await supabase
      .from("raw_materials")
      .insert([
        {
          raw_code: rawCode,
          raw_name: rawName,
          supplier,
          unit_price: Number(rawUnitPrice || 0),
          currency: rawCurrency,
          moq: Number(rawMoq || 0),
        },
      ])
      .select()
      .single();

    if (error) {
      alert("원료 저장 오류: " + error.message);
      return;
    }

    if (selectedGlobal && rawAutoComposition && data?.id) {
      try {
        const targetIngredientId = await findOrCreateIngredientFromGlobal(selectedGlobal);

        const { error: compositionError } = await supabase.from("raw_compositions").insert([
          {
            raw_material_id: data.id,
            ingredient_id: targetIngredientId,
            percentage: 100,
          },
        ]);

        if (compositionError) {
          alert("원료는 저장되었지만 원료조성 자동 연결 오류: " + compositionError.message);
        }
      } catch (error) {
        alert("원료는 저장되었지만 Global Ingredient 자동 연결 오류: " + (error as Error).message);
      }
    }

    setRawCode("");
    setRawName("");
    setSupplier("");
    setRawUnitPrice("");
    setRawCurrency("KRW");
    setRawMoq("");
    setRawGlobalSearch("");
    setRawGlobalIngredientId("");
    setRawAutoComposition(true);

    await logAudit("원료관리", rawCode, "등록", null, {
      raw_code: rawCode,
      raw_name: rawName,
      supplier,
      unit_price: Number(rawUnitPrice || 0),
      currency: rawCurrency,
      moq: Number(rawMoq || 0),
      auto_global_ingredient: selectedGlobal
        ? {
            inci_name: selectedGlobal.inci_name,
            korean_name: selectedGlobal.korean_name,
            cas_no: selectedGlobal.cas_no,
            auto_composition_100: rawAutoComposition,
          }
        : null,
    });
    loadAll();
  }

  async function addIngredient() {
    if (!inciName || !koreanName) {
      alert("INCI명과 국문명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("ingredients").insert([
      {
        inci_name: inciName,
        korean_name: koreanName,
        chinese_name: chineseName,
        japanese_name: japaneseName,
        cas_no: casNo,
        ec_no: ecNo,
        function_ko: functionKo,
        iecic_status: iecicStatus,
        cosmos_status: cosmosStatus,
        vegan_status: veganStatus,
        max_use_level: maxUseLevel,
        regulation_note: regulationNote,
        ewg_grade: ewgGrade,
        allergen_note: allergenNote,
      },
    ]);

    if (error) {
      alert("성분 저장 오류: " + error.message);
      return;
    }

    setInciName("");
    setKoreanName("");
    setCasNo("");
    setEcNo("");
    setFunctionKo("");
    setChineseName("");
    setJapaneseName("");
    setIecicStatus("");
    setCosmosStatus("");
    setVeganStatus("");
    setMaxUseLevel("");
    setRegulationNote("");
    setEwgGrade("");
    setAllergenNote("");
    loadAll();
  }

  function getCompositionRowsByRaw(rawId: string) {
    return compositions.filter((composition) => composition.raw_materials?.id === rawId);
  }

  function getCompositionTotalByRaw(rawId: string) {
    return getCompositionRowsByRaw(rawId).reduce(
      (sum, composition) => sum + Number(composition.percentage || 0),
      0
    );
  }

  function hasDuplicateComposition(rawId: string, targetIngredientId: string) {
    return compositions.some((composition) => {
      return (
        composition.raw_materials?.id === rawId &&
        composition.ingredients?.id === targetIngredientId
      );
    });
  }

  function getFilteredCompositionGlobalIngredients() {
    const keyword = compositionGlobalSearch.trim().toLowerCase();

    if (!keyword) {
      return globalIngredients;
    }

    return globalIngredients.filter((item) => {
      return (
        item.inci_name?.toLowerCase().includes(keyword) ||
        item.korean_name?.toLowerCase().includes(keyword) ||
        item.cas_no?.toLowerCase().includes(keyword)
      );
    });
  }

  async function findOrCreateIngredientFromGlobal(globalItem: GlobalIngredient) {
    const existing = ingredients.find((ingredient) => {
      return (
        ingredient.inci_name?.toLowerCase() === globalItem.inci_name?.toLowerCase() ||
        (globalItem.cas_no && ingredient.cas_no === globalItem.cas_no)
      );
    });

    if (existing) {
      return existing.id;
    }

    const { data, error } = await supabase
      .from("ingredients")
      .insert([
        {
          inci_name: globalItem.inci_name || "",
          korean_name: globalItem.korean_name || "",
          chinese_name: globalItem.chinese_name || "",
          japanese_name: globalItem.japanese_name || "",
          cas_no: globalItem.cas_no || "",
          ec_no: globalItem.ec_no || "",
          function_ko: globalItem.function_ko || "",
          iecic_status: globalItem.iecic_status || "",
          cosmos_status: globalItem.cosmos_status || "",
          vegan_status: globalItem.vegan_status || "",
          max_use_level: globalItem.max_use_level || "",
          regulation_note: globalItem.regulation_note || "",
          ewg_grade: globalItem.ewg_grade || "",
          allergen_note: globalItem.allergen_note || "",
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id;
  }

  async function addCompositionFromGlobal() {
    if (!compositionRawId || !compositionGlobalId || !compositionPercent) {
      alert("원료, Global 성분, 구성비율을 모두 입력하세요.");
      return;
    }

    const globalItem = globalIngredients.find((item) => item.id === compositionGlobalId);

    if (!globalItem) {
      alert("Global 성분을 찾을 수 없습니다.");
      return;
    }

    try {
      const targetIngredientId = await findOrCreateIngredientFromGlobal(globalItem);

      if (hasDuplicateComposition(compositionRawId, targetIngredientId)) {
        alert("이미 해당 원료에 동일 성분이 등록되어 있습니다.");
        return;
      }

      const currentTotal = getCompositionTotalByRaw(compositionRawId);
      const nextTotal = currentTotal + Number(compositionPercent || 0);

      if (nextTotal > 100.0001) {
        alert(`구성비율 합계가 100%를 초과합니다. 현재 ${currentTotal.toFixed(2)}%, 추가 후 ${nextTotal.toFixed(2)}%`);
        return;
      }

      const { error } = await supabase.from("raw_compositions").insert([
        {
          raw_material_id: compositionRawId,
          ingredient_id: targetIngredientId,
          percentage: Number(compositionPercent),
        },
      ]);

      if (error) {
        alert("원료조성 저장 오류: " + error.message);
        return;
      }

      setCompositionRawId("");
      setCompositionGlobalSearch("");
      setCompositionGlobalId("");
      setCompositionPercent("");
      alert("Global 성분 기반 원료조성 저장 완료");
      loadAll();
    } catch (error) {
      alert("자동 연결 오류: " + (error as Error).message);
    }
  }

  async function addComposition() {
    if (!rawMaterialId || !ingredientId || !percentage) {
      alert("원료, 성분, 구성비율을 모두 입력하세요.");
      return;
    }

    if (hasDuplicateComposition(rawMaterialId, ingredientId)) {
      alert("이미 해당 원료에 동일 성분이 등록되어 있습니다.");
      return;
    }

    const currentTotal = getCompositionTotalByRaw(rawMaterialId);
    const nextTotal = currentTotal + Number(percentage || 0);

    if (nextTotal > 100.0001) {
      alert(`구성비율 합계가 100%를 초과합니다. 현재 ${currentTotal.toFixed(2)}%, 추가 후 ${nextTotal.toFixed(2)}%`);
      return;
    }

    const { error } = await supabase.from("raw_compositions").insert([
      {
        raw_material_id: rawMaterialId,
        ingredient_id: ingredientId,
        percentage: Number(percentage),
      },
    ]);

    if (error) {
      alert("원료조성 저장 오류: " + error.message);
      return;
    }

    setRawMaterialId("");
    setIngredientId("");
    setPercentage("");
    loadAll();
  }

  function getFilteredFormulas() {
    const keyword = formulaSearch.trim().toLowerCase();

    if (!keyword) {
      return formulas;
    }

    return formulas.filter((formula) => {
      return (
        formula.formula_code?.toLowerCase().includes(keyword) ||
        formula.formula_name?.toLowerCase().includes(keyword) ||
        formula.version?.toLowerCase().includes(keyword)
      );
    });
  }

  function getSelectedFormula() {
    return formulas.find((formula) => formula.id === selectedFormulaId) || null;
  }

  function getSortedBreakdownByFormula(targetFormulaId: string) {
    return calculateBreakdown(targetFormulaId).sort((a, b) => {
      const aAboveOne = Number(a.final_percentage || 0) >= 1;
      const bAboveOne = Number(b.final_percentage || 0) >= 1;

      if (aAboveOne && !bAboveOne) return -1;
      if (!aAboveOne && bAboveOne) return 1;

      return Number(b.final_percentage || 0) - Number(a.final_percentage || 0);
    });
  }

  function getFilteredAiIngredients() {
    const keyword = aiIngredientSearch.trim().toLowerCase();

    if (!keyword) {
      return globalIngredients.slice(0, 100);
    }

    return globalIngredients
      .filter((item) => {
        const text = [
          item.inci_name,
          item.korean_name,
          item.chinese_name,
          item.japanese_name,
          item.cas_no,
          item.ec_no,
          item.function_ko,
          item.function_en,
          item.iecic_status,
          item.cosmos_status,
          item.vegan_status,
          item.halal_status,
          item.rspo_status,
          item.eu_status,
          item.china_status,
          item.japan_status,
          item.asean_status,
          item.ewg_grade,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(keyword);
      })
      .slice(0, 100);
  }

  function getIngredientRecommendedRange(item: GlobalIngredient) {
    const text = `${item.inci_name} ${item.korean_name} ${item.function_ko} ${item.function_en}`.toLowerCase();

    if (item.max_use_percent) {
      return `0.01 ~ ${item.max_use_percent}% 이하`;
    }

    if (text.includes("preservative") || text.includes("보존")) return "0.1 ~ 1.0%";
    if (text.includes("retinol") || text.includes("레티놀")) return "0.01 ~ 0.3%";
    if (text.includes("salicylic") || text.includes("살리실")) return "0.1 ~ 2.0%";
    if (text.includes("niacinamide") || text.includes("나이아신")) return "2.0 ~ 5.0%";
    if (text.includes("panthenol") || text.includes("판테놀")) return "0.5 ~ 5.0%";
    if (text.includes("hyaluronate") || text.includes("히알루")) return "0.01 ~ 1.0%";
    if (text.includes("ceramide") || text.includes("세라마이드")) return "0.01 ~ 0.5%";
    if (text.includes("thick") || text.includes("점증") || text.includes("gum") || text.includes("카보머")) return "0.05 ~ 1.0%";
    if (text.includes("humectant") || text.includes("보습")) return "1.0 ~ 10.0%";
    if (text.includes("emollient") || text.includes("에몰리언트")) return "1.0 ~ 20.0%";

    return "원료 특성 및 제품 유형별 설정 필요";
  }

  function getIngredientStabilityNotes(item: GlobalIngredient) {
    const text = `${item.inci_name} ${item.korean_name} ${item.function_ko} ${item.function_en}`.toLowerCase();
    const notes: string[] = [];

    if (text.includes("retinol") || text.includes("레티놀")) notes.push("광/열/산소 안정성 검토 필요. 에어리스/차광 포장 권장.");
    if (text.includes("ascorbic") || text.includes("아스코")) notes.push("산화 안정성 및 pH 조건 검토 필요.");
    if (text.includes("carbomer") || text.includes("카보머")) notes.push("중화제, 전해질, pH에 따른 점도 변화 확인 필요.");
    if (text.includes("niacinamide") || text.includes("나이아신")) notes.push("저pH 제형에서 니코틴산 전환/피부자극 가능성 검토.");
    if (text.includes("hyaluronate") || text.includes("히알루")) notes.push("고분자/저분자 원료별 점도 및 사용감 차이 확인.");
    if (text.includes("preservative") || text.includes("보존")) notes.push("방부력 테스트 및 국가별 보존제 한도 확인 필요.");

    if (notes.length === 0) notes.push("일반적인 온도/광/미생물 안정성 시험으로 확인 권장.");

    return notes;
  }

  function getIngredientFormulationNotes(item: GlobalIngredient) {
    const text = `${item.inci_name} ${item.korean_name} ${item.function_ko} ${item.function_en}`.toLowerCase();
    const notes: string[] = [];

    if (text.includes("humectant") || text.includes("보습")) notes.push("수상 Phase에 적용 권장. 끈적임은 다가알코올/베타인 조합으로 밸런싱.");
    if (text.includes("emollient") || text.includes("에몰리언트")) notes.push("유상 Phase에서 사용감, 산패, 유화 안정성 확인.");
    if (text.includes("thick") || text.includes("점증") || text.includes("gum")) notes.push("분산 순서와 수화 시간이 중요. 뭉침 방지 공정 필요.");
    if (text.includes("surfactant") || text.includes("계면")) notes.push("HLB, 자극, 점도 형성, 전해질 영향 확인.");
    if (text.includes("preservative") || text.includes("보존")) notes.push("pH, 용해도, 부스터 조합, Challenge Test 확인.");
    if (notes.length === 0) notes.push("제형 유형별 용해도, 투입 Phase, pH, 가열 안정성 확인 필요.");

    return notes;
  }

  function getIngredientSubstituteCandidates(item: GlobalIngredient) {
    const targetFunction = `${item.function_ko} ${item.function_en}`.toLowerCase();
    const targetInci = (item.inci_name || "").toLowerCase();

    return globalIngredients
      .filter((candidate) => candidate.id !== item.id)
      .filter((candidate) => {
        const text = `${candidate.function_ko} ${candidate.function_en} ${candidate.inci_name} ${candidate.korean_name}`.toLowerCase();

        if (targetFunction.includes("보습") || targetFunction.includes("humectant")) {
          return text.includes("보습") || text.includes("humectant");
        }

        if (targetFunction.includes("emollient") || targetFunction.includes("에몰리언트")) {
          return text.includes("emollient") || text.includes("에몰리언트");
        }

        if (targetFunction.includes("preservative") || targetFunction.includes("보존")) {
          return text.includes("preservative") || text.includes("보존");
        }

        if (targetInci.includes("ceramide")) return text.includes("ceramide") || text.includes("세라마이드");
        if (targetInci.includes("hyaluronate")) return text.includes("hyaluronate") || text.includes("히알루");

        return targetFunction && text.includes(targetFunction.split(" ")[0]);
      })
      .slice(0, 8);
  }

  function analyzeAiIngredient(item: GlobalIngredient) {
    const matchedRawMaterials = materials.filter((material) => {
      const text = `${material.raw_name} ${material.raw_code}`.toLowerCase();
      return (
        text.includes((item.inci_name || "").toLowerCase()) ||
        text.includes((item.korean_name || "").toLowerCase())
      );
    });

    const regulationRows = countryRegulations.filter((reg) => {
      const sameInci = item.inci_name && reg.inci_name?.toLowerCase() === item.inci_name.toLowerCase();
      const sameCas = item.cas_no && reg.cas_no === item.cas_no;
      return sameInci || sameCas;
    });

    const highRisk = regulationRows.some((row) => row.is_prohibited);
    const mediumRisk =
      !highRisk &&
      (regulationRows.some((row) => row.regulation_type === "Restricted") ||
        item.max_use_percent ||
        String(item.regulation_note || "").includes("확인"));

    const riskLevel = highRisk ? "HIGH" : mediumRisk ? "MEDIUM" : "LOW";
    const score = riskLevel === "HIGH" ? 45 : riskLevel === "MEDIUM" ? 70 : 90;

    setAiIngredientAnalysis({
      ingredient: item,
      matched_raw_materials: matchedRawMaterials,
      regulation_rows: regulationRows,
      recommended_range: getIngredientRecommendedRange(item),
      stability_notes: getIngredientStabilityNotes(item),
      formulation_notes: getIngredientFormulationNotes(item),
      substitute_candidates: getIngredientSubstituteCandidates(item),
      risk_level: riskLevel,
      score,
    });
  }

  function normalizeTextForAi(value: string) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function findGlobalIngredientByKeywords(keywords: string[]) {
    return globalIngredients.find((item) => {
      const text = normalizeTextForAi(
        [
          item.inci_name,
          item.korean_name,
          item.function_ko,
          item.function_en,
          item.regulation_note,
          item.iecic_status,
          item.cosmos_status,
          item.vegan_status,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return keywords.some((keyword) => text.includes(normalizeTextForAi(keyword)));
    });
  }

  function findRawMaterialForIngredient(inciName: string, koreanName: string) {
    const normalizedInci = normalizeTextForAi(inciName);
    const normalizedKo = normalizeTextForAi(koreanName);

    const direct = materials.find((material) => {
      const rawText = normalizeTextForAi(`${material.raw_name} ${material.raw_code}`);
      return rawText.includes(normalizedInci) || rawText.includes(normalizedKo);
    });

    if (direct) return direct;

    const composition = compositions.find((row) => {
      const inci = normalizeTextForAi(row.ingredients?.inci_name || "");
      const ko = normalizeTextForAi(row.ingredients?.korean_name || "");

      return inci === normalizedInci || ko === normalizedKo || inci.includes(normalizedInci) || ko.includes(normalizedKo);
    });

    return composition?.raw_materials || undefined;
  }

  function buildAiSuggestion(
    phase: string,
    keywords: string[],
    fallbackInci: string,
    fallbackKo: string,
    purpose: string,
    recommendedPercent: number,
    minPercent: number,
    maxPercent: number,
    note: string
  ): AiFormulaSuggestion {
    const global = findGlobalIngredientByKeywords(keywords) || {
      inci_name: fallbackInci,
      korean_name: fallbackKo,
    } as GlobalIngredient;

    const raw = findRawMaterialForIngredient(global.inci_name || fallbackInci, global.korean_name || fallbackKo);
    const unitPrice = Number(raw?.unit_price || 0);
    const cost = raw ? (unitPrice * recommendedPercent) / 100 : 0;

    return {
      phase,
      inci_name: global.inci_name || fallbackInci,
      korean_name: global.korean_name || fallbackKo,
      purpose,
      recommended_percent: recommendedPercent,
      min_percent: minPercent,
      max_percent: maxPercent,
      raw_material_id: raw?.id,
      raw_material_name: raw?.raw_name,
      unit_price: unitPrice,
      cost,
      note: raw ? note : `${note} / 원료마스터 매칭 필요`,
    };
  }

  function getAiFormulaTemplate() {
    const type = normalizeTextForAi(aiFormulaType);
    const concept = normalizeTextForAi(aiConcept);
    const required = normalizeTextForAi(aiRequiredIngredients);
    const avoid = normalizeTextForAi(aiAvoidIngredients);

    const suggestions: AiFormulaSuggestion[] = [];

    suggestions.push(buildAiSuggestion("Phase A", ["water", "aqua", "정제수"], "Water", "정제수", "Base", 70, 50, 90, "기본 수상 베이스"));
    suggestions.push(buildAiSuggestion("Phase A", ["glycerin", "글리세린"], "Glycerin", "글리세린", "Humectant", concept.includes("고보습") ? 5 : 3, 1, 10, "기본 보습제"));
    suggestions.push(buildAiSuggestion("Phase A", ["betaine", "베타인"], "Betaine", "베타인", "Humectant / Mildness", concept.includes("저자극") ? 3 : 2, 0.5, 5, "저자극 보습 보조"));
    suggestions.push(buildAiSuggestion("Phase A", ["panthenol", "판테놀"], "Panthenol", "판테놀", "Soothing", concept.includes("진정") || concept.includes("저자극") ? 1 : 0.5, 0.1, 5, "진정 및 장벽 보조"));

    if (type.includes("크림") || type.includes("로션") || type.includes("cream")) {
      suggestions.push(buildAiSuggestion("Phase B", ["caprylic", "triglyceride", "카프릴릭"], "Caprylic/Capric Triglyceride", "카프릴릭/카프릭트라이글리세라이드", "Emollient", 6, 2, 15, "가벼운 에몰리언트"));
      suggestions.push(buildAiSuggestion("Phase B", ["squalane", "스쿠알란"], "Squalane", "스쿠알란", "Emollient", concept.includes("프리미엄") ? 3 : 1.5, 0.5, 10, "보습막 및 사용감 개선"));
      suggestions.push(buildAiSuggestion("Phase B", ["cetearyl alcohol", "세테아릴"], "Cetearyl Alcohol", "세테아릴알코올", "Consistency", 2, 0.5, 5, "크림 점도 및 바디감"));
      suggestions.push(buildAiSuggestion("Phase B", ["glyceryl stearate", "글리세릴스테아레이트"], "Glyceryl Stearate", "글리세릴스테아레이트", "Emulsifier", 2.5, 1, 5, "기본 유화제"));
    }

    if (type.includes("세럼") || type.includes("앰플") || type.includes("serum")) {
      suggestions.push(buildAiSuggestion("Phase A", ["butylene glycol", "부틸렌글라이콜"], "Butylene Glycol", "부틸렌글라이콜", "Humectant / Solvent", 5, 1, 10, "세럼 보습 및 용제"));
      suggestions.push(buildAiSuggestion("Phase C", ["sodium hyaluronate", "하이알루로네이트"], "Sodium Hyaluronate", "소듐하이알루로네이트", "Moisturizing", 0.1, 0.01, 1, "고보습 컨셉 핵심"));
    }

    if (concept.includes("미백") || required.includes("나이아신") || required.includes("niacinamide")) {
      suggestions.push(buildAiSuggestion("Phase A", ["niacinamide", "나이아신"], "Niacinamide", "나이아신아마이드", "Brightening", 2, 0.5, 5, "미백/톤 케어 컨셉"));
    }

    if (concept.includes("장벽") || concept.includes("세라마이드") || required.includes("ceramide")) {
      suggestions.push(buildAiSuggestion("Phase C", ["ceramide", "세라마이드"], "Ceramide NP", "세라마이드엔피", "Barrier Care", 0.05, 0.01, 0.5, "장벽 케어 컨셉"));
    }

    suggestions.push(buildAiSuggestion("Phase C", ["allantoin", "알란토인"], "Allantoin", "알란토인", "Soothing", 0.2, 0.05, 0.5, "피부 진정 보조"));
    suggestions.push(buildAiSuggestion("Phase C", ["1,2-hexanediol", "헥산다이올"], "1,2-Hexanediol", "1,2-헥산다이올", "Preservative Booster", 1.5, 0.5, 3, "보존 보조 및 보습"));
    suggestions.push(buildAiSuggestion("Phase C", ["ethylhexylglycerin", "에틸헥실글리세린"], "Ethylhexylglycerin", "에틸헥실글리세린", "Preservative Booster", 0.3, 0.1, 1, "보존 보조"));

    const filtered = suggestions.filter((item) => {
      const text = normalizeTextForAi(`${item.inci_name} ${item.korean_name}`);
      return !avoid || !avoid.split(",").some((keyword) => keyword.trim() && text.includes(normalizeTextForAi(keyword.trim())));
    });

    const subtotal = filtered.reduce((sum, item) => sum + Number(item.recommended_percent || 0), 0);
    const water = filtered.find((item) => normalizeTextForAi(item.inci_name) === "water");

    if (water) {
      water.recommended_percent = Math.max(0, 100 - (subtotal - water.recommended_percent));
      water.cost = water.raw_material_id ? (Number(water.unit_price || 0) * water.recommended_percent) / 100 : 0;
    }

    return filtered;
  }

  function checkAiRegulationRisks(suggestions: AiFormulaSuggestion[]) {
    const countries = aiTargetCountries
      .split(",")
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean);

    const risks: string[] = [];

    suggestions.forEach((item) => {
      countries.forEach((country) => {
        const match = countryRegulations.find((reg) => {
          const sameCountry = reg.country_code?.toUpperCase() === country;
          const sameInci = item.inci_name && reg.inci_name?.toLowerCase() === item.inci_name.toLowerCase();
          const sameCas = false;

          return sameCountry && (sameInci || sameCas);
        });

        if (!match) return;

        if (match.is_prohibited) {
          risks.push(`${country}: ${item.inci_name} 금지성분 가능성 - ${match.warning_message}`);
          return;
        }

        if (Number(match.max_percentage || 0) > 0 && item.recommended_percent > Number(match.max_percentage || 0)) {
          risks.push(`${country}: ${item.inci_name} ${item.recommended_percent}% > 허용 ${match.max_percentage}%`);
          return;
        }

        if (match.regulation_type === "Warning") {
          risks.push(`${country}: ${item.inci_name} 주의 - ${match.warning_message}`);
        }
      });
    });

    return risks;
  }

  function generateAiFormula() {
    const suggestions = getAiFormulaTemplate();
    const estimatedCost = suggestions.reduce((sum, item) => sum + Number(item.cost || 0), 0);
    const total = suggestions.reduce((sum, item) => sum + Number(item.recommended_percent || 0), 0);
    const riskNotes = checkAiRegulationRisks(suggestions);

    const result = {
      formula_type: aiFormulaType,
      concept: aiConcept,
      target_ph: aiFormulaType.includes("크림") ? "5.5 ~ 6.5" : "5.0 ~ 6.5",
      target_viscosity: aiFormulaType.includes("크림") ? "20,000 ~ 60,000 cPs" : "제품 유형별 설정 필요",
      total_percent: total,
      estimated_cost: estimatedCost,
      risk_notes: riskNotes,
      suggestions,
    };

    setAiResult(result);
    analyzeAiFormulaIntelligence(result);
  }

  function analyzeAiFormulaIntelligence(result: AiFormulaResult) {
    const suggestions = result.suggestions;
    const totalCost = result.estimated_cost;
    const targetCost = Number(aiTargetCost || 0);

    const hasHumectant = suggestions.some((item) => normalizeTextForAi(item.purpose).includes("humectant") || normalizeTextForAi(item.purpose).includes("moist"));
    const humectantLevel = suggestions
      .filter((item) => normalizeTextForAi(`${item.purpose} ${item.inci_name} ${item.korean_name}`).includes("humectant") || normalizeTextForAi(`${item.purpose} ${item.inci_name} ${item.korean_name}`).includes("보습"))
      .reduce((sum, item) => sum + item.recommended_percent, 0);

    const soothingLevel = suggestions
      .filter((item) => normalizeTextForAi(`${item.purpose} ${item.inci_name} ${item.korean_name}`).includes("soothing") || normalizeTextForAi(`${item.purpose} ${item.inci_name} ${item.korean_name}`).includes("진정"))
      .reduce((sum, item) => sum + item.recommended_percent, 0);

    const phaseBalance = suggestions.reduce((acc, item) => {
      acc[item.phase] = (acc[item.phase] || 0) + Number(item.recommended_percent || 0);
      return acc;
    }, {} as Record<string, number>);

    const problemNotes: string[] = [];
    const costSavingNotes: string[] = [];

    suggestions.forEach((item) => {
      if (!item.raw_material_id) {
        problemNotes.push(`${item.inci_name}: 원료마스터 매칭 필요`);
      }

      if (item.recommended_percent > item.max_percent) {
        problemNotes.push(`${item.inci_name}: 추천 함량이 권장범위를 초과`);
      }

      if (normalizeTextForAi(item.inci_name).includes("panthenol") && item.recommended_percent >= 5) {
        problemNotes.push("Panthenol 5% 이상: 끈적임/사용감 저하 가능성 검토");
      }

      if (normalizeTextForAi(item.inci_name).includes("carbomer")) {
        const hasNeutralizer = suggestions.some((s) => normalizeTextForAi(s.inci_name).includes("tromethamine") || normalizeTextForAi(s.inci_name).includes("aminomethyl"));
        if (!hasNeutralizer) problemNotes.push("Carbomer 사용 시 중화제/점도 형성 조건 검토 필요");
      }

      if (Number(item.unit_price || 0) > 50000 && item.recommended_percent > 1) {
        costSavingNotes.push(`${item.inci_name}: 고가 원료 비중이 높음. 대체/함량 최적화 검토`);
      }
    });

    if (targetCost > 0 && totalCost > targetCost) {
      costSavingNotes.push(`예상 원가 ${totalCost.toFixed(0)}원/kg이 목표원가 ${targetCost.toFixed(0)}원/kg 초과`);
    }

    if (!hasHumectant || humectantLevel < 5) {
      problemNotes.push("보습 컨셉 대비 Humectant 총량이 낮을 수 있음");
    }

    const moistureScore = Math.min(100, Math.round(55 + humectantLevel * 5));
    const soothingScore = Math.min(100, Math.round(55 + soothingLevel * 12));
    const costScore = targetCost > 0 ? Math.max(0, Math.min(100, Math.round(100 - ((totalCost - targetCost) / targetCost) * 100))) : 70;
    const regulationScore = Math.max(0, 100 - result.risk_notes.length * 15);
    const stabilityScore = Math.max(45, 90 - problemNotes.length * 7);

    const regulationSummary =
      result.risk_notes.length > 0
        ? result.risk_notes
        : aiTargetCountries.split(",").map((country) => `${country.trim().toUpperCase()}: 현재 DB 기준 주요 위험 없음`);

    setAiIntelligence({
      moisture_score: moistureScore,
      soothing_score: soothingScore,
      cost_score: costScore,
      regulation_score: regulationScore,
      stability_score: stabilityScore,
      phase_balance: phaseBalance,
      problem_notes: problemNotes.length ? problemNotes : ["현재 초안 기준 주요 제형 리스크 없음"],
      cost_saving_notes: costSavingNotes.length ? costSavingNotes : ["현재 초안 기준 즉시 원가절감 경고 없음"],
      regulation_summary: regulationSummary,
    });
  }

  async function createFormulaFromAiDraft() {
    if (!assertCanEdit()) return;

    if (!aiResult) {
      alert("먼저 AI 처방 초안을 생성하세요.");
      return;
    }

    const codeValue = aiDraftCode || `AI-${new Date().getFullYear()}-${String(formulas.length + 1).padStart(3, "0")}`;
    const nameValue = aiDraftName || `${aiFormulaType} AI Draft`;

    const { data: newFormula, error } = await supabase
      .from("formulas")
      .insert([
        {
          formula_code: codeValue,
          formula_name: nameValue,
          version: "0.1",
          revision_no: 1,
          revision_note: `AI Formula Assistant Draft / ${aiConcept}`,
          target_cost: Number(aiTargetCost || 0),
          selling_price: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("AI 처방 저장 오류: " + error.message);
      return;
    }

    const items = aiResult.suggestions
      .filter((item) => item.raw_material_id)
      .map((item) => ({
        formula_id: newFormula.id,
        raw_material_id: item.raw_material_id,
        phase: item.phase,
        percentage: Number(item.recommended_percent || 0),
        remark: `AI 추천: ${item.purpose} / ${item.note}`,
      }));

    if (items.length > 0) {
      const { error: itemError } = await supabase.from("formula_items").insert(items);

      if (itemError) {
        alert("AI 처방 원료 저장 오류: " + itemError.message);
        return;
      }
    }

    await logAudit("AI Formula Assistant", newFormula.id, "AI 처방초안 생성", null, {
      formula_code: codeValue,
      formula_name: nameValue,
      concept: aiConcept,
      item_count: items.length,
      estimated_cost: aiResult.estimated_cost,
      risks: aiResult.risk_notes,
    });

    setSelectedFormulaId(newFormula.id);
    setFormulaId(newFormula.id);
    setMenu("formula");
    alert(`AI 처방 초안 저장 완료: ${codeValue} / 원료 ${items.length}개 연결`);
    loadAll();
  }

  async function addFormula() {
    if (!assertCanEdit()) return;
    if (!formulaCode || !formulaName) {
      alert("처방코드와 처방명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("formulas").insert([
      {
        formula_code: formulaCode,
        formula_name: formulaName,
        version: formulaVersion,
        target_cost: Number(formulaTargetCost || 0),
        selling_price: Number(formulaSellingPrice || 0),
      },
    ]);

    if (error) {
      alert("처방 저장 오류: " + error.message);
      return;
    }

    setFormulaCode("");
    setFormulaName("");
    setFormulaVersion("1.0");
    setFormulaTargetCost("");
    setFormulaSellingPrice("");
    await logAudit("처방관리", formulaCode, "등록", null, {
      formula_code: formulaCode,
      formula_name: formulaName,
      version: formulaVersion,
      target_cost: Number(formulaTargetCost || 0),
      selling_price: Number(formulaSellingPrice || 0),
    });
    loadAll();
  }

  async function addFormulaItem() {
    if (!assertCanEdit()) return;
    if (!assertFormulaEditable(formulaId)) return;
    if (!formulaId || !formulaRawMaterialId || !formulaItemPercentage) {
      alert("처방, 원료, 투입량을 모두 입력하세요.");
      return;
    }

    const { error } = await supabase.from("formula_items").insert([
      {
        formula_id: formulaId,
        raw_material_id: formulaRawMaterialId,
        percentage: Number(formulaItemPercentage),
        phase: formulaItemPhase,
        remark: formulaItemRemark,
      },
    ]);

    if (error) {
      alert("처방 원료 저장 오류: " + error.message);
      return;
    }

    setFormulaId("");
    setFormulaRawMaterialId("");
    setFormulaItemPercentage("");
    setFormulaItemPhase("Phase A");
    setFormulaItemRemark("");
    loadAll();
  }

  async function updateFormulaItem(item: FormulaItem) {
    if (!assertCanEdit()) return;
    if (!assertFormulaEditable(item.formulas?.id || '')) return;
    const phaseValue = window.prompt(
      "Phase를 입력하세요. 예: Phase A ~ Phase H",
      item.phase || "Phase A"
    );
    if (phaseValue === null) return;

    const percentValue = window.prompt(
      "투입량(%)",
      String(item.percentage || 0)
    );
    if (percentValue === null) return;

    const remarkValue = window.prompt(
      "비고",
      item.remark || ""
    );
    if (remarkValue === null) return;

    const rawMaterialIdValue = window.prompt(
      "원료 ID는 일반적으로 수정하지 마세요. 원료 변경이 필요하면 새로 등록하는 것을 권장합니다.",
      item.raw_materials?.id || ""
    );
    if (rawMaterialIdValue === null) return;

    const { error } = await supabase
      .from("formula_items")
      .update({
        raw_material_id: rawMaterialIdValue || item.raw_materials?.id,
        phase: phaseValue || "Phase A",
        percentage: Number(percentValue || 0),
        remark: remarkValue || "",
      })
      .eq("id", item.id);

    if (error) {
      alert("처방 원료 수정 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function deleteFormulaItem(item: FormulaItem) {
    if (!assertCanDelete()) return;
    if (!assertFormulaEditable(item.formulas?.id || '')) return;
    const ok = window.confirm(
      `${item.raw_materials?.raw_code} / ${item.raw_materials?.raw_name} 처방 원료를 삭제할까요?`
    );

    if (!ok) return;

    const okMove = await softDeleteRecord("formula_items", item.id, "처방원료", item);
    if (okMove) loadAll();
  }

  function calculateBreakdown(targetFormulaId: string) {
    const targetFormulaItems = formulaItems.filter(
      (item) => item.formulas?.id === targetFormulaId
    );

    const result: Record<string, BreakdownItem> = {};

    targetFormulaItems.forEach((formulaItem) => {
      const rawId = formulaItem.raw_materials?.id;
      const inputPercentage = Number(formulaItem.percentage || 0);

      const relatedCompositions = compositions.filter(
        (composition) => composition.raw_materials?.id === rawId
      );

      relatedCompositions.forEach((composition) => {
        const ingredient = composition.ingredients;
        const compositionPercentage = Number(composition.percentage || 0);
        const finalPercentage = (inputPercentage * compositionPercentage) / 100;
        const key = ingredient.inci_name || ingredient.korean_name || composition.id;

        const globalMatch = globalIngredients.find((globalItem) => {
          const sameInci =
            globalItem.inci_name &&
            ingredient.inci_name &&
            globalItem.inci_name.trim().toLowerCase() === ingredient.inci_name.trim().toLowerCase();

          const sameCas =
            globalItem.cas_no &&
            ingredient.cas_no &&
            globalItem.cas_no.trim() === ingredient.cas_no.trim();

          return sameInci || sameCas;
        });

        if (!result[key]) {
          result[key] = {
            inci_name: ingredient.inci_name || globalMatch?.inci_name || "",
            korean_name: ingredient.korean_name || globalMatch?.korean_name || "",
            cas_no: ingredient.cas_no || globalMatch?.cas_no || "",
            ec_no: ingredient.ec_no || globalMatch?.ec_no || "",
            function_ko: ingredient.function_ko || globalMatch?.function_ko || "",
            iecic_status: globalMatch?.iecic_status || "",
            cosmos_status: globalMatch?.cosmos_status || "",
            vegan_status: globalMatch?.vegan_status || "",
            regulation_note: globalMatch?.regulation_note || "",
            final_percentage: 0,
          };
        }

        result[key].final_percentage += finalPercentage;
      });
    });

    return Object.values(result).sort((a, b) => Number(b.final_percentage || 0) - Number(a.final_percentage || 0));
  }

  function generateBreakdownIL() {
    if (!breakdownFormulaId) {
      alert("Breakdown IL을 생성할 처방을 선택하세요.");
      return;
    }

    const targetFormulaItems = formulaItems.filter(
      (item) => item.formulas?.id === breakdownFormulaId
    );

    if (targetFormulaItems.length === 0) {
      alert("선택한 처방에 등록된 원료가 없습니다.");
      return;
    }

    setBreakdownItems(calculateBreakdown(breakdownFormulaId));
  }

  function generateFullIL() {
    if (!fullIlFormulaId) {
      alert("Full IL을 생성할 처방을 선택하세요.");
      return;
    }

    const targetFormulaItems = formulaItems.filter(
      (item) => item.formulas?.id === fullIlFormulaId
    );

    if (targetFormulaItems.length === 0) {
      alert("선택한 처방에 등록된 원료가 없습니다.");
      return;
    }

    const rows: FullIlItem[] = [];

    targetFormulaItems.forEach((formulaItem) => {
      const rawId = formulaItem.raw_materials?.id;
      const inputPercentage = Number(formulaItem.percentage);

      const relatedCompositions = compositions.filter(
        (composition) => composition.raw_materials?.id === rawId
      );

      relatedCompositions.forEach((composition) => {
        const ingredient = composition.ingredients;
        const compositionPercentage = Number(composition.percentage);
        const finalPercentage = (inputPercentage * compositionPercentage) / 100;

        rows.push({
          formula_code: formulaItem.formulas?.formula_code || "",
          formula_name: formulaItem.formulas?.formula_name || "",
          raw_code: formulaItem.raw_materials?.raw_code || "",
          raw_name: formulaItem.raw_materials?.raw_name || "",
          raw_input_percentage: inputPercentage,
          inci_name: ingredient.inci_name,
          korean_name: ingredient.korean_name,
          composition_percentage: compositionPercentage,
          final_percentage: finalPercentage,
          cas_no: ingredient.cas_no,
          ec_no: ingredient.ec_no,
          function_ko: ingredient.function_ko,
        });
      });
    });

    rows.sort((a, b) => {
      if (a.raw_code === b.raw_code) {
        return b.final_percentage - a.final_percentage;
      }
      return a.raw_code.localeCompare(b.raw_code);
    });

    setFullIlItems(rows);
    setBreakdownItems(calculateBreakdown(fullIlFormulaId));
  }

  function getSortedIngredientItems() {
    return [...breakdownItems].sort(
      (a, b) => Number(b.final_percentage || 0) - Number(a.final_percentage || 0)
    );
  }

  function makeKoreanIngredientList() {
    if (breakdownItems.length === 0) {
      return "";
    }

    return getSortedIngredientItems()
      .map((item) => item.korean_name || item.inci_name)
      .join(", ");
  }

  function makeEnglishIngredientList() {
    if (breakdownItems.length === 0) {
      return "";
    }

    return getSortedIngredientItems()
      .map((item) => item.inci_name)
      .join(", ");
  }

  function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv =
      "\ufeff" +
      [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function downloadBreakdownIL() {
    if (breakdownItems.length === 0) {
      alert("먼저 Breakdown IL을 생성하세요.");
      return;
    }

    downloadCsv(
      "Breakdown_IL.csv",
      ["INCI", "국문명", "CAS No.", "EC No.", "기능", "최종함량(%)"],
      breakdownItems.map((item) => [
        item.inci_name,
        item.korean_name,
        item.cas_no,
        item.ec_no,
        item.function_ko,
        item.final_percentage.toFixed(6),
      ])
    );
  }

  function downloadFullIL() {
    if (fullIlItems.length === 0) {
      alert("먼저 Full IL을 생성하세요.");
      return;
    }

    downloadCsv(
      "Full_IL.csv",
      [
        "처방코드",
        "처방명",
        "원료코드",
        "원료명",
        "원료투입량(%)",
        "INCI",
        "국문명",
        "원료 내 구성비(%)",
        "최종함량(%)",
        "CAS No.",
        "EC No.",
        "기능",
      ],
      fullIlItems.map((item) => [
        item.formula_code,
        item.formula_name,
        item.raw_code,
        item.raw_name,
        item.raw_input_percentage.toFixed(6),
        item.inci_name,
        item.korean_name,
        item.composition_percentage.toFixed(6),
        item.final_percentage.toFixed(6),
        item.cas_no,
        item.ec_no,
        item.function_ko,
      ])
    );
  }

  function getSortedIngredientItemsByFormula(targetFormulaId: string) {
    return calculateBreakdown(targetFormulaId).sort(
      (a, b) => Number(b.final_percentage || 0) - Number(a.final_percentage || 0)
    );
  }

  function makeKoreanIngredientListByFormula(targetFormulaId: string) {
    if (!targetFormulaId) {
      return "";
    }

    return getSortedIngredientItemsByFormula(targetFormulaId)
      .map((item) => item.korean_name || item.inci_name)
      .join(", ");
  }

  function makeEnglishIngredientListByFormula(targetFormulaId: string) {
    if (!targetFormulaId) {
      return "";
    }

    return getSortedIngredientItemsByFormula(targetFormulaId)
      .map((item) => item.inci_name)
      .join(", ");
  }

  function downloadFormulaSheetCsv() {
    if (!sheetFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    const formula = getFormulaById(sheetFormulaId);
    const rows = getFormulaSheetRows(sheetFormulaId).map((item) => [
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      item.phase || "미지정",
      item.raw_materials?.raw_code || "",
      item.raw_materials?.raw_name || "",
      Number(item.percentage || 0).toFixed(4),
      item.remark || "",
    ]);

    rows.push([
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      "TOTAL",
      "",
      "",
      getFormulaSheetTotal(sheetFormulaId).toFixed(4),
      Math.abs(getFormulaSheetTotal(sheetFormulaId) - 100) < 0.0001 ? "TOTAL 100% 완료" : "TOTAL 100% 아님",
    ]);

    downloadCsv(
      `${formula?.formula_code || "Formula"}_Formula_Sheet.csv`,
      ["처방코드", "처방명", "Version", "Phase", "원료코드", "원료명", "투입량(%)", "비고"],
      rows
    );
  }

  function downloadIngredientList() {
    const label = labelFormulaId ? makeKoreanIngredientListByFormula(labelFormulaId) : makeKoreanIngredientList();

    if (!label) {
      alert("처방을 선택하거나 먼저 Breakdown IL 또는 Full IL을 생성하세요.");
      return;
    }

    const formula = labelFormulaId ? getFormulaById(labelFormulaId) : null;

    downloadCsv(
      `${formula?.formula_code || "Ingredient"}_List.csv`,
      ["국문 전성분", "영문 Ingredient List"],
      [[label, labelFormulaId ? makeEnglishIngredientListByFormula(labelFormulaId) : makeEnglishIngredientList()]]
    );
  }


  function getFormulaTotal(targetFormulaId: string) {
    return formulaItems
      .filter((item) => item.formulas?.id === targetFormulaId)
      .reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  }

  function getFormulaCost(targetFormulaId: string) {
    return formulaItems
      .filter((item) => item.formulas?.id === targetFormulaId)
      .reduce((sum, item) => {
        const unitPrice = Number(item.raw_materials?.unit_price || 0);
        const percent = Number(item.percentage || 0);
        return sum + (unitPrice * percent) / 100;
      }, 0);
  }

  function getCostGap(targetFormulaId: string) {
    const formula = getFormulaById(targetFormulaId);
    const targetCost = Number(formula?.target_cost || 0);
    const actualCost = getFormulaCost(targetFormulaId);
    return targetCost - actualCost;
  }

  function getMarginRate(targetFormulaId: string) {
    const formula = getFormulaById(targetFormulaId);
    const sellingPrice = Number(formula?.selling_price || 0);
    const actualCost = getFormulaCost(targetFormulaId);

    if (!sellingPrice) {
      return 0;
    }

    return ((sellingPrice - actualCost) / sellingPrice) * 100;
  }

  function getFormulaCostRows(targetFormulaId: string) {
    return getFormulaItemsByFormula(targetFormulaId).map((item) => {
      const unitPrice = Number(item.raw_materials?.unit_price || 0);
      const percent = Number(item.percentage || 0);
      const cost = (unitPrice * percent) / 100;

      return {
        ...item,
        unitPrice,
        cost,
      };
    });
  }

  function getFormulaItemsByFormula(targetFormulaId: string) {
    return formulaItems
      .filter((item) => item.formulas?.id === targetFormulaId)
      .sort((a, b) => {
        const phaseCompare = (a.phase || "").localeCompare(b.phase || "");
        if (phaseCompare !== 0) {
          return phaseCompare;
        }
        return (a.raw_materials?.raw_code || "").localeCompare(
          b.raw_materials?.raw_code || ""
        );
      });
  }

  function getNextVersion(version: string) {
    const match = version.match(/^(\d+)\.(\d+)$/);

    if (!match) {
      return "1.1";
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);

    return `${major}.${minor + 1}`;
  }

  async function cloneFormula(sourceFormula: Formula) {
    if (!assertCanEdit()) return;
    const confirmCopy = window.confirm(
      `${sourceFormula.formula_code} ${sourceFormula.formula_name} v${sourceFormula.version} 처방을 복사하시겠습니까?`
    );

    if (!confirmCopy) {
      return;
    }

    const nextVersion = getNextVersion(sourceFormula.version || "1.0");

    const { data: newFormula, error: formulaError } = await supabase
      .from("formulas")
      .insert([
        {
          formula_code: sourceFormula.formula_code,
          formula_name: sourceFormula.formula_name,
          version: nextVersion,
          parent_formula_id: sourceFormula.id,
          revision_no: Number(sourceFormula.revision_no || 1) + 1,
          revision_note: `Copied from v${sourceFormula.version}`,
          target_cost: Number(sourceFormula.target_cost || 0),
          selling_price: Number(sourceFormula.selling_price || 0),
        },
      ])
      .select()
      .single();

    if (formulaError) {
      alert("처방 복사 오류: " + formulaError.message);
      return;
    }

    const sourceItems = formulaItems.filter(
      (item) => item.formulas?.id === sourceFormula.id
    );

    if (sourceItems.length > 0) {
      const newItems = sourceItems.map((item) => ({
        formula_id: newFormula.id,
        raw_material_id: item.raw_materials?.id,
        percentage: Number(item.percentage || 0),
        phase: item.phase || "",
        remark: item.remark || "",
      }));

      const { error: itemError } = await supabase
        .from("formula_items")
        .insert(newItems);

      if (itemError) {
        alert("처방 원료 복사 오류: " + itemError.message);
        return;
      }
    }

    alert(`복사 완료: ${sourceFormula.formula_code} v${nextVersion}`);
    loadAll();
  }

  function getFormulaFamily(targetFormula: Formula | null) {
    if (!targetFormula) return [];

    const rootCode = targetFormula.formula_code;

    return formulas
      .filter((formula) => formula.formula_code === rootCode)
      .sort((a, b) => Number(a.revision_no || 1) - Number(b.revision_no || 1));
  }

  function getNextMajorVersion(version: string) {
    const major = Number(String(version || "1.0").split(".")[0] || 1);
    return `${major + 1}.0`;
  }

  async function cloneFormulaWithMode(sourceFormula: Formula, mode: "minor" | "major") {
    if (!assertCanEdit()) return;

    const note = window.prompt(
      mode === "major"
        ? "Major Version 생성 사유를 입력하세요. 예: 고객 승인 버전, 컨셉 변경"
        : "Minor Revision 생성 사유를 입력하세요. 예: 점도 조정, 향료 변경",
      mode === "major" ? "Major version upgrade" : `Revision from v${sourceFormula.version}`
    );

    if (note === null) return;

    const nextVersion =
      mode === "major"
        ? getNextMajorVersion(sourceFormula.version || "1.0")
        : getNextVersion(sourceFormula.version || "1.0");

    const { data: newFormula, error: formulaError } = await supabase
      .from("formulas")
      .insert([
        {
          formula_code: sourceFormula.formula_code,
          formula_name: sourceFormula.formula_name,
          version: nextVersion,
          parent_formula_id: sourceFormula.id,
          revision_no: Number(sourceFormula.revision_no || 1) + 1,
          revision_note: note || `Copied from v${sourceFormula.version}`,
          target_cost: Number(sourceFormula.target_cost || 0),
          selling_price: Number(sourceFormula.selling_price || 0),
        },
      ])
      .select()
      .single();

    if (formulaError) {
      alert("처방 버전 생성 오류: " + formulaError.message);
      return;
    }

    const sourceItems = formulaItems.filter((item) => item.formulas?.id === sourceFormula.id);

    if (sourceItems.length > 0) {
      const newItems = sourceItems.map((item) => ({
        formula_id: newFormula.id,
        raw_material_id: item.raw_materials?.id,
        percentage: Number(item.percentage || 0),
        phase: item.phase || "",
        remark: item.remark || "",
      }));

      const { error: itemError } = await supabase.from("formula_items").insert(newItems);

      if (itemError) {
        alert("처방 원료 복사 오류: " + itemError.message);
        return;
      }
    }

    await logAudit("처방버전관리", newFormula.id, mode === "major" ? "Major Version 생성" : "Minor Revision 생성", sourceFormula, {
      formula_code: sourceFormula.formula_code,
      from_version: sourceFormula.version,
      to_version: nextVersion,
      revision_note: note,
    });

    setSelectedFormulaId(newFormula.id);
    setFormulaId(newFormula.id);
    setFormulaTab("version");
    alert(`버전 생성 완료: ${sourceFormula.formula_code} v${nextVersion}`);
    loadAll();
  }

  function getFormulaCompareRows(formulaAId: string, formulaBId: string) {
    const itemsA = formulaItems.filter((item) => item.formulas?.id === formulaAId);
    const itemsB = formulaItems.filter((item) => item.formulas?.id === formulaBId);

    const keys = Array.from(
      new Set([
        ...itemsA.map((item) => item.raw_materials?.id || item.raw_materials?.raw_name || ""),
        ...itemsB.map((item) => item.raw_materials?.id || item.raw_materials?.raw_name || ""),
      ])
    ).filter(Boolean);

    return keys.map((key) => {
      const itemA = itemsA.find((item) => (item.raw_materials?.id || item.raw_materials?.raw_name) === key);
      const itemB = itemsB.find((item) => (item.raw_materials?.id || item.raw_materials?.raw_name) === key);

      const percentA = Number(itemA?.percentage || 0);
      const percentB = Number(itemB?.percentage || 0);
      const diff = percentB - percentA;

      return {
        raw_code: itemA?.raw_materials?.raw_code || itemB?.raw_materials?.raw_code || "",
        raw_name: itemA?.raw_materials?.raw_name || itemB?.raw_materials?.raw_name || "",
        phase_a: itemA?.phase || "",
        phase_b: itemB?.phase || "",
        percent_a: percentA,
        percent_b: percentB,
        diff,
        status: !itemA ? "추가" : !itemB ? "삭제" : Math.abs(diff) > 0.000001 || itemA.phase !== itemB.phase ? "변경" : "동일",
      };
    });
  }

  function getFormulaById(targetFormulaId: string) {
    return formulas.find((formula) => formula.id === targetFormulaId);
  }

  function getFormulaSheetRows(targetFormulaId: string) {
    return getFormulaItemsByFormula(targetFormulaId);
  }

  function getFormulaSheetTotal(targetFormulaId: string) {
    return getFormulaTotal(targetFormulaId);
  }

  function printFormulaSheet() {
    if (!sheetFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    window.print();
  }

  function getFormulaSheetDate() {
    return new Date().toLocaleDateString("ko-KR");
  }

  function getMaterialDocumentExpiryStatus(item: MaterialDocument) {
    if (!item.expiry_date) {
      return { label: "만료일 없음", color: "#6b7280" };
    }

    const today = new Date();
    const expiry = new Date(item.expiry_date);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "만료", color: "red" };
    }

    if (diffDays <= 30) {
      return { label: `만료 ${diffDays}일 전`, color: "#d97706" };
    }

    return { label: "정상", color: "green" };
  }

  function getMaterialDocumentsByRaw(rawId: string) {
    return materialDocuments.filter((doc) => doc.raw_materials?.id === rawId);
  }

  function getDocumentStoragePath(rawId: string, file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const timestamp = Date.now();

    return `${rawId}/${timestamp}_${safeName}`;
  }

  async function uploadMaterialDocumentFile(rawId: string, file: File) {
    const filePath = getDocumentStoragePath(rawId, file);

    const { error } = await supabase.storage
      .from("material-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("material-documents")
      .getPublicUrl(filePath);

    return {
      filePath,
      publicUrl: data.publicUrl,
    };
  }

  async function deleteMaterialDocument(item: MaterialDocument) {
    if (!assertCanDelete()) return;

    const ok = window.confirm(`${item.document_title} 문서를 삭제할까요?`);

    if (!ok) return;

    if (item.file_path) {
      await supabase.storage.from("material-documents").remove([item.file_path]);
    }

    const { error } = await supabase
      .from("material_documents")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("문서 삭제 오류: " + error.message);
      return;
    }

    await logAudit("원료문서", item.id, "삭제", item, null);
    loadAll();
  }

  async function addMaterialDocument() {
    if (!assertCanEdit()) return;

    if (!docRawMaterialId || !docType || !docTitle) {
      alert("원료, 문서구분, 문서명을 입력하세요.");
      return;
    }

    setDocUploadStatus("문서 저장 중...");

    let uploadedFile = {
      filePath: "",
      publicUrl: docUrl,
    };

    try {
      if (docFile) {
        uploadedFile = await uploadMaterialDocumentFile(docRawMaterialId, docFile);
      }

      const payload = {
        raw_material_id: docRawMaterialId,
        document_type: docType,
        document_title: docTitle,
        document_url: uploadedFile.publicUrl || docUrl,
        file_path: uploadedFile.filePath || "",
        file_name: docFile?.name || "",
        file_size: docFile?.size || 0,
        mime_type: docFile?.type || "",
        issue_date: docIssueDate || null,
        expiry_date: docExpiryDate || null,
        uploaded_by: userProfile?.display_name || authUser?.email || "",
        remark: docRemark,
      };

      const { error } = await supabase.from("material_documents").insert([payload]);

      if (error) {
        alert("문서 저장 오류: " + error.message);
        setDocUploadStatus("저장 실패");
        return;
      }

      await logAudit("원료문서", docTitle, "등록", null, payload);

      setDocRawMaterialId("");
      setDocType("COA");
      setDocTitle("");
      setDocUrl("");
      setDocIssueDate("");
      setDocExpiryDate("");
      setDocRemark("");
      setDocFile(null);
      setDocUploadStatus("문서 저장 완료");
      loadAll();
    } catch (error) {
      alert("문서 업로드 오류: " + (error as Error).message);
      setDocUploadStatus("업로드 실패");
    }
  }

  async function addProcessStep() {
    if (!processFormulaId || !processPhase || !processStepNo || !processName) {
      alert("처방, Phase, Step No., 공정명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("process_steps").insert([
      {
        formula_id: processFormulaId,
        phase: processPhase,
        step_no: Number(processStepNo),
        process_name: processName,
        temperature: processTemperature,
        rpm: processRpm,
        time_min: processTimeMin,
        instruction: processInstruction,
      },
    ]);

    if (error) {
      alert("공정 저장 오류: " + error.message);
      return;
    }

    setProcessFormulaId("");
    setProcessPhase("Phase A");
    setProcessStepNo("");
    setProcessName("");
    setProcessTemperature("");
    setProcessRpm("");
    setProcessTimeMin("");
    setProcessInstruction("");
    loadAll();
  }

  function getProcessStepsByFormula(targetFormulaId: string) {
    return processSteps
      .filter((step) => step.formulas?.id === targetFormulaId)
      .sort((a, b) => {
        const phaseCompare = (a.phase || "").localeCompare(b.phase || "");
        if (phaseCompare !== 0) {
          return phaseCompare;
        }
        return Number(a.step_no || 0) - Number(b.step_no || 0);
      });
  }

  function getBatchRows(targetFormulaId: string, sizeKg: number) {
    return getFormulaItemsByFormula(targetFormulaId).map((item) => {
      const percent = Number(item.percentage || 0);
      const requiredKg = (sizeKg * percent) / 100;

      return {
        ...item,
        requiredKg,
      };
    });
  }

  function getBatchTotalKg(targetFormulaId: string, sizeKg: number) {
    return getBatchRows(targetFormulaId, sizeKg).reduce(
      (sum, item) => sum + item.requiredKg,
      0
    );
  }

  function printBatchSheet() {
    window.print();
  }

  function getFormulaValidation(targetFormulaId: string) {
    const targetItems = getFormulaItemsByFormula(targetFormulaId);
    const total = getFormulaTotal(targetFormulaId);

    const missingCompositionItems = targetItems.filter((item) => {
      const rawId = item.raw_materials?.id;
      return !compositions.some((composition) => composition.raw_materials?.id === rawId);
    });

    const breakdown = calculateBreakdown(targetFormulaId);

    const iecicWarnings = breakdown.filter((item) => {
      const value = (item as any).iecic_status || "";
      return value && !value.toLowerCase().includes("listed") && !value.includes("가능");
    });

    const cosmosWarnings = breakdown.filter((item) => {
      const value = (item as any).cosmos_status || "";
      return value && (value.includes("불가") || value.toLowerCase().includes("no"));
    });

    const veganWarnings = breakdown.filter((item) => {
      const value = (item as any).vegan_status || "";
      return value && (value.toLowerCase().includes("non") || value.includes("불가"));
    });

    const totalOk = Math.abs(total - 100) < 0.0001;
    const compositionOk = missingCompositionItems.length === 0;
    const ilOk = totalOk && compositionOk && breakdown.length > 0;

    return {
      total,
      totalOk,
      compositionOk,
      ilOk,
      missingCompositionItems,
      breakdown,
      iecicWarnings,
      cosmosWarnings,
      veganWarnings,
    };
  }

  function getIngredientEngineValidation(targetFormulaId: string) {
    const targetItems = getFormulaItemsByFormula(targetFormulaId);
    const breakdown = calculateBreakdown(targetFormulaId);

    const missingCompositionItems = targetItems.filter((item) => {
      const rawId = item.raw_materials?.id;
      return !compositions.some((composition) => composition.raw_materials?.id === rawId);
    });

    const incompleteCompositionItems = targetItems
      .map((item) => {
        const rawId = item.raw_materials?.id;
        const related = compositions.filter((composition) => composition.raw_materials?.id === rawId);
        const sum = related.reduce((acc, composition) => acc + Number(composition.percentage || 0), 0);

        return {
          item,
          sum,
          ok: related.length > 0 && Math.abs(sum - 100) < 0.0001,
        };
      })
      .filter((row) => !row.ok);

    const missingInciItems = breakdown.filter((item) => !item.inci_name);
    const missingKoreanNameItems = breakdown.filter((item) => !item.korean_name);
    const missingCasItems = breakdown.filter((item) => !item.cas_no);
    const missingEcItems = breakdown.filter((item) => !item.ec_no);

    const missingGlobalMasterItems = breakdown.filter((item) => {
      return !globalIngredients.some((globalItem) => {
        const sameInci =
          globalItem.inci_name &&
          item.inci_name &&
          globalItem.inci_name.trim().toLowerCase() === item.inci_name.trim().toLowerCase();

        const sameCas =
          globalItem.cas_no &&
          item.cas_no &&
          globalItem.cas_no.trim() === item.cas_no.trim();

        return sameInci || sameCas;
      });
    });

    const engineOk =
      missingCompositionItems.length === 0 &&
      incompleteCompositionItems.length === 0 &&
      missingInciItems.length === 0 &&
      missingKoreanNameItems.length === 0 &&
      missingCasItems.length === 0 &&
      breakdown.length > 0;

    return {
      engineOk,
      breakdown,
      missingCompositionItems,
      incompleteCompositionItems,
      missingInciItems,
      missingKoreanNameItems,
      missingCasItems,
      missingEcItems,
      missingGlobalMasterItems,
    };
  }

  function parseMaxUseLevel(value: string | undefined) {
    if (!value) {
      return null;
    }

    const normalized = String(value).replace("%", "").replace("≤", "").replace("<=", "").trim();
    const matched = normalized.match(/[0-9]+(\.[0-9]+)?/);

    if (!matched) {
      return null;
    }

    return Number(matched[0]);
  }

  function getRegulationWarnings(targetFormulaId: string) {
    const breakdown = calculateBreakdown(targetFormulaId);

    const warnings: {
      level: string;
      category: string;
      inci_name: string;
      korean_name: string;
      final_percentage: number;
      standard: string;
      message: string;
    }[] = [];

    breakdown.forEach((item) => {
      const maxUse = parseMaxUseLevel(item.regulation_note || "") ?? parseMaxUseLevel((item as any).max_use_level || "");
      const finalPercentage = Number(item.final_percentage || 0);

      if (maxUse !== null && finalPercentage > maxUse) {
        warnings.push({
          level: "위험",
          category: "배합한도",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: `${maxUse}% 이하`,
          message: `최종함량 ${finalPercentage.toFixed(6)}%가 배합한도 ${maxUse}%를 초과했습니다.`,
        });
      }

      if (!item.inci_name) {
        warnings.push({
          level: "위험",
          category: "INCI",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "필수",
          message: "INCI가 누락되었습니다.",
        });
      }

      if (!item.cas_no) {
        warnings.push({
          level: "주의",
          category: "CAS",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "권장",
          message: "CAS No.가 누락되었습니다.",
        });
      }

      const iecic = String(item.iecic_status || "").toLowerCase();
      if (iecic && (iecic.includes("not") || iecic.includes("unlisted") || iecic.includes("불가") || iecic.includes("미등재"))) {
        warnings.push({
          level: "주의",
          category: "IECIC",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "Listed 권장",
          message: `IECIC 상태 확인 필요: ${item.iecic_status}`,
        });
      }

      const cosmos = String(item.cosmos_status || "").toLowerCase();
      if (cosmos && (cosmos.includes("no") || cosmos.includes("not") || cosmos.includes("불가"))) {
        warnings.push({
          level: "주의",
          category: "COSMOS",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "가능/허용 권장",
          message: `COSMOS 상태 확인 필요: ${item.cosmos_status}`,
        });
      }

      const vegan = String(item.vegan_status || "").toLowerCase();
      if (vegan && (vegan.includes("non") || vegan.includes("no") || vegan.includes("불가"))) {
        warnings.push({
          level: "주의",
          category: "VEGAN",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "Vegan 권장",
          message: `VEGAN 상태 확인 필요: ${item.vegan_status}`,
        });
      }

      if (item.regulation_note && String(item.regulation_note).trim()) {
        warnings.push({
          level: "정보",
          category: "규제사항",
          inci_name: item.inci_name,
          korean_name: item.korean_name,
          final_percentage: finalPercentage,
          standard: "-",
          message: item.regulation_note,
        });
      }
    });

    return warnings;
  }

  function getRegulationSummary(targetFormulaId: string) {
    const warnings = getRegulationWarnings(targetFormulaId);
    const dangerCount = warnings.filter((warning) => warning.level === "위험").length;
    const cautionCount = warnings.filter((warning) => warning.level === "주의").length;
    const infoCount = warnings.filter((warning) => warning.level === "정보").length;

    return {
      warnings,
      dangerCount,
      cautionCount,
      infoCount,
      pass: dangerCount === 0,
    };
  }

  function getAvailableCountryCodes() {
    const fromDb = countryRegulations.map((item) => item.country_code).filter(Boolean);
    const baseCountries = ["KR", "EU", "CN", "US", "JP", "ASEAN"];

    return Array.from(new Set([...baseCountries, ...fromDb]));
  }

  function matchCountryRegulation(item: BreakdownItem, regulation: CountryRegulation) {
    const itemInci = String(item.inci_name || "").trim().toLowerCase();
    const ruleInci = String(regulation.inci_name || "").trim().toLowerCase();

    const itemCas = String(item.cas_no || "").trim();
    const ruleCas = String(regulation.cas_no || "").trim();

    const inciMatched = Boolean(itemInci && ruleInci && itemInci === ruleInci);
    const casMatched = Boolean(itemCas && ruleCas && itemCas === ruleCas);

    return inciMatched || casMatched;
  }

  function getCountryRegulationWarnings(targetFormulaId: string, countryCode: string) {
    const breakdown = calculateBreakdown(targetFormulaId);
    const rules = countryRegulations.filter((rule) => rule.country_code === countryCode);

    const warnings: {
      country_code: string;
      country_name: string;
      level: string;
      regulation_type: string;
      inci_name: string;
      korean_name: string;
      cas_no: string;
      final_percentage: number;
      max_percentage: number | null;
      message: string;
      reference_note: string;
    }[] = [];

    breakdown.forEach((item) => {
      const matchedRules = rules.filter((rule) => matchCountryRegulation(item, rule));

      matchedRules.forEach((rule) => {
        const finalPercentage = Number(item.final_percentage || 0);
        const maxPercentage = Number(rule.max_percentage || 0);

        if (rule.is_prohibited) {
          warnings.push({
            country_code: rule.country_code,
            country_name: rule.country_name,
            level: "위험",
            regulation_type: "금지",
            inci_name: item.inci_name,
            korean_name: item.korean_name,
            cas_no: item.cas_no,
            final_percentage: finalPercentage,
            max_percentage: null,
            message: rule.warning_message || "해당 국가에서 금지 성분으로 등록되어 있습니다.",
            reference_note: rule.reference_note || "",
          });
        } else if (maxPercentage > 0 && finalPercentage > maxPercentage) {
          warnings.push({
            country_code: rule.country_code,
            country_name: rule.country_name,
            level: "위험",
            regulation_type: rule.regulation_type || "Restricted",
            inci_name: item.inci_name,
            korean_name: item.korean_name,
            cas_no: item.cas_no,
            final_percentage: finalPercentage,
            max_percentage: maxPercentage,
            message:
              rule.warning_message ||
              `최종함량 ${finalPercentage.toFixed(6)}%가 ${countryCode} 허용한도 ${maxPercentage}%를 초과했습니다.`,
            reference_note: rule.reference_note || "",
          });
        } else {
          warnings.push({
            country_code: rule.country_code,
            country_name: rule.country_name,
            level: "정보",
            regulation_type: rule.regulation_type || "정보",
            inci_name: item.inci_name,
            korean_name: item.korean_name,
            cas_no: item.cas_no,
            final_percentage: finalPercentage,
            max_percentage: maxPercentage > 0 ? maxPercentage : null,
            message: rule.warning_message || "국가별 규제 DB에 등록된 성분입니다. 기준을 확인하세요.",
            reference_note: rule.reference_note || "",
          });
        }
      });
    });

    return warnings;
  }

  function getGlobalRegulationSummary(targetFormulaId: string) {
    const rows = selectedCountryCodes.map((countryCode) => {
      const warnings = getCountryRegulationWarnings(targetFormulaId, countryCode);
      const dangerCount = warnings.filter((warning) => warning.level === "위험").length;
      const cautionCount = warnings.filter((warning) => warning.level === "주의").length;
      const infoCount = warnings.filter((warning) => warning.level === "정보").length;
      const score = Math.max(0, 100 - dangerCount * 30 - cautionCount * 10);

      return {
        countryCode,
        countryName:
          countryRegulations.find((item) => item.country_code === countryCode)?.country_name ||
          countryCode,
        warnings,
        dangerCount,
        cautionCount,
        infoCount,
        score,
        pass: dangerCount === 0,
      };
    });

    return rows;
  }

  function getAllCountryRegulationWarnings(targetFormulaId: string) {
    return selectedCountryCodes.flatMap((countryCode) =>
      getCountryRegulationWarnings(targetFormulaId, countryCode)
    );
  }

  function getCountryRegulationCsvHeaders() {
    return [
      "country_code",
      "country_name",
      "inci_name",
      "cas_no",
      "regulation_type",
      "max_percentage",
      "is_prohibited",
      "warning_message",
      "reference_note",
    ];
  }

  function downloadRegulationSeedCsv() {
    const headers = getCountryRegulationCsvHeaders();

    const rows = [
      ["EU", "European Union", "Phenoxyethanol", "122-99-6", "Restricted", "1", "false", "EU 보존제 최대 사용한도 확인 필요", "EU Cosmetics Regulation Annex V"],
      ["CN", "China", "Phenoxyethanol", "122-99-6", "Restricted", "1", "false", "중국 보존제 최대 사용한도 확인 필요", "China Safety and Technical Standards for Cosmetics"],
      ["JP", "Japan", "Phenoxyethanol", "122-99-6", "Restricted", "1", "false", "일본 기준 보존제 한도 확인 필요", "Japan Standards for Cosmetics"],
      ["ASEAN", "ASEAN", "Phenoxyethanol", "122-99-6", "Restricted", "1", "false", "ASEAN 보존제 한도 확인 필요", "ASEAN Cosmetic Directive"],
      ["US", "United States", "Phenoxyethanol", "122-99-6", "Warning", "1", "false", "미국 판매 시 안전성 및 라벨 검토 필요", "US cosmetic safety review"],

      ["EU", "European Union", "Salicylic Acid", "69-72-7", "Restricted", "2", "false", "BHA/살리실릭애씨드 국가별 사용 목적 및 한도 확인 필요", "EU Cosmetics Regulation Annex III"],
      ["CN", "China", "Salicylic Acid", "69-72-7", "Restricted", "2", "false", "중국 살리실릭애씨드 사용 한도 확인 필요", "China Safety and Technical Standards for Cosmetics"],
      ["JP", "Japan", "Salicylic Acid", "69-72-7", "Restricted", "0.2", "false", "일본 기준 및 제품 유형별 한도 확인 필요", "Japan Standards for Cosmetics"],
      ["ASEAN", "ASEAN", "Salicylic Acid", "69-72-7", "Restricted", "2", "false", "ASEAN 살리실릭애씨드 한도 확인 필요", "ASEAN Cosmetic Directive"],
      ["US", "United States", "Salicylic Acid", "69-72-7", "Warning", "2", "false", "OTC/화장품 구분 및 클레임 검토 필요", "US FDA OTC/cosmetic review"],

      ["EU", "European Union", "Retinol", "68-26-8", "Restricted", "0.3", "false", "비타민A 계열 국가별 최신 제한 기준 확인 필요", "EU Vitamin A restrictions review"],
      ["CN", "China", "Retinol", "68-26-8", "Warning", "0.3", "false", "중국 비타민A 계열 안전성 검토 필요", "China cosmetic safety assessment"],
      ["JP", "Japan", "Retinol", "68-26-8", "Warning", "0.3", "false", "일본 판매 전 비타민A 계열 기준 확인 필요", "Japan cosmetic ingredient review"],
      ["ASEAN", "ASEAN", "Retinol", "68-26-8", "Warning", "0.3", "false", "ASEAN 비타민A 계열 사용 주의", "ASEAN Cosmetic Directive review"],
      ["US", "United States", "Retinol", "68-26-8", "Warning", "0.3", "false", "미국 안전성 및 임산부 주의문구 검토 필요", "US cosmetic safety review"],

      ["EU", "European Union", "Hydroquinone", "123-31-9", "Prohibited", "0", "true", "일반 화장품 사용 금지 또는 전문용도 제한 가능성 확인 필요", "EU Cosmetics Regulation Annex II/III"],
      ["CN", "China", "Hydroquinone", "123-31-9", "Prohibited", "0", "true", "중국 화장품 사용 금지 성분 여부 확인 필요", "China prohibited/restricted ingredient list"],
      ["JP", "Japan", "Hydroquinone", "123-31-9", "Restricted", "0", "false", "일본 의약부외품/화장품 구분 확인 필요", "Japan ingredient regulation review"],
      ["ASEAN", "ASEAN", "Hydroquinone", "123-31-9", "Prohibited", "0", "true", "ASEAN 사용 금지 여부 확인 필요", "ASEAN Cosmetic Directive Annex"],
      ["US", "United States", "Hydroquinone", "123-31-9", "Warning", "0", "false", "미국 OTC/규제 상태 확인 필요", "US FDA review"],

      ["EU", "European Union", "Triclosan", "3380-34-5", "Restricted", "0.3", "false", "제품 유형별 한도 및 사용 가능 여부 확인 필요", "EU Cosmetics Regulation Annex V"],
      ["CN", "China", "Triclosan", "3380-34-5", "Restricted", "0.3", "false", "중국 사용 한도 확인 필요", "China cosmetic preservative list"],
      ["JP", "Japan", "Triclosan", "3380-34-5", "Restricted", "0.1", "false", "일본 기준 확인 필요", "Japan Standards for Cosmetics"],
      ["ASEAN", "ASEAN", "Triclosan", "3380-34-5", "Restricted", "0.3", "false", "ASEAN 사용 한도 확인 필요", "ASEAN Cosmetic Directive"],
      ["US", "United States", "Triclosan", "3380-34-5", "Warning", "0.3", "false", "미국 적용 제품군별 규제 확인 필요", "US FDA review"],

      ["EU", "European Union", "BHT", "128-37-0", "Warning", "0.8", "false", "최신 사용 제한 및 제품 유형별 기준 확인 필요", "EU ingredient safety review"],
      ["CN", "China", "BHT", "128-37-0", "Warning", "0.8", "false", "중국 안전성 검토 필요", "China cosmetic safety assessment"],
      ["JP", "Japan", "BHT", "128-37-0", "Warning", "0.8", "false", "일본 기준 확인 필요", "Japan ingredient review"],
      ["ASEAN", "ASEAN", "BHT", "128-37-0", "Warning", "0.8", "false", "ASEAN 기준 확인 필요", "ASEAN review"],
      ["US", "United States", "BHT", "128-37-0", "Warning", "0.8", "false", "미국 안전성 검토 필요", "US CIR/FDA review"],

      ["EU", "European Union", "Methylparaben", "99-76-3", "Restricted", "0.4", "false", "단일/혼합 파라벤 한도 확인 필요", "EU Cosmetics Regulation Annex V"],
      ["CN", "China", "Methylparaben", "99-76-3", "Restricted", "0.4", "false", "중국 파라벤 보존제 한도 확인 필요", "China preservative list"],
      ["JP", "Japan", "Methylparaben", "99-76-3", "Restricted", "1", "false", "일본 보존제 한도 확인 필요", "Japan Standards for Cosmetics"],
      ["ASEAN", "ASEAN", "Methylparaben", "99-76-3", "Restricted", "0.4", "false", "ASEAN 파라벤 한도 확인 필요", "ASEAN Cosmetic Directive"],
      ["US", "United States", "Methylparaben", "99-76-3", "Warning", "0.4", "false", "미국 안전성 검토 필요", "US cosmetic safety review"],

      ["EU", "European Union", "Formaldehyde", "50-00-0", "Prohibited", "0", "true", "포름알데하이드 및 방출원료 규제 확인 필요", "EU Cosmetics Regulation"],
      ["CN", "China", "Formaldehyde", "50-00-0", "Prohibited", "0", "true", "중국 금지/제한 기준 확인 필요", "China cosmetic standards"],
      ["JP", "Japan", "Formaldehyde", "50-00-0", "Prohibited", "0", "true", "일본 기준 확인 필요", "Japan Standards for Cosmetics"],
      ["ASEAN", "ASEAN", "Formaldehyde", "50-00-0", "Prohibited", "0", "true", "ASEAN 금지/제한 기준 확인 필요", "ASEAN Cosmetic Directive"],
      ["US", "United States", "Formaldehyde", "50-00-0", "Warning", "0", "false", "미국 제품 유형별 안전성 검토 필요", "US FDA review"],
    ];

    downloadCsv("global_regulation_seed_db_v22_1.csv", headers, rows);
  }

  async function importRegulationSeedCsv(file: File) {
    if (!assertCanEdit()) return;

    setRegSeedStatus("규제 Seed CSV 읽는 중...");

    const text = await file.text();
    const lines = text
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV에 데이터가 없습니다.");
      setRegSeedStatus("");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    const records = rows
      .map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = row[index] || "";
        });

        return {
          country_code: (record.country_code || "").toUpperCase(),
          country_name: record.country_name || "",
          inci_name: record.inci_name || "",
          cas_no: record.cas_no || "",
          regulation_type: record.regulation_type || "Warning",
          max_percentage: Number(record.max_percentage || 0),
          is_prohibited: String(record.is_prohibited || "false").toLowerCase() === "true",
          warning_message: record.warning_message || "",
          reference_note: record.reference_note || "",
        };
      })
      .filter((record) => record.country_code && (record.inci_name || record.cas_no));

    if (records.length === 0) {
      alert("업로드할 규제 데이터가 없습니다.");
      setRegSeedStatus("");
      return;
    }

    const chunkSize = 300;
    let uploadedCount = 0;

    for (let start = 0; start < records.length; start += chunkSize) {
      const chunk = records.slice(start, start + chunkSize);

      setRegSeedStatus(`규제 Seed Import 중: ${Math.min(start + chunk.length, records.length)} / ${records.length}`);

      const { error } = await supabase
        .from("country_regulations")
        .upsert(chunk, {
          onConflict: "country_code,inci_name,cas_no",
          ignoreDuplicates: false,
        });

      if (error) {
        alert("규제 Seed Import 오류: " + error.message);
        setRegSeedStatus("Import 실패");
        return;
      }

      uploadedCount += chunk.length;
    }

    await logAudit("Global Regulation Seed DB", "Seed Import", "IMPORT", null, {
      uploaded_count: uploadedCount,
    });

    setRegSeedStatus(`규제 Seed Import 완료: ${uploadedCount}개 처리`);
    loadAll();
  }

  function exportCountryRegulationsCsv() {
    const rows = countryRegulations.map((item) => [
      item.country_code,
      item.country_name,
      item.inci_name,
      item.cas_no,
      item.regulation_type,
      item.max_percentage ?? "",
      item.is_prohibited ? "true" : "false",
      item.warning_message,
      item.reference_note,
    ]);

    downloadCsv("country_regulations_export.csv", getCountryRegulationCsvHeaders(), rows);
  }

  function normalizeRegulationColumnName(name: string) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[()\[\]{}]/g, "")
      .replace(/[-/]/g, "_");
  }

  function getRegulationColumnAliases() {
    return {
      country_code: ["country_code", "country", "market", "국가코드", "국가", "region"],
      country_name: ["country_name", "market_name", "국가명", "지역명"],
      inci_name: ["inci", "inci_name", "ingredient", "ingredient_name", "성분명", "영문명"],
      cas_no: ["cas", "cas_no", "cas_number", "cas번호", "cas_no."],
      regulation_type: ["regulation_type", "type", "status", "규제유형", "규제", "annex"],
      max_percentage: ["max_percentage", "max_percent", "max_use", "limit", "허용한도", "최대함량"],
      is_prohibited: ["is_prohibited", "prohibited", "ban", "banned", "금지", "금지성분"],
      warning_message: ["warning_message", "warning", "message", "주의", "경고", "비고"],
      reference_note: ["reference_note", "reference", "source", "근거", "출처", "annex_reference"],
    } as Record<string, string[]>;
  }

  function mapRegulationCsvRecord(headers: string[], row: string[], fallbackSourceName = "", fallbackSourceUrl = "") {
    const aliases = getRegulationColumnAliases();
    const normalizedHeaders = headers.map((header) => normalizeRegulationColumnName(header));

    const getValue = (targetKey: string) => {
      const candidates = aliases[targetKey] || [targetKey];
      const normalizedCandidates = candidates.map((item) => normalizeRegulationColumnName(item));
      const index = normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));

      return index >= 0 ? row[index] || "" : "";
    };

    const countryCode = (getValue("country_code") || "EU").toUpperCase();
    const regulationType = getValue("regulation_type") || "Warning";
    const prohibitedRaw = String(getValue("is_prohibited") || "").toLowerCase();

    return {
      country_code: countryCode,
      country_name: getValue("country_name") || countryCode,
      inci_name: getValue("inci_name"),
      cas_no: getValue("cas_no"),
      regulation_type: regulationType,
      max_percentage: Number(getValue("max_percentage") || 0),
      is_prohibited:
        prohibitedRaw === "true" ||
        prohibitedRaw === "yes" ||
        prohibitedRaw === "y" ||
        prohibitedRaw === "1" ||
        regulationType.toLowerCase().includes("prohibit") ||
        regulationType.toLowerCase().includes("ban"),
      warning_message: getValue("warning_message"),
      reference_note: getValue("reference_note") || fallbackSourceName,
      source_name: fallbackSourceName,
      source_url: fallbackSourceUrl,
    } as RegulationUpdateRow;
  }

  function detectRegulationTypeFromText(text: string) {
    const lower = text.toLowerCase();

    if (lower.includes("prohibited") || lower.includes("banned") || lower.includes("annex ii") || lower.includes("금지")) {
      return "Prohibited";
    }

    if (lower.includes("restricted") || lower.includes("annex iii") || lower.includes("limit") || lower.includes("제한") || lower.includes("한도")) {
      return "Restricted";
    }

    return "Warning";
  }

  function extractMaxPercentFromText(text: string) {
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);

    if (percentMatch) {
      return Number(percentMatch[1]);
    }

    const ppmMatch = text.match(/(\d+(?:\.\d+)?)\s*ppm/i);

    if (ppmMatch) {
      return Number(ppmMatch[1]) / 10000;
    }

    return 0;
  }

  function extractCasFromText(text: string) {
    const match = text.match(/\b\d{2,7}-\d{2}-\d\b/);
    return match ? match[0] : "";
  }

  function cleanExtractedInciName(value: string) {
    return value
      .replace(/\b\d{2,7}-\d{2}-\d\b/g, "")
      .replace(/\d+(?:\.\d+)?\s*%/g, "")
      .replace(/\d+(?:\.\d+)?\s*ppm/gi, "")
      .replace(/prohibited|restricted|warning|banned|annex\s+[ivx]+|max|limit|금지|제한|한도/gi, "")
      .replace(/[|:;]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseOfficialTextToRegulationRows() {
    if (!regOfficialText.trim()) {
      alert("공식자료 텍스트를 입력하세요.");
      return;
    }

    const lines = regOfficialText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 2);

    const parsed = lines
      .map((line) => {
        const regulationType = detectRegulationTypeFromText(line);
        const casNo = extractCasFromText(line);
        const maxPercentage = extractMaxPercentFromText(line);
        const inciName = cleanExtractedInciName(line);
        const confidence = (casNo ? 35 : 0) + (inciName ? 35 : 0) + (regulationType !== "Warning" ? 20 : 10) + (maxPercentage ? 10 : 0);

        return {
          country_code: regAutoCountryCode,
          country_name: regAutoCountryName,
          inci_name: inciName,
          cas_no: casNo,
          regulation_type: regulationType,
          max_percentage: maxPercentage,
          is_prohibited: regulationType === "Prohibited",
          warning_message:
            regulationType === "Prohibited"
              ? "공식자료 텍스트 분석 결과 금지 가능성 감지"
              : regulationType === "Restricted"
              ? "공식자료 텍스트 분석 결과 제한/한도 가능성 감지"
              : "공식자료 텍스트 분석 결과 검토 필요",
          reference_note: regUpdateSourceName,
          source_name: regUpdateSourceName,
          source_url: regUpdateSourceUrl,
          raw_text: line,
          confidence,
        } as RegulationUpdateRow;
      })
      .filter((row) => row.inci_name && row.confidence && row.confidence >= 45)
      .map((row) => classifyRegulationUpdate(row));

    setRegUpdateRows(parsed);
    setRegAutoParseStatus(
      `AI 자동 추출 완료: ${parsed.length}건 / 신규 ${parsed.filter((row) => row.update_type === "NEW").length} / 변경 ${parsed.filter((row) => row.update_type === "UPDATE").length} / 동일 ${parsed.filter((row) => row.update_type === "NO_CHANGE").length}`
    );
    setRegUpdateStatus("공식자료 텍스트 자동 분석 완료");
  }

  function downloadOfficialSourceWorklistCsv() {
    const headers = ["region", "source_name", "source_url", "update_frequency", "owner", "status", "note"];
    const rows = [
      ["EU", "European Commission CosIng / Regulation 1223/2009", "https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en", "Monthly", "RA", "Manual Check", "CosIng/Annex 변경 확인 후 CSV 또는 텍스트 분석"],
      ["US", "FDA Prohibited & Restricted Ingredients", "https://www.fda.gov/cosmetics/cosmetics-laws-regulations/prohibited-restricted-ingredients-cosmetics", "Monthly", "RA", "Manual Check", "금지/제한 성분 업데이트 확인"],
      ["ASEAN", "ASEAN Cosmetic Directive Annexes", "https://www.hsa.gov.sg/cosmetic-products/asean-cosmetic-directive", "Monthly", "RA", "Manual Check", "Annex II/III/VI 등 변경 확인"],
      ["China", "NMPA IECIC / 고시", "NMPA official notice / IECIC channel", "Monthly", "RA", "Manual Check", "IECIC 여부 및 금지/제한 고시 확인"],
      ["Japan", "일본 화장품 기준/성분 고시", "MHLW / official standards", "Monthly", "RA", "Manual Check", "기준/성분 고시 변경 확인"],
    ];

    downloadCsv("official_regulation_source_worklist.csv", headers, rows);
  }

  function getExistingRegulationMatch(row: RegulationUpdateRow) {
    return countryRegulations.find((item) => {
      const sameCountry = item.country_code?.toUpperCase() === row.country_code?.toUpperCase();
      const sameInci = row.inci_name && item.inci_name?.toLowerCase() === row.inci_name?.toLowerCase();
      const sameCas = row.cas_no && item.cas_no === row.cas_no;

      return sameCountry && (sameInci || sameCas);
    });
  }

  function classifyRegulationUpdate(row: RegulationUpdateRow) {
    const existing = getExistingRegulationMatch(row);

    if (!existing) {
      return { ...row, update_type: "NEW", matched_existing_id: "" };
    }

    const changed =
      existing.regulation_type !== row.regulation_type ||
      Number(existing.max_percentage || 0) !== Number(row.max_percentage || 0) ||
      Boolean(existing.is_prohibited) !== Boolean(row.is_prohibited) ||
      (existing.warning_message || "") !== (row.warning_message || "") ||
      (existing.reference_note || "") !== (row.reference_note || "");

    return {
      ...row,
      update_type: changed ? "UPDATE" : "NO_CHANGE",
      matched_existing_id: existing.id,
    };
  }

  async function previewRegulationUpdateCsv(file: File) {
    setRegUpdateStatus("공식자료 CSV를 분석하는 중입니다...");

    const text = await file.text();
    const lines = text
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV에 데이터가 없습니다.");
      setRegUpdateStatus("");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    const mapped = rows
      .map((row) => mapRegulationCsvRecord(headers, row, regUpdateSourceName, regUpdateSourceUrl))
      .filter((row) => row.country_code && (row.inci_name || row.cas_no))
      .map((row) => classifyRegulationUpdate(row));

    setRegUpdateRows(mapped);
    setRegUpdateStatus(
      `변경감지 완료: 신규 ${mapped.filter((row) => row.update_type === "NEW").length} / 변경 ${mapped.filter((row) => row.update_type === "UPDATE").length} / 동일 ${mapped.filter((row) => row.update_type === "NO_CHANGE").length}`
    );
  }

  function getFilteredRegUpdateRows() {
    if (regUpdateFilter === "ALL") return regUpdateRows;

    return regUpdateRows.filter((row) => row.update_type === regUpdateFilter);
  }

  async function applyRegulationUpdates() {
    if (!assertCanEdit()) return;

    const targetRows = regUpdateRows.filter((row) => row.update_type === "NEW" || row.update_type === "UPDATE");

    if (targetRows.length === 0) {
      alert("반영할 신규/변경 데이터가 없습니다.");
      return;
    }

    const ok = window.confirm(`${targetRows.length}건의 규제 변경사항을 country_regulations에 반영할까요?`);

    if (!ok) return;

    const payload = targetRows.map((row) => ({
      country_code: row.country_code,
      country_name: row.country_name,
      inci_name: row.inci_name,
      cas_no: row.cas_no,
      regulation_type: row.regulation_type,
      max_percentage: Number(row.max_percentage || 0),
      is_prohibited: row.is_prohibited,
      warning_message: row.warning_message,
      reference_note: [row.reference_note, row.source_url].filter(Boolean).join(" | "),
    }));

    const { error } = await supabase
      .from("country_regulations")
      .upsert(payload, {
        onConflict: "country_code,inci_name,cas_no",
        ignoreDuplicates: false,
      });

    if (error) {
      alert("규제 업데이트 반영 오류: " + error.message);
      return;
    }

    await logAudit("Regulation Update Center", "Official Source Import", "공식자료 반영", null, {
      source_name: regUpdateSourceName,
      source_url: regUpdateSourceUrl,
      total: targetRows.length,
      new_count: targetRows.filter((row) => row.update_type === "NEW").length,
      update_count: targetRows.filter((row) => row.update_type === "UPDATE").length,
    });

    setRegUpdateStatus(`반영 완료: ${targetRows.length}건`);
    setRegUpdateRows([]);
    loadAll();
  }

  function downloadOfficialRegulationUpdateTemplate() {
    downloadCsv(
      "official_regulation_update_template.csv",
      getCountryRegulationCsvHeaders(),
      [
        ["EU", "European Union", "Salicylic Acid", "69-72-7", "Restricted", "2", "false", "공식자료 기준 사용한도 확인 필요", "EU CosIng / Annex III"],
        ["US", "United States", "Mercury Compounds", "", "Prohibited", "0", "true", "FDA prohibited/restricted ingredient check", "FDA prohibited/restricted ingredients"],
        ["ASEAN", "ASEAN", "Hydroquinone", "123-31-9", "Prohibited", "0", "true", "ASEAN Annex prohibited/restricted check", "ASEAN Cosmetic Directive Annex"],
      ]
    );
  }

  async function saveCountryRegulation() {
    if (!assertCanEdit()) return;

    if (!countryCodeInput || !countryNameInput || (!regInciInput && !regCasInput)) {
      alert("국가코드, 국가명, INCI 또는 CAS No.를 입력하세요.");
      return;
    }

    const payload = {
      country_code: countryCodeInput.trim().toUpperCase(),
      country_name: countryNameInput.trim(),
      inci_name: regInciInput.trim(),
      cas_no: regCasInput.trim(),
      regulation_type: regTypeInput.trim() || "Restricted",
      max_percentage: Number(regMaxInput || 0),
      is_prohibited: regProhibitedInput,
      warning_message: regWarningInput.trim(),
      reference_note: regReferenceInput.trim(),
    };

    const { error } = await supabase.from("country_regulations").insert([payload]);

    if (error) {
      alert("국가별 규제 저장 오류: " + error.message);
      return;
    }

    await logAudit("국가별규제", `${payload.country_code}-${payload.inci_name || payload.cas_no}`, "등록", null, payload);

    setRegInciInput("");
    setRegCasInput("");
    setRegMaxInput("");
    setRegProhibitedInput(false);
    setRegWarningInput("");
    setRegReferenceInput("");
    loadAll();
  }

  async function deleteCountryRegulation(item: CountryRegulation) {
    if (!assertCanDelete()) return;

    const ok = window.confirm(`${item.country_code} / ${item.inci_name || item.cas_no} 규제 기준을 삭제할까요?`);

    if (!ok) return;

    const { error } = await supabase.from("country_regulations").delete().eq("id", item.id);

    if (error) {
      alert("국가별 규제 삭제 오류: " + error.message);
      return;
    }

    await logAudit("국가별규제", item.id, "삭제", item, null);
    loadAll();
  }

  function downloadGlobalRegulationReport() {
    if (!globalRegFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    const formula = getFormulaById(globalRegFormulaId);
    const rows = getAllCountryRegulationWarnings(globalRegFormulaId).map((warning) => [
      warning.country_code,
      warning.country_name,
      warning.level,
      warning.regulation_type,
      warning.inci_name,
      warning.korean_name,
      warning.cas_no,
      warning.final_percentage.toFixed(6),
      warning.max_percentage ?? "",
      warning.message,
      warning.reference_note,
    ]);

    downloadCsv(
      `${formula?.formula_code || "Formula"}_Global_Regulation_Report.csv`,
      ["국가코드", "국가명", "등급", "규제유형", "INCI", "국문명", "CAS No.", "최종함량(%)", "허용한도(%)", "메시지", "Reference"],
      rows
    );
  }

  function downloadRegulationWarnings() {
    if (!regulationFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    const formula = getFormulaById(regulationFormulaId);
    const rows = getRegulationWarnings(regulationFormulaId).map((warning) => [
      warning.level,
      warning.category,
      warning.inci_name,
      warning.korean_name,
      warning.final_percentage.toFixed(6),
      warning.standard,
      warning.message,
    ]);

    downloadCsv(
      `${formula?.formula_code || "Formula"}_Regulation_Check.csv`,
      ["등급", "구분", "INCI", "국문명", "최종함량(%)", "기준", "메시지"],
      rows
    );
  }

  function downloadDocumentPackage() {
    if (!packageFormulaId) {
      alert("문서 패키지를 생성할 처방을 선택하세요.");
      return;
    }

    const formula = getFormulaById(packageFormulaId);
    const prefix = `${formula?.formula_code || "Formula"}_${formula?.formula_name || "Document"}`.replace(/[\\/:*?"<>|]/g, "_");

    const formulaSheetRows = getFormulaSheetRows(packageFormulaId).map((item) => [
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      item.phase || "미지정",
      item.raw_materials?.raw_code || "",
      item.raw_materials?.raw_name || "",
      Number(item.percentage || 0).toFixed(4),
      Number(item.raw_materials?.unit_price || 0),
      ((Number(item.raw_materials?.unit_price || 0) * Number(item.percentage || 0)) / 100).toFixed(2),
      item.remark || "",
    ]);

    formulaSheetRows.push([
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      "TOTAL",
      "",
      "",
      getFormulaSheetTotal(packageFormulaId).toFixed(4),
      "",
      getFormulaCost(packageFormulaId).toFixed(2),
      Math.abs(getFormulaSheetTotal(packageFormulaId) - 100) < 0.0001 ? "TOTAL 100% 완료" : "TOTAL 100% 아님",
    ]);

    const breakdownRows = calculateBreakdown(packageFormulaId).map((item) => [
      item.inci_name,
      item.korean_name,
      item.cas_no,
      item.ec_no,
      item.function_ko,
      item.final_percentage.toFixed(6),
      item.iecic_status || "",
      item.cosmos_status || "",
      item.vegan_status || "",
      item.regulation_note || "",
    ]);

    const fullIlRows = getFormulaItemsByFormula(packageFormulaId).flatMap((formulaItem) => {
      const rawId = formulaItem.raw_materials?.id;
      const inputPercentage = Number(formulaItem.percentage || 0);
      const relatedCompositions = compositions.filter((composition) => composition.raw_materials?.id === rawId);

      return relatedCompositions.map((composition) => {
        const ingredient = composition.ingredients;
        const compositionPercentage = Number(composition.percentage || 0);
        const finalPercentage = (inputPercentage * compositionPercentage) / 100;

        return [
          formula?.formula_code || "",
          formula?.formula_name || "",
          formulaItem.phase || "",
          formulaItem.raw_materials?.raw_code || "",
          formulaItem.raw_materials?.raw_name || "",
          inputPercentage.toFixed(6),
          ingredient.inci_name || "",
          ingredient.korean_name || "",
          compositionPercentage.toFixed(6),
          finalPercentage.toFixed(6),
          ingredient.cas_no || "",
          ingredient.ec_no || "",
          ingredient.function_ko || "",
        ];
      });
    });

    const ingredientListRows = [[
      makeKoreanIngredientListByFormula(packageFormulaId),
      makeEnglishIngredientListByFormula(packageFormulaId),
    ]];

    const costRows = [[
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      getFormulaCost(packageFormulaId).toFixed(2),
      getBomExtraCost(packageFormulaId).toFixed(2),
      getBomFinalCost(packageFormulaId).toFixed(2),
      Number(formula?.target_cost || 0).toFixed(2),
      Number(formula?.selling_price || 0).toFixed(2),
      getBomSuggestedPrice(packageFormulaId).toFixed(2),
      getMarginRate(packageFormulaId).toFixed(2),
    ]];

    const regulationRows = getRegulationWarnings(packageFormulaId).map((warning) => [
      warning.level,
      warning.category,
      warning.inci_name,
      warning.korean_name,
      warning.final_percentage.toFixed(6),
      warning.standard,
      warning.message,
    ]);

    const summaryHeaders: string[] = [
      "문서명",
      "생성일",
      "처방코드",
      "처방명",
      "버전",
      "TOTAL(%)",
      "규제 위험",
      "규제 주의",
      "규제 정보",
    ];

    const summaryData: (string | number)[] = [
      "Cosmetic PLM Document Package",
      new Date().toLocaleString(),
      formula?.formula_code || "",
      formula?.formula_name || "",
      formula?.version || "",
      getFormulaSheetTotal(packageFormulaId).toFixed(4),
      getRegulationSummary(packageFormulaId).dangerCount,
      getRegulationSummary(packageFormulaId).cautionCount,
      getRegulationSummary(packageFormulaId).infoCount,
    ];

    const downloads = [
      () => downloadCsv(`${prefix}_00_Package_Summary.csv`, summaryHeaders, [summaryData]),
      () => downloadCsv(
        `${prefix}_01_Formula_Sheet.csv`,
        ["처방코드", "처방명", "Version", "Phase", "원료코드", "원료명", "투입량(%)", "단가(원/kg)", "원가(원/kg)", "비고"],
        formulaSheetRows
      ),
      () => downloadCsv(
        `${prefix}_02_Breakdown_IL.csv`,
        ["INCI", "국문명", "CAS No.", "EC No.", "기능", "최종함량(%)", "IECIC", "COSMOS", "VEGAN", "규제사항"],
        breakdownRows
      ),
      () => downloadCsv(
        `${prefix}_03_Full_IL.csv`,
        ["처방코드", "처방명", "Phase", "원료코드", "원료명", "원료투입량(%)", "INCI", "국문명", "원료 내 구성비(%)", "최종함량(%)", "CAS No.", "EC No.", "기능"],
        fullIlRows
      ),
      () => downloadCsv(
        `${prefix}_04_Ingredient_List.csv`,
        ["국문 전성분", "영문 Ingredient List"],
        ingredientListRows
      ),
      () => downloadCsv(
        `${prefix}_05_Cost_Summary.csv`,
        ["처방코드", "처방명", "Version", "원료원가", "BOM부대원가", "최종제조원가", "목표원가", "공급가", "권장공급가", "마진율(%)"],
        costRows
      ),
      () => downloadCsv(
        `${prefix}_06_Regulation_Check.csv`,
        ["등급", "구분", "INCI", "국문명", "최종함량(%)", "기준", "메시지"],
        regulationRows
      ),
    ];

    downloads.forEach((download, index) => {
      setTimeout(download, index * 300);
    });

    alert("문서 패키지 생성이 시작되었습니다. 브라우저에서 여러 CSV 파일 다운로드 허용이 필요할 수 있습니다.");
  }

  function printPackageFormulaSheet() {
    if (!packageFormulaId) {
      alert("처방을 선택하세요.");
      return;
    }

    setSheetFormulaId(packageFormulaId);
    setMenu("sheet");

    setTimeout(() => {
      window.print();
    }, 500);
  }

  function isFormulaLocked(targetFormulaId: string) {
    const formula = getFormulaById(targetFormulaId);
    return Boolean(formula?.is_locked);
  }

  function assertFormulaEditable(targetFormulaId: string) {
    if (!targetFormulaId) {
      return true;
    }

    if (isFormulaLocked(targetFormulaId) && !isAdmin()) {
      alert("승인 잠금된 처방입니다. 관리자만 수정할 수 있습니다.");
      return false;
    }

    return true;
  }

  async function lockFormula() {
    if (!assertCanApprove()) return;

    if (!lockFormulaId) {
      alert("잠금 처리할 처방을 선택하세요.");
      return;
    }

    const formula = getFormulaById(lockFormulaId);

    if (!formula) {
      alert("처방 정보를 찾을 수 없습니다.");
      return;
    }

    const payload = {
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: auditUserName || userProfile?.display_name || authUser?.email || "PLM User",
      lock_reason: lockReason || "승인 완료",
      prepared_by: preparedBy || formula.prepared_by || auditUserName || "",
      reviewed_by: reviewedBy || formula.reviewed_by || "",
      approved_by: approvedBy || formula.approved_by || auditUserName || "",
      approved_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("formulas")
      .update(payload)
      .eq("id", lockFormulaId);

    if (error) {
      alert("처방 잠금 오류: " + error.message);
      return;
    }

    await logAudit("처방잠금", lockFormulaId, "LOCK", formula, payload);
    setLockReason("승인 완료");
    setPreparedBy("");
    setReviewedBy("");
    setApprovedBy("");
    loadAll();
  }

  async function lockFormulaById(targetFormulaId: string) {
    setLockFormulaId(targetFormulaId);
    const formula = getFormulaById(targetFormulaId);

    if (!formula) return;

    const payload = {
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: auditUserName || userProfile?.display_name || authUser?.email || "PLM User",
      lock_reason: formula.lock_reason || "승인 완료",
      prepared_by: formula.prepared_by || userProfile?.display_name || "",
      reviewed_by: formula.reviewed_by || "",
      approved_by: formula.approved_by || userProfile?.display_name || "",
      approved_at: new Date().toISOString(),
    };

    if (!assertCanApprove()) return;

    const { error } = await supabase
      .from("formulas")
      .update(payload)
      .eq("id", targetFormulaId);

    if (error) {
      alert("처방 잠금 오류: " + error.message);
      return;
    }

    await logAudit("처방잠금", targetFormulaId, "LOCK", formula, payload);
    loadAll();
  }

  async function unlockFormula(targetFormulaId: string) {
    if (!isAdmin()) {
      alert("처방 잠금 해제는 관리자(admin)만 가능합니다.");
      return;
    }

    const formula = getFormulaById(targetFormulaId);

    if (!formula) {
      alert("처방 정보를 찾을 수 없습니다.");
      return;
    }

    const ok = window.confirm(`${formula.formula_code} / ${formula.formula_name} 처방 잠금을 해제할까요?`);

    if (!ok) return;

    const payload = {
      is_locked: false,
      locked_at: null,
      locked_by: null,
      lock_reason: null,
    };

    const { error } = await supabase
      .from("formulas")
      .update(payload)
      .eq("id", targetFormulaId);

    if (error) {
      alert("처방 잠금 해제 오류: " + error.message);
      return;
    }

    await logAudit("처방잠금", targetFormulaId, "UNLOCK", formula, payload);
    loadAll();
  }

  function loadFormulaSignatureToForm(targetFormulaId: string) {
    const formula = getFormulaById(targetFormulaId);

    if (!formula) return;

    setLockFormulaId(targetFormulaId);
    setPreparedBy(formula.prepared_by || userProfile?.display_name || "");
    setReviewedBy(formula.reviewed_by || "");
    setApprovedBy(formula.approved_by || userProfile?.display_name || "");
    setLockReason(formula.lock_reason || "승인 완료");
  }

  function getAdvancedDashboardKpis() {
    const base = getDashboardKpis();

    const lockedFormulas = formulas.filter((formula) => formula.is_locked).length;
    const editableFormulas = formulas.length - lockedFormulas;

    const regulationDanger = formulas.reduce(
      (sum, formula) => sum + getRegulationSummary(formula.id).dangerCount,
      0
    );

    const regulationCaution = formulas.reduce(
      (sum, formula) => sum + getRegulationSummary(formula.id).cautionCount,
      0
    );

    const formulaCosts = formulas.map((formula) => getFormulaCost(formula.id));
    const averageFormulaCost =
      formulaCosts.length > 0
        ? formulaCosts.reduce((sum, cost) => sum + cost, 0) / formulaCosts.length
        : 0;

    const bomFinalCosts = formulas.map((formula) => getBomFinalCost(formula.id));
    const averageBomCost =
      bomFinalCosts.length > 0
        ? bomFinalCosts.reduce((sum, cost) => sum + cost, 0) / bomFinalCosts.length
        : 0;

    const targetCostOkCount = formulas.filter((formula) => {
      const targetCost = Number(formula.target_cost || 0);
      if (targetCost <= 0) return false;
      return getFormulaCost(formula.id) <= targetCost;
    }).length;

    const targetCostRate =
      formulas.length > 0 ? (targetCostOkCount / formulas.length) * 100 : 0;

    const approvalPending = approvalRequests.filter((request) =>
      ["Review", "Requested", "요청", "검토중"].includes(request.status)
    ).length;

    const approvalDone = approvalRequests.filter((request) =>
      ["Approved", "Released", "승인", "배포"].includes(request.status)
    ).length;

    const trashCount =
      trashMaterials.length +
      trashGlobalIngredients.length +
      trashFormulas.length +
      trashFormulaItems.length +
      trashBomCosts.length;

    const recentAuditCount = auditLogs.filter((log) => {
      if (!log.created_at) return false;
      const created = new Date(log.created_at).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return created >= sevenDaysAgo;
    }).length;

    return {
      ...base,
      lockedFormulas,
      editableFormulas,
      regulationDanger,
      regulationCaution,
      averageFormulaCost,
      averageBomCost,
      targetCostRate,
      approvalPending,
      approvalDone,
      trashCount,
      recentAuditCount,
    };
  }

  function getStatusBarPercent(value: number, total: number) {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.max(0, (value / total) * 100));
  }

  function DashboardKpiCard({
    title,
    value,
    subtitle,
    accent = "#2563eb",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    accent?: string;
  }) {
    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "18px",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          borderLeft: `6px solid ${accent}`,
        }}
      >
        <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
          {title}
        </div>
        <div style={{ fontSize: "30px", fontWeight: "bold", color: "#111827" }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "8px" }}>
            {subtitle}
          </div>
        )}
      </div>
    );
  }

  function DashboardProgress({
    label,
    value,
    total,
    color = "#2563eb",
  }: {
    label: string;
    value: number;
    total: number;
    color?: string;
  }) {
    const percent = getStatusBarPercent(value, total);

    return (
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span>{label}</span>
          <strong>
            {value} / {total}
          </strong>
        </div>
        <div
          style={{
            height: "10px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: color,
            }}
          />
        </div>
      </div>
    );
  }

  function getDashboardKpis() {
    const totalProjects = projects.length;

    const activeProjects = projects.filter((project) => project.status === "개발중").length;
    const completedProjects = projects.filter(
      (project) => project.status === "출시"
    ).length;
    const holdProjects = projects.filter((project) => project.status === "보류").length;

    const reviewCount = approvalRequests.filter((request) => request.status === "Review").length;
    const approvedCount = approvalRequests.filter((request) => request.status === "Approved").length;
    const releasedCount = approvalRequests.filter((request) => request.status === "Released").length;
    const rejectedCount = approvalRequests.filter((request) => request.status === "Rejected").length;

    const stabilityRunning = stabilityTests.filter((test) => test.final_result === "진행중").length;
    const stabilityPass = stabilityTests.filter((test) => test.final_result === "PASS").length;
    const stabilityFail = stabilityTests.filter((test) => test.final_result === "FAIL").length;

    const totalFormulas = formulas.length;
    const totalMaterials = materials.length;
    const totalIngredients = ingredients.length;
    const totalGlobalIngredients = globalIngredients.length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      holdProjects,
      reviewCount,
      approvedCount,
      releasedCount,
      rejectedCount,
      stabilityRunning,
      stabilityPass,
      stabilityFail,
      totalFormulas,
      totalMaterials,
      totalIngredients,
      totalGlobalIngredients,
    };
  }

  function getBomByFormula(targetFormulaId: string) {
    return bomCosts.find((bom) => bom.formulas?.id === targetFormulaId) || null;
  }

  function getBomExtraCost(targetFormulaId: string) {
    const bom = getBomByFormula(targetFormulaId);

    if (!bom) {
      return 0;
    }

    return (
      Number(bom.packaging_cost || 0) +
      Number(bom.filling_cost || 0) +
      Number(bom.labor_cost || 0) +
      Number(bom.logistics_cost || 0)
    );
  }

  function getBomFinalCost(targetFormulaId: string) {
    const bom = getBomByFormula(targetFormulaId);
    const baseCost = getFormulaCost(targetFormulaId);
    const extraCost = getBomExtraCost(targetFormulaId);
    const overheadRateValue = Number(bom?.overhead_rate || 0);

    return (baseCost + extraCost) * (1 + overheadRateValue / 100);
  }

  function getBomSuggestedPrice(targetFormulaId: string) {
    const bom = getBomByFormula(targetFormulaId);
    const finalCost = getBomFinalCost(targetFormulaId);
    const marginRateValue = Number(bom?.target_margin_rate || 0);

    if (marginRateValue >= 100) {
      return 0;
    }

    return finalCost / (1 - marginRateValue / 100);
  }

  function isPlainObject(value: any) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function flattenAuditObject(data: any, prefix = ""): Record<string, any> {
    const result: Record<string, any> = {};

    if (!isPlainObject(data)) {
      return result;
    }

    Object.keys(data).forEach((key) => {
      const value = data[key];
      const fieldKey = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        result[fieldKey] = `[Array ${value.length}]`;
        return;
      }

      if (isPlainObject(value)) {
        const nested = flattenAuditObject(value, fieldKey);
        Object.assign(result, nested);
        return;
      }

      result[fieldKey] = value;
    });

    return result;
  }

  function stringifyAuditValue(value: any) {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function getSmartAuditDiff(beforeData: any, afterData: any) {
    if (!beforeData && afterData) {
      const afterFlat = flattenAuditObject(afterData);
      const keys = Object.keys(afterFlat).filter((key) => !["id", "created_at", "updated_at"].includes(key));

      return keys.slice(0, 20).map((key) => ({
        field: key,
        before: "-",
        after: stringifyAuditValue(afterFlat[key]),
      }));
    }

    if (beforeData && !afterData) {
      const beforeFlat = flattenAuditObject(beforeData);
      const keys = Object.keys(beforeFlat).filter((key) => !["id", "created_at", "updated_at"].includes(key));

      return keys.slice(0, 20).map((key) => ({
        field: key,
        before: stringifyAuditValue(beforeFlat[key]),
        after: "-",
      }));
    }

    const beforeFlat = flattenAuditObject(beforeData);
    const afterFlat = flattenAuditObject(afterData);
    const keys = Array.from(new Set([...Object.keys(beforeFlat), ...Object.keys(afterFlat)]));
    const ignoredFields = new Set([
      "id",
      "created_at",
      "updated_at",
      "raw_materials",
      "ingredients",
      "formulas",
      "projects",
      "raw_materials.id",
      "ingredients.id",
      "formulas.id",
      "projects.id",
    ]);

    return keys
      .filter((key) => !ignoredFields.has(key))
      .filter((key) => stringifyAuditValue(beforeFlat[key]) !== stringifyAuditValue(afterFlat[key]))
      .map((key) => ({
        field: key,
        before: stringifyAuditValue(beforeFlat[key]),
        after: stringifyAuditValue(afterFlat[key]),
      }))
      .slice(0, 30);
  }

  function getAuditSummary(actionType: string, diffs: { field: string; before: string; after: string }[]) {
    if (diffs.length === 0) {
      return actionType;
    }

    if (diffs.length === 1) {
      const diff = diffs[0];
      return `${diff.field}: ${diff.before} → ${diff.after}`;
    }

    const preview = diffs
      .slice(0, 3)
      .map((diff) => `${diff.field}: ${diff.before} → ${diff.after}`)
      .join(" / ");

    return `${preview}${diffs.length > 3 ? ` 외 ${diffs.length - 3}건` : ""}`;
  }

  function getPrimaryAuditField(diffs: { field: string; before: string; after: string }[]) {
    return diffs[0]?.field || "";
  }

  function getPrimaryBeforeValue(diffs: { field: string; before: string; after: string }[]) {
    return diffs[0]?.before || "";
  }

  function getPrimaryAfterValue(diffs: { field: string; before: string; after: string }[]) {
    return diffs[0]?.after || "";
  }

  function getAuditDiffRows(log: AuditLog) {
    if (Array.isArray(log.diff_data)) {
      return log.diff_data;
    }

    return getSmartAuditDiff(log.before_data, log.after_data);
  }

  async function logAudit(
    moduleName: string,
    recordId: string,
    actionType: string,
    beforeData: any,
    afterData: any
  ) {
    const diffs = getSmartAuditDiff(beforeData, afterData);
    const changeSummary = getAuditSummary(actionType, diffs);

    await supabase.from("audit_logs").insert([
      {
        module_name: moduleName,
        record_id: recordId,
        action_type: actionType,
        before_data: beforeData || null,
        after_data: afterData || null,
        field_name: getPrimaryAuditField(diffs),
        before_value: getPrimaryBeforeValue(diffs),
        after_value: getPrimaryAfterValue(diffs),
        change_summary: changeSummary,
        diff_data: diffs,
        user_name: auditUserName || userProfile?.display_name || authUser?.email || "PLM User",
      },
    ]);
  }

  async function softDeleteRecord(tableName: string, recordId: string, moduleName: string, beforeData: any) {
    const { error } = await supabase
      .from(tableName)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: auditUserName || userProfile?.display_name || authUser?.email || "PLM User",
      })
      .eq("id", recordId);

    if (error) {
      alert("휴지통 이동 오류: " + error.message);
      return false;
    }

    await logAudit(moduleName, recordId, "휴지통 이동", beforeData, null);
    return true;
  }

  async function restoreRecord(tableName: string, recordId: string, moduleName: string, beforeData: any) {
    if (!assertCanDelete()) return;

    const { error } = await supabase
      .from(tableName)
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", recordId);

    if (error) {
      alert("복구 오류: " + error.message);
      return;
    }

    await logAudit(moduleName, recordId, "복구", beforeData, null);
    loadAll();
  }

  async function permanentDeleteRecord(tableName: string, recordId: string, moduleName: string, beforeData: any) {
    if (!isAdmin()) {
      alert("영구삭제는 관리자(admin)만 가능합니다.");
      return;
    }

    const ok = window.confirm("정말 영구삭제할까요? 이 작업은 복구할 수 없습니다.");

    if (!ok) return;

    if (tableName === "formulas") {
      await supabase.from("formula_items").delete().eq("formula_id", recordId);
      await supabase.from("project_formulas").delete().eq("formula_id", recordId);
      await supabase.from("approval_requests").delete().eq("formula_id", recordId);
      await supabase.from("stability_tests").delete().eq("formula_id", recordId);
      await supabase.from("process_steps").delete().eq("formula_id", recordId);
      await supabase.from("bom_costs").delete().eq("formula_id", recordId);
    }

    const { error } = await supabase.from(tableName).delete().eq("id", recordId);

    if (error) {
      alert("영구삭제 오류: " + error.message);
      return;
    }

    await logAudit(moduleName, recordId, "영구삭제", beforeData, null);
    loadAll();
  }

  useEffect(() => {
    if (!authLoading && authUser && !canAccessMenu(menu)) {
      setMenu(getDefaultMenuForRole());
    }
  }, [authLoading, authUser, userProfile, menu]);

  useEffect(() => {
    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user || null;

      setAuthUser(user);
      if (user) {
        await loadUserProfile(user);
        await loadAll();
      }

      setAuthLoading(false);
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);

      if (user) {
        await loadUserProfile(user);
        await loadAll();
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  function canAccessMenu(menuKey: string) {
    if (isAdmin()) return true;

    const role = getUserRole();

    const permissions: Record<string, string[]> = {
      dashboard: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      project: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      raw: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      material: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      documents: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      ingredient: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      global: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      composition: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      formula: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      aiFormula: ["manager", "qa", "ra", "senior", "researcher"],
      aiIngredient: ["manager", "qa", "ra", "senior", "researcher"],
      validation: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      regulation: ["manager", "qa", "ra", "viewer"],
      globalRegulation: ["manager", "ra", "viewer"],
      regUpdate: ["manager", "ra"],
      stability: ["manager", "qa", "senior", "researcher", "viewer"],
      approval: ["manager", "qa", "senior"],
      lock: ["manager", "qa", "senior"],
      stage: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      cost: ["manager", "senior", "viewer"],
      bom: ["manager", "senior", "viewer"],
      batch: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      breakdown: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      fullil: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      label: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      sheet: ["manager", "qa", "ra", "senior", "researcher", "viewer"],
      package: ["manager", "qa", "ra", "senior", "researcher"],
      audit: ["manager", "qa"],
      users: [],
      trash: ["manager"],
    };

    return permissions[menuKey]?.includes(role) || false;
  }

  function getDefaultMenuForRole() {
    if (canAccessMenu(menu)) return menu;

    if (canAccessMenu("dashboard")) return "dashboard";
    if (canAccessMenu("formula")) return "formula";
    if (canAccessMenu("project")) return "project";

    return "dashboard";
  }

  function handleMenuClick(menuKey: string) {
    if (!canAccessMenu(menuKey)) {
      alert("해당 메뉴 접근 권한이 없습니다.");
      return;
    }

    setMenu(menuKey);
  }

  function getFilteredMenuItems(items: string[][]) {
    return items.filter(([key]) => canAccessMenu(key));
  }

  function getPermissionLabel() {
    const role = getUserRole();

    if (role === "admin") return "전체 권한";
    if (role === "manager") return "관리/삭제/승인 가능";
    if (role === "qa") return "품질/승인/안정도 중심";
    if (role === "ra") return "규제검증 중심";
    if (role === "senior") return "선임 연구원";
    if (role === "researcher") return "연구원";
    return "조회 전용";
  }

  const menuGroups = [
    {
      title: "공통",
      items: [
        ["dashboard", "대시보드"],
        ["approval", "승인관리"],
      ],
    },
    {
      title: "연구팀 R&D",
      items: [
        ["project", "프로젝트관리"],
        ["raw", "원료관리"],
        ["globalIngredient", "성분관리"],
        ["composition", "원료조성표"],
        ["formula", "처방관리"],
        ["aiFormula", "AI 처방엔진"],
        ["aiIngredient", "AI 성분분석"],
        ["validation", "처방검증"],
        ["stage", "개발일정"],
        ["cost", "원가관리"],
        ["bom", "BOM원가"],
        ["batch", "배치계산"],
      ],
    },
    {
      title: "QC팀",
      items: [
        ["documents", "원료문서센터"],
      ],
    },
    {
      title: "QA팀",
      items: [
        ["stability", "안정도관리"],
      ],
    },
    {
      title: "RA팀",
      items: [
        ["regulation", "규제검증"],
        ["globalRegulation", "국가별규제"],
        ["regUpdate", "규제업데이트센터"],
        ["breakdown", "Breakdown IL"],
        ["fullil", "Full IL"],
        ["label", "전성분"],
        ["sheet", "Formula Sheet"],
        ["package", "문서패키지"],
      ],
    },
    {
      title: "관리자",
      items: [
        ["lock", "처방잠금"],
        ["audit", "Audit Log"],
        ["trash", "휴지통"],
        ["users", "사용자관리"],
      ],
    },
  ];

  if (authLoading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial" }}>
        <div>로그인 상태 확인 중...</div>
      </main>
    );
  }

  if (authUser && userProfile?.is_active === false) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial" }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px", background: "white" }}>
          <h1>계정 비활성화</h1>
          <p>관리자가 계정을 비활성화했습니다. 관리자에게 문의하세요.</p>
          <button onClick={signOut} style={{ background: "#dc2626" }}>로그아웃</button>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial",
          background: "#f9fafb",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "420px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "28px",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h1>Cosmetic PLM</h1>
          <p style={{ color: "#6b7280" }}>로그인 후 PLM을 사용할 수 있습니다.</p>

          <div style={{ display: "grid", gap: "10px" }}>
            {authMode === "signup" && (
              <input
                placeholder="이름 예: 홍길동"
                value={authDisplayName || ""}
                onChange={(e) => setAuthDisplayName(e.target.value)}
              />
            )}

            <input
              placeholder="이메일"
              value={authEmail || ""}
              onChange={(e) => setAuthEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={authPassword || ""}
              onChange={(e) => setAuthPassword(e.target.value)}
            />

            {authMode === "signin" ? (
              <button onClick={signIn}>로그인</button>
            ) : (
              <button onClick={signUp}>회원가입</button>
            )}

            <button
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              style={{ background: "#6b7280" }}
            >
              {authMode === "signin" ? "회원가입으로 전환" : "로그인으로 전환"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!canAccessMenu(menu)) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial" }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px", background: "white" }}>
          <h1>접근 권한 없음</h1>
          <p>현재 권한으로는 이 메뉴를 사용할 수 없습니다.</p>
          <p>현재 권한: {getUserRoleLabel()} / {getPermissionLabel()}</p>
          <button onClick={() => setMenu(getDefaultMenuForRole())}>대시보드로 이동</button>
          <button onClick={signOut} style={{ background: "#dc2626", marginLeft: "8px" }}>로그아웃</button>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
        <style jsx global>{`
          table {
            border-collapse: collapse;
          }
          th {
            border: 1px solid #d1d5db;
            padding: 10px;
            background: #f3f4f6;
            text-align: left;
            white-space: nowrap;
          }
          td {
            border: 1px solid #d1d5db;
            padding: 10px;
            vertical-align: top;
          }
          input, select, textarea {
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-sizing: border-box;
          }
          button {
            padding: 8px 12px;
            border: 0;
            border-radius: 6px;
            background: #2563eb;
            color: white;
            font-weight: 700;
            cursor: pointer;
            margin: 2px;
          }
          button:hover {
            opacity: 0.9;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #formula-sheet,
            #formula-sheet * {
              visibility: visible;
            }
            #formula-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: none !important;
              border: 0 !important;
              box-shadow: none !important;
            }
            button,
            select,
            input,
            textarea,
            nav,
            aside {
              display: none !important;
            }
          }
        `}</style>

      <aside style={{ width: "260px", background: "#111827", color: "white", padding: "22px", overflowY: "auto", maxHeight: "100vh" }}>
        <h2>🧪 Cosmetic PLM</h2>
        <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "-8px" }}>
          {getUserRoleLabel()} / {getPermissionLabel()}
        </p>

        {menuGroups.map((group) => {
          const visibleItems = getFilteredMenuItems(group.items);

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={group.title} style={{ marginTop: "18px" }}>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  borderBottom: "1px solid #374151",
                  paddingBottom: "4px",
                }}
              >
                {group.title}
              </div>

              {visibleItems.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleMenuClick(key)}
                  style={{
                    display: "block",
                    width: "100%",
                    margin: "6px 0",
                    padding: "9px 10px",
                    background: menu === key ? "#2563eb" : "#374151",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      <section style={{ flex: 1, padding: "40px" }}>
        {menu === "dashboard" && (
          <>
            <h1>Cosmetic PLM Executive Dashboard</h1>
            <p style={{ color: "#6b7280" }}>
              프로젝트, 처방, 승인, 안정도, 원가, 규제검증, Audit 현황을 한 화면에서 확인합니다.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "16px",
                marginTop: "20px",
                marginBottom: "28px",
              }}
            >
              <DashboardKpiCard title="전체 프로젝트" value={getAdvancedDashboardKpis().totalProjects} subtitle={`진행중 ${getAdvancedDashboardKpis().activeProjects} / 출시완료 ${getAdvancedDashboardKpis().completedProjects}`} accent="#2563eb" />
              <DashboardKpiCard title="전체 처방" value={formulas.length} subtitle={`LOCK ${getAdvancedDashboardKpis().lockedFormulas} / 수정가능 ${getAdvancedDashboardKpis().editableFormulas}`} accent="#7c3aed" />
              <DashboardKpiCard title="승인대기" value={getAdvancedDashboardKpis().approvalPending} subtitle={`승인/배포 ${getAdvancedDashboardKpis().approvalDone}`} accent="#d97706" />
              <DashboardKpiCard title="안정도진행" value={getAdvancedDashboardKpis().stabilityRunning} subtitle={`PASS ${getAdvancedDashboardKpis().stabilityPass} / FAIL ${getAdvancedDashboardKpis().stabilityFail}`} accent="#059669" />
              <DashboardKpiCard title="규제 위험" value={getAdvancedDashboardKpis().regulationDanger} subtitle={`주의 ${getAdvancedDashboardKpis().regulationCaution}`} accent={getAdvancedDashboardKpis().regulationDanger > 0 ? "#dc2626" : "#059669"} />
              <DashboardKpiCard title="목표원가 달성률" value={`${getAdvancedDashboardKpis().targetCostRate.toFixed(1)}%`} subtitle={`평균 원료원가 ${getAdvancedDashboardKpis().averageFormulaCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}원/kg`} accent="#0ea5e9" />
              <DashboardKpiCard title="평균 제조원가" value={`${getAdvancedDashboardKpis().averageBomCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subtitle="BOM 반영 원가(원/kg)" accent="#10b981" />
              <DashboardKpiCard title="휴지통" value={getAdvancedDashboardKpis().trashCount} subtitle={`최근 Audit 7일 ${getAdvancedDashboardKpis().recentAuditCount}건`} accent="#6b7280" />
              <DashboardKpiCard title="국가별 규제 DB" value={countryRegulations.length} subtitle={`검증국가 ${getAvailableCountryCodes().length}개`} accent="#9333ea" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "28px" }}>
              <div style={cardStyle}>
                <h2>프로젝트 현황</h2>
                <DashboardProgress label="개발중" value={getAdvancedDashboardKpis().activeProjects} total={Math.max(getAdvancedDashboardKpis().totalProjects, 1)} color="#2563eb" />
                <DashboardProgress label="출시/완료" value={getAdvancedDashboardKpis().completedProjects} total={Math.max(getAdvancedDashboardKpis().totalProjects, 1)} color="#059669" />
                <DashboardProgress label="보류" value={getAdvancedDashboardKpis().holdProjects} total={Math.max(getAdvancedDashboardKpis().totalProjects, 1)} color="#d97706" />
              </div>

              <div style={cardStyle}>
                <h2>처방 운영 현황</h2>
                <DashboardProgress label="LOCKED" value={getAdvancedDashboardKpis().lockedFormulas} total={Math.max(formulas.length, 1)} color="#7c3aed" />
                <DashboardProgress label="수정 가능" value={getAdvancedDashboardKpis().editableFormulas} total={Math.max(formulas.length, 1)} color="#2563eb" />
                <DashboardProgress label="목표원가 달성" value={Math.round((getAdvancedDashboardKpis().targetCostRate / 100) * Math.max(formulas.length, 1))} total={Math.max(formulas.length, 1)} color="#0ea5e9" />
              </div>

              <div style={cardStyle}>
                <h2>승인 / 안정도</h2>
                <DashboardProgress label="승인대기" value={getAdvancedDashboardKpis().approvalPending} total={Math.max(approvalRequests.length, 1)} color="#d97706" />
                <DashboardProgress label="승인완료" value={getAdvancedDashboardKpis().approvalDone} total={Math.max(approvalRequests.length, 1)} color="#059669" />
                <DashboardProgress label="안정도 PASS" value={getAdvancedDashboardKpis().stabilityPass} total={Math.max(stabilityTests.length, 1)} color="#10b981" />
              </div>

              <div style={cardStyle}>
                <h2>규제 / 품질 Alert</h2>
                <DashboardProgress label="규제 위험" value={getAdvancedDashboardKpis().regulationDanger} total={Math.max(getAdvancedDashboardKpis().regulationDanger + getAdvancedDashboardKpis().regulationCaution, 1)} color="#dc2626" />
                <DashboardProgress label="규제 주의" value={getAdvancedDashboardKpis().regulationCaution} total={Math.max(getAdvancedDashboardKpis().regulationDanger + getAdvancedDashboardKpis().regulationCaution, 1)} color="#d97706" />
                <DashboardProgress label="최근 Audit" value={getAdvancedDashboardKpis().recentAuditCount} total={Math.max(auditLogs.length, 1)} color="#6b7280" />
              </div>
            </div>

            <h2>프로젝트별 진행률</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>프로젝트 코드</th>
                  <th>고객사</th>
                  <th>프로젝트명</th>
                  <th>진행률</th>
                  <th>현재 단계</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.project_code}</td>
                    <td>{project.customer_name}</td>
                    <td>{project.project_name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "140px", height: "10px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${getProjectProgress(project.id)}%`, height: "100%", background: "#2563eb" }} />
                        </div>
                        <strong>{getProjectProgress(project.id)}%</strong>
                      </div>
                    </td>
                    <td>{getCurrentProjectStage(project.id)}</td>
                    <td>{project.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>규제 위험 처방 Top List</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>위험</th>
                  <th>주의</th>
                  <th>잠금상태</th>
                  <th>제조원가</th>
                </tr>
              </thead>
              <tbody>
                {formulas
                  .map((formula) => ({ formula, summary: getRegulationSummary(formula.id) }))
                  .sort((a, b) => b.summary.dangerCount - a.summary.dangerCount || b.summary.cautionCount - a.summary.cautionCount)
                  .slice(0, 10)
                  .map(({ formula, summary }) => (
                    <tr key={formula.id}>
                      <td>{formula.formula_code}</td>
                      <td>{formula.formula_name}</td>
                      <td style={{ color: summary.dangerCount > 0 ? "red" : "green", fontWeight: "bold" }}>{summary.dangerCount}</td>
                      <td style={{ color: summary.cautionCount > 0 ? "#d97706" : "green", fontWeight: "bold" }}>{summary.cautionCount}</td>
                      <td>{formula.is_locked ? "LOCKED" : "EDITABLE"}</td>
                      <td>{getBomFinalCost(formula.id).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <h2>최근 Audit Log</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>일시</th>
                  <th>모듈</th>
                  <th>작업</th>
                  <th>작업자</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                    <td>{log.module_name}</td>
                    <td>{log.action_type}</td>
                    <td>{log.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "project" && (
          <>
            <h1>프로젝트관리</h1>
            <p>고객사별 제품개발 프로젝트, 담당 연구원, 진행 상태를 관리합니다.</p>

            <h2>프로젝트 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "600px" }}>
              <input
                placeholder={`프로젝트 코드 자동 생성 예: ${generateProjectCode()}`}
                value={projectCode || generateProjectCode()}
                readOnly
              />

              <input
                placeholder="고객사 예: ABC 브랜드"
                value={customerName || ""}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                placeholder="프로젝트명 예: 비건 수분크림 개발"
                value={projectName || ""}
                onChange={(e) => setProjectName(e.target.value)}
              />

              <input
                placeholder="제형 예: 크림 / 세럼 / 패치 / 토너"
                value={dosageForm || ""}
                onChange={(e) => setDosageForm(e.target.value)}
              />

              <input
                placeholder="주요 컨셉 예: 비건, 저자극, 고보습"
                value={conceptKeywords || ""}
                onChange={(e) => setConceptKeywords(e.target.value)}
              />

              <input
                placeholder="희망원가(원/kg) 예: 2500"
                value={targetPrice || ""}
                onChange={(e) => setTargetPrice(e.target.value)}
              />

              <input
                placeholder="금지원료 예: 파라벤, 페녹시에탄올"
                value={forbiddenIngredients || ""}
                onChange={(e) => setForbiddenIngredients(e.target.value)}
              />

              <input
                placeholder="필수원료 예: PDRN, 판테놀"
                value={requiredIngredients || ""}
                onChange={(e) => setRequiredIngredients(e.target.value)}
              />

              <input
                placeholder="담당 연구원 예: 홍길동"
                value={researcher || ""}
                onChange={(e) => setResearcher(e.target.value)}
              />

              <select value={projectStatus || "개발중"} onChange={(e) => setProjectStatus(e.target.value)}>
                {getProjectStatusOptions().map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="고객사 Brief / 개발 요청사항"
                value={customerBrief || ""}
                onChange={(e) => setCustomerBrief(e.target.value)}
                rows={4}
              />

              <input
                placeholder="내부 비고"
                value={projectDescription || ""}
                onChange={(e) => setProjectDescription(e.target.value)}
              />

              <button onClick={addProject}>프로젝트 저장</button>
            </div>

            <h2>프로젝트 ↔ 처방 연결</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "600px", marginBottom: "24px" }}>
              <select value={mappingProjectId || ""} onChange={(e) => setMappingProjectId(e.target.value)}>
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </option>
                ))}
              </select>

              <select value={mappingFormulaId || ""} onChange={(e) => setMappingFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <label>
                <input
                  type="checkbox"
                  checked={mappingIsCurrent}
                  onChange={(e) => setMappingIsCurrent(e.target.checked)}
                />
                현재 승인 버전으로 지정
              </label>

              <button onClick={addProjectFormula}>프로젝트에 처방 연결</button>
            </div>

            <h2>프로젝트 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>프로젝트 코드</th>
                  <th>고객사</th>
                  <th>프로젝트명</th>
                  <th>제형</th>
                  <th>컨셉</th>
                  <th>희망원가</th>
                  <th>금지원료</th>
                  <th>필수원료</th>
                  <th>담당 연구원</th>
                  <th>상태</th>
                  <th>고객 Brief</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.project_code}</td>
                    <td>{project.customer_name}</td>
                    <td>{project.project_name}</td>
                    <td>{project.dosage_form}</td>
                    <td>{project.concept_keywords}</td>
                    <td>{Number(project.target_price || 0).toLocaleString()}</td>
                    <td>{project.forbidden_ingredients}</td>
                    <td>{project.required_ingredients}</td>
                    <td>{project.researcher}</td>
                    <td>
                      <select
                        value={project.status || "개발중"}
                        onChange={(e) => updateProjectStatus(project, e.target.value)}
                        style={{ fontWeight: "bold" }}
                      >
                        {getProjectStatusOptions().map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{project.customer_brief}</td>
                    <td>{project.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2>프로젝트별 연결 처방</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>프로젝트 코드</th>
                  <th>고객사</th>
                  <th>프로젝트명</th>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>Version</th>
                  <th>Revision No.</th>
                  <th>현재 승인 버전</th>
                </tr>
              </thead>
              <tbody>
                {projectFormulas.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.projects?.project_code}</td>
                    <td>{mapping.projects?.customer_name}</td>
                    <td>{mapping.projects?.project_name}</td>
                    <td>{mapping.formulas?.formula_code}</td>
                    <td>{mapping.formulas?.formula_name}</td>
                    <td>{mapping.formulas?.version}</td>
                    <td>{mapping.formulas?.revision_no || 1}</td>
                    <td style={{ color: mapping.is_current ? "green" : "#555", fontWeight: mapping.is_current ? "bold" : "normal" }}>
                      {mapping.is_current ? "YES" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </>
        )}

        {menu === "raw" && (
          <>
            <h1>원료관리</h1>

            <h2>Global Ingredient 자동 연결 원료 등록</h2>
            <p style={{ color: "#6b7280" }}>
              Global Ingredient Master에서 성분을 선택하면 원료명과 원료조성표 100% 단일성분 연결을 자동 생성할 수 있습니다.
            </p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "700px", marginBottom: "24px" }}>
              <input
                placeholder="Global 성분 검색 예: Niacinamide / 나이아신아마이드 / 98-92-0"
                value={rawGlobalSearch || ""}
                onChange={(e) => setRawGlobalSearch(e.target.value)}
              />

              <select
                value={rawGlobalIngredientId || ""}
                onChange={(e) => {
                  const selected = globalIngredients.find((item) => item.id === e.target.value);
                  if (selected) {
                    fillRawMaterialFromGlobal(selected);
                  } else {
                    setRawGlobalIngredientId("");
                  }
                }}
              >
                <option value="">Global Ingredient 선택</option>
                {getFilteredRawGlobalIngredients().slice(0, 50).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.inci_name} / {item.korean_name} / {item.cas_no} / {item.function_ko}
                  </option>
                ))}
              </select>

              {getSelectedRawGlobalIngredient() && (
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>INCI</th>
                      <td>{getSelectedRawGlobalIngredient()?.inci_name}</td>
                      <th>국문명</th>
                      <td>{getSelectedRawGlobalIngredient()?.korean_name}</td>
                    </tr>
                    <tr>
                      <th>CAS</th>
                      <td>{getSelectedRawGlobalIngredient()?.cas_no}</td>
                      <th>EC</th>
                      <td>{getSelectedRawGlobalIngredient()?.ec_no}</td>
                    </tr>
                    <tr>
                      <th>기능</th>
                      <td>{getSelectedRawGlobalIngredient()?.function_ko}</td>
                      <th>IECIC/COSMOS/VEGAN</th>
                      <td>
                        {getSelectedRawGlobalIngredient()?.iecic_status} / {getSelectedRawGlobalIngredient()?.cosmos_status} / {getSelectedRawGlobalIngredient()?.vegan_status}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={rawAutoComposition}
                  onChange={(e) => setRawAutoComposition(e.target.checked)}
                />
                선택한 Global Ingredient를 원료조성표에 100% 자동 연결
              </label>
            </div>

            <h2>원료 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "500px", marginBottom: "24px" }}>
              <input placeholder="원료코드 예: RM0001" value={rawCode || ""} onChange={(e) => setRawCode(e.target.value)} />
              <input placeholder="원료명 예: 글리세린" value={rawName || ""} onChange={(e) => setRawName(e.target.value)} />
              <input placeholder="공급사 예: OO상사" value={supplier || ""} onChange={(e) => setSupplier(e.target.value)} />
              <input placeholder="구매단가(원/kg) 예: 4500" value={rawUnitPrice || ""} onChange={(e) => setRawUnitPrice(e.target.value)} />
              <input placeholder="통화 예: KRW" value={rawCurrency || ""} onChange={(e) => setRawCurrency(e.target.value)} />
              <input placeholder="MOQ(kg) 예: 20" value={rawMoq || ""} onChange={(e) => setRawMoq(e.target.value)} />
              <button onClick={addMaterial}>원료 저장</button>
            </div>

            <h2>원료 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>공급사</th>
                  <th>단가(원/kg)</th>
                  <th>통화</th>
                  <th>MOQ(kg)</th>
                  <th>조성합계</th>
                  <th>조성상태</th>
                  <th>문서수</th>
                  <th>문서상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.raw_code}</td>
                    <td>{m.raw_name}</td>
                    <td>{m.supplier}</td>
                    <td>{Number(m.unit_price || 0).toLocaleString()}</td>
                    <td>{m.currency || "KRW"}</td>
                    <td>{Number(m.moq || 0).toLocaleString()}</td>
                    <td>{getCompositionTotalByRaw(m.id).toFixed(2)}%</td>
                    <td style={{ color: Math.abs(getCompositionTotalByRaw(m.id) - 100) < 0.0001 ? "green" : "red", fontWeight: "bold" }}>
                      {Math.abs(getCompositionTotalByRaw(m.id) - 100) < 0.0001 ? "완료" : "검토"}
                    </td>
                    <td>{getMaterialDocumentsByRaw(m.id).length}</td>
                    <td>
                      {getMaterialDocumentsByRaw(m.id).some((doc) => getMaterialDocumentExpiryStatus(doc).label.includes("만료")) ? (
                        <span style={{ color: "#d97706", fontWeight: "bold" }}>검토</span>
                      ) : (
                        <span style={{ color: "green", fontWeight: "bold" }}>정상</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => setMenu("documents")}>문서센터</button>
                      <button onClick={() => updateRawMaterial(m)}>수정</button>
                      <button onClick={() => deleteRawMaterial(m)} style={{ background: "#dc2626" }}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "documents" && (
          <>
            <h1>원료문서센터</h1>
            <p>원료별 COA, MSDS, TDS, Specification, Allergen, Vegan, Halal, RSPO 등 공급사 문서를 업로드하고 만료일을 관리합니다.</p>

            <h2>문서 업로드</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px", marginBottom: "24px" }}>
              <select value={docRawMaterialId || ""} onChange={(e) => setDocRawMaterialId(e.target.value)}>
                <option value="">원료 선택</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.raw_code} - {m.raw_name} / {m.supplier}
                  </option>
                ))}
              </select>

              <select value={docType || "COA"} onChange={(e) => setDocType(e.target.value)}>
                <option value="COA">COA</option>
                <option value="MSDS">MSDS</option>
                <option value="TDS">TDS</option>
                <option value="Specification">Specification</option>
                <option value="Allergen Statement">Allergen Statement</option>
                <option value="Non-Animal Statement">Non-Animal Statement</option>
                <option value="Vegan Certificate">Vegan Certificate</option>
                <option value="Halal Certificate">Halal Certificate</option>
                <option value="RSPO Certificate">RSPO Certificate</option>
                <option value="Other">Other</option>
              </select>

              <input placeholder="문서명 예: Glycerin COA 2026" value={docTitle || ""} onChange={(e) => setDocTitle(e.target.value)} />

              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setDocFile(file);

                  if (file && !docTitle) {
                    setDocTitle(file.name);
                  }
                }}
              />

              <input placeholder="외부 문서 URL 사용 시 입력" value={docUrl || ""} onChange={(e) => setDocUrl(e.target.value)} />

              <label>발행일</label>
              <input type="date" value={docIssueDate || ""} onChange={(e) => setDocIssueDate(e.target.value)} />

              <label>만료일</label>
              <input type="date" value={docExpiryDate || ""} onChange={(e) => setDocExpiryDate(e.target.value)} />

              <input placeholder="비고" value={docRemark || ""} onChange={(e) => setDocRemark(e.target.value)} />

              <button onClick={addMaterialDocument}>문서 저장</button>
              <p style={{ color: "#2563eb", fontWeight: "bold" }}>{docUploadStatus}</p>
            </div>

            <h2>문서 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>공급사</th>
                  <th>문서구분</th>
                  <th>문서명</th>
                  <th>파일명</th>
                  <th>발행일</th>
                  <th>만료일</th>
                  <th>상태</th>
                  <th>업로드자</th>
                  <th>비고</th>
                  <th>열기</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {materialDocuments.map((doc) => {
                  const status = getMaterialDocumentExpiryStatus(doc);

                  return (
                    <tr key={doc.id}>
                      <td>{doc.raw_materials?.raw_code}</td>
                      <td>{doc.raw_materials?.raw_name}</td>
                      <td>{doc.raw_materials?.supplier}</td>
                      <td>{doc.document_type}</td>
                      <td>{doc.document_title}</td>
                      <td>{doc.file_name || "-"}</td>
                      <td>{doc.issue_date || "-"}</td>
                      <td>{doc.expiry_date || "-"}</td>
                      <td style={{ color: status.color, fontWeight: "bold" }}>{status.label}</td>
                      <td>{doc.uploaded_by || "-"}</td>
                      <td>{doc.remark}</td>
                      <td>
                        {doc.document_url ? (
                          <a href={doc.document_url} target="_blank" rel="noreferrer">
                            열기
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <button onClick={() => deleteMaterialDocument(doc)} style={{ background: "#dc2626" }}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {menu === "globalIngredient" && (
          <>
            <h1>성분관리 / 통합 성분 Master</h1>
            <p>성분 정보를 하나의 통합 마스터로 관리합니다. INCI, 국문명, 중문명, 일문명, CAS, EC, 규제 정보를 이 화면에서 등록/수정/삭제합니다.</p>

            <h2>CSV 대량 업로드</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "600px", marginBottom: "24px" }}>
              <button onClick={downloadGlobalCsvTemplate}>CSV 양식 다운로드</button>
              <button onClick={exportGlobalIngredientMasterCsv} style={{ background: "#059669" }}>Global Master CSV 내보내기</button>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    importGlobalCsv(file);
                    e.target.value = "";
                  }
                }}
              />

              <p style={{ color: "#555" }}>
                CSV 첫 줄은 양식 그대로 사용하세요. INCI명(inci_name)은 필수입니다. 같은 INCI명은 새로 추가하지 않고 기존 데이터를 업데이트합니다. v20 컬럼(HALAL/RSPO/EU/China/Japan/ASEAN/Source/Verified Date)까지 일괄 관리됩니다.
              </p>

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>
                {globalUploadStatus}
              </p>
            </div>

            <h2>Bulk Import Wizard</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "760px", marginBottom: "24px" }}>
              <p style={{ color: "#6b7280" }}>
                외부 CSV의 컬럼명이 서로 달라도 INCI, CAS, EWG, IECIC 등 주요 컬럼을 자동 인식해 Global Ingredient Master로 업로드합니다.
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={downloadSeedIngredientCsv} style={{ background: "#7c3aed" }}>
                  Seed DB 샘플 CSV 다운로드
                </button>
                <button onClick={importBulkWizardRows} style={{ background: "#059669" }}>
                  미리보기 데이터 Bulk Import
                </button>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    previewBulkIngredientCsv(file);
                    e.target.value = "";
                  }
                }}
              />

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>{bulkWizardStatus}</p>

              {bulkWizardRows.length > 0 && (
                <>
                  <h3>자동 매핑 미리보기</h3>
                  <p>
                    원본 컬럼 수: {bulkWizardHeaders.length}개 / 인식된 성분 수: {bulkWizardMappedCount}개
                  </p>

                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th>INCI</th>
                        <th>국문명</th>
                        <th>CAS</th>
                        <th>EC</th>
                        <th>기능</th>
                        <th>IECIC</th>
                        <th>EU</th>
                        <th>China</th>
                        <th>EWG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkWizardRows.slice(0, 20).map((row, index) => (
                        <tr key={`${row.inci_name}-${index}`}>
                          <td>{row.inci_name}</td>
                          <td>{row.korean_name}</td>
                          <td>{row.cas_no}</td>
                          <td>{row.ec_no}</td>
                          <td>{row.function_ko}</td>
                          <td>{row.iecic_status}</td>
                          <td>{row.eu_status}</td>
                          <td>{row.china_status}</td>
                          <td>{row.ewg_grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <h2>통합 성분 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "600px" }}>
              <input placeholder="INCI 예: Glycerin" value={globalInciName || ""} onChange={(e) => setGlobalInciName(e.target.value)} />
              <input placeholder="국문명 예: 글리세린" value={globalKoreanName || ""} onChange={(e) => setGlobalKoreanName(e.target.value)} />
              <input placeholder="중문명 예: 甘油" value={globalChineseName || ""} onChange={(e) => setGlobalChineseName(e.target.value)} />
              <input placeholder="일문명 예: グリセリン" value={globalJapaneseName || ""} onChange={(e) => setGlobalJapaneseName(e.target.value)} />
              <input placeholder="CAS No. 예: 56-81-5" value={globalCasNo || ""} onChange={(e) => setGlobalCasNo(e.target.value)} />
              <input placeholder="EC No. 예: 200-289-5" value={globalEcNo || ""} onChange={(e) => setGlobalEcNo(e.target.value)} />
              <input placeholder="기능(국문) 예: 보습제" value={globalFunctionKo || ""} onChange={(e) => setGlobalFunctionKo(e.target.value)} />
              <input placeholder="Function(English) 예: Humectant" value={globalFunctionEn || ""} onChange={(e) => setGlobalFunctionEn(e.target.value)} />
              <input placeholder="IECIC 여부 예: Listed" value={globalIecicStatus || ""} onChange={(e) => setGlobalIecicStatus(e.target.value)} />
              <input placeholder="COSMOS 여부 예: 가능" value={globalCosmosStatus || ""} onChange={(e) => setGlobalCosmosStatus(e.target.value)} />
              <input placeholder="VEGAN 여부 예: Vegan" value={globalVeganStatus || ""} onChange={(e) => setGlobalVeganStatus(e.target.value)} />
              <input placeholder="배합한도 예: 제한 없음" value={globalMaxUseLevel || ""} onChange={(e) => setGlobalMaxUseLevel(e.target.value)} />
              <input placeholder="규제사항" value={globalRegulationNote || ""} onChange={(e) => setGlobalRegulationNote(e.target.value)} />
              <input placeholder="EWG 등급 예: 1" value={globalEwgGrade || ""} onChange={(e) => setGlobalEwgGrade(e.target.value)} />
              <input placeholder="알러젠 정보" value={globalAllergenNote || ""} onChange={(e) => setGlobalAllergenNote(e.target.value)} />

              <button onClick={addGlobalIngredient}>통합 성분 저장</button>
            </div>

            <h2>통합 성분 목록</h2>
            <p>
              Global 성분 수: {globalIngredients.length}개 / 성분관리 등록 수: {ingredients.length}개
            </p>
            <p style={{ color: "#6b7280" }}>
              성분 데이터가 많을 때 화면 지연을 줄이기 위해 목록은 페이지 단위로 표시됩니다.
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
              <span>
                표시: {getPaginatedGlobalIngredients().length}개 / 검색결과 {getFilteredGlobalIngredients().length}개 / 전체 {globalIngredients.length}개
              </span>

              <select
                value={globalIngredientPageSize}
                onChange={(e) => {
                  setGlobalIngredientPageSize(Number(e.target.value));
                  setGlobalIngredientPage(1);
                }}
              >
                <option value={25}>25개씩</option>
                <option value={50}>50개씩</option>
                <option value={100}>100개씩</option>
                <option value={200}>200개씩</option>
              </select>

              <button
                onClick={() => setGlobalIngredientPage(Math.max(1, globalIngredientPage - 1))}
                disabled={globalIngredientPage <= 1}
                style={{ background: globalIngredientPage <= 1 ? "#9ca3af" : "#2563eb" }}
              >
                이전
              </button>

              <span>
                Page {globalIngredientPage} / {getGlobalIngredientTotalPages()}
              </span>

              <button
                onClick={() => setGlobalIngredientPage(Math.min(getGlobalIngredientTotalPages(), globalIngredientPage + 1))}
                disabled={globalIngredientPage >= getGlobalIngredientTotalPages()}
                style={{ background: globalIngredientPage >= getGlobalIngredientTotalPages() ? "#9ca3af" : "#2563eb" }}
              >
                다음
              </button>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>중문명</th>
                  <th>일문명</th>
                  <th>CAS No.</th>
                  <th>EC No.</th>
                  <th>기능</th>
                  <th>Function</th>
                  <th>IECIC</th>
                  <th>COSMOS</th>
                  <th>VEGAN</th>
                  <th>HALAL</th>
                  <th>RSPO</th>
                  <th>EU</th>
                  <th>China</th>
                  <th>Japan</th>
                  <th>ASEAN</th>
                  <th>배합한도</th>
                  <th>Max %</th>
                  <th>EWG</th>
                  <th>알러젠</th>
                  <th>Source</th>
                  <th>Verified</th>
                  <th>규제사항</th>
                  <th>성분관리 등록</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedGlobalIngredients().map((item) => (
                  <tr key={item.id}>
                    <td>{item.inci_name}</td>
                    <td>{item.korean_name}</td>
                    <td>{item.chinese_name}</td>
                    <td>{item.japanese_name}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.ec_no}</td>
                    <td>{item.function_ko}</td>
                    <td>{item.function_en}</td>
                    <td>{item.iecic_status}</td>
                    <td>{item.cosmos_status}</td>
                    <td>{item.vegan_status}</td>
                    <td>{item.halal_status}</td>
                    <td>{item.rspo_status}</td>
                    <td>{item.eu_status}</td>
                    <td>{item.china_status}</td>
                    <td>{item.japan_status}</td>
                    <td>{item.asean_status}</td>
                    <td>{item.max_use_level}</td>
                    <td>{item.max_use_percent ?? ""}</td>
                    <td>{item.ewg_grade}</td>
                    <td>{item.allergen_note}</td>
                    <td>{item.reference_source}</td>
                    <td>{item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString() : ""}</td>
                    <td>{item.regulation_note}</td>
                    <td>
                      <button onClick={() => registerGlobalToIngredient(item)}>등록</button>
                    </td>
                    <td>
                      <button onClick={() => updateGlobalIngredient(item)}>수정</button>
                      <button onClick={() => deleteGlobalIngredient(item)} style={{ background: "#dc2626" }}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "composition" && (
          <>
            <h1>원료조성표</h1>

            <h2>Global INCI 기반 원료조성 자동 연결</h2>
            <p>Global INCI에서 성분을 검색해 성분관리에 자동등록하고, 원료조성표까지 바로 연결합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "700px", marginBottom: "24px" }}>
              <select value={compositionRawId || ""} onChange={(e) => setCompositionRawId(e.target.value)}>
                <option value="">원료 선택</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.raw_code} - {m.raw_name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Global 성분 검색 예: Glycerin / 글리세린 / 56-81-5"
                value={compositionGlobalSearch || ""}
                onChange={(e) => setCompositionGlobalSearch(e.target.value)}
              />

              <select value={compositionGlobalId || ""} onChange={(e) => setCompositionGlobalId(e.target.value)}>
                <option value="">Global 성분 선택</option>
                {getFilteredCompositionGlobalIngredients().slice(0, 30).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.inci_name} / {item.korean_name} / {item.cas_no}
                  </option>
                ))}
              </select>

              <input
                placeholder="구성비율 예: 100 또는 44.9"
                value={compositionPercent || ""}
                onChange={(e) => setCompositionPercent(e.target.value)}
              />

              <button onClick={addCompositionFromGlobal}>Global 성분으로 원료조성 저장</button>
            </div>

            <h2>기존 방식 원료조성 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
              <select value={rawMaterialId || ""} onChange={(e) => setRawMaterialId(e.target.value)}>
                <option value="">원료 선택</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.raw_code} - {m.raw_name}
                  </option>
                ))}
              </select>

              <select value={ingredientId || ""} onChange={(e) => setIngredientId(e.target.value)}>
                <option value="">성분 선택</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.inci_name} / {i.korean_name}
                  </option>
                ))}
              </select>

              <input placeholder="구성비율 예: 100 또는 44.9" value={percentage || ""} onChange={(e) => setPercentage(e.target.value)} />
              <button onClick={addComposition}>원료조성 저장</button>
            </div>

            <h2>원료별 구성비율 합계</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>구성비율 합계(%)</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const total = getCompositionTotalByRaw(m.id);
                  const isComplete = Math.abs(total - 100) < 0.0001;

                  return (
                    <tr key={m.id}>
                      <td>{m.raw_code}</td>
                      <td>{m.raw_name}</td>
                      <td>{total.toFixed(2)}</td>
                      <td style={{ color: isComplete ? "green" : "red", fontWeight: "bold" }}>
                        {isComplete ? "100% 완료" : "100% 아님"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h2>원료조성표 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>CAS No.</th>
                  <th>IECIC</th>
                  <th>구성비율(%)</th>
                </tr>
              </thead>
              <tbody>
                {compositions.map((c) => (
                  <tr key={c.id}>
                    <td>{c.raw_materials?.raw_code}</td>
                    <td>{c.raw_materials?.raw_name}</td>
                    <td>{c.ingredients?.inci_name}</td>
                    <td>{c.ingredients?.korean_name}</td>
                    <td>{c.ingredients?.cas_no}</td>
                    <td>{c.ingredients?.iecic_status}</td>
                    <td>{c.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "aiIngredient" && (
          <>
            <h1>AI Ingredient Intelligence</h1>
            <p style={{ color: "#6b7280" }}>
              Global Ingredient Master, 원료마스터, 국가별 규제 DB를 연결해 성분별 기능/권장함량/규제/대체원료/공급원료를 분석합니다.
            </p>

            <h2>성분 검색</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "760px", marginBottom: "24px" }}>
              <input
                placeholder="INCI / 국문명 / CAS / 기능 검색 예: Niacinamide, 보습, 98-92-0"
                value={aiIngredientSearch || ""}
                onChange={(e) => setAiIngredientSearch(e.target.value)}
              />

              <select
                value={aiIngredientId || ""}
                onChange={(e) => {
                  const selected = globalIngredients.find((item) => item.id === e.target.value);
                  setAiIngredientId(e.target.value);

                  if (selected) {
                    analyzeAiIngredient(selected);
                  }
                }}
              >
                <option value="">분석할 성분 선택</option>
                {getFilteredAiIngredients().map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.inci_name} / {item.korean_name} / {item.cas_no} / {item.function_ko}
                  </option>
                ))}
              </select>
            </div>

            {aiIngredientAnalysis && (
              <>
                <h2>성분 분석 결과</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={cardStyle}><strong>INCI</strong><div>{aiIngredientAnalysis.ingredient.inci_name}</div></div>
                  <div style={cardStyle}><strong>국문명</strong><div>{aiIngredientAnalysis.ingredient.korean_name}</div></div>
                  <div style={cardStyle}><strong>CAS</strong><div>{aiIngredientAnalysis.ingredient.cas_no || "-"}</div></div>
                  <div style={cardStyle}><strong>EC</strong><div>{aiIngredientAnalysis.ingredient.ec_no || "-"}</div></div>
                  <div style={cardStyle}><strong>AI Score</strong><div>{aiIngredientAnalysis.score}/100</div></div>
                  <div style={cardStyle}>
                    <strong>Risk</strong>
                    <div style={{ color: aiIngredientAnalysis.risk_level === "HIGH" ? "red" : aiIngredientAnalysis.risk_level === "MEDIUM" ? "#d97706" : "green", fontWeight: "bold" }}>
                      {aiIngredientAnalysis.risk_level}
                    </div>
                  </div>
                </div>

                <h3>기본 정보</h3>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>기능</th>
                      <td>{aiIngredientAnalysis.ingredient.function_ko} / {aiIngredientAnalysis.ingredient.function_en}</td>
                      <th>권장 사용범위</th>
                      <td>{aiIngredientAnalysis.recommended_range}</td>
                    </tr>
                    <tr>
                      <th>IECIC</th>
                      <td>{aiIngredientAnalysis.ingredient.iecic_status || "-"}</td>
                      <th>COSMOS / VEGAN / HALAL / RSPO</th>
                      <td>
                        {aiIngredientAnalysis.ingredient.cosmos_status || "-"} / {aiIngredientAnalysis.ingredient.vegan_status || "-"} / {aiIngredientAnalysis.ingredient.halal_status || "-"} / {aiIngredientAnalysis.ingredient.rspo_status || "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>EU / China / Japan / ASEAN</th>
                      <td colSpan={3}>
                        {aiIngredientAnalysis.ingredient.eu_status || "-"} / {aiIngredientAnalysis.ingredient.china_status || "-"} / {aiIngredientAnalysis.ingredient.japan_status || "-"} / {aiIngredientAnalysis.ingredient.asean_status || "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>EWG</th>
                      <td>{aiIngredientAnalysis.ingredient.ewg_grade || "-"}</td>
                      <th>알러젠</th>
                      <td>{aiIngredientAnalysis.ingredient.allergen_note || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <h3>제형 적용 Notes</h3>
                <ul>{aiIngredientAnalysis.formulation_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>

                <h3>안정성 검토 Notes</h3>
                <ul>{aiIngredientAnalysis.stability_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>

                <h3>국가별 규제 매칭</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>국가</th>
                      <th>규제유형</th>
                      <th>한도%</th>
                      <th>금지</th>
                      <th>경고</th>
                      <th>근거</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiIngredientAnalysis.regulation_rows.length === 0 && (
                      <tr><td colSpan={6}>현재 국가별 규제 DB 매칭 없음</td></tr>
                    )}
                    {aiIngredientAnalysis.regulation_rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.country_code} / {row.country_name}</td>
                        <td>{row.regulation_type}</td>
                        <td>{row.max_percentage}</td>
                        <td>{row.is_prohibited ? "YES" : "-"}</td>
                        <td>{row.warning_message}</td>
                        <td>{row.reference_note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>공급 가능 원료 매칭</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>원료코드</th>
                      <th>원료명</th>
                      <th>공급사</th>
                      <th>단가</th>
                      <th>MOQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiIngredientAnalysis.matched_raw_materials.length === 0 && (
                      <tr><td colSpan={5}>원료마스터 매칭 없음</td></tr>
                    )}
                    {aiIngredientAnalysis.matched_raw_materials.map((raw) => (
                      <tr key={raw.id}>
                        <td>{raw.raw_code}</td>
                        <td>{raw.raw_name}</td>
                        <td>{raw.supplier}</td>
                        <td>{Number(raw.unit_price || 0).toLocaleString()}</td>
                        <td>{Number(raw.moq || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>대체 후보 성분</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>CAS</th>
                      <th>기능</th>
                      <th>규제 Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiIngredientAnalysis.substitute_candidates.length === 0 && (
                      <tr><td colSpan={5}>대체 후보 매칭 없음</td></tr>
                    )}
                    {aiIngredientAnalysis.substitute_candidates.map((item) => (
                      <tr key={item.id}>
                        <td>{item.inci_name}</td>
                        <td>{item.korean_name}</td>
                        <td>{item.cas_no}</td>
                        <td>{item.function_ko}</td>
                        <td>{item.regulation_note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "aiFormula" && (
          <>
            <h1>AI Formula Assistant + Intelligence Engine</h1>
            <p style={{ color: "#6b7280" }}>
              연구소 실무형 AI 처방 초안 생성, 원가/규제/안정성/사용감 분석을 한 번에 수행합니다.
            </p>

            <h2>처방 조건 입력</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="제형 예: 수분크림 / 세럼 / 앰플 / 로션" value={aiFormulaType || ""} onChange={(e) => setAiFormulaType(e.target.value)} />
                <input placeholder="컨셉 예: 고보습, 저자극, 장벽, 미백" value={aiConcept || ""} onChange={(e) => setAiConcept(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="목표 원가(원/kg)" value={aiTargetCost || ""} onChange={(e) => setAiTargetCost(e.target.value)} />
                <input placeholder="판매 국가 예: KR,EU,CN,US,JP,ASEAN" value={aiTargetCountries || ""} onChange={(e) => setAiTargetCountries(e.target.value)} />
              </div>

              <input placeholder="필수 원료/성분 예: Niacinamide, Ceramide" value={aiRequiredIngredients || ""} onChange={(e) => setAiRequiredIngredients(e.target.value)} />
              <input placeholder="제외 원료/성분 예: Phenoxyethanol, Retinol" value={aiAvoidIngredients || ""} onChange={(e) => setAiAvoidIngredients(e.target.value)} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="저장할 처방코드 미입력 시 자동 생성" value={aiDraftCode || ""} onChange={(e) => setAiDraftCode(e.target.value)} />
                <input placeholder="저장할 처방명 미입력 시 자동 생성" value={aiDraftName || ""} onChange={(e) => setAiDraftName(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={generateAiFormula}>AI 처방 초안 + Intelligence 분석</button>
                <button onClick={createFormulaFromAiDraft} style={{ background: "#059669" }}>초안을 처방관리로 저장</button>
              </div>
            </div>

            {aiResult && (
              <>
                <h2>AI 처방 초안 결과</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={cardStyle}><strong>제형</strong><div>{aiResult.formula_type}</div></div>
                  <div style={cardStyle}><strong>컨셉</strong><div>{aiResult.concept}</div></div>
                  <div style={cardStyle}><strong>Total</strong><div>{aiResult.total_percent.toFixed(4)}%</div></div>
                  <div style={cardStyle}><strong>예상 원료원가</strong><div>{aiResult.estimated_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}원/kg</div></div>
                  <div style={cardStyle}><strong>목표 pH</strong><div>{aiResult.target_ph}</div></div>
                  <div style={cardStyle}><strong>목표 점도</strong><div>{aiResult.target_viscosity}</div></div>
                </div>

                {aiIntelligence && (
                  <>
                    <h2>AI Formula Intelligence</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={cardStyle}><strong>보습력</strong><div>{aiIntelligence.moisture_score}/100</div></div>
                      <div style={cardStyle}><strong>진정</strong><div>{aiIntelligence.soothing_score}/100</div></div>
                      <div style={cardStyle}><strong>원가</strong><div>{aiIntelligence.cost_score}/100</div></div>
                      <div style={cardStyle}><strong>규제</strong><div>{aiIntelligence.regulation_score}/100</div></div>
                      <div style={cardStyle}><strong>안정성</strong><div>{aiIntelligence.stability_score}/100</div></div>
                    </div>

                    <h3>Phase Balance</h3>
                    <table style={tableStyle}>
                      <tbody>
                        {Object.entries(aiIntelligence.phase_balance).map(([phase, percent]) => (
                          <tr key={phase}>
                            <th>{phase}</th>
                            <td>{Number(percent).toFixed(4)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h3>예상 문제점</h3>
                    <ul>{aiIntelligence.problem_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>

                    <h3>원가 절감 검토</h3>
                    <ul>{aiIntelligence.cost_saving_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>

                    <h3>국가별 규제 요약</h3>
                    <ul>{aiIntelligence.regulation_summary.map((note, index) => <li key={index}>{note}</li>)}</ul>
                  </>
                )}

                <h2>추천 원료 구성</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>목적</th>
                      <th>추천%</th>
                      <th>권장범위</th>
                      <th>매칭 원료</th>
                      <th>단가</th>
                      <th>원가</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResult.suggestions.map((item, index) => (
                      <tr key={`${item.inci_name}-${index}`}>
                        <td>{item.phase}</td>
                        <td>{item.inci_name}</td>
                        <td>{item.korean_name}</td>
                        <td>{item.purpose}</td>
                        <td style={{ fontWeight: "bold" }}>{item.recommended_percent.toFixed(4)}</td>
                        <td>{item.min_percent} ~ {item.max_percent}</td>
                        <td style={{ color: item.raw_material_id ? "green" : "red", fontWeight: "bold" }}>{item.raw_material_name || "원료 매칭 필요"}</td>
                        <td>{Number(item.unit_price || 0).toLocaleString()}</td>
                        <td>{Number(item.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td>{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "formula" && (
          <>
            <h1>처방관리</h1>
            <p style={{ color: "#6b7280" }}>
              처방을 검색하고 선택하면 기본정보, 원료목록, 원가/검증, 전성분을 탭으로 확인할 수 있습니다.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>
              <div style={cardStyle}>
                <h2>처방 등록</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  <input placeholder="처방코드 예: FC-001" value={formulaCode || ""} onChange={(e) => setFormulaCode(e.target.value)} />
                  <input placeholder="처방명 예: 립패치" value={formulaName || ""} onChange={(e) => setFormulaName(e.target.value)} />
                  <input placeholder="버전 예: 1.0" value={formulaVersion || ""} onChange={(e) => setFormulaVersion(e.target.value)} />
                  <input placeholder="목표원가(원/kg) 예: 500" value={formulaTargetCost || ""} onChange={(e) => setFormulaTargetCost(e.target.value)} />
                  <input placeholder="공급가(원/kg) 예: 3000" value={formulaSellingPrice || ""} onChange={(e) => setFormulaSellingPrice(e.target.value)} />
                  <button onClick={addFormula}>처방 저장</button>
                </div>

                <h2 style={{ marginTop: "24px" }}>처방 검색</h2>
                <input
                  placeholder="처방코드 / 처방명 / 버전 검색"
                  value={formulaSearch || ""}
                  onChange={(e) => setFormulaSearch(e.target.value)}
                />

                <div style={{ marginTop: "12px", display: "grid", gap: "8px", maxHeight: "520px", overflowY: "auto" }}>
                  {getFilteredFormulas().map((formula) => {
                    const total = getFormulaTotal(formula.id);
                    const isSelected = selectedFormulaId === formula.id;

                    return (
                      <button
                        key={formula.id}
                        onClick={() => {
                          setSelectedFormulaId(formula.id);
                          setFormulaId(formula.id);
                        }}
                        style={{
                          textAlign: "left",
                          background: isSelected ? "#2563eb" : "white",
                          color: isSelected ? "white" : "#111827",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>
                          {formula.formula_code} - {formula.formula_name}
                        </div>
                        <div style={{ fontSize: "13px", opacity: 0.85 }}>
                          v{formula.version} / Rev.{formula.revision_no || 1} / TOTAL {total.toFixed(2)}% / {formula.is_locked ? "LOCKED" : "EDITABLE"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={cardStyle}>
                {!getSelectedFormula() && (
                  <p style={{ color: "#6b7280" }}>왼쪽에서 처방을 선택하세요.</p>
                )}

                {getSelectedFormula() && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
                      <div>
                        <h2 style={{ marginBottom: "4px" }}>
                          {getSelectedFormula()?.formula_code} - {getSelectedFormula()?.formula_name}
                        </h2>
                        <p style={{ color: "#6b7280", marginTop: 0 }}>
                          Version {getSelectedFormula()?.version} / Revision {getSelectedFormula()?.revision_no || 1}
                        </p>
                      </div>

                      <div>
                        <button onClick={() => getSelectedFormula() && updateFormulaBasic(getSelectedFormula()!)}>수정</button>
                        <button
                          onClick={() => getSelectedFormula() && cloneFormulaWithMode(getSelectedFormula()!, "minor")}
                          style={{ background: "#059669" }}
                        >
                          Minor 생성
                        </button>
                        <button
                          onClick={() => getSelectedFormula() && cloneFormulaWithMode(getSelectedFormula()!, "major")}
                          style={{ background: "#0ea5e9" }}
                        >
                          Major 생성
                        </button>
                        {getSelectedFormula()?.is_locked ? (
                          <button
                            onClick={() => getSelectedFormula() && unlockFormula(getSelectedFormula()!.id)}
                            style={{ background: "#7c3aed" }}
                          >
                            잠금해제
                          </button>
                        ) : (
                          <button
                            onClick={() => getSelectedFormula() && loadFormulaSignatureToForm(getSelectedFormula()!.id)}
                            style={{ background: "#059669" }}
                          >
                            승인잠금
                          </button>
                        )}

                        <button
                          onClick={() => getSelectedFormula() && deleteFormulaBasic(getSelectedFormula()!)}
                          style={{ background: "#dc2626" }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
                      {[
                        ["basic", "기본정보"],
                        ["items", "원료목록"],
                        ["cost", "원가/검증"],
                        ["il", "전성분"],
                        ["version", "버전관리"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFormulaTab(key)}
                          style={{
                            background: formulaTab === key ? "#2563eb" : "#6b7280",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {formulaTab === "basic" && (
                      <table style={tableStyle}>
                        <tbody>
                          <tr>
                            <th>처방코드</th>
                            <td>{getSelectedFormula()?.formula_code}</td>
                            <th>처방명</th>
                            <td>{getSelectedFormula()?.formula_name}</td>
                          </tr>
                          <tr>
                            <th>버전</th>
                            <td>{getSelectedFormula()?.version}</td>
                            <th>Revision No.</th>
                            <td>{getSelectedFormula()?.revision_no || 1}</td>
                          </tr>
                          <tr>
                            <th>TOTAL</th>
                            <td>{getFormulaTotal(selectedFormulaId).toFixed(4)}%</td>
                            <th>상태</th>
                            <td style={{ color: Math.abs(getFormulaTotal(selectedFormulaId) - 100) < 0.0001 ? "green" : "red", fontWeight: "bold" }}>
                              {Math.abs(getFormulaTotal(selectedFormulaId) - 100) < 0.0001 ? "TOTAL 100% 완료" : "TOTAL 100% 아님"}
                            </td>
                          </tr>
                          <tr>
                            <th>잠금 상태</th>
                            <td style={{ color: getSelectedFormula()?.is_locked ? "red" : "green", fontWeight: "bold" }}>
                              {getSelectedFormula()?.is_locked ? "LOCKED" : "EDITABLE"}
                            </td>
                            <th>승인자</th>
                            <td>{getSelectedFormula()?.approved_by || "-"}</td>
                          </tr>
                          <tr>
                            <th>잠금일</th>
                            <td>{getSelectedFormula()?.locked_at ? new Date(getSelectedFormula()?.locked_at || "").toLocaleString() : "-"}</td>
                            <th>잠금 사유</th>
                            <td>{getSelectedFormula()?.lock_reason || "-"}</td>
                          </tr>
                          <tr>
                            <th>Revision Note</th>
                            <td colSpan={3}>{getSelectedFormula()?.revision_note || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {formulaTab === "version" && (
                      <>
                        <h2>Formula Version Control</h2>
                        <p style={{ color: "#6b7280" }}>
                          동일 처방코드 기준으로 Version Tree, Revision Note, 처방 비교를 관리합니다.
                        </p>

                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                          <button onClick={() => getSelectedFormula() && cloneFormulaWithMode(getSelectedFormula()!, "minor")}>
                            Minor Revision 생성
                          </button>
                          <button onClick={() => getSelectedFormula() && cloneFormulaWithMode(getSelectedFormula()!, "major")} style={{ background: "#0ea5e9" }}>
                            Major Version 생성
                          </button>
                        </div>

                        <h3>Version Tree</h3>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th>선택</th>
                              <th>처방코드</th>
                              <th>처방명</th>
                              <th>Version</th>
                              <th>Revision No.</th>
                              <th>Parent</th>
                              <th>LOCK</th>
                              <th>Revision Note</th>
                              <th>TOTAL</th>
                              <th>원가</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFormulaFamily(getSelectedFormula()).map((formula) => (
                              <tr key={formula.id}>
                                <td>
                                  <button
                                    onClick={() => {
                                      setSelectedFormulaId(formula.id);
                                      setFormulaId(formula.id);
                                    }}
                                    style={{ background: selectedFormulaId === formula.id ? "#2563eb" : "#6b7280" }}
                                  >
                                    선택
                                  </button>
                                </td>
                                <td>{formula.formula_code}</td>
                                <td>{formula.formula_name}</td>
                                <td style={{ fontWeight: "bold" }}>v{formula.version}</td>
                                <td>{formula.revision_no || 1}</td>
                                <td>{formula.parent_formula_id ? "있음" : "Root"}</td>
                                <td style={{ color: formula.is_locked ? "red" : "green", fontWeight: "bold" }}>
                                  {formula.is_locked ? "LOCKED" : "EDITABLE"}
                                </td>
                                <td>{formula.revision_note || "-"}</td>
                                <td>{getFormulaTotal(formula.id).toFixed(4)}%</td>
                                <td>{getFormulaCost(formula.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <h3>Version Compare</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "760px", marginBottom: "16px" }}>
                          <select value={compareFormulaIdA || ""} onChange={(e) => setCompareFormulaIdA(e.target.value)}>
                            <option value="">비교 기준 Version A</option>
                            {getFormulaFamily(getSelectedFormula()).map((formula) => (
                              <option key={formula.id} value={formula.id}>
                                v{formula.version} / Rev.{formula.revision_no || 1} / {formula.revision_note || "-"}
                              </option>
                            ))}
                          </select>

                          <select value={compareFormulaIdB || ""} onChange={(e) => setCompareFormulaIdB(e.target.value)}>
                            <option value="">비교 대상 Version B</option>
                            {getFormulaFamily(getSelectedFormula()).map((formula) => (
                              <option key={formula.id} value={formula.id}>
                                v{formula.version} / Rev.{formula.revision_no || 1} / {formula.revision_note || "-"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {compareFormulaIdA && compareFormulaIdB && (
                          <table style={tableStyle}>
                            <thead>
                              <tr>
                                <th>상태</th>
                                <th>원료코드</th>
                                <th>원료명</th>
                                <th>Phase A</th>
                                <th>Phase B</th>
                                <th>A 투입량(%)</th>
                                <th>B 투입량(%)</th>
                                <th>차이</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getFormulaCompareRows(compareFormulaIdA, compareFormulaIdB).map((row, index) => (
                                <tr key={`${row.raw_code}-${index}`}>
                                  <td style={{ fontWeight: "bold", color: row.status === "동일" ? "green" : row.status === "삭제" ? "red" : "#d97706" }}>
                                    {row.status}
                                  </td>
                                  <td>{row.raw_code}</td>
                                  <td>{row.raw_name}</td>
                                  <td>{row.phase_a}</td>
                                  <td>{row.phase_b}</td>
                                  <td>{row.percent_a.toFixed(6)}</td>
                                  <td>{row.percent_b.toFixed(6)}</td>
                                  <td style={{ color: Math.abs(row.diff) > 0.000001 ? "#d97706" : "green", fontWeight: "bold" }}>
                                    {row.diff.toFixed(6)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {formulaTab === "items" && (
                      <>
                        <h3>처방 원료 등록</h3>
                        <div style={{ display: "grid", gap: "10px", marginBottom: "20px", maxWidth: "600px" }}>
                          <select value={formulaId || selectedFormulaId || ""} onChange={(e) => setFormulaId(e.target.value)}>
                            <option value="">처방 선택</option>
                            {formulas.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.formula_code} - {f.formula_name} v{f.version}
                              </option>
                            ))}
                          </select>

                          <select value={formulaRawMaterialId || ""} onChange={(e) => setFormulaRawMaterialId(e.target.value)}>
                            <option value="">원료 선택</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.raw_code} - {m.raw_name}
                              </option>
                            ))}
                          </select>

                          <select value={formulaItemPhase || "Phase A"} onChange={(e) => setFormulaItemPhase(e.target.value)}>
                            <option value="Phase A">Phase A</option>
                            <option value="Phase B">Phase B</option>
                            <option value="Phase C">Phase C</option>
                            <option value="Phase D">Phase D</option>
                            <option value="Phase E">Phase E</option>
                            <option value="Phase F">Phase F</option>
                            <option value="Phase G">Phase G</option>
                            <option value="Phase H">Phase H</option>
                            <option value="미지정">미지정</option>
                          </select>

                          <input placeholder="투입량(%) 예: 5" value={formulaItemPercentage || ""} onChange={(e) => setFormulaItemPercentage(e.target.value)} />
                          <input placeholder="비고 예: 70℃ 투입" value={formulaItemRemark || ""} onChange={(e) => setFormulaItemRemark(e.target.value)} />
                          <button onClick={addFormulaItem}>처방 원료 저장</button>
                          <p style={{ color: "#6b7280", fontSize: "13px" }}>
                            저장된 원료는 아래 목록의 수정 버튼으로 Phase, 투입량, 비고를 변경할 수 있습니다.
                          </p>
                        </div>

                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th>Phase</th>
                              <th>원료코드</th>
                              <th>원료명</th>
                              <th>투입량(%)</th>
                              <th>단가(원/kg)</th>
                              <th>원가(원/kg)</th>
                              <th>비고</th>
                              <th>관리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFormulaItemsByFormula(selectedFormulaId).map((item) => (
                              <tr key={item.id}>
                                <td>{item.phase}</td>
                                <td>{item.raw_materials?.raw_code}</td>
                                <td>{item.raw_materials?.raw_name}</td>
                                <td>{Number(item.percentage || 0).toFixed(4)}</td>
                                <td>{Number(item.raw_materials?.unit_price || 0).toLocaleString()}</td>
                                <td>{((Number(item.raw_materials?.unit_price || 0) * Number(item.percentage || 0)) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td>{item.remark}</td>
                                <td>
                                  <button onClick={() => updateFormulaItem(item)}>수정</button>
                                  <button onClick={() => deleteFormulaItem(item)} style={{ background: "#dc2626" }}>삭제</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {formulaTab === "cost" && (
                      <table style={tableStyle}>
                        <tbody>
                          <tr>
                            <th>예상원가(원/kg)</th>
                            <td>{getFormulaCost(selectedFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <th>목표원가(원/kg)</th>
                            <td>{Number(getSelectedFormula()?.target_cost || 0).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <th>차이(원/kg)</th>
                            <td style={{ color: getCostGap(selectedFormulaId) >= 0 ? "green" : "red", fontWeight: "bold" }}>
                              {getCostGap(selectedFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <th>공급가(원/kg)</th>
                            <td>{Number(getSelectedFormula()?.selling_price || 0).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <th>마진율</th>
                            <td>{getMarginRate(selectedFormulaId).toFixed(2)}%</td>
                            <th>전성분 생성</th>
                            <td>{calculateBreakdown(selectedFormulaId).length > 0 ? "가능" : "검토 필요"}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {formulaTab === "il" && (
                      <>
                        <h3>Breakdown IL</h3>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th>INCI</th>
                              <th>국문명</th>
                              <th>CAS No.</th>
                              <th>최종함량(%)</th>
                              <th>기능</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedBreakdownByFormula(selectedFormulaId).map((item) => (
                              <tr key={item.inci_name}>
                                <td>{item.inci_name}</td>
                                <td>{item.korean_name}</td>
                                <td>{item.cas_no}</td>
                                <td>{item.final_percentage.toFixed(6)}</td>
                                <td>{item.function_ko}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <h3>전성분 문구</h3>
                        <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "16px", background: "#fff" }}>
                          {getSortedBreakdownByFormula(selectedFormulaId)
                            .map((item) => item.korean_name || item.inci_name)
                            .join(", ") || "전성분 생성 데이터가 없습니다."}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {menu === "validation" && (
          <>
            <h1>처방검증</h1>
            <p>처방 TOTAL, 원료조성 등록 여부, 전성분 생성 가능 여부, IECIC/COSMOS/VEGAN 상태를 자동 점검합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px", marginBottom: "20px" }}>
              <select value={validationFormulaId || ""} onChange={(e) => setValidationFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>
            </div>

            {validationFormulaId && (
              <>
                <h2>검증 요약</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(validationFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(validationFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>TOTAL</th>
                      <td>{getFormulaValidation(validationFormulaId).total.toFixed(4)}%</td>
                      <th>상태</th>
                      <td style={{ color: getFormulaValidation(validationFormulaId).totalOk ? "green" : "red", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).totalOk ? "TOTAL 100% 완료" : "TOTAL 100% 아님"}
                      </td>
                    </tr>
                    <tr>
                      <th>원료조성표</th>
                      <td colSpan={3} style={{ color: getFormulaValidation(validationFormulaId).compositionOk ? "green" : "red", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).compositionOk ? "모든 원료 조성 등록 완료" : "원료조성 미등록 원료 존재"}
                      </td>
                    </tr>
                    <tr>
                      <th>전성분 생성</th>
                      <td colSpan={3} style={{ color: getFormulaValidation(validationFormulaId).ilOk ? "green" : "red", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).ilOk ? "생성 가능" : "검토 필요"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h2>전성분 엔진 검증</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>엔진 상태</th>
                      <td
                        style={{
                          color: getIngredientEngineValidation(validationFormulaId).engineOk ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {getIngredientEngineValidation(validationFormulaId).engineOk ? "전성분 생성 가능" : "검토 필요"}
                      </td>
                      <th>Breakdown 성분 수</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).breakdown.length}</td>
                    </tr>
                    <tr>
                      <th>원료조성 합계 오류</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).incompleteCompositionItems.length}</td>
                      <th>INCI 누락</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).missingInciItems.length}</td>
                    </tr>
                    <tr>
                      <th>국문명 누락</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).missingKoreanNameItems.length}</td>
                      <th>CAS No. 누락</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).missingCasItems.length}</td>
                    </tr>
                    <tr>
                      <th>EC No. 누락</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).missingEcItems.length}</td>
                      <th>통합 성분 Master 미등록</th>
                      <td>{getIngredientEngineValidation(validationFormulaId).missingGlobalMasterItems.length}</td>
                    </tr>
                  </tbody>
                </table>

                <h2>규제검증 요약</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>위험</th>
                      <td style={{ color: "red", fontWeight: "bold" }}>{getRegulationSummary(validationFormulaId).dangerCount}</td>
                      <th>주의</th>
                      <td style={{ color: "#d97706", fontWeight: "bold" }}>{getRegulationSummary(validationFormulaId).cautionCount}</td>
                    </tr>
                    <tr>
                      <th>정보</th>
                      <td>{getRegulationSummary(validationFormulaId).infoCount}</td>
                      <th>상태</th>
                      <td
                        style={{
                          color: getRegulationSummary(validationFormulaId).pass ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {getRegulationSummary(validationFormulaId).pass ? "위험 항목 없음" : "위험 항목 있음"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h2>원료조성 합계 오류</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>원료코드</th>
                      <th>원료명</th>
                      <th>구성비 합계(%)</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getIngredientEngineValidation(validationFormulaId).incompleteCompositionItems.map((row) => (
                      <tr key={row.item.id}>
                        <td>{row.item.raw_materials?.raw_code}</td>
                        <td>{row.item.raw_materials?.raw_name}</td>
                        <td>{row.sum.toFixed(4)}</td>
                        <td style={{ color: "red", fontWeight: "bold" }}>100% 아님</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>원료조성 미등록 원료</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>원료코드</th>
                      <th>원료명</th>
                      <th>투입량(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFormulaValidation(validationFormulaId).missingCompositionItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.raw_materials?.raw_code}</td>
                        <td>{item.raw_materials?.raw_name}</td>
                        <td>{item.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>성분 규제/인증 점검</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>결과</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>IECIC</td>
                      <td style={{ color: getFormulaValidation(validationFormulaId).iecicWarnings.length === 0 ? "green" : "orange", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).iecicWarnings.length === 0 ? "이상 없음" : "검토 필요"}
                      </td>
                      <td>{getFormulaValidation(validationFormulaId).iecicWarnings.map((i) => i.inci_name).join(", ") || "-"}</td>
                    </tr>
                    <tr>
                      <td>COSMOS</td>
                      <td style={{ color: getFormulaValidation(validationFormulaId).cosmosWarnings.length === 0 ? "green" : "orange", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).cosmosWarnings.length === 0 ? "이상 없음" : "검토 필요"}
                      </td>
                      <td>{getFormulaValidation(validationFormulaId).cosmosWarnings.map((i) => i.inci_name).join(", ") || "-"}</td>
                    </tr>
                    <tr>
                      <td>VEGAN</td>
                      <td style={{ color: getFormulaValidation(validationFormulaId).veganWarnings.length === 0 ? "green" : "orange", fontWeight: "bold" }}>
                        {getFormulaValidation(validationFormulaId).veganWarnings.length === 0 ? "이상 없음" : "검토 필요"}
                      </td>
                      <td>{getFormulaValidation(validationFormulaId).veganWarnings.map((i) => i.inci_name).join(", ") || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <h2>Breakdown 기준 성분 목록</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>최종함량(%)</th>
                      <th>CAS No.</th>
                      <th>기능</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFormulaValidation(validationFormulaId).breakdown.map((item) => (
                      <tr key={item.inci_name}>
                        <td>{item.inci_name}</td>
                        <td>{item.korean_name}</td>
                        <td>{item.final_percentage.toFixed(6)}</td>
                        <td>{item.cas_no}</td>
                        <td>{item.function_ko}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "regulation" && (
          <>
            <h1>규제검증 엔진</h1>
            <p>
              Breakdown 최종함량을 기준으로 배합한도, INCI/CAS 누락, IECIC/COSMOS/VEGAN 상태와 규제 메모를 자동 점검합니다.
            </p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "600px", marginBottom: "20px" }}>
              <select value={regulationFormulaId || ""} onChange={(e) => setRegulationFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <button onClick={downloadRegulationWarnings}>규제검증 CSV 다운로드</button>
            </div>

            {regulationFormulaId && (
              <>
                <h2>검증 요약</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(regulationFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(regulationFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>검증 상태</th>
                      <td
                        style={{
                          color: getRegulationSummary(regulationFormulaId).pass ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {getRegulationSummary(regulationFormulaId).pass ? "위험 항목 없음" : "위험 항목 있음"}
                      </td>
                      <th>Breakdown 성분 수</th>
                      <td>{calculateBreakdown(regulationFormulaId).length}</td>
                    </tr>
                    <tr>
                      <th>위험</th>
                      <td style={{ color: "red", fontWeight: "bold" }}>{getRegulationSummary(regulationFormulaId).dangerCount}</td>
                      <th>주의</th>
                      <td style={{ color: "#d97706", fontWeight: "bold" }}>{getRegulationSummary(regulationFormulaId).cautionCount}</td>
                    </tr>
                    <tr>
                      <th>정보</th>
                      <td>{getRegulationSummary(regulationFormulaId).infoCount}</td>
                      <th>정렬 기준</th>
                      <td>Breakdown 최종함량 내림차순</td>
                    </tr>
                  </tbody>
                </table>

                <h2>자동 경고 목록</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>등급</th>
                      <th>구분</th>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>최종함량(%)</th>
                      <th>기준</th>
                      <th>메시지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRegulationWarnings(regulationFormulaId).map((warning, index) => (
                      <tr key={`${warning.category}-${warning.inci_name}-${index}`}>
                        <td
                          style={{
                            color: warning.level === "위험" ? "red" : warning.level === "주의" ? "#d97706" : "#2563eb",
                            fontWeight: "bold",
                          }}
                        >
                          {warning.level}
                        </td>
                        <td>{warning.category}</td>
                        <td>{warning.inci_name}</td>
                        <td>{warning.korean_name}</td>
                        <td>{warning.final_percentage.toFixed(6)}</td>
                        <td>{warning.standard}</td>
                        <td>{warning.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>검증 기준 안내</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>배합한도</th>
                      <td>성분관리의 배합한도 또는 규제사항에 입력된 숫자 %를 기준으로 최종함량 초과 여부를 점검합니다.</td>
                    </tr>
                    <tr>
                      <th>IECIC/COSMOS/VEGAN</th>
                      <td>성분관리의 상태값에 Not, Unlisted, 불가, 미등재 등이 포함되면 주의로 표시합니다.</td>
                    </tr>
                    <tr>
                      <th>향료/색소 정렬</th>
                      <td>별도 후순위 처리하지 않고 Breakdown 최종함량 기준으로 정렬합니다.</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "regUpdate" && (
          <>
            <h1>Regulation Update Center</h1>
            <p>
              공식/공신력 자료를 CSV로 정리해 업로드하면 기존 국가별 규제 DB와 비교하여 신규/변경/동일 항목을 자동 감지합니다.
            </p>

            <h2>1순위 공식자료 업데이트 소스</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>지역</th>
                  <th>권장 소스</th>
                  <th>PLM 처리 방식</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EU</td>
                  <td>European Commission CosIng / Cosmetics Regulation 1223/2009</td>
                  <td>CSV 정리 후 INCI/CAS 기준 Import</td>
                </tr>
                <tr>
                  <td>US</td>
                  <td>FDA Prohibited & Restricted Ingredients</td>
                  <td>제한/금지 성분 CSV 정리 후 Import</td>
                </tr>
                <tr>
                  <td>ASEAN</td>
                  <td>ASEAN Cosmetic Directive Annexes</td>
                  <td>Annex II/III/VI 등 CSV 정리 후 Import</td>
                </tr>
                <tr>
                  <td>China</td>
                  <td>NMPA IECIC / 고시 자료</td>
                  <td>IECIC 여부 및 제한/금지 업데이트</td>
                </tr>
                <tr>
                  <td>Japan</td>
                  <td>일본 화장품 기준/성분 고시</td>
                  <td>제한/금지/주의 성분 CSV 정리 후 Import</td>
                </tr>
              </tbody>
            </table>

            <h2>v25.0 공식자료 Auto Update Engine</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "24px" }}>
              <p style={{ color: "#6b7280" }}>
                공식 사이트의 표/PDF 내용을 복사해 붙여넣으면 INCI, CAS, 금지/제한/한도 정보를 1차 자동 추출합니다.
                추출 결과는 반드시 RA 검토 후 PLM에 반영하세요.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  placeholder="국가코드 예: EU, US, CN, JP, ASEAN"
                  value={regAutoCountryCode || ""}
                  onChange={(e) => setRegAutoCountryCode(e.target.value.toUpperCase())}
                />
                <input
                  placeholder="국가명 예: European Union"
                  value={regAutoCountryName || ""}
                  onChange={(e) => setRegAutoCountryName(e.target.value)}
                />
              </div>

              <textarea
                placeholder={`공식자료 텍스트 붙여넣기 예:\nSalicylic Acid CAS 69-72-7 Restricted max 2% Annex III\nHydroquinone CAS 123-31-9 Prohibited Annex II`}
                value={regOfficialText || ""}
                onChange={(e) => setRegOfficialText(e.target.value)}
                rows={8}
              />

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={regAutoReviewOnly}
                  onChange={(e) => setRegAutoReviewOnly(e.target.checked)}
                />
                RA 검토용으로만 사용하고, 검토 후 신규/변경사항 PLM 반영 버튼으로 반영
              </label>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={parseOfficialTextToRegulationRows} style={{ background: "#7c3aed" }}>
                  공식자료 텍스트 AI 추출
                </button>
                <button onClick={downloadOfficialSourceWorklistCsv} style={{ background: "#0ea5e9" }}>
                  공식자료 월간 체크리스트 다운로드
                </button>
              </div>

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>{regAutoParseStatus}</p>
            </div>

            <h2>공식자료 업로드 / 변경감지</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "24px" }}>
              <input
                placeholder="자료명 예: EU CosIng Annex Update 2026-06"
                value={regUpdateSourceName || ""}
                onChange={(e) => setRegUpdateSourceName(e.target.value)}
              />

              <input
                placeholder="공식자료 URL 또는 내부 근거 링크"
                value={regUpdateSourceUrl || ""}
                onChange={(e) => setRegUpdateSourceUrl(e.target.value)}
              />

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={downloadOfficialRegulationUpdateTemplate}>
                  업로드 CSV 양식 다운로드
                </button>
                <button onClick={applyRegulationUpdates} style={{ background: "#059669" }}>
                  신규/변경사항 PLM 반영
                </button>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    previewRegulationUpdateCsv(file);
                    e.target.value = "";
                  }
                }}
              />

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>{regUpdateStatus}</p>
            </div>

            <h2>변경감지 결과</h2>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {["ALL", "NEW", "UPDATE", "NO_CHANGE"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRegUpdateFilter(filter)}
                  style={{ background: regUpdateFilter === filter ? "#2563eb" : "#6b7280" }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>국가</th>
                  <th>INCI</th>
                  <th>CAS</th>
                  <th>규제유형</th>
                  <th>한도(%)</th>
                  <th>금지</th>
                  <th>경고</th>
                  <th>근거</th>
                  <th>신뢰도</th>
                  <th>원문</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRegUpdateRows().map((row, index) => (
                  <tr key={`${row.country_code}-${row.inci_name}-${row.cas_no}-${index}`}>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: row.update_type === "NEW" ? "green" : row.update_type === "UPDATE" ? "#d97706" : "#6b7280",
                      }}
                    >
                      {row.update_type}
                    </td>
                    <td>{row.country_code} / {row.country_name}</td>
                    <td>{row.inci_name}</td>
                    <td>{row.cas_no}</td>
                    <td>{row.regulation_type}</td>
                    <td>{row.max_percentage}</td>
                    <td>{row.is_prohibited ? "YES" : "-"}</td>
                    <td>{row.warning_message}</td>
                    <td>{row.reference_note}</td>
                    <td>{row.confidence ? `${row.confidence}%` : "-"}</td>
                    <td style={{ maxWidth: "360px", whiteSpace: "pre-wrap" }}>{row.raw_text || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "globalRegulation" && (
          <>
            <h1>Global Regulation Engine</h1>
            <p>
              국가별 성분 규제 DB를 기준으로 처방의 Breakdown 최종함량을 검증합니다. KR/EU/CN/US/JP/ASEAN 등 국가별 판매 가능성을 확인할 수 있습니다.
            </p>

            <h2>Global Regulation Seed DB</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "760px", marginBottom: "24px" }}>
              <p style={{ color: "#6b7280" }}>
                EU, 중국, 일본, 미국, ASEAN 기준의 주요 제한/금지/주의 성분 초기 규제 마스터를 CSV로 업로드합니다.
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={downloadRegulationSeedCsv} style={{ background: "#7c3aed" }}>
                  규제 Seed CSV 다운로드
                </button>
                <button onClick={exportCountryRegulationsCsv} style={{ background: "#059669" }}>
                  현재 규제 DB 내보내기
                </button>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    importRegulationSeedCsv(file);
                    e.target.value = "";
                  }
                }}
              />

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>{regSeedStatus}</p>
              <p>현재 규제 DB: {countryRegulations.length}개</p>
            </div>

            <h2>국가별 규제 기준 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "720px", marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="국가코드 예: EU" value={countryCodeInput || ""} onChange={(e) => setCountryCodeInput(e.target.value)} />
                <input placeholder="국가명 예: European Union" value={countryNameInput || ""} onChange={(e) => setCountryNameInput(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="INCI 예: Salicylic Acid" value={regInciInput || ""} onChange={(e) => setRegInciInput(e.target.value)} />
                <input placeholder="CAS No. 예: 69-72-7" value={regCasInput || ""} onChange={(e) => setRegCasInput(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <select value={regTypeInput || ""} onChange={(e) => setRegTypeInput(e.target.value)}>
                  <option value="Restricted">Restricted</option>
                  <option value="Prohibited">Prohibited</option>
                  <option value="Warning">Warning</option>
                  <option value="Positive List">Positive List</option>
                </select>

                <input placeholder="허용한도(%) 예: 2" value={regMaxInput || ""} onChange={(e) => setRegMaxInput(e.target.value)} />

                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={regProhibitedInput} onChange={(e) => setRegProhibitedInput(e.target.checked)} />
                  금지성분
                </label>
              </div>

              <input placeholder="경고 메시지" value={regWarningInput || ""} onChange={(e) => setRegWarningInput(e.target.value)} />
              <input placeholder="Reference 예: EU 1223/2009 Annex III" value={regReferenceInput || ""} onChange={(e) => setRegReferenceInput(e.target.value)} />

              <button onClick={saveCountryRegulation}>국가별 규제 기준 저장</button>
            </div>

            <h2>국가별 처방 검증</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "720px", marginBottom: "24px" }}>
              <select value={globalRegFormulaId || ""} onChange={(e) => setGlobalRegFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {getAvailableCountryCodes().map((countryCode) => (
                  <label key={countryCode} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedCountryCodes.includes(countryCode)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCountryCodes(Array.from(new Set([...selectedCountryCodes, countryCode])));
                        } else {
                          setSelectedCountryCodes(selectedCountryCodes.filter((item) => item !== countryCode));
                        }
                      }}
                    />
                    {countryCode}
                  </label>
                ))}
              </div>

              <button onClick={downloadGlobalRegulationReport}>국가별 규제검증 Report CSV 다운로드</button>
            </div>

            {globalRegFormulaId && (
              <>
                <h2>국가별 판매 가능성 요약</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>국가</th>
                      <th>국가명</th>
                      <th>점수</th>
                      <th>판정</th>
                      <th>위험</th>
                      <th>주의</th>
                      <th>정보</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGlobalRegulationSummary(globalRegFormulaId).map((row) => (
                      <tr key={row.countryCode}>
                        <td>{row.countryCode}</td>
                        <td>{row.countryName}</td>
                        <td style={{ fontWeight: "bold" }}>{row.score}</td>
                        <td style={{ color: row.pass ? "green" : "red", fontWeight: "bold" }}>
                          {row.pass ? "판매 가능 검토" : "위험 항목 존재"}
                        </td>
                        <td style={{ color: row.dangerCount > 0 ? "red" : "green", fontWeight: "bold" }}>{row.dangerCount}</td>
                        <td style={{ color: row.cautionCount > 0 ? "#d97706" : "green", fontWeight: "bold" }}>{row.cautionCount}</td>
                        <td>{row.infoCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>국가별 자동 경고 상세</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>국가</th>
                      <th>등급</th>
                      <th>규제유형</th>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>CAS No.</th>
                      <th>최종함량(%)</th>
                      <th>허용한도(%)</th>
                      <th>메시지</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAllCountryRegulationWarnings(globalRegFormulaId).map((warning, index) => (
                      <tr key={`${warning.country_code}-${warning.inci_name}-${index}`}>
                        <td>{warning.country_code}</td>
                        <td style={{ color: warning.level === "위험" ? "red" : warning.level === "주의" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>
                          {warning.level}
                        </td>
                        <td>{warning.regulation_type}</td>
                        <td>{warning.inci_name}</td>
                        <td>{warning.korean_name}</td>
                        <td>{warning.cas_no}</td>
                        <td>{warning.final_percentage.toFixed(6)}</td>
                        <td>{warning.max_percentage ?? "-"}</td>
                        <td>{warning.message}</td>
                        <td>{warning.reference_note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <h2>국가별 규제 DB 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>국가</th>
                  <th>국가명</th>
                  <th>INCI</th>
                  <th>CAS No.</th>
                  <th>유형</th>
                  <th>허용한도(%)</th>
                  <th>금지</th>
                  <th>메시지</th>
                  <th>Reference</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {countryRegulations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.country_code}</td>
                    <td>{item.country_name}</td>
                    <td>{item.inci_name}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.regulation_type}</td>
                    <td>{Number(item.max_percentage || 0)}</td>
                    <td>{item.is_prohibited ? "Y" : "N"}</td>
                    <td>{item.warning_message}</td>
                    <td>{item.reference_note}</td>
                    <td>
                      <button onClick={() => deleteCountryRegulation(item)} style={{ background: "#dc2626" }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "stability" && (
          <>
            <h1>안정도관리</h1>
            <p>프로젝트와 처방별 안정도 시험 조건, 주차별 결과, 평가항목, 최종판정을 관리합니다.</p>

            <h2>안정도 시험 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px" }}>
              <input
                placeholder="시험번호 예: ST-2026-001"
                value={stabilityTestCode || ""}
                onChange={(e) => setStabilityTestCode(e.target.value)}
              />

              <select value={stabilityProjectId || ""} onChange={(e) => setStabilityProjectId(e.target.value)}>
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </option>
                ))}
              </select>

              <select value={stabilityFormulaId || ""} onChange={(e) => setStabilityFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <select value={stabilityTestType || "가속"} onChange={(e) => setStabilityTestType(e.target.value)}>
                <option value="실온">실온</option>
                <option value="가속">가속</option>
                <option value="냉장">냉장</option>
                <option value="냉동">냉동</option>
                <option value="냉열반복">냉열반복</option>
                <option value="원심분리">원심분리</option>
              </select>

              <label>시험 시작일</label>
              <input
                type="date"
                value={stabilityStartDate || ""}
                onChange={(e) => setStabilityStartDate(e.target.value)}
              />

              <h3>주차별 결과</h3>
              <input placeholder="1주 결과" value={week1Result || ""} onChange={(e) => setWeek1Result(e.target.value)} />
              <input placeholder="2주 결과" value={week2Result || ""} onChange={(e) => setWeek2Result(e.target.value)} />
              <input placeholder="4주 결과" value={week4Result || ""} onChange={(e) => setWeek4Result(e.target.value)} />
              <input placeholder="8주 결과" value={week8Result || ""} onChange={(e) => setWeek8Result(e.target.value)} />
              <input placeholder="12주 결과" value={week12Result || ""} onChange={(e) => setWeek12Result(e.target.value)} />

              <h3>평가항목</h3>
              <input placeholder="외관 결과" value={appearanceResult || ""} onChange={(e) => setAppearanceResult(e.target.value)} />
              <input placeholder="색상 결과" value={colorResult || ""} onChange={(e) => setColorResult(e.target.value)} />
              <input placeholder="향 결과" value={odorResult || ""} onChange={(e) => setOdorResult(e.target.value)} />
              <input placeholder="점도 결과" value={viscosityResult || ""} onChange={(e) => setViscosityResult(e.target.value)} />
              <input placeholder="pH 결과" value={phResult || ""} onChange={(e) => setPhResult(e.target.value)} />
              <input placeholder="비중 결과" value={specificGravityResult || ""} onChange={(e) => setSpecificGravityResult(e.target.value)} />

              <select value={stabilityFinalResult || "진행중"} onChange={(e) => setStabilityFinalResult(e.target.value)}>
                <option value="진행중">진행중</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="보류">보류</option>
                <option value="재시험">재시험</option>
                <option value="처방수정">처방수정</option>
              </select>

              <input
                placeholder="비고"
                value={stabilityRemark || ""}
                onChange={(e) => setStabilityRemark(e.target.value)}
              />

              <button onClick={addStabilityTest}>안정도 시험 저장</button>
            </div>

            <h2>안정도 시험 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>시험번호</th>
                  <th>프로젝트</th>
                  <th>처방</th>
                  <th>시험구분</th>
                  <th>시작일</th>
                  <th>1주</th>
                  <th>2주</th>
                  <th>4주</th>
                  <th>8주</th>
                  <th>12주</th>
                  <th>외관</th>
                  <th>색상</th>
                  <th>향</th>
                  <th>점도</th>
                  <th>pH</th>
                  <th>비중</th>
                  <th>최종판정</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {stabilityTests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.test_code}</td>
                    <td>{test.projects?.project_code} / {test.projects?.project_name}</td>
                    <td>{test.formulas?.formula_code} v{test.formulas?.version}</td>
                    <td>{test.test_type}</td>
                    <td>{test.start_date || "-"}</td>
                    <td>{test.week_1_result}</td>
                    <td>{test.week_2_result}</td>
                    <td>{test.week_4_result}</td>
                    <td>{test.week_8_result}</td>
                    <td>{test.week_12_result}</td>
                    <td>{test.appearance_result}</td>
                    <td>{test.color_result}</td>
                    <td>{test.odor_result}</td>
                    <td>{test.viscosity_result}</td>
                    <td>{test.ph_result}</td>
                    <td>{test.specific_gravity_result}</td>
                    <td style={{ fontWeight: "bold", color: test.final_result === "PASS" ? "green" : test.final_result === "FAIL" ? "red" : "orange" }}>
                      {test.final_result}
                    </td>
                    <td>{test.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "approval" && (
          <>
            <h1>승인관리 Release Workflow</h1>
            <p>연구원 요청 → 선임 검토 → QA 검토 → RA 검토 → 팀장 승인 → 최종 승인 → 배포 완료 순서로 처방 승인 체계를 관리합니다.</p>

            <h2>승인 요청 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "760px" }}>
              <select value={approvalProjectId || ""} onChange={(e) => setApprovalProjectId(e.target.value)}>
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </option>
                ))}
              </select>

              <select value={approvalFormulaId || ""} onChange={(e) => setApprovalFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version} {formula.is_locked ? "(LOCKED)" : ""}
                  </option>
                ))}
              </select>

              <select value={approvalRequestType || "처방승인"} onChange={(e) => setApprovalRequestType(e.target.value)}>
                <option value="처방승인">처방승인</option>
                <option value="원가승인">원가승인</option>
                <option value="안정도승인">안정도승인</option>
                <option value="양산승인">양산승인</option>
                <option value="변경승인">변경승인</option>
                <option value="규제승인">규제승인</option>
              </select>

              <input
                placeholder="요청자 미입력 시 현재 로그인 사용자 자동 입력"
                value={approvalRequester || ""}
                onChange={(e) => setApprovalRequester(e.target.value)}
              />

              <input
                placeholder="1차 검토자 예: 선임연구원 / 팀장"
                value={approvalReviewer || ""}
                onChange={(e) => setApprovalReviewer(e.target.value)}
              />

              <textarea
                placeholder="승인 요청 내용"
                value={approvalRequestNote || ""}
                onChange={(e) => setApprovalRequestNote(e.target.value)}
                rows={4}
              />

              <button onClick={addApprovalRequest}>승인 Workflow 시작</button>
            </div>

            <h2>Workflow 단계 기준</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>1</th>
                  <td>Senior Review</td>
                  <td>선임/팀장 1차 처방 검토</td>
                </tr>
                <tr>
                  <th>2</th>
                  <td>QA Review</td>
                  <td>품질/안정도/문서 검토</td>
                </tr>
                <tr>
                  <th>3</th>
                  <td>RA Review</td>
                  <td>국가별 규제/전성분 검토</td>
                </tr>
                <tr>
                  <th>4</th>
                  <td>Manager Approval</td>
                  <td>최종 승인자 승인</td>
                </tr>
                <tr>
                  <th>5</th>
                  <td>Approved</td>
                  <td>처방 자동 LOCK 및 전자서명 기록</td>
                </tr>
                <tr>
                  <th>6</th>
                  <td>Released</td>
                  <td>고객 제출/양산 배포 가능 상태</td>
                </tr>
              </tbody>
            </table>

            <h2>승인 요청 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>요청구분</th>
                  <th>프로젝트</th>
                  <th>처방</th>
                  <th>Workflow</th>
                  <th>진행률</th>
                  <th>요청자</th>
                  <th>선임</th>
                  <th>QA</th>
                  <th>RA</th>
                  <th>최종승인</th>
                  <th>요청내용</th>
                  <th>검토의견</th>
                  <th>요청일</th>
                  <th>검토일</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.request_type}</td>
                    <td>{request.projects?.project_code} / {request.projects?.project_name}</td>
                    <td>
                      {request.formulas?.formula_code} v{request.formulas?.version}
                      <div style={{ color: request.formulas?.is_locked ? "red" : "#6b7280", fontSize: "12px" }}>
                        {request.formulas?.is_locked ? "LOCKED" : "EDITABLE"}
                      </div>
                    </td>
                    <td style={{ color: getApprovalStatusColor(request.status), fontWeight: "bold" }}>
                      {getApprovalStatusLabel(request.status)}
                    </td>
                    <td>
                      <div style={{ width: "120px", height: "10px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${getApprovalProgress(request.status)}%`,
                            height: "100%",
                            background: getApprovalStatusColor(request.status),
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "12px" }}>{getApprovalProgress(request.status)}%</div>
                    </td>
                    <td>{request.requester}</td>
                    <td>
                      {request.senior_reviewer || request.reviewer || "-"}
                      <div style={{ fontSize: "12px" }}>{request.senior_approved_at ? new Date(request.senior_approved_at).toLocaleDateString() : ""}</div>
                    </td>
                    <td>
                      {request.qa_reviewer || "-"}
                      <div style={{ fontSize: "12px" }}>{request.qa_approved_at ? new Date(request.qa_approved_at).toLocaleDateString() : ""}</div>
                    </td>
                    <td>
                      {request.ra_reviewer || "-"}
                      <div style={{ fontSize: "12px" }}>{request.ra_approved_at ? new Date(request.ra_approved_at).toLocaleDateString() : ""}</div>
                    </td>
                    <td>
                      {request.manager_approver || "-"}
                      <div style={{ fontSize: "12px" }}>{request.manager_approved_at ? new Date(request.manager_approved_at).toLocaleDateString() : ""}</div>
                    </td>
                    <td>{request.request_note}</td>
                    <td>{request.review_note}</td>
                    <td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : "-"}</td>
                    <td>{request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : "-"}</td>
                    <td>
                      {request.status !== "Rejected" && request.status !== "Released" && (
                        <button onClick={() => processNextApprovalStep(request)}>
                          {getApprovalActionLabel(request.status)}
                        </button>
                      )}
                      {request.status !== "Rejected" && request.status !== "Released" && (
                        <button onClick={() => rejectApprovalRequest(request)} style={{ background: "#dc2626" }}>
                          반려
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "lock" && (
          <>
            <h1>처방잠금 / 전자서명</h1>
            <p>승인 완료된 처방을 잠금 처리하고 작성/검토/승인자를 기록합니다. 잠금된 처방은 관리자 외 수정할 수 없습니다.</p>

            <h2>처방 승인잠금 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px", marginBottom: "24px" }}>
              <select value={lockFormulaId || ""} onChange={(e) => loadFormulaSignatureToForm(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version} {formula.is_locked ? "(LOCKED)" : ""}
                  </option>
                ))}
              </select>

              <input placeholder="작성자" value={preparedBy || ""} onChange={(e) => setPreparedBy(e.target.value)} />
              <input placeholder="검토자" value={reviewedBy || ""} onChange={(e) => setReviewedBy(e.target.value)} />
              <input placeholder="승인자" value={approvedBy || ""} onChange={(e) => setApprovedBy(e.target.value)} />
              <input placeholder="잠금 사유 예: 고객 승인 완료" value={lockReason || ""} onChange={(e) => setLockReason(e.target.value)} />

              <button onClick={lockFormula}>처방 승인잠금</button>
            </div>

            <h2>처방 잠금 현황</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>Version</th>
                  <th>상태</th>
                  <th>작성</th>
                  <th>검토</th>
                  <th>승인</th>
                  <th>승인일</th>
                  <th>잠금자</th>
                  <th>사유</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((formula) => (
                  <tr key={formula.id}>
                    <td>{formula.formula_code}</td>
                    <td>{formula.formula_name}</td>
                    <td>{formula.version}</td>
                    <td style={{ color: formula.is_locked ? "red" : "green", fontWeight: "bold" }}>
                      {formula.is_locked ? "LOCKED" : "EDITABLE"}
                    </td>
                    <td>{formula.prepared_by}</td>
                    <td>{formula.reviewed_by}</td>
                    <td>{formula.approved_by}</td>
                    <td>{formula.approved_at ? new Date(formula.approved_at).toLocaleString() : "-"}</td>
                    <td>{formula.locked_by}</td>
                    <td>{formula.lock_reason}</td>
                    <td>
                      <button onClick={() => loadFormulaSignatureToForm(formula.id)}>불러오기</button>
                      {formula.is_locked ? (
                        <button onClick={() => unlockFormula(formula.id)} style={{ background: "#7c3aed" }}>
                          잠금해제
                        </button>
                      ) : (
                        <button onClick={() => lockFormulaById(formula.id)} style={{ background: "#059669" }}>
                          잠금
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>운영 기준</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>LOCKED</th>
                  <td>처방 기본정보, 처방 원료, BOM 원가 수정이 제한됩니다. 관리자(admin)는 예외적으로 수정 가능합니다.</td>
                </tr>
                <tr>
                  <th>UNLOCK</th>
                  <td>관리자(admin)만 잠금 해제가 가능합니다. 해제 이력은 Audit Log에 기록됩니다.</td>
                </tr>
                <tr>
                  <th>전자서명</th>
                  <td>작성자, 검토자, 승인자, 승인일, 잠금자를 Formula Sheet PDF에 자동 표시합니다.</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {menu === "stage" && (
          <>
            <h1>개발일정 Stage Gate</h1>
            <p>프로젝트 단계, 예정일, 완료일, 진행률을 관리합니다.</p>

            <h2>일정 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px" }}>
              <select value={stageProjectId || ""} onChange={(e) => setStageProjectId(e.target.value)}>
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </option>
                ))}
              </select>

              <select value={stageName || "고객문의"} onChange={(e) => setStageName(e.target.value)}>
                <option value="고객문의">고객문의</option>
                <option value="프로젝트 등록">프로젝트 등록</option>
                <option value="처방개발">처방개발</option>
                <option value="샘플발송">샘플발송</option>
                <option value="고객피드백">고객피드백</option>
                <option value="안정도">안정도</option>
                <option value="승인">승인</option>
                <option value="양산">양산</option>
                <option value="출시">출시</option>
              </select>

              <select value={stageStatus || "대기"} onChange={(e) => setStageStatus(e.target.value)}>
                <option value="대기">대기</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
              </select>

              <label>예정일</label>
              <input type="date" value={plannedDate || ""} onChange={(e) => setPlannedDate(e.target.value)} />

              <label>실제 완료일</label>
              <input type="date" value={actualDate || ""} onChange={(e) => setActualDate(e.target.value)} />

              <input
                placeholder="비고"
                value={stageRemark || ""}
                onChange={(e) => setStageRemark(e.target.value)}
              />

              <button onClick={addProjectStage}>일정 저장</button>
            </div>

            <h2>프로젝트 진행률</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>프로젝트 코드</th>
                  <th>프로젝트명</th>
                  <th>고객사</th>
                  <th>진행률</th>
                  <th>현재 단계</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.project_code}</td>
                    <td>{project.project_name}</td>
                    <td>{project.customer_name}</td>
                    <td style={{ fontWeight: "bold" }}>{getProjectProgress(project.id)}%</td>
                    <td>{getCurrentProjectStage(project.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>개발일정 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>프로젝트</th>
                  <th>단계</th>
                  <th>상태</th>
                  <th>예정일</th>
                  <th>실제 완료일</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {projectStages.map((stage) => {
                  const isDelayed =
                    stage.planned_date &&
                    stage.stage_status !== "완료" &&
                    new Date(stage.planned_date) < new Date();

                  return (
                    <tr key={stage.id}>
                      <td>{stage.projects?.project_code} / {stage.projects?.project_name}</td>
                      <td>{stage.stage_name}</td>
                      <td
                        style={{
                          color:
                            stage.stage_status === "완료"
                              ? "green"
                              : stage.stage_status === "진행중"
                              ? "orange"
                              : isDelayed
                              ? "red"
                              : "#333",
                          fontWeight: "bold",
                        }}
                      >
                        {stage.stage_status}
                        {isDelayed ? " / 지연" : ""}
                      </td>
                      <td>{stage.planned_date || "-"}</td>
                      <td>{stage.actual_date || "-"}</td>
                      <td>{stage.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {menu === "cost" && (
          <>
            <h1>원가관리</h1>
            <p>처방 원료 투입량과 원료 단가를 기준으로 목표원가, 공급가, 마진을 자동 계산합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
              <select value={costFormulaId || ""} onChange={(e) => setCostFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>
            </div>

            {costFormulaId && (
              <>
                <h2>원가 요약</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(costFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(costFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>원료원가</th>
                      <td>{getFormulaCost(costFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })} 원/kg</td>
                      <th>목표원가</th>
                      <td>{Number(getFormulaById(costFormulaId)?.target_cost || 0).toLocaleString()} 원/kg</td>
                    </tr>
                    <tr>
                      <th>차이</th>
                      <td style={{ color: getCostGap(costFormulaId) >= 0 ? "green" : "red", fontWeight: "bold" }}>
                        {getCostGap(costFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })} 원/kg
                      </td>
                      <th>원가 상태</th>
                      <td style={{ color: getCostGap(costFormulaId) >= 0 ? "green" : "red", fontWeight: "bold" }}>
                        {getCostGap(costFormulaId) >= 0 ? "목표원가 이내" : "목표원가 초과"}
                      </td>
                    </tr>
                    <tr>
                      <th>공급가</th>
                      <td>{Number(getFormulaById(costFormulaId)?.selling_price || 0).toLocaleString()} 원/kg</td>
                      <th>예상마진율</th>
                      <td style={{ fontWeight: "bold" }}>{getMarginRate(costFormulaId).toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>

                <h2>원료별 원가 상세</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>원료코드</th>
                      <th>원료명</th>
                      <th>투입량(%)</th>
                      <th>단가(원/kg)</th>
                      <th>통화</th>
                      <th>MOQ(kg)</th>
                      <th>원가(원/kg)</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFormulaCostRows(costFormulaId).map((item) => (
                      <tr key={item.id}>
                        <td>{item.phase}</td>
                        <td>{item.raw_materials?.raw_code}</td>
                        <td>{item.raw_materials?.raw_name}</td>
                        <td>{item.percentage}</td>
                        <td>{item.unitPrice.toLocaleString()}</td>
                        <td>{item.raw_materials?.currency || "KRW"}</td>
                        <td>{Number(item.raw_materials?.moq || 0).toLocaleString()}</td>
                        <td>{item.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td>{item.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "bom" && (
          <>
            <h1>BOM 원가관리</h1>
            <p>원료원가에 부자재비, 충전비, 인건비, 물류비, 간접비를 반영해 최종 제조원가와 권장 공급가를 계산합니다.</p>

            <h2>BOM 원가 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px", marginBottom: "24px" }}>
              <select value={bomFormulaId || ""} onChange={(e) => setBomFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <input placeholder="부자재비(원/kg) 예: 300" value={packagingCost || ""} onChange={(e) => setPackagingCost(e.target.value)} />
              <input placeholder="충전비(원/kg) 예: 150" value={fillingCost || ""} onChange={(e) => setFillingCost(e.target.value)} />
              <input placeholder="인건비(원/kg) 예: 100" value={laborCost || ""} onChange={(e) => setLaborCost(e.target.value)} />
              <input placeholder="물류비(원/kg) 예: 80" value={logisticsCost || ""} onChange={(e) => setLogisticsCost(e.target.value)} />
              <input placeholder="간접비율(%) 예: 10" value={overheadRate || ""} onChange={(e) => setOverheadRate(e.target.value)} />
              <input placeholder="목표마진율(%) 예: 30" value={targetMarginRate || ""} onChange={(e) => setTargetMarginRate(e.target.value)} />
              <input placeholder="비고" value={bomRemark || ""} onChange={(e) => setBomRemark(e.target.value)} />

              <button onClick={saveBomCost}>BOM 원가 저장</button>
            </div>

            <h2>BOM 원가 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>Version</th>
                  <th>원료원가</th>
                  <th>부자재비</th>
                  <th>충전비</th>
                  <th>인건비</th>
                  <th>물류비</th>
                  <th>간접비율</th>
                  <th>최종 제조원가</th>
                  <th>목표마진율</th>
                  <th>권장 공급가</th>
                  <th>비고</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {bomCosts.map((bom) => {
                  const targetFormulaId = bom.formulas?.id || "";

                  return (
                    <tr key={bom.id}>
                      <td>{bom.formulas?.formula_code}</td>
                      <td>{bom.formulas?.formula_name}</td>
                      <td>{bom.formulas?.version}</td>
                      <td>{getFormulaCost(targetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>{Number(bom.packaging_cost || 0).toLocaleString()}</td>
                      <td>{Number(bom.filling_cost || 0).toLocaleString()}</td>
                      <td>{Number(bom.labor_cost || 0).toLocaleString()}</td>
                      <td>{Number(bom.logistics_cost || 0).toLocaleString()}</td>
                      <td>{Number(bom.overhead_rate || 0).toFixed(2)}%</td>
                      <td style={{ fontWeight: "bold" }}>
                        {getBomFinalCost(targetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td>{Number(bom.target_margin_rate || 0).toFixed(2)}%</td>
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>
                        {getBomSuggestedPrice(targetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td>{bom.remark}</td>
                      <td>
                        <button onClick={() => loadBomToForm(bom)}>수정</button>
                        <button onClick={() => deleteBomCost(bom)} style={{ background: "#dc2626" }}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h2>처방별 BOM 시뮬레이션</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>원료원가</th>
                  <th>BOM 등록 여부</th>
                  <th>최종 제조원가</th>
                  <th>권장 공급가</th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((formula) => (
                  <tr key={formula.id}>
                    <td>{formula.formula_code}</td>
                    <td>{formula.formula_name}</td>
                    <td>{getFormulaCost(formula.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{getBomByFormula(formula.id) ? "등록" : "미등록"}</td>
                    <td>{getBomFinalCost(formula.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{getBomSuggestedPrice(formula.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "batch" && (
          <>
            <h1>배치계산 / 제조지시서</h1>
            <p>처방 투입량(%)을 기준으로 생산량별 원료 소요량을 자동 계산합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px", marginBottom: "20px" }}>
              <select value={batchFormulaId || ""} onChange={(e) => setBatchFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>

              <input
                placeholder="생산량(kg) 예: 100"
                value={batchSize || ""}
                onChange={(e) => setBatchSize(e.target.value)}
              />

              <button onClick={printBatchSheet}>인쇄 / PDF 저장</button>
            </div>

            {batchFormulaId && (
              <div
                style={{
                  border: "1px solid #ddd",
                  padding: "32px",
                  maxWidth: "900px",
                  background: "white",
                }}
              >
                <h1 style={{ textAlign: "center" }}>BATCH MANUFACTURING SHEET</h1>

                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(batchFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(batchFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>Version</th>
                      <td>{getFormulaById(batchFormulaId)?.version}</td>
                      <th>생산량</th>
                      <td>{Number(batchSize || 0).toLocaleString()} kg</td>
                    </tr>
                  </tbody>
                </table>

                {Array.from(
                  new Set(getBatchRows(batchFormulaId, Number(batchSize || 0)).map((item) => item.phase || "미지정"))
                ).map((phase) => (
                  <div key={phase} style={{ marginBottom: "24px" }}>
                    <h2>{phase}</h2>

                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th>원료코드</th>
                          <th>원료명</th>
                          <th>투입량(%)</th>
                          <th>소요량(kg)</th>
                          <th>비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getBatchRows(batchFormulaId, Number(batchSize || 0))
                          .filter((item) => (item.phase || "미지정") === phase)
                          .map((item) => (
                            <tr key={item.id}>
                              <td>{item.raw_materials?.raw_code}</td>
                              <td>{item.raw_materials?.raw_name}</td>
                              <td>{Number(item.percentage || 0).toFixed(4)}</td>
                              <td>{item.requiredKg.toFixed(4)}</td>
                              <td>{item.remark}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <h2>제조 공정</h2>

                {Array.from(
                  new Set(getProcessStepsByFormula(batchFormulaId).map((step) => step.phase || "미지정"))
                ).map((phase) => (
                  <div key={phase} style={{ marginBottom: "24px" }}>
                    <h3>{phase}</h3>

                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>공정명</th>
                          <th>온도</th>
                          <th>RPM</th>
                          <th>시간</th>
                          <th>작업지시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getProcessStepsByFormula(batchFormulaId)
                          .filter((step) => (step.phase || "미지정") === phase)
                          .map((step) => (
                            <tr key={step.id}>
                              <td>{step.step_no}</td>
                              <td>{step.process_name}</td>
                              <td>{step.temperature}</td>
                              <td>{step.rpm}</td>
                              <td>{step.time_min}</td>
                              <td>{step.instruction}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <h2 style={{ textAlign: "right" }}>
                  TOTAL INPUT: {getFormulaTotal(batchFormulaId).toFixed(4)}%
                </h2>

                <h2 style={{ textAlign: "right" }}>
                  TOTAL WEIGHT: {getBatchTotalKg(batchFormulaId, Number(batchSize || 0)).toFixed(4)} kg
                </h2>

                <p
                  style={{
                    textAlign: "right",
                    color: Math.abs(getFormulaTotal(batchFormulaId) - 100) < 0.0001 ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {Math.abs(getFormulaTotal(batchFormulaId) - 100) < 0.0001
                    ? "TOTAL 100% 완료"
                    : "TOTAL 100% 아님"}
                </p>
              </div>
            )}
          </>
        )}

        {menu === "breakdown" && (
          <>
            <h1>Breakdown IL</h1>
            <p>처방 원료와 원료조성표를 기준으로 INCI별 최종 함량을 자동 계산합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
              <select value={breakdownFormulaId || ""} onChange={(e) => setBreakdownFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>

              <button onClick={generateBreakdownIL}>Breakdown IL 생성</button>
              <button onClick={downloadBreakdownIL}>Breakdown IL 다운로드</button>
            </div>

            <h2>Breakdown IL 결과</h2>
            <p style={{ color: "#6b7280" }}>
              복합원료는 원료조성표 기준으로 자동 분해됩니다. 정렬은 Breakdown 최종함량 기준 내림차순입니다.
            </p>

            {breakdownFormulaId && (
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <th>전성분 생성 상태</th>
                    <td
                      style={{
                        color: getIngredientEngineValidation(breakdownFormulaId).engineOk ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {getIngredientEngineValidation(breakdownFormulaId).engineOk ? "생성 가능" : "검토 필요"}
                    </td>
                    <th>성분 수</th>
                    <td>{breakdownItems.length}</td>
                  </tr>
                  <tr>
                    <th>원료조성 합계 오류</th>
                    <td>{getIngredientEngineValidation(breakdownFormulaId).incompleteCompositionItems.length}</td>
                    <th>CAS 누락</th>
                    <td>{getIngredientEngineValidation(breakdownFormulaId).missingCasItems.length}</td>
                  </tr>
                </tbody>
              </table>
            )}

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>CAS No.</th>
                  <th>EC No.</th>
                  <th>기능</th>
                  <th>최종함량(%)</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((item) => (
                  <tr key={item.inci_name}>
                    <td>{item.inci_name}</td>
                    <td>{item.korean_name}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.ec_no}</td>
                    <td>{item.function_ko}</td>
                    <td>{item.final_percentage.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "fullil" && (
          <>
            <h1>Full IL</h1>
            <p>처방 원료별 투입량과 원료조성표를 전개해 Full IL로 표시합니다. 복합원료의 실제 최종함량을 검토할 수 있습니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
              <select value={fullIlFormulaId || ""} onChange={(e) => setFullIlFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>

              <button onClick={generateFullIL}>Full IL 생성</button>
              <button onClick={downloadFullIL}>Full IL 다운로드</button>
            </div>

            <h2>Full IL 결과</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>원료투입량(%)</th>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>원료 내 구성비(%)</th>
                  <th>최종함량(%)</th>
                  <th>CAS No.</th>
                  <th>EC No.</th>
                  <th>기능</th>
                </tr>
              </thead>
              <tbody>
                {fullIlItems.map((item, index) => (
                  <tr key={`${item.raw_code}-${item.inci_name}-${index}`}>
                    <td>{item.formula_code}</td>
                    <td>{item.formula_name}</td>
                    <td>{item.raw_code}</td>
                    <td>{item.raw_name}</td>
                    <td>{item.raw_input_percentage.toFixed(6)}</td>
                    <td>{item.inci_name}</td>
                    <td>{item.korean_name}</td>
                    <td>{item.composition_percentage.toFixed(6)}</td>
                    <td>{item.final_percentage.toFixed(6)}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.ec_no}</td>
                    <td>{item.function_ko}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "sheet" && (
          <>
            <h1>Formula Sheet PDF</h1>
            <p>처방을 선택하면 고객 제출용 Formula Sheet가 자동 생성됩니다. 인쇄/PDF 저장으로 PDF 파일을 만들 수 있습니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "600px", marginBottom: "20px" }}>
              <select value={sheetFormulaId || ""} onChange={(e) => setSheetFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={printFormulaSheet}>PDF 생성 / 인쇄</button>
                <button onClick={downloadFormulaSheetCsv} style={{ background: "#059669" }}>
                  Formula Sheet CSV 다운로드
                </button>
              </div>
            </div>

            {sheetFormulaId && (
              <div
                id="formula-sheet"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "36px",
                  maxWidth: "1000px",
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <h1 style={{ textAlign: "center", letterSpacing: "1px" }}>FORMULA SHEET</h1>
                <p style={{ textAlign: "center", color: "#6b7280" }}>Cosmetic PLM Generated Document</p>

                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(sheetFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(sheetFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>Version</th>
                      <td>{getFormulaById(sheetFormulaId)?.version}</td>
                      <th>Revision No.</th>
                      <td>{getFormulaById(sheetFormulaId)?.revision_no || 1}</td>
                    </tr>
                    <tr>
                      <th>작성일</th>
                      <td>{getFormulaSheetDate()}</td>
                      <th>TOTAL</th>
                      <td
                        style={{
                          color: Math.abs(getFormulaSheetTotal(sheetFormulaId) - 100) < 0.0001 ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {getFormulaSheetTotal(sheetFormulaId).toFixed(4)}%
                      </td>
                    </tr>
                    <tr>
                      <th>잠금 상태</th>
                      <td style={{ color: getFormulaById(sheetFormulaId)?.is_locked ? "red" : "green", fontWeight: "bold" }}>
                        {getFormulaById(sheetFormulaId)?.is_locked ? "LOCKED" : "EDITABLE"}
                      </td>
                      <th>승인일</th>
                      <td>{getFormulaById(sheetFormulaId)?.approved_at ? new Date(getFormulaById(sheetFormulaId)?.approved_at || "").toLocaleString() : "-"}</td>
                    </tr>
                    <tr>
                      <th>Revision Note</th>
                      <td colSpan={3}>{getFormulaById(sheetFormulaId)?.revision_note || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <h2>1. Formula Composition</h2>
                {Array.from(
                  new Set(getFormulaSheetRows(sheetFormulaId).map((item) => item.phase || "미지정"))
                ).map((phase) => (
                  <div key={phase} style={{ marginBottom: "24px" }}>
                    <h3>{phase}</h3>

                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>원료코드</th>
                          <th>원료명</th>
                          <th>투입량(%)</th>
                          <th>단가(원/kg)</th>
                          <th>원가(원/kg)</th>
                          <th>비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFormulaSheetRows(sheetFormulaId)
                          .filter((item) => (item.phase || "미지정") === phase)
                          .map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>{item.raw_materials?.raw_code}</td>
                              <td>{item.raw_materials?.raw_name}</td>
                              <td>{Number(item.percentage || 0).toFixed(4)}</td>
                              <td>{Number(item.raw_materials?.unit_price || 0).toLocaleString()}</td>
                              <td>
                                {((Number(item.raw_materials?.unit_price || 0) * Number(item.percentage || 0)) / 100).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td>{item.remark}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <h2>2. Cost Summary</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>원료원가(원/kg)</th>
                      <td>{getFormulaCost(sheetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <th>BOM 부대원가(원/kg)</th>
                      <td>{getBomExtraCost(sheetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <th>최종 제조원가(원/kg)</th>
                      <td style={{ fontWeight: "bold" }}>
                        {getBomFinalCost(sheetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <th>권장 공급가(원/kg)</th>
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>
                        {getBomSuggestedPrice(sheetFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <th>목표원가(원/kg)</th>
                      <td>{Number(getFormulaById(sheetFormulaId)?.target_cost || 0).toLocaleString()}</td>
                      <th>공급가(원/kg)</th>
                      <td>{Number(getFormulaById(sheetFormulaId)?.selling_price || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <h2>3. Ingredient List</h2>
                <h3>국문 전성분</h3>
                <div style={{ border: "1px solid #d1d5db", padding: "14px", lineHeight: "1.8", marginBottom: "12px" }}>
                  {makeKoreanIngredientListByFormula(sheetFormulaId) || "전성분 데이터가 없습니다."}
                </div>

                <h3>English Ingredient List</h3>
                <div style={{ border: "1px solid #d1d5db", padding: "14px", lineHeight: "1.8", marginBottom: "12px" }}>
                  {makeEnglishIngredientListByFormula(sheetFormulaId) || "Ingredient List data is empty."}
                </div>

                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>INCI</th>
                      <th>국문명</th>
                      <th>CAS No.</th>
                      <th>기능</th>
                      <th>최종함량(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedIngredientItemsByFormula(sheetFormulaId).map((item) => (
                      <tr key={item.inci_name}>
                        <td>{item.inci_name}</td>
                        <td>{item.korean_name}</td>
                        <td>{item.cas_no}</td>
                        <td>{item.function_ko}</td>
                        <td>{item.final_percentage.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>4. Approval / Notes</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>작성</th>
                      <td style={{ height: "44px" }}>{getFormulaById(sheetFormulaId)?.prepared_by || ""}</td>
                      <th>검토</th>
                      <td style={{ height: "44px" }}>{getFormulaById(sheetFormulaId)?.reviewed_by || ""}</td>
                      <th>승인</th>
                      <td style={{ height: "44px" }}>{getFormulaById(sheetFormulaId)?.approved_by || ""}</td>
                    </tr>
                    <tr>
                      <th>승인일</th>
                      <td>{getFormulaById(sheetFormulaId)?.approved_at ? new Date(getFormulaById(sheetFormulaId)?.approved_at || "").toLocaleString() : "-"}</td>
                      <th>잠금자</th>
                      <td>{getFormulaById(sheetFormulaId)?.locked_by || "-"}</td>
                      <th>사유</th>
                      <td>{getFormulaById(sheetFormulaId)?.lock_reason || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "24px" }}>
                  This document was generated by Cosmetic PLM. Please verify regulatory and customer-specific requirements before release.
                </p>
              </div>
            )}
          </>
        )}

        {menu === "package" && (
          <>
            <h1>문서 패키지 생성</h1>
            <p>처방을 선택하면 고객 제출 및 내부 검토용 문서 패키지를 자동으로 생성합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "640px", marginBottom: "24px" }}>
              <select value={packageFormulaId || ""} onChange={(e) => setPackageFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={downloadDocumentPackage}>문서 패키지 CSV 일괄 생성</button>
                <button onClick={printPackageFormulaSheet} style={{ background: "#059669" }}>
                  Formula Sheet PDF 생성
                </button>
              </div>
            </div>

            {packageFormulaId && (
              <>
                <h2>패키지 요약</h2>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <th>처방코드</th>
                      <td>{getFormulaById(packageFormulaId)?.formula_code}</td>
                      <th>처방명</th>
                      <td>{getFormulaById(packageFormulaId)?.formula_name}</td>
                    </tr>
                    <tr>
                      <th>Version</th>
                      <td>{getFormulaById(packageFormulaId)?.version}</td>
                      <th>TOTAL</th>
                      <td
                        style={{
                          color: Math.abs(getFormulaSheetTotal(packageFormulaId) - 100) < 0.0001 ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {getFormulaSheetTotal(packageFormulaId).toFixed(4)}%
                      </td>
                    </tr>
                    <tr>
                      <th>Breakdown 성분 수</th>
                      <td>{calculateBreakdown(packageFormulaId).length}</td>
                      <th>규제 위험/주의</th>
                      <td>
                        위험 {getRegulationSummary(packageFormulaId).dangerCount} / 주의 {getRegulationSummary(packageFormulaId).cautionCount}
                      </td>
                    </tr>
                    <tr>
                      <th>원료원가</th>
                      <td>{getFormulaCost(packageFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <th>최종 제조원가</th>
                      <td>{getBomFinalCost(packageFormulaId).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>

                <h2>생성 문서 목록</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>문서명</th>
                      <th>형식</th>
                      <th>내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>00</td>
                      <td>Package Summary</td>
                      <td>CSV</td>
                      <td>처방 기본정보, TOTAL, 규제검증 요약</td>
                    </tr>
                    <tr>
                      <td>01</td>
                      <td>Formula Sheet</td>
                      <td>CSV / PDF</td>
                      <td>Phase별 처방 원료, 투입량, 원가</td>
                    </tr>
                    <tr>
                      <td>02</td>
                      <td>Breakdown IL</td>
                      <td>CSV</td>
                      <td>INCI별 최종함량, CAS, EC, 기능, 규제상태</td>
                    </tr>
                    <tr>
                      <td>03</td>
                      <td>Full IL</td>
                      <td>CSV</td>
                      <td>원료별 구성성분 전개표</td>
                    </tr>
                    <tr>
                      <td>04</td>
                      <td>Ingredient List</td>
                      <td>CSV</td>
                      <td>국문 전성분, 영문 Ingredient List</td>
                    </tr>
                    <tr>
                      <td>05</td>
                      <td>Cost Summary</td>
                      <td>CSV</td>
                      <td>원료원가, BOM원가, 제조원가, 권장공급가</td>
                    </tr>
                    <tr>
                      <td>06</td>
                      <td>Regulation Check</td>
                      <td>CSV</td>
                      <td>규제검증 자동 경고 목록</td>
                    </tr>
                  </tbody>
                </table>

                <h2>규제검증 미리보기</h2>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th>등급</th>
                      <th>구분</th>
                      <th>INCI</th>
                      <th>최종함량</th>
                      <th>메시지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRegulationWarnings(packageFormulaId).slice(0, 10).map((warning, index) => (
                      <tr key={`${warning.category}-${warning.inci_name}-${index}`}>
                        <td style={{ color: warning.level === "위험" ? "red" : warning.level === "주의" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>
                          {warning.level}
                        </td>
                        <td>{warning.category}</td>
                        <td>{warning.inci_name}</td>
                        <td>{warning.final_percentage.toFixed(6)}</td>
                        <td>{warning.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {menu === "audit" && (
          <>
            <h1>Audit Log 2.0 Smart Diff</h1>
            <p>전체 JSON을 그대로 펼치지 않고 변경된 필드만 요약해서 표시합니다. 기존 로그는 자동으로 Smart Diff 형태로 변환 표시됩니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "520px", marginBottom: "20px" }}>
              <input
                placeholder="작업자명 예: 홍길동"
                value={auditUserName || ""}
                onChange={(e) => setAuditUserName(e.target.value)}
              />
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>일시</th>
                  <th>모듈</th>
                  <th>작업</th>
                  <th>Record ID</th>
                  <th>작업자</th>
                  <th>변경요약</th>
                  <th>변경 필드</th>
                  <th>변경 전</th>
                  <th>변경 후</th>
                  <th>상세 Diff</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const diffRows = getAuditDiffRows(log);
                  const summary = log.change_summary || getAuditSummary(log.action_type, diffRows);

                  return (
                    <tr key={log.id}>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                      <td>{log.module_name}</td>
                      <td style={{ fontWeight: "bold" }}>{log.action_type}</td>
                      <td>{log.record_id}</td>
                      <td>{log.user_name}</td>
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>{summary}</td>
                      <td>{log.field_name || diffRows[0]?.field || "-"}</td>
                      <td>{log.before_value || diffRows[0]?.before || "-"}</td>
                      <td>{log.after_value || diffRows[0]?.after || "-"}</td>
                      <td>
                        {diffRows.length > 0 ? (
                          <table style={{ ...tableStyle, margin: 0, fontSize: "12px" }}>
                            <thead>
                              <tr>
                                <th>항목</th>
                                <th>Before</th>
                                <th>After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diffRows.map((diff: any, index: number) => (
                                <tr key={`${log.id}-${diff.field}-${index}`}>
                                  <td>{diff.field}</td>
                                  <td style={{ color: "#6b7280" }}>{diff.before}</td>
                                  <td style={{ color: "#111827", fontWeight: "bold" }}>{diff.after}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {menu === "users" && (
          <>
            <h1>사용자관리</h1>
            <p>현재 로그인 사용자와 권한을 확인합니다. 권한 변경은 초기 버전에서는 Supabase Table Editor의 user_profiles에서 관리합니다.</p>

            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>이메일</th>
                  <td>{authUser?.email}</td>
                  <th>이름</th>
                  <td>{userProfile?.display_name}</td>
                </tr>
                <tr>
                  <th>권한</th>
                  <td>{getUserRole()}</td>
                  <th>권한 설명</th>
                  <td>
                    Admin: 전체 권한 / Manager: 관리·삭제·승인 / QA: 품질·안정도·승인 / RA: 규제검증 / Senior: 선임 연구원 / Researcher: 연구원 / Viewer: 조회 전용
                  </td>
                </tr>
              </tbody>
            </table>

            <h2>권한별 기능</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>권한</th>
                  <th>조회</th>
                  <th>등록/수정</th>
                  <th>삭제</th>
                  <th>승인</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>admin</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>가능</td>
                </tr>
                <tr>
                  <td>manager</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>가능</td>
                </tr>
                <tr>
                  <td>senior</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>불가</td>
                  <td>가능</td>
                </tr>
                <tr>
                  <td>researcher</td>
                  <td>가능</td>
                  <td>가능</td>
                  <td>불가</td>
                  <td>불가</td>
                </tr>
                <tr>
                  <td>viewer</td>
                  <td>가능</td>
                  <td>불가</td>
                  <td>불가</td>
                  <td>불가</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {menu === "trash" && (
          <>
            <h1>휴지통</h1>
            <p>삭제된 원료, 성분, 처방, 처방원료, BOM 원가를 복구하거나 관리자 권한으로 영구삭제할 수 있습니다.</p>

            <h2>삭제된 원료</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>원료코드</th>
                  <th>원료명</th>
                  <th>삭제일</th>
                  <th>삭제자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {trashMaterials.map((item) => (
                  <tr key={item.id}>
                    <td>{item.raw_code}</td>
                    <td>{item.raw_name}</td>
                    <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</td>
                    <td>{item.deleted_by}</td>
                    <td>
                      <button onClick={() => restoreRecord("raw_materials", item.id, "원료관리", item)}>복구</button>
                      <button onClick={() => permanentDeleteRecord("raw_materials", item.id, "원료관리", item)} style={{ background: "#dc2626" }}>영구삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>삭제된 성분</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>CAS No.</th>
                  <th>삭제일</th>
                  <th>삭제자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {trashGlobalIngredients.map((item) => (
                  <tr key={item.id}>
                    <td>{item.inci_name}</td>
                    <td>{item.korean_name}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</td>
                    <td>{item.deleted_by}</td>
                    <td>
                      <button onClick={() => restoreRecord("ingredient_master_global", item.id, "성분관리", item)}>복구</button>
                      <button onClick={() => permanentDeleteRecord("ingredient_master_global", item.id, "성분관리", item)} style={{ background: "#dc2626" }}>영구삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>삭제된 처방</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>Version</th>
                  <th>삭제일</th>
                  <th>삭제자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {trashFormulas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.formula_code}</td>
                    <td>{item.formula_name}</td>
                    <td>{item.version}</td>
                    <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</td>
                    <td>{item.deleted_by}</td>
                    <td>
                      <button onClick={() => restoreRecord("formulas", item.id, "처방관리", item)}>복구</button>
                      <button onClick={() => permanentDeleteRecord("formulas", item.id, "처방관리", item)} style={{ background: "#dc2626" }}>영구삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>삭제된 처방 원료</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방</th>
                  <th>원료</th>
                  <th>투입량</th>
                  <th>Phase</th>
                  <th>삭제일</th>
                  <th>삭제자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {trashFormulaItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.formulas?.formula_code}</td>
                    <td>{item.raw_materials?.raw_name}</td>
                    <td>{Number(item.percentage || 0).toFixed(4)}</td>
                    <td>{item.phase}</td>
                    <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</td>
                    <td>{item.deleted_by}</td>
                    <td>
                      <button onClick={() => restoreRecord("formula_items", item.id, "처방원료", item)}>복구</button>
                      <button onClick={() => permanentDeleteRecord("formula_items", item.id, "처방원료", item)} style={{ background: "#dc2626" }}>영구삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>삭제된 BOM 원가</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방</th>
                  <th>최종 제조원가</th>
                  <th>삭제일</th>
                  <th>삭제자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {trashBomCosts.map((item) => (
                  <tr key={item.id}>
                    <td>{item.formulas?.formula_code}</td>
                    <td>{getBomFinalCost(item.formulas?.id || "").toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</td>
                    <td>{item.deleted_by}</td>
                    <td>
                      <button onClick={() => restoreRecord("bom_costs", item.id, "BOM원가", item)}>복구</button>
                      <button onClick={() => permanentDeleteRecord("bom_costs", item.id, "BOM원가", item)} style={{ background: "#dc2626" }}>영구삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {menu === "label" && (
          <>
            <h1>전성분</h1>
            <p>처방을 선택하면 식약처 표시 기준에 맞춰 1% Rule을 반영한 전성분 문구가 자동 생성됩니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "600px", marginBottom: "20px" }}>
              <select value={labelFormulaId || ""} onChange={(e) => setLabelFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <button onClick={downloadIngredientList}>전성분 CSV 다운로드</button>
            </div>

            <h2>국문 전성분</h2>
            <div style={{ border: "1px solid #ddd", padding: "20px", maxWidth: "900px", lineHeight: "1.8", background: "white" }}>
              {labelFormulaId
                ? makeKoreanIngredientListByFormula(labelFormulaId) || "해당 처방의 전성분 데이터가 없습니다."
                : makeKoreanIngredientList() || "처방을 선택하거나 Breakdown IL을 생성하세요."}
            </div>

            <h2>영문 Ingredient List</h2>
            <div style={{ border: "1px solid #ddd", padding: "20px", maxWidth: "900px", lineHeight: "1.8", background: "white" }}>
              {labelFormulaId
                ? makeEnglishIngredientListByFormula(labelFormulaId) || "해당 처방의 Ingredient List 데이터가 없습니다."
                : makeEnglishIngredientList() || "처방을 선택하거나 Breakdown IL을 생성하세요."}
            </div>

            <h2>전성분 정렬 기준</h2>
            <p style={{ color: "#6b7280" }}>
              Breakdown 최종함량 기준 내림차순으로 정렬합니다. 향료와 색소를 별도로 후순위 처리하지 않습니다.
            </p>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>INCI</th>
                  <th>국문명</th>
                  <th>최종함량(%)</th>
                  <th>구분</th>
                </tr>
              </thead>
              <tbody>
                {(labelFormulaId ? getSortedIngredientItemsByFormula(labelFormulaId) : getSortedIngredientItems()).map((item) => (
                  <tr key={item.inci_name}>
                    <td>{item.inci_name}</td>
                    <td>{item.korean_name}</td>
                    <td>{item.final_percentage.toFixed(6)}</td>
                    <td>{Number(item.final_percentage || 0) >= 1 ? "1% 이상" : "1% 미만"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

      </section>
    </main>
  );
}
