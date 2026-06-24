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
  issue_date: string;
  expiry_date: string;
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
  max_use_level: string;
  regulation_note: string;
  ewg_grade: string;
  allergen_note: string;
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
  user_name: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: string;
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
        issue_date,
        expiry_date,
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

  return (
        item.inci_name?.toLowerCase().includes(keyword) ||
        item.korean_name?.toLowerCase().includes(keyword) ||
        item.cas_no?.toLowerCase().includes(keyword)
      );
    });
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

  function downloadGlobalCsvTemplate() {
    const headers = [
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
      "max_use_level",
      "regulation_note",
      "ewg_grade",
      "allergen_note",
    ];

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
      "가능",
      "Vegan",
      "제한 없음",
      "사용제한 원료 아님",
      "1",
      "해당 없음",
    ];

    const csv =
      "\ufeff" +
      headers.join(",") +
      "\n" +
      sample.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "global_inci_template.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function importGlobalCsv(file: File) {
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
          max_use_level: record.max_use_level || "",
          regulation_note: record.regulation_note || "",
          ewg_grade: record.ewg_grade || "",
          allergen_note: record.allergen_note || "",
        };
      })
      .filter((record) => record.inci_name);

    if (records.length === 0) {
      alert("업로드할 INCI 데이터가 없습니다.");
      setGlobalUploadStatus("");
      return;
    }

    const chunkSize = 500;
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

    setGlobalUploadStatus(`업로드 완료: ${uploadedCount}개 처리`);
    alert(`${uploadedCount}개 Global INCI 데이터 업로드/업데이트 완료`);
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
        max_use_level: globalMaxUseLevel,
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

  async function addProject() {
    if (!projectCode || !projectName) {
      alert("프로젝트 코드와 프로젝트명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("projects").insert([
      {
        project_code: projectCode,
        customer_name: customerName,
        project_name: projectName,
        researcher,
        status: projectStatus,
        target_launch_date: targetLaunchDate || null,
        description: projectDescription,
        product_type: productType,
        dosage_form: dosageForm,
        target_user: targetUser,
        concept_keywords: conceptKeywords,
        target_price: Number(targetPrice || 0),
        forbidden_ingredients: forbiddenIngredients,
        required_ingredients: requiredIngredients,
        customer_brief: customerBrief,
      },
    ]);

    if (error) {
      alert("프로젝트 저장 오류: " + error.message);
      return;
    }

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
    if (!approvalProjectId || !approvalFormulaId || !approvalRequester) {
      alert("프로젝트, 처방, 요청자를 입력하세요.");
      return;
    }

    const { error } = await supabase.from("approval_requests").insert([
      {
        project_id: approvalProjectId,
        formula_id: approvalFormulaId,
        request_type: approvalRequestType,
        status: "Review",
        requester: approvalRequester,
        reviewer: approvalReviewer,
        request_note: approvalRequestNote,
      },
    ]);

    if (error) {
      alert("승인요청 저장 오류: " + error.message);
      return;
    }

    setApprovalProjectId("");
    setApprovalFormulaId("");
    setApprovalRequestType("처방승인");
    setApprovalRequester("");
    setApprovalReviewer("");
    setApprovalRequestNote("");
    loadAll();
  }

  async function updateApprovalStatus(id: string, status: string) {
    if (!assertCanApprove()) return;
    const reviewNote = window.prompt(`${status} 처리 사유 또는 코멘트를 입력하세요.`) || "";

    const { error } = await supabase
      .from("approval_requests")
      .update({
        status,
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert("승인상태 변경 오류: " + error.message);
      return;
    }

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

  async function addMaterial() {
    if (!assertCanEdit()) return;
    if (!rawCode || !rawName) {
      alert("원료코드와 원료명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("raw_materials").insert([
      {
        raw_code: rawCode,
        raw_name: rawName,
        supplier,
        unit_price: Number(rawUnitPrice || 0),
        currency: rawCurrency,
        moq: Number(rawMoq || 0),
      },
    ]);

    if (error) {
      alert("원료 저장 오류: " + error.message);
      return;
    }

    setRawCode("");
    setRawName("");
    setSupplier("");
    setRawUnitPrice("");
    setRawCurrency("KRW");
    setRawMoq("");
    await logAudit("원료관리", rawCode, "등록", null, {
      raw_code: rawCode,
      raw_name: rawName,
      supplier,
      unit_price: Number(rawUnitPrice || 0),
      currency: rawCurrency,
      moq: Number(rawMoq || 0),
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

  async function addMaterialDocument() {
    if (!docRawMaterialId || !docType || !docTitle) {
      alert("원료, 문서구분, 문서명을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("material_documents").insert([
      {
        raw_material_id: docRawMaterialId,
        document_type: docType,
        document_title: docTitle,
        document_url: docUrl,
        issue_date: docIssueDate || null,
        expiry_date: docExpiryDate || null,
        remark: docRemark,
      },
    ]);

    if (error) {
      alert("문서 저장 오류: " + error.message);
      return;
    }

    setDocRawMaterialId("");
    setDocType("COA");
    setDocTitle("");
    setDocUrl("");
    setDocIssueDate("");
    setDocExpiryDate("");
    setDocRemark("");
    loadAll();
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
      (project) => project.status === "출시" || project.status === "종료" || project.status === "양산 승인"
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

  async function logAudit(
    moduleName: string,
    recordId: string,
    actionType: string,
    beforeData: any,
    afterData: any
  ) {
    await supabase.from("audit_logs").insert([
      {
        module_name: moduleName,
        record_id: recordId,
        action_type: actionType,
        before_data: beforeData || null,
        after_data: afterData || null,
        user_name: auditUserName || "PLM User",
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

  const menuItems = [
    ["dashboard", "대시보드"],
    ["project", "프로젝트관리"],
    ["raw", "원료관리"],
    ["globalIngredient", "성분관리"],
    ["composition", "원료조성표"],
    ["formula", "처방관리"],
    ["validation", "처방검증"],
    ["regulation", "규제검증"],
    ["globalRegulation", "국가별규제"],
    ["stability", "안정도관리"],
    ["approval", "승인관리"],
    ["lock", "처방잠금"],
    ["stage", "개발일정"],
    ["cost", "원가관리"],
    ["bom", "BOM원가"],
    ["batch", "배치계산"],
    ["breakdown", "Breakdown IL"],
    ["fullil", "Full IL"],
    ["label", "전성분"],
    ["sheet", "Formula Sheet"],
    ["package", "문서패키지"],
    ["audit", "Audit Log"],
    ["users", "사용자관리"],
    ["trash", "휴지통"],
  ];

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

      <aside style={{ width: "230px", background: "#111827", color: "white", padding: "24px" }}>
        <h2>🧪 Cosmetic PLM</h2>

        {menuItems.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMenu(key)}
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0",
              padding: "10px",
              background: menu === key ? "#2563eb" : "#374151",
              color: "white",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
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
              <DashboardKpiCard title="안정도 진행" value={getAdvancedDashboardKpis().stabilityRunning} subtitle={`PASS ${getAdvancedDashboardKpis().stabilityPass} / FAIL ${getAdvancedDashboardKpis().stabilityFail}`} accent="#059669" />
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
            <p>고객사별 제품개발 프로젝트, 담당 연구원, 진행 상태, 목표 출시일을 관리합니다.</p>

            <h2>프로젝트 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "600px" }}>
              <input
                placeholder="프로젝트 코드 예: PJT-2026-001"
                value={projectCode || ""}
                onChange={(e) => setProjectCode(e.target.value)}
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
                placeholder="제품유형 예: 스킨케어 / 메이크업 / 헤어"
                value={productType || ""}
                onChange={(e) => setProductType(e.target.value)}
              />

              <input
                placeholder="제형 예: 크림 / 세럼 / 패치 / 토너"
                value={dosageForm || ""}
                onChange={(e) => setDosageForm(e.target.value)}
              />

              <input
                placeholder="타겟 예: 민감성 피부 / 2030 여성"
                value={targetUser || ""}
                onChange={(e) => setTargetUser(e.target.value)}
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
                <option value="개발중">개발중</option>
                <option value="안정도 진행">안정도 진행</option>
                <option value="샘플 발송">샘플 발송</option>
                <option value="고객 검토">고객 검토</option>
                <option value="양산 승인">양산 승인</option>
                <option value="종료">종료</option>
              </select>

              <label>목표 출시일</label>
              <input
                type="date"
                value={targetLaunchDate || ""}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
              />

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
                  <th>제품유형</th>
                  <th>제형</th>
                  <th>타겟</th>
                  <th>컨셉</th>
                  <th>희망원가</th>
                  <th>금지원료</th>
                  <th>필수원료</th>
                  <th>담당 연구원</th>
                  <th>상태</th>
                  <th>목표 출시일</th>
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
                    <td>{project.product_type}</td>
                    <td>{project.dosage_form}</td>
                    <td>{project.target_user}</td>
                    <td>{project.concept_keywords}</td>
                    <td>{Number(project.target_price || 0).toLocaleString()}</td>
                    <td>{project.forbidden_ingredients}</td>
                    <td>{project.required_ingredients}</td>
                    <td>{project.researcher}</td>
                    <td style={{ fontWeight: "bold" }}>{project.status}</td>
                    <td>{project.target_launch_date || "-"}</td>
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
            <div style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
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
                    <td>
                      <button onClick={() => updateRawMaterial(m)}>수정</button>
                      <button onClick={() => deleteRawMaterial(m)} style={{ background: "#dc2626" }}>삭제</button>
                    </td>
                  </tr>
                ))}
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
                CSV 첫 줄은 양식 그대로 사용하세요. INCI명(inci_name)은 필수입니다.
                같은 INCI명은 새로 추가하지 않고 기존 데이터를 업데이트합니다.
              </p>

              <p style={{ fontWeight: "bold", color: "#2563eb" }}>
                {globalUploadStatus}
              </p>
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
                  <th>배합한도</th>
                  <th>규제사항</th>
                  <th>성분관리 등록</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {globalIngredients.map((item) => (
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
                    <td>{item.max_use_level}</td>
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
                          v{formula.version} / TOTAL {total.toFixed(2)}%
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
                          onClick={() => getSelectedFormula() && cloneFormula(getSelectedFormula()!)}
                          style={{ background: "#059669" }}
                        >
                          복사
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

        {menu === "globalRegulation" && (
          <>
            <h1>Global Regulation Engine</h1>
            <p>
              국가별 성분 규제 DB를 기준으로 처방의 Breakdown 최종함량을 검증합니다. KR/EU/CN/US/JP/ASEAN 등 국가별 판매 가능성을 확인할 수 있습니다.
            </p>

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
            <h1>승인관리 Workflow</h1>
            <p>프로젝트와 처방의 승인 요청, 검토, 승인, 반려, 배포 상태를 관리합니다.</p>

            <h2>승인 요청 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "700px" }}>
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
                    {formula.formula_code} - {formula.formula_name} v{formula.version}
                  </option>
                ))}
              </select>

              <select value={approvalRequestType || "처방승인"} onChange={(e) => setApprovalRequestType(e.target.value)}>
                <option value="처방승인">처방승인</option>
                <option value="원가승인">원가승인</option>
                <option value="안정도승인">안정도승인</option>
                <option value="양산승인">양산승인</option>
                <option value="변경승인">변경승인</option>
              </select>

              <input
                placeholder="요청자 예: 연구원 홍길동"
                value={approvalRequester || ""}
                onChange={(e) => setApprovalRequester(e.target.value)}
              />

              <input
                placeholder="검토자 예: 팀장 김OO"
                value={approvalReviewer || ""}
                onChange={(e) => setApprovalReviewer(e.target.value)}
              />

              <textarea
                placeholder="승인 요청 내용"
                value={approvalRequestNote || ""}
                onChange={(e) => setApprovalRequestNote(e.target.value)}
                rows={4}
              />

              <button onClick={addApprovalRequest}>승인 요청</button>
            </div>

            <h2>승인 요청 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>요청구분</th>
                  <th>프로젝트</th>
                  <th>처방</th>
                  <th>상태</th>
                  <th>요청자</th>
                  <th>검토자</th>
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
                    <td>{request.formulas?.formula_code} v{request.formulas?.version}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color:
                          request.status === "Approved" || request.status === "Released"
                            ? "green"
                            : request.status === "Rejected"
                            ? "red"
                            : "orange",
                      }}
                    >
                      {request.status}
                    </td>
                    <td>{request.requester}</td>
                    <td>{request.reviewer}</td>
                    <td>{request.request_note}</td>
                    <td>{request.review_note}</td>
                    <td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : "-"}</td>
                    <td>{request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : "-"}</td>
                    <td>
                      <button onClick={() => updateApprovalStatus(request.id, "Approved")}>승인</button>
                      <button onClick={() => updateApprovalStatus(request.id, "Rejected")}>반려</button>
                      <button onClick={() => updateApprovalStatus(request.id, "Released")}>배포</button>
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
            <h1>Audit Log</h1>
            <p>원료, 성분, 처방, BOM 원가의 등록/수정/삭제 이력을 확인합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "400px", marginBottom: "20px" }}>
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
                  <th>변경 전</th>
                  <th>변경 후</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                    <td>{log.module_name}</td>
                    <td style={{ fontWeight: "bold" }}>{log.action_type}</td>
                    <td>{log.record_id}</td>
                    <td>{log.user_name}</td>
                    <td>
                      <pre style={{ whiteSpace: "pre-wrap", maxWidth: "320px" }}>
                        {JSON.stringify(log.before_data || {}, null, 2)}
                      </pre>
                    </td>
                    <td>
                      <pre style={{ whiteSpace: "pre-wrap", maxWidth: "320px" }}>
                        {JSON.stringify(log.after_data || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
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
                    admin: 전체 권한 / manager: 삭제·승인 가능 / senior: 승인 가능 / researcher: 등록·수정 가능 / viewer: 조회 전용
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
