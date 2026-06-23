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
  const [validationFormulaId, setValidationFormulaId] = useState("");

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

  async function loadAll() {
    const { data: rawData } = await supabase
      .from("raw_materials")
      .select("*")
      .order("raw_code");

    const { data: ingData } = await supabase
      .from("ingredients")
      .select("*")
      .order("inci_name");

    const { data: globalIngData } = await supabase
      .from("ingredient_master_global")
      .select("*")
      .order("inci_name");

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
      .order("created_at", { ascending: false });

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
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price )
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
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price )
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
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price )
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

    const { data: formulaItemData } = await supabase
      .from("formula_items")
      .select(`
        id,
        percentage,
        phase,
        remark,
        formulas ( id, formula_code, formula_name, version ),
        raw_materials ( id, raw_code, raw_name, supplier, unit_price, currency, moq )
      `);

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
        formulas ( id, formula_code, formula_name, version, parent_formula_id, revision_no, revision_note, target_cost, selling_price )
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

  async function updateRawMaterial(item: RawMaterial) {
    const rawCode = window.prompt("원료코드", item.raw_code || "");
    if (rawCode === null) return;

    const rawName = window.prompt("원료명", item.raw_name || "");
    if (rawName === null) return;

    const supplierValue = window.prompt("공급사", item.supplier || "");
    if (supplierValue === null) return;

    const unitPriceValue = window.prompt("구매단가(원/kg)", String(item.unit_price || 0));
    if (unitPriceValue === null) return;

    const currencyValue = window.prompt("통화", item.currency || "KRW");
    if (currencyValue === null) return;

    const moqValue = window.prompt("MOQ(kg)", String(item.moq || 0));
    if (moqValue === null) return;

    const { error } = await supabase
      .from("raw_materials")
      .update({
        raw_code: rawCode,
        raw_name: rawName,
        supplier: supplierValue,
        unit_price: Number(unitPriceValue || 0),
        currency: currencyValue,
        moq: Number(moqValue || 0),
      })
      .eq("id", item.id);

    if (error) {
      alert("원료 수정 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function deleteRawMaterial(item: RawMaterial) {
    const ok = window.confirm(`${item.raw_code} / ${item.raw_name} 원료를 삭제할까요? 연결된 조성/처방 데이터에 영향이 있을 수 있습니다.`);

    if (!ok) return;

    const { error } = await supabase.from("raw_materials").delete().eq("id", item.id);

    if (error) {
      alert("원료 삭제 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function updateGlobalIngredient(item: GlobalIngredient) {
    const inciName = window.prompt("INCI", item.inci_name || "");
    if (inciName === null) return;

    const koreanNameValue = window.prompt("국문명", item.korean_name || "");
    if (koreanNameValue === null) return;

    const chineseNameValue = window.prompt("중문명", item.chinese_name || "");
    if (chineseNameValue === null) return;

    const japaneseNameValue = window.prompt("일문명", item.japanese_name || "");
    if (japaneseNameValue === null) return;

    const casNoValue = window.prompt("CAS No.", item.cas_no || "");
    if (casNoValue === null) return;

    const ecNoValue = window.prompt("EC No.", item.ec_no || "");
    if (ecNoValue === null) return;

    const functionKoValue = window.prompt("기능(국문)", item.function_ko || "");
    if (functionKoValue === null) return;

    const functionEnValue = window.prompt("Function(English)", item.function_en || "");
    if (functionEnValue === null) return;

    const iecicValue = window.prompt("IECIC 여부", item.iecic_status || "");
    if (iecicValue === null) return;

    const cosmosValue = window.prompt("COSMOS 여부", item.cosmos_status || "");
    if (cosmosValue === null) return;

    const veganValue = window.prompt("VEGAN 여부", item.vegan_status || "");
    if (veganValue === null) return;

    const maxUseValue = window.prompt("배합한도", item.max_use_level || "");
    if (maxUseValue === null) return;

    const regulationValue = window.prompt("규제사항", item.regulation_note || "");
    if (regulationValue === null) return;

    const ewgValue = window.prompt("EWG 등급", item.ewg_grade || "");
    if (ewgValue === null) return;

    const allergenValue = window.prompt("알러젠 정보", item.allergen_note || "");
    if (allergenValue === null) return;

    const { error } = await supabase
      .from("ingredient_master_global")
      .update({
        inci_name: inciName,
        korean_name: koreanNameValue,
        chinese_name: chineseNameValue,
        japanese_name: japaneseNameValue,
        cas_no: casNoValue,
        ec_no: ecNoValue,
        function_ko: functionKoValue,
        function_en: functionEnValue,
        iecic_status: iecicValue,
        cosmos_status: cosmosValue,
        vegan_status: veganValue,
        max_use_level: maxUseValue,
        regulation_note: regulationValue,
        ewg_grade: ewgValue,
        allergen_note: allergenValue,
      })
      .eq("id", item.id);

    if (error) {
      alert("성분 수정 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function deleteGlobalIngredient(item: GlobalIngredient) {
    const ok = window.confirm(`${item.inci_name} / ${item.korean_name} 성분을 삭제할까요?`);

    if (!ok) return;

    const { error } = await supabase.from("ingredient_master_global").delete().eq("id", item.id);

    if (error) {
      alert("성분 삭제 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function updateFormulaBasic(item: Formula) {
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

    loadAll();
  }

  async function deleteFormulaBasic(item: Formula) {
    const ok = window.confirm(`${item.formula_code} / ${item.formula_name} 처방을 삭제할까요? 연결된 처방 원료도 삭제될 수 있습니다.`);

    if (!ok) return;

    const { error } = await supabase.from("formulas").delete().eq("id", item.id);

    if (error) {
      alert("처방 삭제 오류: " + error.message);
      return;
    }

    loadAll();
  }

  async function addMaterial() {
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

  async function addFormula() {
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
    loadAll();
  }

  async function addFormulaItem() {
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

  function calculateBreakdown(targetFormulaId: string) {
    const targetFormulaItems = formulaItems.filter(
      (item) => item.formulas?.id === targetFormulaId
    );

    const result: Record<string, BreakdownItem> = {};

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
        const key = ingredient.inci_name;

        if (!result[key]) {
          result[key] = {
            inci_name: ingredient.inci_name,
            korean_name: ingredient.korean_name,
            cas_no: ingredient.cas_no,
            ec_no: ingredient.ec_no,
            function_ko: ingredient.function_ko,
            final_percentage: 0,
          };
        }

        result[key].final_percentage += finalPercentage;
      });
    });

    return Object.values(result).sort(
      (a, b) => b.final_percentage - a.final_percentage
    );
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
    return [...breakdownItems].sort((a, b) => {
      const aAboveOne = Number(a.final_percentage || 0) >= 1;
      const bAboveOne = Number(b.final_percentage || 0) >= 1;

      if (aAboveOne && !bAboveOne) {
        return -1;
      }

      if (!aAboveOne && bAboveOne) {
        return 1;
      }

      return Number(b.final_percentage || 0) - Number(a.final_percentage || 0);
    });
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

  function downloadIngredientList() {
    const label = makeKoreanIngredientList();

    if (!label) {
      alert("먼저 Breakdown IL 또는 Full IL을 생성하세요.");
      return;
    }

    downloadCsv(
      "Ingredient_List.csv",
      ["전성분"],
      [[label]]
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
    window.print();
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

  useEffect(() => {
    loadAll();
  }, []);

  const menuItems = [
    ["dashboard", "대시보드"],
    ["project", "프로젝트관리"],
    ["raw", "원료관리"],
    ["globalIngredient", "성분관리"],
    ["composition", "원료조성표"],
    ["formula", "처방관리"],
    ["validation", "처방검증"],
    ["stability", "안정도관리"],
    ["approval", "승인관리"],
    ["stage", "개발일정"],
    ["cost", "원가관리"],
    ["batch", "배치계산"],
    ["breakdown", "Breakdown IL"],
    ["fullil", "Full IL"],
    ["label", "전성분"],
    ["sheet", "Formula Sheet"],
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
            <h1>Cosmetic PLM Dashboard</h1>
            <p>프로젝트, 승인, 안정도, 마스터 데이터 현황을 한눈에 확인합니다.</p>

            <h2>프로젝트 현황</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>전체 프로젝트</th>
                  <td>{getDashboardKpis().totalProjects}</td>
                  <th>진행중</th>
                  <td>{getDashboardKpis().activeProjects}</td>
                </tr>
                <tr>
                  <th>출시/완료</th>
                  <td>{getDashboardKpis().completedProjects}</td>
                  <th>보류</th>
                  <td>{getDashboardKpis().holdProjects}</td>
                </tr>
              </tbody>
            </table>

            <h2>승인 현황</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>승인대기</th>
                  <td>{getDashboardKpis().reviewCount}</td>
                  <th>승인완료</th>
                  <td>{getDashboardKpis().approvedCount}</td>
                </tr>
                <tr>
                  <th>배포완료</th>
                  <td>{getDashboardKpis().releasedCount}</td>
                  <th>반려</th>
                  <td>{getDashboardKpis().rejectedCount}</td>
                </tr>
              </tbody>
            </table>

            <h2>안정도 현황</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>진행중</th>
                  <td>{getDashboardKpis().stabilityRunning}</td>
                  <th>PASS</th>
                  <td>{getDashboardKpis().stabilityPass}</td>
                </tr>
                <tr>
                  <th>FAIL</th>
                  <td>{getDashboardKpis().stabilityFail}</td>
                  <th>전체 안정도 시험</th>
                  <td>{stabilityTests.length}</td>
                </tr>
              </tbody>
            </table>

            <h2>마스터 데이터 현황</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th>원료 수</th>
                  <td>{getDashboardKpis().totalMaterials}</td>
                  <th>성분 수</th>
                  <td>{getDashboardKpis().totalIngredients}</td>
                </tr>
                <tr>
                  <th>통합 성분 수</th>
                  <td>{getDashboardKpis().totalGlobalIngredients}</td>
                  <th>처방 수</th>
                  <td>{getDashboardKpis().totalFormulas}</td>
                </tr>
              </tbody>
            </table>

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
                    <td style={{ fontWeight: "bold" }}>{getProjectProgress(project.id)}%</td>
                    <td>{getCurrentProjectStage(project.id)}</td>
                    <td>{project.status}</td>
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

            <h2>처방 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
              <input placeholder="처방코드 예: FC-001" value={formulaCode || ""} onChange={(e) => setFormulaCode(e.target.value)} />
              <input placeholder="처방명 예: 립패치" value={formulaName || ""} onChange={(e) => setFormulaName(e.target.value)} />
              <input placeholder="버전 예: 1.0" value={formulaVersion || ""} onChange={(e) => setFormulaVersion(e.target.value)} />
              <input placeholder="목표원가(원/kg) 예: 500" value={formulaTargetCost || ""} onChange={(e) => setFormulaTargetCost(e.target.value)} />
              <input placeholder="공급가(원/kg) 예: 3000" value={formulaSellingPrice || ""} onChange={(e) => setFormulaSellingPrice(e.target.value)} />
              <button onClick={addFormula}>처방 저장</button>
            </div>

            <h2>처방 원료 등록</h2>
            <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
              <select value={formulaId || ""} onChange={(e) => setFormulaId(e.target.value)}>
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

              <input placeholder="투입량(%) 예: 5" value={formulaItemPercentage || ""} onChange={(e) => setFormulaItemPercentage(e.target.value)} />
              <button onClick={addFormulaItem}>처방 원료 저장</button>
            </div>

            <h2>처방 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
                  <th>버전</th>
                  <th>Revision No.</th>
                  <th>Revision Note</th>
                  <th>TOTAL(%)</th>
                  <th>예상원가(원/kg)</th>
                  <th>목표원가(원/kg)</th>
                  <th>차이(원/kg)</th>
                  <th>공급가(원/kg)</th>
                  <th>마진율(%)</th>
                  <th>상태</th>
                  <th>복사</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((f) => {
                  const total = getFormulaTotal(f.id);
                  const isComplete = Math.abs(total - 100) < 0.0001;

                  return (
                    <tr key={f.id}>
                      <td>{f.formula_code}</td>
                      <td>{f.formula_name}</td>
                      <td>{f.version}</td>
                      <td>{f.revision_no || 1}</td>
                      <td>{f.revision_note || "-"}</td>
                      <td>{total.toFixed(2)}</td>
                      <td>{getFormulaCost(f.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>{Number(f.target_cost || 0).toLocaleString()}</td>
                      <td style={{ color: getCostGap(f.id) >= 0 ? "green" : "red", fontWeight: "bold" }}>
                        {getCostGap(f.id).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td>{Number(f.selling_price || 0).toLocaleString()}</td>
                      <td>{getMarginRate(f.id).toFixed(2)}</td>
                      <td style={{ color: isComplete ? "green" : "red", fontWeight: "bold" }}>
                        {isComplete ? "TOTAL 100% 완료" : "TOTAL 100% 아님"}
                      </td>
                      <td>
                        <button onClick={() => cloneFormula(f)}>복사</button>
                      </td>
                      <td>
                        <button onClick={() => updateFormulaBasic(f)}>수정</button>
                        <button onClick={() => deleteFormulaBasic(f)} style={{ background: "#dc2626" }}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h2>처방 원료 목록</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>처방코드</th>
                  <th>처방명</th>
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
                {formulaItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.formulas?.formula_code}</td>
                    <td>{item.formulas?.formula_name}</td>
                    <td>{item.phase}</td>
                    <td>{item.raw_materials?.raw_code}</td>
                    <td>{item.raw_materials?.raw_name}</td>
                    <td>{item.percentage}</td>
                    <td>{Number(item.raw_materials?.unit_price || 0).toLocaleString()}</td>
                    <td>{((Number(item.raw_materials?.unit_price || 0) * Number(item.percentage || 0)) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{item.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <p>처방 원료별 투입량과 구성성분을 전개해서 Full IL 형태로 표시합니다.</p>

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
            <h1>Formula Sheet</h1>
            <p>처방을 선택하면 Phase별 처방서가 자동 생성됩니다. 인쇄 버튼으로 PDF 저장도 가능합니다.</p>

            <div style={{ display: "grid", gap: "10px", maxWidth: "500px", marginBottom: "20px" }}>
              <select value={sheetFormulaId || ""} onChange={(e) => setSheetFormulaId(e.target.value)}>
                <option value="">처방 선택</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formula_code} - {f.formula_name} v{f.version}
                  </option>
                ))}
              </select>

              <button onClick={printFormulaSheet}>인쇄 / PDF 저장</button>
            </div>

            {sheetFormulaId && (
              <div
                id="formula-sheet"
                style={{
                  border: "1px solid #ddd",
                  padding: "32px",
                  maxWidth: "900px",
                  background: "white",
                }}
              >
                <h1 style={{ textAlign: "center" }}>FORMULA SHEET</h1>

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
                  </tbody>
                </table>

                {Array.from(
                  new Set(getFormulaSheetRows(sheetFormulaId).map((item) => item.phase || "미지정"))
                ).map((phase) => (
                  <div key={phase} style={{ marginBottom: "24px" }}>
                    <h2>{phase}</h2>

                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th>원료코드</th>
                          <th>원료명</th>
                          <th>투입량(%)</th>
                          <th>비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFormulaSheetRows(sheetFormulaId)
                          .filter((item) => (item.phase || "미지정") === phase)
                          .map((item) => (
                            <tr key={item.id}>
                              <td>{item.raw_materials?.raw_code}</td>
                              <td>{item.raw_materials?.raw_name}</td>
                              <td>{Number(item.percentage || 0).toFixed(4)}</td>
                              <td>{item.remark}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <h2 style={{ textAlign: "right" }}>
                  TOTAL: {getFormulaSheetTotal(sheetFormulaId).toFixed(4)}%
                </h2>

                <p
                  style={{
                    textAlign: "right",
                    color: Math.abs(getFormulaSheetTotal(sheetFormulaId) - 100) < 0.0001 ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {Math.abs(getFormulaSheetTotal(sheetFormulaId) - 100) < 0.0001
                    ? "TOTAL 100% 완료"
                    : "TOTAL 100% 아님"}
                </p>
              </div>
            )}
          </>
        )}

        {menu === "label" && (
          <>
            <h1>전성분</h1>
            <p>Breakdown IL 또는 Full IL 생성 후 1% Rule을 반영한 함량순 전성분 문구가 자동 생성됩니다.</p>
            <button onClick={downloadIngredientList} style={{ marginBottom: "12px" }}>
              전성분 다운로드
            </button>

            <h2>국문 전성분</h2>
            <div style={{ border: "1px solid #ddd", padding: "20px", maxWidth: "900px", lineHeight: "1.8" }}>
              {makeKoreanIngredientList() || "아직 생성된 전성분이 없습니다."}
            </div>

            <h2>영문 Ingredient List</h2>
            <div style={{ border: "1px solid #ddd", padding: "20px", maxWidth: "900px", lineHeight: "1.8" }}>
              {makeEnglishIngredientList() || "아직 생성된 Ingredient List가 없습니다."}
            </div>

            <h2>전성분 정렬 기준</h2>
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
                {getSortedIngredientItems().map((item) => (
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
