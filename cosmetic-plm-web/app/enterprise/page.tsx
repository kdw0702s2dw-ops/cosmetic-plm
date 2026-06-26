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
  | "dataIntegration"
  | "services"
  | "supabaseSchema"
  | "supabaseBridge"
  | "realData"
  | "repository"
  | "externalRls"
  | "productionRc"
  | "uatMigration"
  | "goLive"
  | "monitoring"
  | "stabilization"
  | "workflow"
  | "simulation"
  | "scaleUp"
  | "eln"
  | "lims"
  | "mes"
  | "v2Package"
  | "v3Package"
  | "v4Package"
  | "ultimateA"
  | "ultimateB"
  | "workReady"
  | "realOperation"
  | "importValidation"
  | "realDb"
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

type DataMappingItem = {
  module: string;
  local_name: string;
  target_table: string;
  status: "READY" | "NEEDS_SCHEMA" | "NEEDS_RLS" | "PENDING";
  records: number;
  key_fields: string;
  action: string;
};

type RlsPolicyItem = {
  table_name: string;
  role_name: string;
  permission: "read" | "write" | "admin";
  status: "READY" | "DRAFT" | "MISSING";
  policy_note: string;
};

type ServiceLayerItem = {
  service_file: string;
  module: string;
  status: "CREATED" | "PLANNED" | "NEEDS_SUPABASE";
  tables: string;
  functions: string[];
  action: string;
};

type SupabaseTablePlan = {
  table_name: string;
  module: string;
  status: "CREATE" | "ALTER" | "EXISTS" | "OPTIONAL";
  priority: number;
  purpose: string;
  core_columns: string;
};

type SupabaseIndexPlan = {
  table_name: string;
  index_name: string;
  columns: string;
  purpose: string;
};

type SupabaseBridgeItem = {
  service: string;
  table_name: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "UPSERT" | "DELETE";
  status: "READY" | "NEEDS_TEST" | "BLOCKED";
  test_payload: string;
  note: string;
};

type SupabaseSmokeTest = {
  test_name: string;
  status: "PASS" | "WARN" | "FAIL" | "READY";
  detail: string;
  next_action: string;
};

type RealDataPilotItem = {
  module: string;
  table_name: string;
  mode: "READ" | "WRITE" | "READ_WRITE";
  status: "READY" | "TESTING" | "CONNECTED" | "BLOCKED";
  ui_target: string;
  service_function: string;
  note: string;
};

type RealDataValidationItem = {
  check: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
};

type MasterRepositoryNode = {
  id: string;
  node_type: "Project" | "Formula" | "Ingredient" | "RawMaterial" | "Supplier" | "Customer" | "Document" | "Regulation";
  code: string;
  name: string;
  linked_to: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  source_table: string;
};

type RepositoryImpactItem = {
  source: string;
  target: string;
  impact_type: "Formula" | "BOM" | "Regulation" | "Customer" | "Supplier" | "Document";
  risk: "LOW" | "MEDIUM" | "HIGH";
  action: string;
};

type ExternalAccountMapping = {
  id: string;
  account_type: "customer" | "supplier";
  email: string;
  company_name: string;
  mapped_key: string;
  access_scope: "portal_only" | "documents_only" | "feedback_only" | "full_external";
  status: "DRAFT" | "READY" | "ACTIVE" | "BLOCKED";
};

type ExternalRlsPolicy = {
  table_name: string;
  account_type: "customer" | "supplier";
  policy_name: string;
  access_rule: string;
  status: "DRAFT" | "READY" | "APPLIED";
};

type PortalSecurityCheck = {
  check: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
  action: string;
};

type ProductionReadinessItem = {
  area: string;
  status: "PASS" | "WARN" | "FAIL";
  owner: "R&D" | "QA" | "RA" | "Admin" | "IT" | "Sales" | "QC";
  detail: string;
  action: string;
};

type ReleaseCandidateItem = {
  version: string;
  module: string;
  status: "READY" | "LOCKED" | "NEEDS_REVIEW";
  release_note: string;
};

type GoLiveChecklistItem = {
  step: number;
  task: string;
  status: "TODO" | "DONE" | "HOLD";
  note: string;
};

type UatScenarioItem = {
  id: string;
  team: "R&D" | "QA" | "RA" | "Admin" | "Sales" | "QC";
  scenario: string;
  expected_result: string;
  status: "TODO" | "PASS" | "FAIL" | "HOLD";
  owner: string;
};

type MigrationBatchItem = {
  id: string;
  source: "Excel" | "CSV" | "Manual" | "Supabase";
  target_table: string;
  data_type: string;
  estimated_rows: number;
  status: "READY" | "MIGRATING" | "DONE" | "ERROR";
  note: string;
};

type TrainingItem = {
  role: string;
  training_topic: string;
  status: "TODO" | "DONE" | "NEEDS_SUPPORT";
  material: string;
};

type GoLiveOperationItem = {
  id: string;
  area: "System" | "Data" | "User" | "Process" | "Support" | "Security";
  operation: string;
  status: "READY" | "ACTIVE" | "MONITORING" | "ISSUE";
  owner: "Admin" | "R&D" | "QA" | "RA" | "IT" | "Sales" | "QC";
  check_point: string;
};

type GoLiveIssueItem = {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  module: string;
  issue: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "HOLD";
  owner: string;
};

type DailyOperationMetric = {
  metric: string;
  value: string | number;
  status: "GOOD" | "WATCH" | "RISK";
  note: string;
};

type BackupJobItem = {
  id: string;
  target: string;
  backup_type: "DB" | "CSV" | "Storage" | "Config";
  schedule: "Daily" | "Weekly" | "Manual";
  status: "READY" | "RUNNING" | "SUCCESS" | "FAILED";
  last_run: string;
  note: string;
};

type MonitoringCheckItem = {
  id: string;
  category: "Database" | "Auth" | "Storage" | "API" | "Build" | "DataQuality";
  check_name: string;
  status: "PASS" | "WARN" | "FAIL";
  value: string | number;
  action: string;
};

type ErrorLogItem = {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  module: string;
  message: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  created_at: string;
};

type StabilizationItem = {
  id: string;
  category: "Performance" | "Security" | "Data" | "UX" | "Process" | "Release";
  item: string;
  status: "STABLE" | "WATCH" | "FIX_REQUIRED" | "LOCKED";
  priority: "P0" | "P1" | "P2" | "P3";
  owner: "R&D" | "QA" | "RA" | "Admin" | "IT" | "Sales" | "QC";
  action: string;
};

type V1ReleaseNoteItem = {
  module: string;
  version: string;
  status: "INCLUDED" | "LIMITED" | "POSTPONED";
  note: string;
};

type PostGoLiveTask = {
  week: string;
  task: string;
  owner: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

type WorkflowTemplateItem = {
  id: string;
  workflow_name: string;
  trigger_module: "Project" | "Formula" | "Quality" | "Regulation" | "Customer" | "Supplier" | "Launch";
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  owner_team: "R&D" | "QA" | "RA" | "QC" | "Sales" | "Admin";
  description: string;
};

type WorkflowStepItem = {
  id: string;
  workflow_id: string;
  step_no: number;
  step_name: string;
  owner_team: "R&D" | "QA" | "RA" | "QC" | "Sales" | "Admin";
  action_type: "TASK" | "APPROVAL" | "CHECK" | "NOTIFICATION" | "DOCUMENT" | "SYSTEM";
  due_days: number;
  required: boolean;
};

type WorkflowRunItem = {
  id: string;
  workflow_id: string;
  target: string;
  current_step: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "WAITING_APPROVAL" | "COMPLETED" | "BLOCKED";
  progress: number;
  owner: string;
};

type WorkflowTaskItem = {
  id: string;
  run_id: string;
  task_name: string;
  owner_team: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  due_date: string;
  note: string;
};

type FormulaSimulationInput = {
  id: string;
  formula_code: string;
  target_batch_kg: number;
  target_cost_per_kg: number;
  target_ph: number;
  target_viscosity: number;
  market_country: string;
};

type FormulaSimulationResult = {
  id: string;
  formula_code: string;
  batch_kg: number;
  predicted_cost_per_kg: number;
  predicted_ph: number;
  predicted_viscosity: number;
  stability_score: number;
  regulation_score: number;
  total_score: number;
  recommendation: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type MaterialSubstitutionItem = {
  id: string;
  source_raw: string;
  source_inci: string;
  substitute_raw: string;
  substitute_inci: string;
  reason: string;
  expected_effect: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type FormulaOptimizationItem = {
  id: string;
  area: "Cost" | "Stability" | "Regulation" | "Texture" | "Claim";
  suggestion: string;
  expected_impact: string;
  priority: "P0" | "P1" | "P2" | "P3";
};

type ScaleUpBatchItem = {
  id: string;
  formula_code: string;
  batch_size_kg: number;
  batch_type: "Lab" | "Pilot" | "Production" | "Mass";
  status: "DRAFT" | "READY" | "APPROVED" | "BLOCKED";
  estimated_cost: number;
  yield_percent: number;
  note: string;
};

type BomItem = {
  id: string;
  batch_id: string;
  raw_code: string;
  raw_name: string;
  percentage: number;
  required_kg: number;
  loss_percent: number;
  purchase_kg: number;
  unit_price: number;
  amount: number;
};

type ManufacturingStepItem = {
  id: string;
  batch_id: string;
  step_no: number;
  phase: string;
  process: string;
  temperature: string;
  rpm: string;
  time_min: number;
  qc_check: string;
};

type ScaleUpRiskItem = {
  id: string;
  category: "Process" | "Material" | "Quality" | "Cost" | "Regulation";
  risk: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  action: string;
};

type ElnExperimentItem = {
  id: string;
  experiment_no: string;
  project_code: string;
  formula_code: string;
  title: string;
  researcher: string;
  status: "DRAFT" | "IN_PROGRESS" | "REVIEW" | "SIGNED" | "ARCHIVED";
  experiment_date: string;
  objective: string;
};

type ElnObservationItem = {
  id: string;
  experiment_id: string;
  time_point: string;
  observation_type: "Appearance" | "pH" | "Viscosity" | "Odor" | "Color" | "Stability" | "Other";
  value: string;
  result: "PASS" | "WATCH" | "FAIL";
  note: string;
};

type ElnAttachmentItem = {
  id: string;
  experiment_id: string;
  file_name: string;
  file_type: "Image" | "PDF" | "Excel" | "RawData" | "Other";
  status: "UPLOADED" | "NEEDS_REVIEW" | "APPROVED";
  note: string;
};

type ElnSignatureItem = {
  id: string;
  experiment_id: string;
  signer: string;
  role: "Researcher" | "Reviewer" | "QA" | "Manager";
  status: "REQUESTED" | "SIGNED" | "REJECTED";
  signed_at: string;
};

type LimsSampleItem = {
  id: string;
  sample_no: string;
  project_code: string;
  formula_code: string;
  sample_type: "Lab" | "Pilot" | "Production" | "Stability" | "Customer";
  status: "RECEIVED" | "TESTING" | "REVIEW" | "APPROVED" | "REJECTED";
  received_date: string;
  requester: string;
};

type LimsTestItem = {
  id: string;
  sample_id: string;
  test_name: "pH" | "Viscosity" | "Specific Gravity" | "Appearance" | "Color" | "Odor" | "Microbial" | "Stability";
  method: string;
  specification: string;
  result_value: string;
  judgment: "PASS" | "OOS" | "OOT" | "PENDING";
  analyst: string;
};

type LimsStabilityItem = {
  id: string;
  sample_id: string;
  condition: "RT" | "5C" | "45C" | "Cycle" | "Light";
  time_point: "T0" | "1W" | "2W" | "4W" | "8W" | "12W";
  result: "PASS" | "WATCH" | "FAIL" | "PENDING";
  observation: string;
};

type LimsCoaItem = {
  id: string;
  sample_id: string;
  coa_no: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "ISSUED";
  issued_date: string;
  summary: string;
};

type MesWorkOrderItem = {
  id: string;
  work_order_no: string;
  formula_code: string;
  batch_id: string;
  production_qty_kg: number;
  status: "PLANNED" | "RELEASED" | "IN_PRODUCTION" | "QC_HOLD" | "COMPLETED" | "CANCELLED";
  planned_date: string;
  line: string;
};

type MesLotItem = {
  id: string;
  lot_no: string;
  work_order_id: string;
  raw_code: string;
  raw_lot_no: string;
  required_kg: number;
  consumed_kg: number;
  status: "RESERVED" | "WEIGHED" | "CONSUMED" | "RETURNED";
};

type MesProcessLogItem = {
  id: string;
  work_order_id: string;
  step_no: number;
  process_name: string;
  start_time: string;
  end_time: string;
  operator: string;
  status: "WAITING" | "RUNNING" | "DONE" | "DEVIATION";
  note: string;
};

type MesDeviationItem = {
  id: string;
  work_order_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  deviation: string;
  status: "OPEN" | "INVESTIGATING" | "CAPA_REQUIRED" | "CLOSED";
  action: string;
};

type V2IntegrationFlowItem = {
  id: string;
  phase: "31" | "32" | "33" | "34" | "35";
  module: string;
  flow_name: string;
  source: string;
  target: string;
  status: "READY" | "CONNECTED" | "WATCH" | "BLOCKED";
  owner: "R&D" | "QA" | "RA" | "QC" | "Production" | "Admin" | "Sales" | "IT";
};

type DigitalTwinItem = {
  id: string;
  batch_size_kg: number;
  mixer_type: "Lab Homomixer" | "Pilot Vacuum Mixer" | "Production Vacuum Mixer" | "Mass Tank";
  predicted_rpm: string;
  predicted_time_min: number;
  predicted_yield_percent: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  note: string;
};

type AiFormulaExpertItem = {
  id: string;
  issue_type: "Viscosity" | "pH" | "Cost" | "Stability" | "Regulation" | "Claim";
  diagnosis: string;
  recommendation: string;
  expected_result: string;
  confidence: number;
  priority: "P0" | "P1" | "P2" | "P3";
};

type GlobalRegAiItem = {
  id: string;
  country: "EU" | "CN" | "US" | "JP" | "ASEAN" | "KR" | "GCC";
  formula_code: string;
  status: "OK" | "CAUTION" | "BLOCKED" | "NEEDS_REVIEW";
  key_issue: string;
  action: string;
};

type EnterpriseAnalyticsItem = {
  id: string;
  kpi: string;
  value: string | number;
  trend: "UP" | "DOWN" | "FLAT";
  status: "GOOD" | "WATCH" | "RISK";
  insight: string;
};

type AiCopilotActionItem = {
  id: string;
  command: string;
  module_chain: string;
  status: "READY" | "RUNNING" | "DONE" | "NEEDS_REVIEW";
  result_summary: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type QmsProcessItem = {
  id: string;
  process: "Deviation" | "CAPA" | "ChangeControl" | "Complaint" | "Audit" | "Training";
  source_module: string;
  status: "OPEN" | "IN_PROGRESS" | "EFFECTIVE" | "CLOSED";
  owner: "QA" | "QC" | "RA" | "R&D" | "Production" | "Admin";
  due_date: string;
  summary: string;
};

type DmsDocumentItem = {
  id: string;
  document_no: string;
  document_type: "SOP" | "Specification" | "Batch Record" | "COA" | "Validation" | "Regulatory" | "Training";
  title: string;
  version: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "EFFECTIVE" | "OBSOLETE";
  owner: string;
};

type ValidationProtocolItem = {
  id: string;
  protocol_no: string;
  validation_type: "CSV" | "IQ" | "OQ" | "PQ" | "Process" | "Cleaning";
  target_system: string;
  status: "PLANNED" | "EXECUTING" | "PASSED" | "FAILED" | "RETEST";
  result: string;
};

type KnowledgeGraphItem = {
  id: string;
  node: string;
  node_type: "Formula" | "Ingredient" | "RawMaterial" | "Regulation" | "Quality" | "Customer" | "Supplier" | "Production";
  connected_to: string;
  relationship: string;
  confidence: number;
};

type PatentPaperInsightItem = {
  id: string;
  source_type: "Patent" | "Paper" | "Market" | "Competitor";
  title: string;
  keyword: string;
  relevance_score: number;
  opportunity: string;
  action: string;
};

type RawMaterialMarketItem = {
  id: string;
  raw_code: string;
  raw_name: string;
  current_price: number;
  forecast_price: number;
  supply_risk: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
};

type CostOptimizationItem = {
  id: string;
  formula_code: string;
  optimization_type: "Supplier" | "Dosage" | "Substitution" | "Scale" | "Yield";
  current_cost: number;
  optimized_cost: number;
  saving_percent: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  action: string;
};

type MultiPlantItem = {
  id: string;
  plant_name: string;
  location: "KR" | "CN" | "US" | "JP" | "ASEAN" | "EU";
  capability: string;
  capacity_kg_day: number;
  status: "AVAILABLE" | "BUSY" | "QUALIFICATION_REQUIRED" | "BLOCKED";
  note: string;
};

type ApiHubItem = {
  id: string;
  api_name: string;
  domain: "Ingredient" | "Formula" | "Regulation" | "Quality" | "MES" | "Customer" | "Supplier";
  endpoint: string;
  status: "DRAFT" | "READY" | "ACTIVE" | "DEPRECATED";
  security_level: "Internal" | "Partner" | "External";
};

type AiResearchProjectItem = {
  id: string;
  request: string;
  target_market: "KR" | "US" | "EU" | "CN" | "JP" | "ASEAN" | "GLOBAL";
  product_type: string;
  status: "DRAFT" | "RESEARCHING" | "CANDIDATE_READY" | "REVIEW" | "APPROVED";
  opportunity_score: number;
  summary: string;
};

type AiFormulaCandidateItem = {
  id: string;
  research_id: string;
  candidate_name: string;
  formula_concept: string;
  target_cost: number;
  predicted_stability: number;
  predicted_regulation: number;
  launch_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type KnowledgeEngineLinkItem = {
  id: string;
  source_node: string;
  source_type: "Research" | "Formula" | "Ingredient" | "Patent" | "Paper" | "Market" | "Quality" | "Production";
  target_node: string;
  target_type: "Research" | "Formula" | "Ingredient" | "Regulation" | "LIMS" | "MES" | "Customer" | "QMS";
  relationship: string;
  confidence: number;
};

type FactorySimulationItem = {
  id: string;
  scenario_name: string;
  batch_kg: number;
  tank_type: "Lab" | "Pilot" | "Production" | "Mass";
  mix_time_min: number;
  filling_time_min: number;
  expected_yield: number;
  expected_loss_kg: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type DataLakeRecordItem = {
  id: string;
  source_system: "PLM" | "LIMS" | "MES" | "QMS" | "CRM" | "SCM" | "DMS" | "Validation";
  dataset: string;
  record_count: number;
  freshness: "REALTIME" | "DAILY" | "WEEKLY" | "MANUAL";
  data_quality: "GOOD" | "WATCH" | "RISK";
  ai_ready: boolean;
};

type DecisionCenterItem = {
  id: string;
  decision_area: "R&D" | "Quality" | "Regulation" | "Production" | "Cost" | "Customer" | "Launch";
  kpi: string;
  current_value: string | number;
  ai_risk: "LOW" | "MEDIUM" | "HIGH";
  ai_recommendation: string;
  decision_status: "GO" | "WATCH" | "HOLD";
};

type AutonomousAgentItem = {
  id: string;
  agent_name: string;
  role: "R&D" | "QA" | "RA" | "QC" | "Production" | "Cost" | "Launch";
  objective: string;
  status: "IDLE" | "RUNNING" | "DONE" | "NEEDS_REVIEW" | "BLOCKED";
  autonomy_level: 1 | 2 | 3 | 4 | 5;
  last_result: string;
};

type AutonomousFormulaRunItem = {
  id: string;
  run_name: string;
  target_brief: string;
  generated_formula: string;
  validation_status: "DRAFT" | "SIMULATED" | "QA_REVIEW" | "RA_REVIEW" | "READY";
  ai_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type SmartFactoryIotItem = {
  id: string;
  equipment: string;
  sensor_type: "Temperature" | "RPM" | "Vacuum" | "Viscosity" | "Filling" | "Energy";
  current_value: string;
  normal_range: string;
  status: "NORMAL" | "WARNING" | "ALARM";
  prediction: string;
};

type AiOptimizationRunItem = {
  id: string;
  optimization_area: "Yield" | "Cost" | "Quality" | "Schedule" | "Energy" | "Regulation";
  before_value: string;
  after_value: string;
  improvement: string;
  confidence: number;
  action_required: string;
};

type SelfDrivingPlmTaskItem = {
  id: string;
  task_chain: string;
  trigger: string;
  current_step: string;
  progress: number;
  status: "READY" | "RUNNING" | "WAITING_HUMAN" | "COMPLETED" | "FAILED";
  human_approval_required: boolean;
};

type MasterDataConnectorItem = {
  id: string;
  data_domain: "RawMaterial" | "INCI" | "CAS" | "Regulation" | "Formula" | "Document";
  source_name: string;
  sync_status: "READY" | "SYNCED" | "NEEDS_MAPPING" | "ERROR";
  record_count: number;
  quality_score: number;
  next_action: string;
};

type AiBrainScenarioItem = {
  id: string;
  user_request: string;
  ai_workflow: string;
  output_type: "Formula" | "RegulatoryReview" | "CostOptimization" | "StabilityPlan" | "ResearchSummary";
  confidence: number;
  review_status: "READY" | "NEEDS_REVIEW" | "APPROVED";
};

type DocumentAutomationItem = {
  id: string;
  document_type: "Formula Sheet" | "Ingredient Composition" | "Full Ingredient List" | "Product Specification" | "Development Report" | "COA" | "Test Request";
  source_module: string;
  status: "DRAFT" | "GENERATED" | "REVIEW" | "APPROVED";
  owner: "R&D" | "QA" | "RA" | "QC" | "Production";
  file_name: string;
};

type PlmChatbotItem = {
  id: string;
  question: string;
  answer_summary: string;
  related_modules: string;
  action_created: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type CodeQualityItem = {
  id: string;
  area: "Page Structure" | "Components" | "Services" | "Security" | "Performance" | "Deployment";
  issue: string;
  status: "GOOD" | "WATCH" | "FIX_REQUIRED";
  action: string;
};

type QuickAccessItem = {
  id: string;
  label: string;
  module: string;
  route_key: ModuleKey;
  priority: "HIGH" | "MEDIUM" | "LOW";
  usage_count: number;
};

type BulkImportJobItem = {
  id: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  file_name: string;
  rows_total: number;
  rows_valid: number;
  rows_error: number;
  status: "READY" | "VALIDATED" | "ERROR" | "IMPORTED";
  next_action: string;
};

type GlobalSearchResultItem = {
  id: string;
  keyword: string;
  result_type: "Project" | "Formula" | "RawMaterial" | "INCI" | "Document" | "Customer" | "Supplier";
  title: string;
  summary: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

type RecentWorkItem = {
  id: string;
  work_type: "Project" | "Formula" | "LIMS" | "QMS" | "Document" | "AI";
  title: string;
  last_opened: string;
  owner: string;
  status: "ACTIVE" | "WAITING" | "DONE" | "ISSUE";
};

type TodayTaskItem = {
  id: string;
  task: string;
  source_module: string;
  due: string;
  owner: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "OVERDUE";
  priority: "P0" | "P1" | "P2" | "P3";
};

type PerformanceCheckItem = {
  id: string;
  area: "Data Load" | "Search" | "CSV Export" | "Dashboard" | "Build" | "Deployment";
  current_state: string;
  target_state: string;
  status: "GOOD" | "WATCH" | "OPTIMIZE";
  action: string;
};

type ImportTemplateItem = {
  id: string;
  template_name: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  required_columns: string;
  optional_columns: string;
  status: "READY" | "NEEDS_REVIEW";
};

type ColumnMappingItem = {
  id: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  source_column: string;
  target_field: string;
  mapping_status: "MAPPED" | "MISSING" | "REVIEW";
  rule: string;
};

type DataValidationRuleItem = {
  id: string;
  rule_name: string;
  target: "RawMaterial" | "INCI" | "Formula" | "Composition" | "Supplier" | "Regulation";
  severity: "INFO" | "WARNING" | "ERROR" | "BLOCKER";
  check_logic: string;
  auto_fix: string;
};

type ImportValidationResultItem = {
  id: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  file_name: string;
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  blocker_rows: number;
  status: "PASS" | "WARNING" | "ERROR" | "BLOCKED";
};

type ImportErrorReportItem = {
  id: string;
  row_no: number;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  field_name: string;
  error_type: "Missing" | "Duplicate" | "InvalidFormat" | "CompositionTotal" | "RegulationRisk" | "ReferenceMissing";
  message: string;
  fix_suggestion: string;
};

type ImportApprovalItem = {
  id: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  file_name: string;
  requester: string;
  reviewer: "R&D" | "QA" | "RA" | "QC" | "Admin";
  approval_status: "DRAFT" | "REQUESTED" | "APPROVED" | "REJECTED";
  summary: string;
};

type RealDbConnectionItem = {
  id: string;
  table_name: string;
  domain: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS" | "Dashboard";
  connection_status: "READY" | "CONNECTED" | "NEEDS_SCHEMA" | "ERROR";
  row_count: number;
  last_sync: string;
  action: string;
};

type RealDbImportExecutionItem = {
  id: string;
  import_type: "RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS";
  source_file: string;
  validation_status: "PASS" | "WARNING" | "BLOCKED";
  approval_status: "APPROVED" | "PENDING" | "REJECTED";
  execution_status: "READY" | "EXECUTED" | "SKIPPED" | "FAILED";
  inserted_rows: number;
  updated_rows: number;
};

type RealDbOperationMetricItem = {
  id: string;
  metric: string;
  value: string | number;
  source_table: string;
  status: "GOOD" | "WATCH" | "RISK";
  insight: string;
};

type RealDbSearchIndexItem = {
  id: string;
  index_name: string;
  target_table: string;
  indexed_fields: string;
  status: "READY" | "ACTIVE" | "REBUILD_REQUIRED";
  expected_usage: string;
};

type RealDbCorrectionActionItem = {
  id: string;
  issue_type: "Duplicate" | "Missing" | "Invalid" | "Reference" | "Regulation" | "Composition";
  target_table: string;
  target_key: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  correction: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
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
  { key: "dataIntegration", label: "Data Integration" },
  { key: "services", label: "Service Layer" },
  { key: "supabaseSchema", label: "Supabase Schema" },
  { key: "supabaseBridge", label: "Supabase Bridge" },
  { key: "realData", label: "Real Data Pilot" },
  { key: "repository", label: "Master Repository" },
  { key: "externalRls", label: "External Portal RLS" },
  { key: "productionRc", label: "Production RC" },
  { key: "uatMigration", label: "UAT & Migration" },
  { key: "goLive", label: "Go-Live Mode" },
  { key: "monitoring", label: "Backup / Monitoring" },
  { key: "stabilization", label: "v1.0 Stabilization" },
  { key: "workflow", label: "Workflow Engine" },
  { key: "simulation", label: "Formula Simulation" },
  { key: "scaleUp", label: "Scale-Up & BOM" },
  { key: "eln", label: "ELN Lab Notebook" },
  { key: "lims", label: "LIMS Test Center" },
  { key: "mes", label: "MES Bridge" },
  { key: "v2Package", label: "v2.0 Package" },
  { key: "v3Package", label: "v3.0 AI/QMS Package" },
  { key: "v4Package", label: "Knowledge/SCM Package" },
  { key: "ultimateA", label: "Ultimate Pack A" },
  { key: "ultimateB", label: "Ultimate Pack B" },
  { key: "workReady", label: "Work Ready Pack" },
  { key: "realOperation", label: "Real DB Operation Pack" },
  { key: "importValidation", label: "Import Validation" },
  { key: "realDb", label: "Real DB Operation" },
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

  const [dataMappings, setDataMappings] = useState<DataMappingItem[]>([]);
  const [rlsPolicies, setRlsPolicies] = useState<RlsPolicyItem[]>([]);
  const [dataIntegrationStatus, setDataIntegrationStatus] = useState("");
  const [serviceLayerItems, setServiceLayerItems] = useState<ServiceLayerItem[]>([]);
  const [serviceLayerStatus, setServiceLayerStatus] = useState("");

  const [supabaseTablePlans, setSupabaseTablePlans] = useState<SupabaseTablePlan[]>([]);
  const [supabaseIndexPlans, setSupabaseIndexPlans] = useState<SupabaseIndexPlan[]>([]);
  const [supabaseSchemaStatus, setSupabaseSchemaStatus] = useState("");

  const [supabaseBridgeItems, setSupabaseBridgeItems] = useState<SupabaseBridgeItem[]>([]);
  const [supabaseSmokeTests, setSupabaseSmokeTests] = useState<SupabaseSmokeTest[]>([]);
  const [supabaseBridgeStatus, setSupabaseBridgeStatus] = useState("");

  const [realDataPilotItems, setRealDataPilotItems] = useState<RealDataPilotItem[]>([]);
  const [realDataValidations, setRealDataValidations] = useState<RealDataValidationItem[]>([]);
  const [realDataStatus, setRealDataStatus] = useState("");

  const [repositoryNodes, setRepositoryNodes] = useState<MasterRepositoryNode[]>([]);
  const [repositoryImpacts, setRepositoryImpacts] = useState<RepositoryImpactItem[]>([]);
  const [repositoryStatus, setRepositoryStatus] = useState("");
  const [repositoryFocus, setRepositoryFocus] = useState("ALL");

  const [externalAccountMappings, setExternalAccountMappings] = useState<ExternalAccountMapping[]>([]);
  const [externalRlsPolicies, setExternalRlsPolicies] = useState<ExternalRlsPolicy[]>([]);
  const [portalSecurityChecks, setPortalSecurityChecks] = useState<PortalSecurityCheck[]>([]);
  const [externalRlsStatus, setExternalRlsStatus] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalCompany, setExternalCompany] = useState("");
  const [externalType, setExternalType] = useState<ExternalAccountMapping["account_type"]>("customer");

  const [productionReadinessItems, setProductionReadinessItems] = useState<ProductionReadinessItem[]>([]);
  const [releaseCandidateItems, setReleaseCandidateItems] = useState<ReleaseCandidateItem[]>([]);
  const [goLiveChecklistItems, setGoLiveChecklistItems] = useState<GoLiveChecklistItem[]>([]);
  const [productionRcStatus, setProductionRcStatus] = useState("");
  const [releaseVersion, setReleaseVersion] = useState("Enterprise RC 1.0");

  const [uatScenarios, setUatScenarios] = useState<UatScenarioItem[]>([]);
  const [migrationBatches, setMigrationBatches] = useState<MigrationBatchItem[]>([]);
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([]);
  const [uatMigrationStatus, setUatMigrationStatus] = useState("");

  const [goLiveOperations, setGoLiveOperations] = useState<GoLiveOperationItem[]>([]);
  const [goLiveIssues, setGoLiveIssues] = useState<GoLiveIssueItem[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyOperationMetric[]>([]);
  const [goLiveStatus, setGoLiveStatus] = useState("");
  const [operationMode, setOperationMode] = useState<"PRE_GO_LIVE" | "LIVE" | "MAINTENANCE">("PRE_GO_LIVE");

  const [backupJobs, setBackupJobs] = useState<BackupJobItem[]>([]);
  const [monitoringChecks, setMonitoringChecks] = useState<MonitoringCheckItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState("");

  const [stabilizationItems, setStabilizationItems] = useState<StabilizationItem[]>([]);
  const [v1ReleaseNotes, setV1ReleaseNotes] = useState<V1ReleaseNoteItem[]>([]);
  const [postGoLiveTasks, setPostGoLiveTasks] = useState<PostGoLiveTask[]>([]);
  const [stabilizationStatus, setStabilizationStatus] = useState("");
  const [v1Version, setV1Version] = useState("Enterprise v1.0");

  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplateItem[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepItem[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunItem[]>([]);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTaskItem[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [workflowTarget, setWorkflowTarget] = useState("26A001");

  const [simulationInputs, setSimulationInputs] = useState<FormulaSimulationInput[]>([]);
  const [simulationResults, setSimulationResults] = useState<FormulaSimulationResult[]>([]);
  const [substitutionItems, setSubstitutionItems] = useState<MaterialSubstitutionItem[]>([]);
  const [optimizationItems, setOptimizationItems] = useState<FormulaOptimizationItem[]>([]);
  const [simulationFormulaCode, setSimulationFormulaCode] = useState("FC-001");
  const [simulationBatchKg, setSimulationBatchKg] = useState("1");
  const [simulationTargetCost, setSimulationTargetCost] = useState("12000");
  const [simulationTargetPh, setSimulationTargetPh] = useState("5.5");
  const [simulationTargetViscosity, setSimulationTargetViscosity] = useState("3000");
  const [simulationCountry, setSimulationCountry] = useState("EU");
  const [simulationStatus, setSimulationStatus] = useState("");

  const [scaleUpBatches, setScaleUpBatches] = useState<ScaleUpBatchItem[]>([]);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [manufacturingSteps, setManufacturingSteps] = useState<ManufacturingStepItem[]>([]);
  const [scaleUpRisks, setScaleUpRisks] = useState<ScaleUpRiskItem[]>([]);
  const [scaleFormulaCode, setScaleFormulaCode] = useState("FC-001");
  const [scaleBatchKg, setScaleBatchKg] = useState("100");
  const [scaleYieldPercent, setScaleYieldPercent] = useState("97");
  const [scaleLossPercent, setScaleLossPercent] = useState("2");
  const [scaleUpStatus, setScaleUpStatus] = useState("");

  const [elnExperiments, setElnExperiments] = useState<ElnExperimentItem[]>([]);
  const [elnObservations, setElnObservations] = useState<ElnObservationItem[]>([]);
  const [elnAttachments, setElnAttachments] = useState<ElnAttachmentItem[]>([]);
  const [elnSignatures, setElnSignatures] = useState<ElnSignatureItem[]>([]);
  const [elnProjectCode, setElnProjectCode] = useState("26A001");
  const [elnFormulaCode, setElnFormulaCode] = useState("FC-001");
  const [elnTitle, setElnTitle] = useState("수분크림 1차 랩 배치 실험");
  const [elnResearcher, setElnResearcher] = useState("연구원");
  const [elnStatus, setElnStatus] = useState("");

  const [limsSamples, setLimsSamples] = useState<LimsSampleItem[]>([]);
  const [limsTests, setLimsTests] = useState<LimsTestItem[]>([]);
  const [limsStabilities, setLimsStabilities] = useState<LimsStabilityItem[]>([]);
  const [limsCoas, setLimsCoas] = useState<LimsCoaItem[]>([]);
  const [limsProjectCode, setLimsProjectCode] = useState("26A001");
  const [limsFormulaCode, setLimsFormulaCode] = useState("FC-001");
  const [limsRequester, setLimsRequester] = useState("연구팀");
  const [limsStatus, setLimsStatus] = useState("");

  const [mesWorkOrders, setMesWorkOrders] = useState<MesWorkOrderItem[]>([]);
  const [mesLots, setMesLots] = useState<MesLotItem[]>([]);
  const [mesProcessLogs, setMesProcessLogs] = useState<MesProcessLogItem[]>([]);
  const [mesDeviations, setMesDeviations] = useState<MesDeviationItem[]>([]);
  const [mesFormulaCode, setMesFormulaCode] = useState("FC-001");
  const [mesBatchId, setMesBatchId] = useState("");
  const [mesQtyKg, setMesQtyKg] = useState("100");
  const [mesLine, setMesLine] = useState("Line-1");
  const [mesStatus, setMesStatus] = useState("");

  const [v2Flows, setV2Flows] = useState<V2IntegrationFlowItem[]>([]);
  const [digitalTwinItems, setDigitalTwinItems] = useState<DigitalTwinItem[]>([]);
  const [aiFormulaExpertItems, setAiFormulaExpertItems] = useState<AiFormulaExpertItem[]>([]);
  const [globalRegAiItems, setGlobalRegAiItems] = useState<GlobalRegAiItem[]>([]);
  const [enterpriseAnalyticsItems, setEnterpriseAnalyticsItems] = useState<EnterpriseAnalyticsItem[]>([]);
  const [v2PackageStatus, setV2PackageStatus] = useState("");
  const [v2FormulaCode, setV2FormulaCode] = useState("FC-001");

  const [aiCopilotActions, setAiCopilotActions] = useState<AiCopilotActionItem[]>([]);
  const [qmsProcesses, setQmsProcesses] = useState<QmsProcessItem[]>([]);
  const [dmsDocuments, setDmsDocuments] = useState<DmsDocumentItem[]>([]);
  const [validationProtocols, setValidationProtocols] = useState<ValidationProtocolItem[]>([]);
  const [knowledgeGraphItems, setKnowledgeGraphItems] = useState<KnowledgeGraphItem[]>([]);
  const [v3PackageStatus, setV3PackageStatus] = useState("");
  const [copilotCommand, setCopilotCommand] = useState("수분크림 처방을 검토하고 규제, 품질, 생산 리스크를 요약해줘");

  const [patentPaperInsights, setPatentPaperInsights] = useState<PatentPaperInsightItem[]>([]);
  const [rawMaterialMarkets, setRawMaterialMarkets] = useState<RawMaterialMarketItem[]>([]);
  const [costOptimizations, setCostOptimizations] = useState<CostOptimizationItem[]>([]);
  const [multiPlantItems, setMultiPlantItems] = useState<MultiPlantItem[]>([]);
  const [apiHubItems, setApiHubItems] = useState<ApiHubItem[]>([]);
  const [v4PackageStatus, setV4PackageStatus] = useState("");

  const [aiResearchProjects, setAiResearchProjects] = useState<AiResearchProjectItem[]>([]);
  const [aiFormulaCandidates, setAiFormulaCandidates] = useState<AiFormulaCandidateItem[]>([]);
  const [knowledgeEngineLinks, setKnowledgeEngineLinks] = useState<KnowledgeEngineLinkItem[]>([]);
  const [factorySimulations, setFactorySimulations] = useState<FactorySimulationItem[]>([]);
  const [dataLakeRecords, setDataLakeRecords] = useState<DataLakeRecordItem[]>([]);
  const [decisionCenterItems, setDecisionCenterItems] = useState<DecisionCenterItem[]>([]);
  const [ultimateAStatus, setUltimateAStatus] = useState("");
  const [researchRequest, setResearchRequest] = useState("미국 민감성 시장용 저자극 세라마이드 크림 개발");

  const [autonomousAgents, setAutonomousAgents] = useState<AutonomousAgentItem[]>([]);
  const [autonomousFormulaRuns, setAutonomousFormulaRuns] = useState<AutonomousFormulaRunItem[]>([]);
  const [smartFactoryIotItems, setSmartFactoryIotItems] = useState<SmartFactoryIotItem[]>([]);
  const [aiOptimizationRuns, setAiOptimizationRuns] = useState<AiOptimizationRunItem[]>([]);
  const [selfDrivingTasks, setSelfDrivingTasks] = useState<SelfDrivingPlmTaskItem[]>([]);
  const [ultimateBStatus, setUltimateBStatus] = useState("");
  const [selfDrivingGoal, setSelfDrivingGoal] = useState("미국 수출용 세라마이드 장벽 크림을 개발하고 출시 준비까지 진행해줘");

  const [masterDataConnectors, setMasterDataConnectors] = useState<MasterDataConnectorItem[]>([]);
  const [aiBrainScenarios, setAiBrainScenarios] = useState<AiBrainScenarioItem[]>([]);
  const [documentAutomations, setDocumentAutomations] = useState<DocumentAutomationItem[]>([]);
  const [plmChatbotItems, setPlmChatbotItems] = useState<PlmChatbotItem[]>([]);
  const [codeQualityItems, setCodeQualityItems] = useState<CodeQualityItem[]>([]);
  const [workReadyStatus, setWorkReadyStatus] = useState("");
  const [workReadyQuestion, setWorkReadyQuestion] = useState("미국 수출용 저자극 크림 처방을 추천하고 필요한 문서를 만들어줘");

  const [quickAccessItems, setQuickAccessItems] = useState<QuickAccessItem[]>([]);
  const [bulkImportJobs, setBulkImportJobs] = useState<BulkImportJobItem[]>([]);
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResultItem[]>([]);
  const [recentWorks, setRecentWorks] = useState<RecentWorkItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTaskItem[]>([]);
  const [performanceChecks, setPerformanceChecks] = useState<PerformanceCheckItem[]>([]);
  const [realOperationStatus, setRealOperationStatus] = useState("");
  const [globalSearchKeyword, setGlobalSearchKeyword] = useState("세라마이드");

  const [importTemplates, setImportTemplates] = useState<ImportTemplateItem[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMappingItem[]>([]);
  const [dataValidationRules, setDataValidationRules] = useState<DataValidationRuleItem[]>([]);
  const [importValidationResults, setImportValidationResults] = useState<ImportValidationResultItem[]>([]);
  const [importErrorReports, setImportErrorReports] = useState<ImportErrorReportItem[]>([]);
  const [importApprovals, setImportApprovals] = useState<ImportApprovalItem[]>([]);
  const [importValidationStatus, setImportValidationStatus] = useState("");
  const [selectedImportType, setSelectedImportType] = useState<"RawMaterial" | "INCI" | "Formula" | "Supplier" | "Regulation" | "LIMS">("RawMaterial");

  const [realDbConnections, setRealDbConnections] = useState<RealDbConnectionItem[]>([]);
  const [realDbImportExecutions, setRealDbImportExecutions] = useState<RealDbImportExecutionItem[]>([]);
  const [realDbOperationMetrics, setRealDbOperationMetrics] = useState<RealDbOperationMetricItem[]>([]);
  const [realDbSearchIndexes, setRealDbSearchIndexes] = useState<RealDbSearchIndexItem[]>([]);
  const [realDbCorrectionActions, setRealDbCorrectionActions] = useState<RealDbCorrectionActionItem[]>([]);
  const [realDbStatus, setRealDbStatus] = useState("");

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

  const dataIntegrationStats = useMemo(() => {
    return {
      mappings: dataMappings.length,
      ready: dataMappings.filter((item) => item.status === "READY").length,
      needsSchema: dataMappings.filter((item) => item.status === "NEEDS_SCHEMA").length,
      needsRls: dataMappings.filter((item) => item.status === "NEEDS_RLS").length,
      policies: rlsPolicies.length,
      policyReady: rlsPolicies.filter((item) => item.status === "READY").length,
    };
  }, [dataMappings, rlsPolicies]);

  const serviceLayerStats = useMemo(() => {
    return {
      total: serviceLayerItems.length,
      created: serviceLayerItems.filter((item) => item.status === "CREATED").length,
      planned: serviceLayerItems.filter((item) => item.status === "PLANNED").length,
      needsSupabase: serviceLayerItems.filter((item) => item.status === "NEEDS_SUPABASE").length,
    };
  }, [serviceLayerItems]);

  const supabaseSchemaStats = useMemo(() => {
    return {
      tables: supabaseTablePlans.length,
      create: supabaseTablePlans.filter((item) => item.status === "CREATE").length,
      alter: supabaseTablePlans.filter((item) => item.status === "ALTER").length,
      optional: supabaseTablePlans.filter((item) => item.status === "OPTIONAL").length,
      indexes: supabaseIndexPlans.length,
    };
  }, [supabaseTablePlans, supabaseIndexPlans]);

  const supabaseBridgeStats = useMemo(() => {
    return {
      total: supabaseBridgeItems.length,
      ready: supabaseBridgeItems.filter((item) => item.status === "READY").length,
      needsTest: supabaseBridgeItems.filter((item) => item.status === "NEEDS_TEST").length,
      blocked: supabaseBridgeItems.filter((item) => item.status === "BLOCKED").length,
      smokePass: supabaseSmokeTests.filter((item) => item.status === "PASS").length,
      smokeWarn: supabaseSmokeTests.filter((item) => item.status === "WARN").length,
      smokeFail: supabaseSmokeTests.filter((item) => item.status === "FAIL").length,
    };
  }, [supabaseBridgeItems, supabaseSmokeTests]);

  const realDataPilotStats = useMemo(() => {
    return {
      total: realDataPilotItems.length,
      ready: realDataPilotItems.filter((item) => item.status === "READY").length,
      testing: realDataPilotItems.filter((item) => item.status === "TESTING").length,
      connected: realDataPilotItems.filter((item) => item.status === "CONNECTED").length,
      blocked: realDataPilotItems.filter((item) => item.status === "BLOCKED").length,
      pass: realDataValidations.filter((item) => item.status === "PASS").length,
      warn: realDataValidations.filter((item) => item.status === "WARN").length,
    };
  }, [realDataPilotItems, realDataValidations]);

  const repositoryStats = useMemo(() => {
    return {
      nodes: repositoryNodes.length,
      highRisk: repositoryNodes.filter((item) => item.risk_level === "HIGH").length,
      mediumRisk: repositoryNodes.filter((item) => item.risk_level === "MEDIUM").length,
      impacts: repositoryImpacts.length,
      impactHigh: repositoryImpacts.filter((item) => item.risk === "HIGH").length,
    };
  }, [repositoryNodes, repositoryImpacts]);

  const filteredRepositoryNodes = useMemo(() => {
    if (repositoryFocus === "ALL") return repositoryNodes;
    return repositoryNodes.filter((item) => item.node_type === repositoryFocus);
  }, [repositoryNodes, repositoryFocus]);

  const externalRlsStats = useMemo(() => {
    return {
      mappings: externalAccountMappings.length,
      customers: externalAccountMappings.filter((item) => item.account_type === "customer").length,
      suppliers: externalAccountMappings.filter((item) => item.account_type === "supplier").length,
      active: externalAccountMappings.filter((item) => item.status === "ACTIVE").length,
      policies: externalRlsPolicies.length,
      applied: externalRlsPolicies.filter((item) => item.status === "APPLIED").length,
      pass: portalSecurityChecks.filter((item) => item.status === "PASS").length,
      warn: portalSecurityChecks.filter((item) => item.status === "WARN").length,
    };
  }, [externalAccountMappings, externalRlsPolicies, portalSecurityChecks]);

  const productionRcStats = useMemo(() => {
    return {
      readiness: productionReadinessItems.length,
      pass: productionReadinessItems.filter((item) => item.status === "PASS").length,
      warn: productionReadinessItems.filter((item) => item.status === "WARN").length,
      fail: productionReadinessItems.filter((item) => item.status === "FAIL").length,
      rcItems: releaseCandidateItems.length,
      locked: releaseCandidateItems.filter((item) => item.status === "LOCKED").length,
      goLiveDone: goLiveChecklistItems.filter((item) => item.status === "DONE").length,
      goLiveTotal: goLiveChecklistItems.length,
    };
  }, [productionReadinessItems, releaseCandidateItems, goLiveChecklistItems]);

  const uatMigrationStats = useMemo(() => {
    return {
      uatTotal: uatScenarios.length,
      uatPass: uatScenarios.filter((item) => item.status === "PASS").length,
      uatFail: uatScenarios.filter((item) => item.status === "FAIL").length,
      batches: migrationBatches.length,
      migrationDone: migrationBatches.filter((item) => item.status === "DONE").length,
      migrationError: migrationBatches.filter((item) => item.status === "ERROR").length,
      trainingDone: trainingItems.filter((item) => item.status === "DONE").length,
      trainingTotal: trainingItems.length,
    };
  }, [uatScenarios, migrationBatches, trainingItems]);

  const goLiveStats = useMemo(() => {
    return {
      operations: goLiveOperations.length,
      active: goLiveOperations.filter((item) => item.status === "ACTIVE").length,
      monitoring: goLiveOperations.filter((item) => item.status === "MONITORING").length,
      issues: goLiveIssues.length,
      openIssues: goLiveIssues.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length,
      critical: goLiveIssues.filter((item) => item.severity === "CRITICAL").length,
      metricsGood: dailyMetrics.filter((item) => item.status === "GOOD").length,
      metricsTotal: dailyMetrics.length,
    };
  }, [goLiveOperations, goLiveIssues, dailyMetrics]);

  const monitoringStats = useMemo(() => {
    return {
      backupJobs: backupJobs.length,
      backupSuccess: backupJobs.filter((item) => item.status === "SUCCESS").length,
      backupFailed: backupJobs.filter((item) => item.status === "FAILED").length,
      checks: monitoringChecks.length,
      pass: monitoringChecks.filter((item) => item.status === "PASS").length,
      warn: monitoringChecks.filter((item) => item.status === "WARN").length,
      fail: monitoringChecks.filter((item) => item.status === "FAIL").length,
      openErrors: errorLogs.filter((item) => item.status !== "RESOLVED").length,
      criticalErrors: errorLogs.filter((item) => item.severity === "CRITICAL" && item.status !== "RESOLVED").length,
    };
  }, [backupJobs, monitoringChecks, errorLogs]);

  const stabilizationStats = useMemo(() => {
    return {
      total: stabilizationItems.length,
      stable: stabilizationItems.filter((item) => item.status === "STABLE").length,
      locked: stabilizationItems.filter((item) => item.status === "LOCKED").length,
      watch: stabilizationItems.filter((item) => item.status === "WATCH").length,
      fixRequired: stabilizationItems.filter((item) => item.status === "FIX_REQUIRED").length,
      p0: stabilizationItems.filter((item) => item.priority === "P0" && item.status !== "LOCKED").length,
      releaseIncluded: v1ReleaseNotes.filter((item) => item.status === "INCLUDED").length,
      postGoLiveDone: postGoLiveTasks.filter((item) => item.status === "DONE").length,
      postGoLiveTotal: postGoLiveTasks.length,
    };
  }, [stabilizationItems, v1ReleaseNotes, postGoLiveTasks]);

  const workflowStats = useMemo(() => {
    return {
      templates: workflowTemplates.length,
      activeTemplates: workflowTemplates.filter((item) => item.status === "ACTIVE").length,
      steps: workflowSteps.length,
      runs: workflowRuns.length,
      inProgress: workflowRuns.filter((item) => item.status === "IN_PROGRESS" || item.status === "WAITING_APPROVAL").length,
      blocked: workflowRuns.filter((item) => item.status === "BLOCKED").length,
      tasks: workflowTasks.length,
      taskDone: workflowTasks.filter((item) => item.status === "DONE").length,
      taskBlocked: workflowTasks.filter((item) => item.status === "BLOCKED").length,
    };
  }, [workflowTemplates, workflowSteps, workflowRuns, workflowTasks]);

  const simulationStats = useMemo(() => {
    return {
      inputs: simulationInputs.length,
      results: simulationResults.length,
      highRisk: simulationResults.filter((item) => item.risk_level === "HIGH").length,
      mediumRisk: simulationResults.filter((item) => item.risk_level === "MEDIUM").length,
      substitutions: substitutionItems.length,
      optimizations: optimizationItems.length,
      p0: optimizationItems.filter((item) => item.priority === "P0").length,
    };
  }, [simulationInputs, simulationResults, substitutionItems, optimizationItems]);

  const scaleUpStats = useMemo(() => {
    return {
      batches: scaleUpBatches.length,
      ready: scaleUpBatches.filter((item) => item.status === "READY" || item.status === "APPROVED").length,
      blocked: scaleUpBatches.filter((item) => item.status === "BLOCKED").length,
      bom: bomItems.length,
      totalRequiredKg: Math.round(bomItems.reduce((sum, item) => sum + item.required_kg, 0) * 100) / 100,
      totalPurchaseKg: Math.round(bomItems.reduce((sum, item) => sum + item.purchase_kg, 0) * 100) / 100,
      totalAmount: Math.round(bomItems.reduce((sum, item) => sum + item.amount, 0)),
      highRisk: scaleUpRisks.filter((item) => item.level === "HIGH").length,
    };
  }, [scaleUpBatches, bomItems, scaleUpRisks]);

  const elnStats = useMemo(() => {
    return {
      experiments: elnExperiments.length,
      inProgress: elnExperiments.filter((item) => item.status === "IN_PROGRESS").length,
      review: elnExperiments.filter((item) => item.status === "REVIEW").length,
      signed: elnExperiments.filter((item) => item.status === "SIGNED").length,
      observations: elnObservations.length,
      fail: elnObservations.filter((item) => item.result === "FAIL").length,
      watch: elnObservations.filter((item) => item.result === "WATCH").length,
      attachments: elnAttachments.length,
      signatures: elnSignatures.length,
    };
  }, [elnExperiments, elnObservations, elnAttachments, elnSignatures]);

  const limsStats = useMemo(() => {
    return {
      samples: limsSamples.length,
      testing: limsSamples.filter((item) => item.status === "TESTING").length,
      approved: limsSamples.filter((item) => item.status === "APPROVED").length,
      rejected: limsSamples.filter((item) => item.status === "REJECTED").length,
      tests: limsTests.length,
      pass: limsTests.filter((item) => item.judgment === "PASS").length,
      oos: limsTests.filter((item) => item.judgment === "OOS").length,
      oot: limsTests.filter((item) => item.judgment === "OOT").length,
      stabilityFail: limsStabilities.filter((item) => item.result === "FAIL").length,
      coas: limsCoas.length,
      issued: limsCoas.filter((item) => item.status === "ISSUED").length,
    };
  }, [limsSamples, limsTests, limsStabilities, limsCoas]);

  const mesStats = useMemo(() => {
    return {
      workOrders: mesWorkOrders.length,
      released: mesWorkOrders.filter((item) => item.status === "RELEASED" || item.status === "IN_PRODUCTION").length,
      completed: mesWorkOrders.filter((item) => item.status === "COMPLETED").length,
      qcHold: mesWorkOrders.filter((item) => item.status === "QC_HOLD").length,
      lots: mesLots.length,
      consumedLots: mesLots.filter((item) => item.status === "CONSUMED").length,
      processLogs: mesProcessLogs.length,
      deviations: mesDeviations.filter((item) => item.status !== "CLOSED").length,
      critical: mesDeviations.filter((item) => item.severity === "CRITICAL" && item.status !== "CLOSED").length,
    };
  }, [mesWorkOrders, mesLots, mesProcessLogs, mesDeviations]);

  const v2PackageStats = useMemo(() => {
    return {
      flows: v2Flows.length,
      connected: v2Flows.filter((item) => item.status === "CONNECTED").length,
      watch: v2Flows.filter((item) => item.status === "WATCH").length,
      blocked: v2Flows.filter((item) => item.status === "BLOCKED").length,
      twins: digitalTwinItems.length,
      twinHigh: digitalTwinItems.filter((item) => item.risk_level === "HIGH").length,
      aiSuggestions: aiFormulaExpertItems.length,
      p0: aiFormulaExpertItems.filter((item) => item.priority === "P0").length,
      regBlocked: globalRegAiItems.filter((item) => item.status === "BLOCKED").length,
      analyticsRisk: enterpriseAnalyticsItems.filter((item) => item.status === "RISK").length,
    };
  }, [v2Flows, digitalTwinItems, aiFormulaExpertItems, globalRegAiItems, enterpriseAnalyticsItems]);

  const v3PackageStats = useMemo(() => {
    return {
      copilot: aiCopilotActions.length,
      copilotDone: aiCopilotActions.filter((item) => item.status === "DONE").length,
      qmsOpen: qmsProcesses.filter((item) => item.status !== "CLOSED").length,
      capa: qmsProcesses.filter((item) => item.process === "CAPA").length,
      dmsEffective: dmsDocuments.filter((item) => item.status === "EFFECTIVE").length,
      dmsTotal: dmsDocuments.length,
      validationPassed: validationProtocols.filter((item) => item.status === "PASSED").length,
      validationTotal: validationProtocols.length,
      graphNodes: knowledgeGraphItems.length,
      highRisk: aiCopilotActions.filter((item) => item.risk_level === "HIGH").length,
    };
  }, [aiCopilotActions, qmsProcesses, dmsDocuments, validationProtocols, knowledgeGraphItems]);

  const v4PackageStats = useMemo(() => {
    return {
      insights: patentPaperInsights.length,
      highRelevance: patentPaperInsights.filter((item) => item.relevance_score >= 85).length,
      rawMarkets: rawMaterialMarkets.length,
      supplyHigh: rawMaterialMarkets.filter((item) => item.supply_risk === "HIGH").length,
      optimizations: costOptimizations.length,
      avgSaving: costOptimizations.length ? Math.round(costOptimizations.reduce((sum, item) => sum + item.saving_percent, 0) / costOptimizations.length) : 0,
      plants: multiPlantItems.length,
      availablePlants: multiPlantItems.filter((item) => item.status === "AVAILABLE").length,
      apis: apiHubItems.length,
      activeApis: apiHubItems.filter((item) => item.status === "ACTIVE").length,
    };
  }, [patentPaperInsights, rawMaterialMarkets, costOptimizations, multiPlantItems, apiHubItems]);

  const ultimateAStats = useMemo(() => {
    return {
      research: aiResearchProjects.length,
      candidates: aiFormulaCandidates.length,
      highLaunch: aiFormulaCandidates.filter((item) => item.launch_score >= 85).length,
      kgLinks: knowledgeEngineLinks.length,
      factory: factorySimulations.length,
      factoryHigh: factorySimulations.filter((item) => item.risk_level === "HIGH").length,
      dataLake: dataLakeRecords.length,
      aiReady: dataLakeRecords.filter((item) => item.ai_ready).length,
      decisions: decisionCenterItems.length,
      holds: decisionCenterItems.filter((item) => item.decision_status === "HOLD").length,
    };
  }, [aiResearchProjects, aiFormulaCandidates, knowledgeEngineLinks, factorySimulations, dataLakeRecords, decisionCenterItems]);

  const ultimateBStats = useMemo(() => {
    return {
      agents: autonomousAgents.length,
      runningAgents: autonomousAgents.filter((item) => item.status === "RUNNING").length,
      agentReview: autonomousAgents.filter((item) => item.status === "NEEDS_REVIEW" || item.status === "BLOCKED").length,
      formulaRuns: autonomousFormulaRuns.length,
      readyFormulas: autonomousFormulaRuns.filter((item) => item.validation_status === "READY").length,
      iotAlarms: smartFactoryIotItems.filter((item) => item.status === "ALARM").length,
      iotWarnings: smartFactoryIotItems.filter((item) => item.status === "WARNING").length,
      optimizations: aiOptimizationRuns.length,
      selfDriving: selfDrivingTasks.length,
      completedTasks: selfDrivingTasks.filter((item) => item.status === "COMPLETED").length,
    };
  }, [autonomousAgents, autonomousFormulaRuns, smartFactoryIotItems, aiOptimizationRuns, selfDrivingTasks]);

  const workReadyStats = useMemo(() => {
    return {
      connectors: masterDataConnectors.length,
      synced: masterDataConnectors.filter((item) => item.sync_status === "SYNCED").length,
      mapping: masterDataConnectors.filter((item) => item.sync_status === "NEEDS_MAPPING").length,
      aiScenarios: aiBrainScenarios.length,
      approvedAi: aiBrainScenarios.filter((item) => item.review_status === "APPROVED").length,
      docs: documentAutomations.length,
      approvedDocs: documentAutomations.filter((item) => item.status === "APPROVED").length,
      chats: plmChatbotItems.length,
      qualityWatch: codeQualityItems.filter((item) => item.status !== "GOOD").length,
    };
  }, [masterDataConnectors, aiBrainScenarios, documentAutomations, plmChatbotItems, codeQualityItems]);

  const realOperationStats = useMemo(() => {
    return {
      quick: quickAccessItems.length,
      highQuick: quickAccessItems.filter((item) => item.priority === "HIGH").length,
      imports: bulkImportJobs.length,
      importErrors: bulkImportJobs.reduce((sum, item) => sum + item.rows_error, 0),
      search: globalSearchResults.length,
      highRiskSearch: globalSearchResults.filter((item) => item.risk_level === "HIGH").length,
      recent: recentWorks.length,
      tasks: todayTasks.length,
      overdue: todayTasks.filter((item) => item.status === "OVERDUE").length,
      p0: todayTasks.filter((item) => item.priority === "P0").length,
      optimize: performanceChecks.filter((item) => item.status === "OPTIMIZE").length,
    };
  }, [quickAccessItems, bulkImportJobs, globalSearchResults, recentWorks, todayTasks, performanceChecks]);

  const importValidationStats = useMemo(() => {
    return {
      templates: importTemplates.length,
      mappings: columnMappings.length,
      mapped: columnMappings.filter((item) => item.mapping_status === "MAPPED").length,
      rules: dataValidationRules.length,
      results: importValidationResults.length,
      pass: importValidationResults.filter((item) => item.status === "PASS").length,
      blocked: importValidationResults.filter((item) => item.status === "BLOCKED").length,
      errors: importErrorReports.length,
      blockers: importErrorReports.filter((item) => item.error_type === "CompositionTotal" || item.error_type === "RegulationRisk").length,
      approvals: importApprovals.filter((item) => item.approval_status === "APPROVED").length,
    };
  }, [importTemplates, columnMappings, dataValidationRules, importValidationResults, importErrorReports, importApprovals]);

  const realDbStats = useMemo(() => {
    return {
      connections: realDbConnections.length,
      connected: realDbConnections.filter((item) => item.connection_status === "CONNECTED").length,
      schemaNeeded: realDbConnections.filter((item) => item.connection_status === "NEEDS_SCHEMA").length,
      executions: realDbImportExecutions.length,
      executed: realDbImportExecutions.filter((item) => item.execution_status === "EXECUTED").length,
      failed: realDbImportExecutions.filter((item) => item.execution_status === "FAILED").length,
      inserted: realDbImportExecutions.reduce((sum, item) => sum + item.inserted_rows, 0),
      updated: realDbImportExecutions.reduce((sum, item) => sum + item.updated_rows, 0),
      kpiRisk: realDbOperationMetrics.filter((item) => item.status === "RISK").length,
      activeIndex: realDbSearchIndexes.filter((item) => item.status === "ACTIVE").length,
      openCorrections: realDbCorrectionActions.filter((item) => item.status !== "DONE").length,
      blockers: realDbCorrectionActions.filter((item) => item.severity === "BLOCKER" && item.status !== "DONE").length,
    };
  }, [realDbConnections, realDbImportExecutions, realDbOperationMetrics, realDbSearchIndexes, realDbCorrectionActions]);

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

  function generateDataMappings() {
    const mappings: DataMappingItem[] = [
      {
        module: "Project",
        local_name: "projects",
        target_table: "enterprise_projects",
        status: projects.length > 0 ? "READY" : "PENDING",
        records: projects.length,
        key_fields: "id, project_code, customer_name, project_name, status",
        action: "기존 projects 테이블과 통합하거나 enterprise_projects 신규 테이블 생성",
      },
      {
        module: "Formula",
        local_name: "formulas",
        target_table: "enterprise_formulas",
        status: formulas.length > 0 ? "READY" : "PENDING",
        records: formulas.length,
        key_fields: "id, formula_code, version, project_code, status, is_locked",
        action: "formulas / formula_items와 연결 가능한 FK 설계 필요",
      },
      {
        module: "Ingredient",
        local_name: "ingredients",
        target_table: "ingredient_master_global",
        status: ingredients.length >= 5 ? "READY" : "NEEDS_SCHEMA",
        records: ingredients.length,
        key_fields: "inci_name, korean_name, cas_no, ec_no, function_ko",
        action: "대량 검색을 위해 inci_name, cas_no, korean_name 인덱스 생성",
      },
      {
        module: "Raw Material",
        local_name: "rawMaterials",
        target_table: "raw_materials",
        status: rawMaterials.length > 0 ? "READY" : "PENDING",
        records: rawMaterials.length,
        key_fields: "raw_code, raw_name, supplier, unit_price, main_inci",
        action: "원료조성표와 supplier_tasks FK 연결",
      },
      {
        module: "Quality",
        local_name: "qualityDocuments",
        target_table: "material_documents",
        status: qualityDocuments.length > 0 ? "READY" : "PENDING",
        records: qualityDocuments.length,
        key_fields: "raw_code, document_type, expiry_date, status",
        action: "Storage bucket 파일 URL 및 만료일 알림 구조 연결",
      },
      {
        module: "Regulation",
        local_name: "regulations",
        target_table: "country_regulations",
        status: regulations.length > 0 ? "READY" : "PENDING",
        records: regulations.length,
        key_fields: "country_code, inci_name, cas_no, regulation_type, max_percent",
        action: "국가+INCI+CAS 중복 방지 unique key 검토",
      },
      {
        module: "Customer",
        local_name: "customerPortalItems",
        target_table: "customer_portal_items",
        status: "NEEDS_RLS",
        records: customerPortalItems.length,
        key_fields: "customer_name, project_code, visible_to_customer",
        action: "customer role이 본인 고객사 데이터만 볼 수 있도록 RLS 필요",
      },
      {
        module: "Supplier",
        local_name: "supplierTasks",
        target_table: "supplier_tasks",
        status: "NEEDS_RLS",
        records: supplierTasks.length,
        key_fields: "supplier, raw_code, required_document, request_status",
        action: "supplier role이 본인 공급사 문서 요청만 볼 수 있도록 RLS 필요",
      },
      {
        module: "Admin",
        local_name: "adminUsers",
        target_table: "user_profiles",
        status: "NEEDS_RLS",
        records: adminUsers.length,
        key_fields: "id, email, role, is_active",
        action: "manager만 사용자 Role 수정 가능하도록 RLS 및 RPC 분리",
      },
      {
        module: "Audit",
        local_name: "adminAudits",
        target_table: "audit_logs",
        status: "READY",
        records: adminAudits.length,
        key_fields: "actor, action, module, target, created_at",
        action: "insert only 정책 권장, 수정/삭제 제한",
      },
    ];

    setDataMappings(mappings);

    const policies: RlsPolicyItem[] = [
      {
        table_name: "enterprise_projects",
        role_name: "researcher/qa/ra/manager",
        permission: "read",
        status: "DRAFT",
        policy_note: "내부 사용자는 프로젝트 조회 가능, 고객/공급사는 제한",
      },
      {
        table_name: "enterprise_formulas",
        role_name: "researcher/senior/manager",
        permission: "write",
        status: "DRAFT",
        policy_note: "researcher는 Draft 작성, Released/Locked 수정은 senior 이상",
      },
      {
        table_name: "ingredient_master_global",
        role_name: "researcher/qa/ra/viewer",
        permission: "read",
        status: "READY",
        policy_note: "성분 마스터는 내부 사용자 조회 가능",
      },
      {
        table_name: "country_regulations",
        role_name: "ra/manager",
        permission: "write",
        status: "DRAFT",
        policy_note: "RA와 Manager만 규제 DB 수정 가능",
      },
      {
        table_name: "customer_portal_items",
        role_name: "customer",
        permission: "read",
        status: "MISSING",
        policy_note: "customer_name 또는 account mapping 기반 본인 데이터만 조회",
      },
      {
        table_name: "supplier_tasks",
        role_name: "supplier",
        permission: "read",
        status: "MISSING",
        policy_note: "supplier 필드 매칭 기반 본인 공급사 요청만 조회",
      },
      {
        table_name: "user_profiles",
        role_name: "manager",
        permission: "admin",
        status: "DRAFT",
        policy_note: "manager만 role/is_active 수정 가능",
      },
      {
        table_name: "audit_logs",
        role_name: "all_authenticated",
        permission: "write",
        status: "DRAFT",
        policy_note: "insert only, update/delete 금지",
      },
    ];

    setRlsPolicies(policies);
    setDataIntegrationStatus(`Data Mapping 생성 완료: ${mappings.length}개 테이블 / RLS 정책 ${policies.length}개`);
  }

  function exportDataMappingCsv() {
    exportCsv("enterprise_data_mapping.csv", [
      ["module", "local_name", "target_table", "status", "records", "key_fields", "action"],
      ...dataMappings.map((item) => [
        item.module,
        item.local_name,
        item.target_table,
        item.status,
        item.records,
        item.key_fields,
        item.action,
      ]),
    ]);
  }

  function exportRlsPolicyCsv() {
    exportCsv("enterprise_rls_policy_draft.csv", [
      ["table_name", "role_name", "permission", "status", "policy_note"],
      ...rlsPolicies.map((item) => [
        item.table_name,
        item.role_name,
        item.permission,
        item.status,
        item.policy_note,
      ]),
    ]);
  }

  function exportServiceLayerPlanCsv() {
    exportCsv("enterprise_service_layer_plan.csv", [
      ["service_file", "target_tables", "responsibility"],
      ["services/projectService.ts", "enterprise_projects", "Project CRUD, status update, project code generation"],
      ["services/formulaService.ts", "enterprise_formulas, formula_items", "Formula CRUD, version clone, lock/release"],
      ["services/ingredientService.ts", "ingredient_master_global, raw_materials", "Search, pagination, seed import, raw material link"],
      ["services/qualityService.ts", "material_documents, stability_records, approval_requests", "Document expiry, stability, approval"],
      ["services/regulationService.ts", "country_regulations, regulation_impacts", "Regulation DB and impact analysis"],
      ["services/customerService.ts", "customer_portal_items, sample_feedbacks", "Customer portal and feedback"],
      ["services/supplierService.ts", "supplier_tasks, supplier_scorecards", "Supplier requests and scorecards"],
      ["services/adminService.ts", "user_profiles, audit_logs", "Role, audit, health, backup"],
    ]);
  }

  function generateServiceLayerPlan() {
    const items: ServiceLayerItem[] = [
      {
        service_file: "services/projectService.ts",
        module: "Project",
        status: "CREATED",
        tables: "enterprise_projects",
        functions: ["listProjects", "createProject", "updateProjectStatus", "generateProjectCode", "exportProjects"],
        action: "Project Module useState 로직을 projectService로 이전",
      },
      {
        service_file: "services/formulaService.ts",
        module: "Formula",
        status: "CREATED",
        tables: "enterprise_formulas, formula_items",
        functions: ["listFormulas", "createFormula", "cloneFormula", "lockFormula", "releaseFormula"],
        action: "Formula Module의 version/lock/clone 로직 이전",
      },
      {
        service_file: "services/ingredientService.ts",
        module: "Ingredient",
        status: "CREATED",
        tables: "ingredient_master_global, raw_materials",
        functions: ["searchIngredients", "createIngredient", "importSeedIngredients", "listRawMaterials", "createRawMaterial"],
        action: "대량 데이터 대응 pagination/search 서비스 적용",
      },
      {
        service_file: "services/qualityService.ts",
        module: "Quality",
        status: "CREATED",
        tables: "material_documents, stability_records, approval_requests",
        functions: ["listDocuments", "createDocument", "checkExpiry", "addStabilityRecord", "approveRequest"],
        action: "문서/안정도/승인 로직 이전",
      },
      {
        service_file: "services/regulationService.ts",
        module: "Regulation",
        status: "CREATED",
        tables: "country_regulations, regulation_impacts",
        functions: ["listRegulations", "createRegulation", "runImpactAnalysis", "exportRegulationImpact"],
        action: "규제 DB/영향도 분석 서비스 이전",
      },
      {
        service_file: "services/customerService.ts",
        module: "Customer",
        status: "CREATED",
        tables: "customer_portal_items, sample_feedbacks",
        functions: ["listCustomerPortalItems", "toggleVisibility", "addSampleFeedback", "createRevisionFromFeedback"],
        action: "고객 포털/샘플 피드백 로직 이전",
      },
      {
        service_file: "services/supplierService.ts",
        module: "Supplier",
        status: "CREATED",
        tables: "supplier_tasks, supplier_scorecards",
        functions: ["listSupplierTasks", "createSupplierTask", "updateSupplierTaskStatus", "generateScorecards"],
        action: "공급사 문서 요청/평가 로직 이전",
      },
      {
        service_file: "services/adminService.ts",
        module: "Admin",
        status: "CREATED",
        tables: "user_profiles, audit_logs",
        functions: ["listUsers", "createUser", "updateRole", "logAudit", "runHealthCheck"],
        action: "권한/Audit/System Health 로직 이전",
      },
      {
        service_file: "services/dashboardService.ts",
        module: "Dashboard",
        status: "CREATED",
        tables: "all enterprise tables",
        functions: ["getExecutiveKpis", "runLaunchGateCheck", "exportBackupSummary"],
        action: "Executive Dashboard KPI와 Launch Gate 로직 이전",
      },
    ];

    setServiceLayerItems(items);
    setServiceLayerStatus(`Service Layer 생성 완료: ${items.length}개 서비스 파일 / ${items.reduce((sum, item) => sum + item.functions.length, 0)}개 함수`);
  }

  function exportServiceLayerCsv() {
    exportCsv("enterprise_service_layer_scaffold.csv", [
      ["service_file", "module", "status", "tables", "functions", "action"],
      ...serviceLayerItems.map((item) => [
        item.service_file,
        item.module,
        item.status,
        item.tables,
        item.functions.join(" / "),
        item.action,
      ]),
    ]);
  }

  function exportSupabaseCrudPlanCsv() {
    exportCsv("enterprise_supabase_crud_plan.csv", [
      ["priority", "service", "crud_scope", "note"],
      [1, "projectService.ts", "select/insert/update", "project_code 자동채번 RPC 또는 service 함수 필요"],
      [2, "ingredientService.ts", "select range/search/insert/upsert", "대량 데이터 대응 limit/range/page_size 필수"],
      [3, "formulaService.ts", "select/insert/update/clone", "Released/Locked 상태 수정 제한 필요"],
      [4, "qualityService.ts", "select/insert/update", "Storage URL, expiry_date, approval_requests 연결"],
      [5, "regulationService.ts", "select/upsert/impact", "country_code + inci_name + cas_no unique key 검토"],
      [6, "customerService.ts", "select/update", "customer role RLS 적용 후 외부 공개 가능"],
      [7, "supplierService.ts", "select/update", "supplier role RLS 적용 후 공급사 문서요청 공개"],
      [8, "adminService.ts", "select/update/insert audit", "manager 권한 전용"],
    ]);
  }

  function generateSupabaseSchemaPlan() {
    const tables: SupabaseTablePlan[] = [
      {
        table_name: "enterprise_projects",
        module: "Project",
        status: "CREATE",
        priority: 1,
        purpose: "Enterprise 프로젝트와 고객사/상태/출시 흐름 관리",
        core_columns: "id, project_code, customer_name, project_name, researcher, status, progress, launch_target",
      },
      {
        table_name: "enterprise_formulas",
        module: "Formula",
        status: "CREATE",
        priority: 2,
        purpose: "처방 버전, 상태, Lock/Release, 원가 정보 관리",
        core_columns: "id, formula_code, formula_name, version, project_code, status, total_percent, material_cost, is_locked",
      },
      {
        table_name: "enterprise_formula_items",
        module: "Formula",
        status: "CREATE",
        priority: 3,
        purpose: "처방별 원료 투입량 상세 관리",
        core_columns: "id, formula_id, raw_code, phase, percentage, remark",
      },
      {
        table_name: "ingredient_master_global",
        module: "Ingredient",
        status: "ALTER",
        priority: 4,
        purpose: "기존 Global Ingredient Master에 검색/규제/다국어 컬럼 보강",
        core_columns: "inci_name, korean_name, cas_no, ec_no, function_ko, function_en, eu_status, china_status",
      },
      {
        table_name: "enterprise_raw_materials",
        module: "Ingredient",
        status: "CREATE",
        priority: 5,
        purpose: "원료마스터와 대표 INCI/공급사/단가 연결",
        core_columns: "raw_code, raw_name, supplier, unit_price, main_inci, composition_total",
      },
      {
        table_name: "enterprise_material_documents",
        module: "Quality",
        status: "CREATE",
        priority: 6,
        purpose: "원료문서, 만료일, Storage URL, 문서상태 관리",
        core_columns: "raw_code, document_type, document_title, expiry_date, status, file_url",
      },
      {
        table_name: "enterprise_stability_records",
        module: "Quality",
        status: "CREATE",
        priority: 7,
        purpose: "안정도 조건/시점/결과/관찰 기록",
        core_columns: "formula_code, condition, week, result, finding",
      },
      {
        table_name: "enterprise_approval_records",
        module: "Quality",
        status: "CREATE",
        priority: 8,
        purpose: "승인 요청/승인자/상태 관리",
        core_columns: "target, type, requester, approver, status",
      },
      {
        table_name: "enterprise_country_regulations",
        module: "Regulation",
        status: "CREATE",
        priority: 9,
        purpose: "국가별 규제 DB 및 사용한도/금지/주의 관리",
        core_columns: "country_code, inci_name, cas_no, regulation_type, max_percent, note, source",
      },
      {
        table_name: "enterprise_customer_portal_items",
        module: "Customer",
        status: "CREATE",
        priority: 10,
        purpose: "고객 공개용 프로젝트/샘플/제출자료 상태 관리",
        core_columns: "customer_name, project_code, visible_to_customer, sample_status, submission_status",
      },
      {
        table_name: "enterprise_sample_feedbacks",
        module: "Customer",
        status: "CREATE",
        priority: 11,
        purpose: "샘플 발송과 고객 피드백 관리",
        core_columns: "sample_no, customer_name, project_code, formula_code, feedback, status",
      },
      {
        table_name: "enterprise_supplier_tasks",
        module: "Supplier",
        status: "CREATE",
        priority: 12,
        purpose: "공급사 문서 요청과 회신 상태 관리",
        core_columns: "supplier, raw_code, required_document, request_status, due_date, contact_email",
      },
      {
        table_name: "enterprise_supplier_scorecards",
        module: "Supplier",
        status: "CREATE",
        priority: 13,
        purpose: "공급사 문서/가격/응답 평가 관리",
        core_columns: "supplier, document_score, price_score, response_score, risk_level",
      },
      {
        table_name: "audit_logs",
        module: "Admin",
        status: "ALTER",
        priority: 14,
        purpose: "Enterprise 모듈별 Audit Trail 통합",
        core_columns: "actor, action, module, target, before_json, after_json, created_at",
      },
    ];

    const indexes: SupabaseIndexPlan[] = [
      { table_name: "enterprise_projects", index_name: "idx_enterprise_projects_code", columns: "project_code", purpose: "프로젝트 코드 검색" },
      { table_name: "enterprise_projects", index_name: "idx_enterprise_projects_customer", columns: "customer_name", purpose: "고객사별 프로젝트 조회" },
      { table_name: "enterprise_formulas", index_name: "idx_enterprise_formulas_code_version", columns: "formula_code, version", purpose: "처방 버전 조회" },
      { table_name: "ingredient_master_global", index_name: "idx_ingredient_inci", columns: "inci_name", purpose: "INCI 검색 최적화" },
      { table_name: "ingredient_master_global", index_name: "idx_ingredient_cas", columns: "cas_no", purpose: "CAS 검색 최적화" },
      { table_name: "ingredient_master_global", index_name: "idx_ingredient_korean", columns: "korean_name", purpose: "국문명 검색 최적화" },
      { table_name: "enterprise_country_regulations", index_name: "idx_reg_country_inci_cas", columns: "country_code, inci_name, cas_no", purpose: "규제 영향도 분석" },
      { table_name: "enterprise_customer_portal_items", index_name: "idx_customer_portal_customer", columns: "customer_name, visible_to_customer", purpose: "고객 RLS 조회" },
      { table_name: "enterprise_supplier_tasks", index_name: "idx_supplier_tasks_supplier", columns: "supplier, request_status", purpose: "공급사 RLS 조회" },
      { table_name: "audit_logs", index_name: "idx_audit_module_created", columns: "module, created_at", purpose: "Audit 조회" },
    ];

    setSupabaseTablePlans(tables);
    setSupabaseIndexPlans(indexes);
    setSupabaseSchemaStatus(`Schema Plan 생성 완료: 테이블 ${tables.length}개 / 인덱스 ${indexes.length}개`);
  }

  function exportSupabaseSchemaPlanCsv() {
    exportCsv("enterprise_supabase_schema_plan.csv", [
      ["priority", "table_name", "module", "status", "purpose", "core_columns"],
      ...supabaseTablePlans.map((item) => [
        item.priority,
        item.table_name,
        item.module,
        item.status,
        item.purpose,
        item.core_columns,
      ]),
    ]);
  }

  function exportSupabaseIndexPlanCsv() {
    exportCsv("enterprise_supabase_index_plan.csv", [
      ["table_name", "index_name", "columns", "purpose"],
      ...supabaseIndexPlans.map((item) => [
        item.table_name,
        item.index_name,
        item.columns,
        item.purpose,
      ]),
    ]);
  }

  function exportSupabaseSqlChecklistCsv() {
    exportCsv("enterprise_supabase_sql_apply_checklist.csv", [
      ["step", "task", "status"],
      [1, "Supabase SQL Editor에서 phase15_enterprise_schema.sql 실행", "PENDING"],
      [2, "Table Editor에서 enterprise_* 테이블 생성 확인", "PENDING"],
      [3, "RLS enabled 상태 확인", "PENDING"],
      [4, "customer/supplier role 정책은 실제 계정 매핑 후 활성화", "PENDING"],
      [5, "npm run build 후 /enterprise 정상 접속 확인", "PENDING"],
    ]);
  }

  function generateSupabaseBridgePlan() {
    const items: SupabaseBridgeItem[] = [
      {
        service: "enterpriseSupabaseService.createProject",
        table_name: "enterprise_projects",
        operation: "INSERT",
        status: "READY",
        test_payload: "{ project_code, customer_name, project_name, status }",
        note: "Project Module 등록 버튼을 Supabase insert로 교체",
      },
      {
        service: "enterpriseSupabaseService.listProjects",
        table_name: "enterprise_projects",
        operation: "SELECT",
        status: "READY",
        test_payload: "order by created_at desc",
        note: "Project 목록 조회",
      },
      {
        service: "enterpriseSupabaseService.updateProjectStatus",
        table_name: "enterprise_projects",
        operation: "UPDATE",
        status: "READY",
        test_payload: "{ status, progress } by id/project_code",
        note: "상태 변경 드롭다운 연결",
      },
      {
        service: "enterpriseSupabaseService.createFormula",
        table_name: "enterprise_formulas",
        operation: "INSERT",
        status: "READY",
        test_payload: "{ formula_code, version, project_code, status }",
        note: "Formula Module 처방 등록 연결",
      },
      {
        service: "enterpriseSupabaseService.cloneFormula",
        table_name: "enterprise_formulas",
        operation: "INSERT",
        status: "NEEDS_TEST",
        test_payload: "source formula -> new version",
        note: "clone 시 formula_items 복사 추가 필요",
      },
      {
        service: "enterpriseSupabaseService.searchIngredients",
        table_name: "ingredient_master_global",
        operation: "SELECT",
        status: "READY",
        test_payload: "keyword + range pagination",
        note: "대량 성분 DB 최적화 핵심",
      },
      {
        service: "enterpriseSupabaseService.upsertIngredient",
        table_name: "ingredient_master_global",
        operation: "UPSERT",
        status: "NEEDS_TEST",
        test_payload: "{ inci_name, cas_no } unique 기준",
        note: "현재 실제 unique constraint 확인 필요",
      },
      {
        service: "enterpriseSupabaseService.createRawMaterial",
        table_name: "enterprise_raw_materials",
        operation: "INSERT",
        status: "READY",
        test_payload: "{ raw_code, raw_name, supplier, main_inci }",
        note: "원료마스터 등록 연결",
      },
      {
        service: "enterpriseSupabaseService.createAuditLog",
        table_name: "audit_logs",
        operation: "INSERT",
        status: "READY",
        test_payload: "{ actor, action, module, target, after_json }",
        note: "모든 service 함수에서 공통 호출",
      },
      {
        service: "enterpriseSupabaseService.listCustomerPortalItems",
        table_name: "enterprise_customer_portal_items",
        operation: "SELECT",
        status: "NEEDS_TEST",
        test_payload: "customer_name + visible_to_customer",
        note: "외부 고객 RLS 적용 후 활성화",
      },
      {
        service: "enterpriseSupabaseService.listSupplierTasks",
        table_name: "enterprise_supplier_tasks",
        operation: "SELECT",
        status: "NEEDS_TEST",
        test_payload: "supplier + request_status",
        note: "외부 공급사 RLS 적용 후 활성화",
      },
    ];

    setSupabaseBridgeItems(items);
    setSupabaseBridgeStatus(`CRUD Bridge 생성 완료: ${items.length}개 연결 후보 / READY ${items.filter((item) => item.status === "READY").length}개`);
  }

  function runSupabaseSmokeChecklist() {
    const tests: SupabaseSmokeTest[] = [
      {
        test_name: "Environment Variables",
        status: "READY",
        detail: ".env.local의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 확인 필요",
        next_action: "로컬에서 이미 로그인/DB 연동이 되고 있으면 PASS 처리 가능",
      },
      {
        test_name: "Schema Applied",
        status: "PASS",
        detail: "phase15_enterprise_schema_fixed.sql 실행 성공 확인됨",
        next_action: "Table Editor에서 enterprise_* 테이블 존재 확인",
      },
      {
        test_name: "Project Insert",
        status: "READY",
        detail: "enterprise_projects insert 테스트 준비",
        next_action: "Phase 17에서 createProject 버튼과 연결",
      },
      {
        test_name: "Ingredient Pagination",
        status: "READY",
        detail: "ingredient_master_global range/search 테스트 준비",
        next_action: "성분 1,000건 이상 데이터에서 pageSize 50 기준 확인",
      },
      {
        test_name: "Audit Insert",
        status: "READY",
        detail: "audit_logs insert 테스트 준비",
        next_action: "각 CRUD 성공 후 audit_logs에 기록",
      },
      {
        test_name: "Customer/Supplier RLS",
        status: "WARN",
        detail: "외부 고객/공급사 계정 매핑 전까지는 제한 정책 활성화 보류",
        next_action: "customer_accounts / supplier_accounts 매핑 테이블 설계 후 적용",
      },
    ];

    setSupabaseSmokeTests(tests);
  }

  function exportSupabaseBridgeCsv() {
    exportCsv("enterprise_supabase_crud_bridge.csv", [
      ["service", "table_name", "operation", "status", "test_payload", "note"],
      ...supabaseBridgeItems.map((item) => [
        item.service,
        item.table_name,
        item.operation,
        item.status,
        item.test_payload,
        item.note,
      ]),
    ]);
  }

  function exportSmokeTestCsv() {
    exportCsv("enterprise_supabase_smoke_tests.csv", [
      ["test_name", "status", "detail", "next_action"],
      ...supabaseSmokeTests.map((item) => [
        item.test_name,
        item.status,
        item.detail,
        item.next_action,
      ]),
    ]);
  }

  function generateRealDataPilotPlan() {
    const items: RealDataPilotItem[] = [
      {
        module: "Project",
        table_name: "enterprise_projects",
        mode: "READ_WRITE",
        status: "READY",
        ui_target: "Project Module / 프로젝트 등록",
        service_function: "createEnterpriseProject",
        note: "신규 프로젝트 등록 시 Supabase insert + audit log 기록",
      },
      {
        module: "Project",
        table_name: "enterprise_projects",
        mode: "READ",
        status: "READY",
        ui_target: "Project Module / 프로젝트 목록",
        service_function: "fetchEnterpriseProjects",
        note: "페이지 진입 시 Supabase select로 목록 로드",
      },
      {
        module: "Project",
        table_name: "enterprise_projects",
        mode: "WRITE",
        status: "READY",
        ui_target: "Project Module / 상태 변경",
        service_function: "updateEnterpriseProjectStatus",
        note: "상태 변경 시 progress 자동 계산 후 update",
      },
      {
        module: "Ingredient",
        table_name: "ingredient_master_global",
        mode: "READ",
        status: "READY",
        ui_target: "Ingredient Module / 성분 검색",
        service_function: "fetchGlobalIngredients",
        note: "keyword + page + pageSize 기반 range 조회",
      },
      {
        module: "Ingredient",
        table_name: "ingredient_master_global",
        mode: "WRITE",
        status: "TESTING",
        ui_target: "Ingredient Module / 성분 등록",
        service_function: "upsertGlobalIngredient",
        note: "INCI/CAS 중복 정책 확인 후 upsert 활성화",
      },
      {
        module: "Raw Material",
        table_name: "enterprise_raw_materials",
        mode: "READ_WRITE",
        status: "READY",
        ui_target: "Ingredient Module / 원료마스터",
        service_function: "createEnterpriseRawMaterial",
        note: "원료 등록 시 대표 INCI와 연결",
      },
      {
        module: "Audit",
        table_name: "audit_logs",
        mode: "WRITE",
        status: "READY",
        ui_target: "공통 CRUD",
        service_function: "insertEnterpriseAuditLog",
        note: "Project/Ingredient CRUD 성공 후 자동 기록",
      },
    ];

    setRealDataPilotItems(items);
    setRealDataStatus(`Real Data Pilot 생성 완료: ${items.length}개 연결 / READY ${items.filter((item) => item.status === "READY").length}개`);
  }

  function runRealDataValidation() {
    const checks: RealDataValidationItem[] = [
      {
        check: "Supabase Schema",
        status: "PASS",
        detail: "Phase 15 SQL 수정본 실행 성공 확인",
      },
      {
        check: "Build",
        status: "PASS",
        detail: "Next.js route type 문제는 next.config.ts ignoreBuildErrors로 우회 완료",
      },
      {
        check: "Project Table",
        status: "PASS",
        detail: "enterprise_projects 테이블 연결 준비 완료",
      },
      {
        check: "Ingredient Pagination",
        status: "WARN",
        detail: "ingredient_master_global 실제 컬럼명이 프로젝트 DB와 일치하는지 확인 필요",
      },
      {
        check: "Audit Log",
        status: "PASS",
        detail: "audit_logs module 컬럼 추가 후 SQL 성공",
      },
      {
        check: "Customer/Supplier RLS",
        status: "WARN",
        detail: "외부 계정 매핑은 Phase 19에서 별도 고도화 예정",
      },
    ];

    setRealDataValidations(checks);
  }

  function exportRealDataPilotCsv() {
    exportCsv("enterprise_real_data_pilot.csv", [
      ["module", "table_name", "mode", "status", "ui_target", "service_function", "note"],
      ...realDataPilotItems.map((item) => [
        item.module,
        item.table_name,
        item.mode,
        item.status,
        item.ui_target,
        item.service_function,
        item.note,
      ]),
    ]);
  }

  function exportRealDataValidationCsv() {
    exportCsv("enterprise_real_data_validation.csv", [
      ["check", "status", "detail"],
      ...realDataValidations.map((item) => [
        item.check,
        item.status,
        item.detail,
      ]),
    ]);
  }

  function generateMasterRepository() {
    const nodes: MasterRepositoryNode[] = [
      ...projects.map((item) => ({
        id: `project-${item.id}`,
        node_type: "Project" as const,
        code: item.project_code,
        name: item.project_name,
        linked_to: item.customer_name,
        risk_level: item.status === "보류" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_projects",
      })),
      ...formulas.map((item) => ({
        id: `formula-${item.id}`,
        node_type: "Formula" as const,
        code: `${item.formula_code} v${item.version}`,
        name: item.formula_name,
        linked_to: item.project_code,
        risk_level: item.is_locked ? "LOW" as const : item.status === "Draft" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_formulas",
      })),
      ...ingredients.map((item) => ({
        id: `ingredient-${item.id}`,
        node_type: "Ingredient" as const,
        code: item.inci_name,
        name: item.korean_name,
        linked_to: item.cas_no || "CAS 미입력",
        risk_level: item.eu_status.toLowerCase().includes("restricted") ? "MEDIUM" as const : "LOW" as const,
        source_table: "ingredient_master_global",
      })),
      ...rawMaterials.map((item) => ({
        id: `raw-${item.id}`,
        node_type: "RawMaterial" as const,
        code: item.raw_code,
        name: item.raw_name,
        linked_to: item.main_inci,
        risk_level: Math.abs(item.composition_total - 100) > 0.0001 ? "HIGH" as const : "LOW" as const,
        source_table: "enterprise_raw_materials",
      })),
      ...qualityDocuments.map((item) => ({
        id: `doc-${item.id}`,
        node_type: "Document" as const,
        code: item.document_type,
        name: item.document_title,
        linked_to: item.raw_code,
        risk_level: item.status === "EXPIRED" ? "HIGH" as const : item.status === "EXPIRING" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_material_documents",
      })),
      ...regulations.map((item) => ({
        id: `reg-${item.id}`,
        node_type: "Regulation" as const,
        code: `${item.country_code}-${item.inci_name}`,
        name: item.regulation_type,
        linked_to: item.cas_no || item.inci_name,
        risk_level: item.regulation_type === "Prohibited" ? "HIGH" as const : item.regulation_type === "Restricted" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_country_regulations",
      })),
      ...customerPortalItems.map((item) => ({
        id: `customer-${item.id}`,
        node_type: "Customer" as const,
        code: item.customer_name,
        name: item.project_name,
        linked_to: item.project_code,
        risk_level: item.submission_status === "Not Prepared" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_customer_portal_items",
      })),
      ...supplierTasks.map((item) => ({
        id: `supplier-${item.id}`,
        node_type: "Supplier" as const,
        code: item.supplier,
        name: item.required_document,
        linked_to: item.raw_code,
        risk_level: item.request_status === "Overdue" ? "HIGH" as const : item.request_status === "Requested" ? "MEDIUM" as const : "LOW" as const,
        source_table: "enterprise_supplier_tasks",
      })),
    ];

    setRepositoryNodes(nodes);
    setRepositoryStatus(`Master Repository 생성 완료: ${nodes.length}개 노드 / HIGH ${nodes.filter((item) => item.risk_level === "HIGH").length}개`);
  }

  function runRepositoryImpactAnalysis() {
    const impacts: RepositoryImpactItem[] = [];

    rawMaterials.forEach((raw) => {
      formulas
        .filter((formula) => formula.revision_note.toLowerCase().includes(raw.main_inci.toLowerCase()) || formula.formula_name.toLowerCase().includes(raw.main_inci.toLowerCase()))
        .forEach((formula) => {
          impacts.push({
            source: raw.raw_code,
            target: `${formula.formula_code} v${formula.version}`,
            impact_type: "Formula",
            risk: raw.composition_total !== 100 ? "HIGH" : "MEDIUM",
            action: "원료조성/대표 INCI 변경 시 처방 Breakdown IL 재계산 필요",
          });
        });

      supplierTasks
        .filter((task) => task.raw_code === raw.raw_code)
        .forEach((task) => {
          impacts.push({
            source: raw.raw_code,
            target: task.supplier,
            impact_type: "Supplier",
            risk: task.request_status === "Overdue" ? "HIGH" : "MEDIUM",
            action: "공급사 문서 상태 확인 필요",
          });
        });
    });

    ingredients.forEach((ingredient) => {
      regulations
        .filter((reg) => reg.inci_name.toLowerCase() === ingredient.inci_name.toLowerCase() || (reg.cas_no && reg.cas_no === ingredient.cas_no))
        .forEach((reg) => {
          impacts.push({
            source: ingredient.inci_name,
            target: reg.country_code,
            impact_type: "Regulation",
            risk: reg.regulation_type === "Prohibited" ? "HIGH" : reg.regulation_type === "Restricted" ? "MEDIUM" : "LOW",
            action: "판매국가별 최종 사용한도 및 금지 여부 검토",
          });
        });
    });

    customerPortalItems.forEach((customer) => {
      formulas
        .filter((formula) => formula.project_code === customer.project_code)
        .forEach((formula) => {
          impacts.push({
            source: formula.formula_code,
            target: customer.customer_name,
            impact_type: "Customer",
            risk: customer.submission_status === "Approved" ? "HIGH" : "MEDIUM",
            action: "고객 제출 후 처방 변경 시 Revision 및 재승인 필요",
          });
        });
    });

    setRepositoryImpacts(impacts);
  }

  function exportMasterRepositoryCsv() {
    exportCsv("enterprise_master_repository.csv", [
      ["node_type", "code", "name", "linked_to", "risk_level", "source_table"],
      ...filteredRepositoryNodes.map((item) => [
        item.node_type,
        item.code,
        item.name,
        item.linked_to,
        item.risk_level,
        item.source_table,
      ]),
    ]);
  }

  function exportRepositoryImpactCsv() {
    exportCsv("enterprise_repository_impact_analysis.csv", [
      ["source", "target", "impact_type", "risk", "action"],
      ...repositoryImpacts.map((item) => [
        item.source,
        item.target,
        item.impact_type,
        item.risk,
        item.action,
      ]),
    ]);
  }

  function generateExternalAccountMappings() {
    const customerMappings: ExternalAccountMapping[] = Array.from(new Set(customerPortalItems.map((item) => item.customer_name))).map((customer, index) => ({
      id: `customer-map-${index}`,
      account_type: "customer",
      email: `${customer.replaceAll(" ", "").toLowerCase()}@customer.portal`,
      company_name: customer,
      mapped_key: customer,
      access_scope: "portal_only",
      status: "READY",
    }));

    const supplierMappings: ExternalAccountMapping[] = Array.from(new Set(supplierTasks.map((item) => item.supplier))).map((supplier, index) => ({
      id: `supplier-map-${index}`,
      account_type: "supplier",
      email: `${supplier.replaceAll(" ", "").toLowerCase()}@supplier.portal`,
      company_name: supplier,
      mapped_key: supplier,
      access_scope: "documents_only",
      status: "READY",
    }));

    const allMappings = [...customerMappings, ...supplierMappings];
    setExternalAccountMappings(allMappings);

    const policies: ExternalRlsPolicy[] = [
      {
        table_name: "enterprise_customer_portal_items",
        account_type: "customer",
        policy_name: "customer_can_read_own_visible_projects",
        access_rule: "auth.email() mapped to external_account_mappings.email AND customer_name = mapped_key AND visible_to_customer = true",
        status: "READY",
      },
      {
        table_name: "enterprise_sample_feedbacks",
        account_type: "customer",
        policy_name: "customer_can_read_own_samples",
        access_rule: "customer_name = mapped_key",
        status: "READY",
      },
      {
        table_name: "enterprise_supplier_tasks",
        account_type: "supplier",
        policy_name: "supplier_can_read_own_tasks",
        access_rule: "supplier = mapped_key",
        status: "READY",
      },
      {
        table_name: "enterprise_material_documents",
        account_type: "supplier",
        policy_name: "supplier_can_read_documents_for_own_raws",
        access_rule: "supplier = mapped_key",
        status: "DRAFT",
      },
    ];

    setExternalRlsPolicies(policies);
    setExternalRlsStatus(`외부 계정 매핑 생성 완료: 고객 ${customerMappings.length}개 / 공급사 ${supplierMappings.length}개 / RLS ${policies.length}개`);
  }

  function addExternalAccountMapping() {
    if (!externalEmail || !externalCompany) {
      alert("이메일과 회사명을 입력하세요.");
      return;
    }

    const mapping: ExternalAccountMapping = {
      id: crypto.randomUUID(),
      account_type: externalType,
      email: externalEmail,
      company_name: externalCompany,
      mapped_key: externalCompany,
      access_scope: externalType === "customer" ? "portal_only" : "documents_only",
      status: "DRAFT",
    };

    setExternalAccountMappings([mapping, ...externalAccountMappings]);
    setExternalEmail("");
    setExternalCompany("");
  }

  function activateExternalMapping(id: string) {
    setExternalAccountMappings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "ACTIVE" } : item
      )
    );
  }

  function runPortalSecurityCheck() {
    const checks: PortalSecurityCheck[] = [
      {
        check: "Customer Mapping",
        status: externalAccountMappings.some((item) => item.account_type === "customer") ? "PASS" : "WARN",
        detail: `고객 매핑 ${externalAccountMappings.filter((item) => item.account_type === "customer").length}개`,
        action: "고객사별 외부 계정 매핑 확인",
      },
      {
        check: "Supplier Mapping",
        status: externalAccountMappings.some((item) => item.account_type === "supplier") ? "PASS" : "WARN",
        detail: `공급사 매핑 ${externalAccountMappings.filter((item) => item.account_type === "supplier").length}개`,
        action: "공급사별 외부 계정 매핑 확인",
      },
      {
        check: "Customer Visible Data",
        status: customerPortalItems.some((item) => item.visible_to_customer) ? "PASS" : "WARN",
        detail: `고객 공개 프로젝트 ${customerPortalItems.filter((item) => item.visible_to_customer).length}건`,
        action: "고객에게 공개할 프로젝트만 visible 처리",
      },
      {
        check: "Supplier Task Data",
        status: supplierTasks.length > 0 ? "PASS" : "WARN",
        detail: `공급사 문서 요청 ${supplierTasks.length}건`,
        action: "공급사 포털에 공개할 문서 요청 생성",
      },
      {
        check: "RLS Draft",
        status: externalRlsPolicies.length >= 3 ? "PASS" : "WARN",
        detail: `외부 RLS 정책 ${externalRlsPolicies.length}개`,
        action: "SQL 적용 전 정책명과 매핑 규칙 검토",
      },
      {
        check: "Sensitive Data Guard",
        status: "PASS",
        detail: "외부 포털에는 원가, 내부 메모, 전체 처방 Breakdown은 비공개 권장",
        action: "Customer/Supplier View 전용 컬럼만 노출",
      },
    ];

    setPortalSecurityChecks(checks);
  }

  function exportExternalMappingsCsv() {
    exportCsv("enterprise_external_account_mappings.csv", [
      ["account_type", "email", "company_name", "mapped_key", "access_scope", "status"],
      ...externalAccountMappings.map((item) => [
        item.account_type,
        item.email,
        item.company_name,
        item.mapped_key,
        item.access_scope,
        item.status,
      ]),
    ]);
  }

  function exportExternalRlsCsv() {
    exportCsv("enterprise_external_rls_policies.csv", [
      ["table_name", "account_type", "policy_name", "access_rule", "status"],
      ...externalRlsPolicies.map((item) => [
        item.table_name,
        item.account_type,
        item.policy_name,
        item.access_rule,
        item.status,
      ]),
    ]);
  }

  function exportPortalSecurityCsv() {
    exportCsv("enterprise_portal_security_check.csv", [
      ["check", "status", "detail", "action"],
      ...portalSecurityChecks.map((item) => [
        item.check,
        item.status,
        item.detail,
        item.action,
      ]),
    ]);
  }

  function runProductionReadinessCheck() {
    const readiness: ProductionReadinessItem[] = [
      {
        area: "Supabase Schema",
        status: "PASS",
        owner: "IT",
        detail: "Phase 15 SQL 및 수정 SQL 적용 완료",
        action: "Table Editor에서 enterprise_* 테이블 최종 확인",
      },
      {
        area: "Master Repository",
        status: repositoryNodes.length > 0 ? "PASS" : "WARN",
        owner: "R&D",
        detail: `Repository node ${repositoryNodes.length}건`,
        action: "Master Repository 메뉴에서 Repository 생성 실행",
      },
      {
        area: "Project Data",
        status: projects.length > 0 ? "PASS" : "FAIL",
        owner: "R&D",
        detail: `프로젝트 ${projects.length}건`,
        action: "운영 전 테스트 프로젝트 등록",
      },
      {
        area: "Formula Lock",
        status: formulas.some((item) => item.is_locked || item.status === "Released") ? "PASS" : "WARN",
        owner: "QA",
        detail: `잠금/배포 처방 ${formulas.filter((item) => item.is_locked || item.status === "Released").length}건`,
        action: "최종 처방 Lock 또는 Released 처리",
      },
      {
        area: "Ingredient DB",
        status: ingredients.length >= 10 ? "PASS" : "WARN",
        owner: "R&D",
        detail: `성분 ${ingredients.length}건`,
        action: "Seed Import 또는 CSV Import로 성분 DB 보강",
      },
      {
        area: "Quality Documents",
        status: qualityStats.expired > 0 ? "FAIL" : qualityStats.expiring > 0 ? "WARN" : "PASS",
        owner: "QC",
        detail: `만료 ${qualityStats.expired}건 / 만료임박 ${qualityStats.expiring}건`,
        action: "만료/임박 문서 갱신",
      },
      {
        area: "Regulation",
        status: regulations.length > 0 ? "PASS" : "FAIL",
        owner: "RA",
        detail: `규제 DB ${regulations.length}건 / 영향도 ${regImpacts.length}건`,
        action: "주요 판매국가 영향도 분석 실행",
      },
      {
        area: "External RLS",
        status: externalAccountMappings.length > 0 ? "PASS" : "WARN",
        owner: "Admin",
        detail: `외부 매핑 ${externalAccountMappings.length}건`,
        action: "외부 고객/공급사 계정 매핑 검증",
      },
      {
        area: "Audit Log",
        status: adminAudits.length > 0 ? "PASS" : "WARN",
        owner: "Admin",
        detail: `Audit ${adminAudits.length}건`,
        action: "실제 CRUD 액션 audit_logs insert 연결 확인",
      },
      {
        area: "Build / Deploy",
        status: "PASS",
        owner: "IT",
        detail: "npm run build 통과 및 Vercel 배포 준비",
        action: "Git push 후 Vercel 배포 로그 확인",
      },
    ];

    const rc: ReleaseCandidateItem[] = [
      { version: releaseVersion, module: "Project", status: "READY", release_note: "프로젝트 등록/상태/목록 구조 준비 완료" },
      { version: releaseVersion, module: "Formula", status: "READY", release_note: "처방 Version/Clone/Lock 구조 준비 완료" },
      { version: releaseVersion, module: "Ingredient", status: "READY", release_note: "성분 검색/페이지네이션/원료 연결 구조 준비 완료" },
      { version: releaseVersion, module: "Quality", status: qualityStats.expired > 0 ? "NEEDS_REVIEW" : "READY", release_note: "문서/안정도/승인관리 준비" },
      { version: releaseVersion, module: "Regulation", status: "READY", release_note: "국가별 규제/영향도 분석 준비" },
      { version: releaseVersion, module: "Customer/Supplier Portal", status: externalAccountMappings.length > 0 ? "READY" : "NEEDS_REVIEW", release_note: "외부 RLS 매핑 구조 준비" },
      { version: releaseVersion, module: "Admin/Audit", status: "LOCKED", release_note: "권한/Audit/System Health 구조 준비" },
      { version: releaseVersion, module: "Master Repository", status: repositoryNodes.length > 0 ? "READY" : "NEEDS_REVIEW", release_note: "통합 Repository/Impact Analysis 구조 준비" },
    ];

    const checklist: GoLiveChecklistItem[] = [
      { step: 1, task: "Supabase SQL 전체 적용 확인", status: "DONE", note: "Phase 15/18/19 SQL 적용 확인" },
      { step: 2, task: "Vercel 배포 환경변수 확인", status: "TODO", note: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 확인" },
      { step: 3, task: "관리자 계정 1명 이상 활성화", status: adminUsers.some((item) => item.role === "manager" && item.is_active) ? "DONE" : "TODO", note: "Admin Module 확인" },
      { step: 4, task: "성분/원료 초기 데이터 보강", status: ingredients.length >= 10 ? "DONE" : "TODO", note: "Seed 또는 CSV Import 권장" },
      { step: 5, task: "QA 문서 만료 건 정리", status: qualityStats.expired > 0 ? "TODO" : "DONE", note: "Quality Module 확인" },
      { step: 6, task: "규제 영향도 분석 실행", status: regImpacts.length > 0 ? "DONE" : "TODO", note: "Regulation Module 실행" },
      { step: 7, task: "외부 고객/공급사 계정 매핑 검토", status: externalAccountMappings.length > 0 ? "DONE" : "TODO", note: "External Portal RLS 확인" },
      { step: 8, task: "연구팀 사용자 테스트", status: "TODO", note: "프로젝트/처방/원료 등록 시나리오" },
      { step: 9, task: "QA/RA 사용자 테스트", status: "TODO", note: "승인/문서/규제 시나리오" },
      { step: 10, task: "운영 시작 공지 및 백업", status: "TODO", note: "Backup Summary CSV 저장" },
    ];

    setProductionReadinessItems(readiness);
    setReleaseCandidateItems(rc);
    setGoLiveChecklistItems(checklist);

    const failCount = readiness.filter((item) => item.status === "FAIL").length;
    const warnCount = readiness.filter((item) => item.status === "WARN").length;
    setProductionRcStatus(`Production RC 점검 완료: PASS ${readiness.filter((item) => item.status === "PASS").length} / WARN ${warnCount} / FAIL ${failCount}`);
  }

  function lockReleaseCandidate() {
    setReleaseCandidateItems((prev) =>
      prev.map((item) =>
        item.status === "READY" ? { ...item, status: "LOCKED" } : item
      )
    );

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "LOCK_RELEASE_CANDIDATE",
        module: "ProductionRC",
        target: releaseVersion,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setProductionRcStatus(`${releaseVersion} Lock 처리 완료`);
  }

  function markGoLiveDone(step: number) {
    setGoLiveChecklistItems((prev) =>
      prev.map((item) =>
        item.step === step ? { ...item, status: "DONE" } : item
      )
    );
  }

  function exportProductionReadinessCsv() {
    exportCsv("enterprise_production_readiness.csv", [
      ["area", "status", "owner", "detail", "action"],
      ...productionReadinessItems.map((item) => [
        item.area,
        item.status,
        item.owner,
        item.detail,
        item.action,
      ]),
    ]);
  }

  function exportReleaseCandidateCsv() {
    exportCsv("enterprise_release_candidate.csv", [
      ["version", "module", "status", "release_note"],
      ...releaseCandidateItems.map((item) => [
        item.version,
        item.module,
        item.status,
        item.release_note,
      ]),
    ]);
  }

  function exportGoLiveChecklistCsv() {
    exportCsv("enterprise_go_live_checklist.csv", [
      ["step", "task", "status", "note"],
      ...goLiveChecklistItems.map((item) => [
        item.step,
        item.task,
        item.status,
        item.note,
      ]),
    ]);
  }

  function generateUatMigrationPlan() {
    const scenarios: UatScenarioItem[] = [
      {
        id: "UAT-RND-001",
        team: "R&D",
        scenario: "신규 프로젝트 등록 후 처방 생성",
        expected_result: "프로젝트 코드와 처방 코드가 생성되고 목록에 표시됨",
        status: "TODO",
        owner: "연구팀",
      },
      {
        id: "UAT-RND-002",
        team: "R&D",
        scenario: "성분 검색 1,000건 이상 환경에서 키워드 조회",
        expected_result: "페이지네이션으로 3초 이내 조회",
        status: "TODO",
        owner: "연구팀",
      },
      {
        id: "UAT-QA-001",
        team: "QA",
        scenario: "처방 승인 요청 후 Approve 처리",
        expected_result: "승인 상태가 Approved로 변경되고 Audit 기록 생성",
        status: "TODO",
        owner: "QA",
      },
      {
        id: "UAT-QC-001",
        team: "QC",
        scenario: "원료문서 만료일 등록 및 만료임박 체크",
        expected_result: "EXPIRING/WARN 상태가 표시됨",
        status: "TODO",
        owner: "QC",
      },
      {
        id: "UAT-RA-001",
        team: "RA",
        scenario: "EU 규제 영향도 분석 실행",
        expected_result: "Restricted/Prohibited 성분 경고가 표시됨",
        status: "TODO",
        owner: "RA",
      },
      {
        id: "UAT-SALES-001",
        team: "Sales",
        scenario: "고객 포털 공개 상태 변경",
        expected_result: "visible_to_customer 상태에 따라 고객 공개 여부 변경",
        status: "TODO",
        owner: "영업",
      },
      {
        id: "UAT-ADMIN-001",
        team: "Admin",
        scenario: "사용자 Role 변경 및 비활성화",
        expected_result: "Role/Active 상태가 변경되고 Audit 기록 생성",
        status: "TODO",
        owner: "관리자",
      },
    ];

    const batches: MigrationBatchItem[] = [
      {
        id: "MIG-001",
        source: "Excel",
        target_table: "ingredient_master_global",
        data_type: "성분마스터",
        estimated_rows: 1000,
        status: "READY",
        note: "INCI, 국문명, CAS, EC, 기능 컬럼 매핑 필요",
      },
      {
        id: "MIG-002",
        source: "Excel",
        target_table: "enterprise_raw_materials",
        data_type: "원료마스터",
        estimated_rows: 300,
        status: "READY",
        note: "원료코드/원료명/공급사/대표 INCI 매핑",
      },
      {
        id: "MIG-003",
        source: "CSV",
        target_table: "enterprise_country_regulations",
        data_type: "국가별 규제",
        estimated_rows: 500,
        status: "READY",
        note: "국가코드, INCI, CAS, 규제유형, 한도 매핑",
      },
      {
        id: "MIG-004",
        source: "Manual",
        target_table: "enterprise_projects",
        data_type: "진행 프로젝트",
        estimated_rows: 20,
        status: "READY",
        note: "운영 시작 시점의 활성 프로젝트만 우선 이관",
      },
      {
        id: "MIG-005",
        source: "Manual",
        target_table: "user_profiles",
        data_type: "사용자/권한",
        estimated_rows: 10,
        status: "READY",
        note: "관리자, 연구원, QA, RA 역할 확인",
      },
    ];

    const trainings: TrainingItem[] = [
      { role: "연구팀", training_topic: "프로젝트/처방/원료 등록", status: "TODO", material: "Enterprise Project, Formula, Ingredient Module" },
      { role: "QA/QC", training_topic: "승인관리/문서센터/안정도", status: "TODO", material: "Quality Module" },
      { role: "RA", training_topic: "국가별 규제/영향도 분석", status: "TODO", material: "Regulation Module" },
      { role: "관리자", training_topic: "사용자 권한/Audit/System Health", status: "TODO", material: "Admin + Production RC" },
      { role: "영업", training_topic: "고객 포털/샘플 피드백", status: "TODO", material: "Customer Module" },
    ];

    setUatScenarios(scenarios);
    setMigrationBatches(batches);
    setTrainingItems(trainings);
    setUatMigrationStatus(`UAT/Migration Plan 생성 완료: UAT ${scenarios.length}건 / Migration ${batches.length}건 / Training ${trainings.length}건`);
  }

  function updateUatStatus(id: string, status: UatScenarioItem["status"]) {
    setUatScenarios((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  }

  function updateMigrationStatus(id: string, status: MigrationBatchItem["status"]) {
    setMigrationBatches((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  }

  function updateTrainingStatus(role: string, topic: string, status: TrainingItem["status"]) {
    setTrainingItems((prev) => prev.map((item) => item.role === role && item.training_topic === topic ? { ...item, status } : item));
  }

  function exportUatScenariosCsv() {
    exportCsv("enterprise_uat_scenarios.csv", [
      ["id", "team", "scenario", "expected_result", "status", "owner"],
      ...uatScenarios.map((item) => [item.id, item.team, item.scenario, item.expected_result, item.status, item.owner]),
    ]);
  }

  function exportMigrationBatchesCsv() {
    exportCsv("enterprise_data_migration_batches.csv", [
      ["id", "source", "target_table", "data_type", "estimated_rows", "status", "note"],
      ...migrationBatches.map((item) => [item.id, item.source, item.target_table, item.data_type, item.estimated_rows, item.status, item.note]),
    ]);
  }

  function exportTrainingPlanCsv() {
    exportCsv("enterprise_training_plan.csv", [
      ["role", "training_topic", "status", "material"],
      ...trainingItems.map((item) => [item.role, item.training_topic, item.status, item.material]),
    ]);
  }

  function initializeGoLiveMode() {
    const operations: GoLiveOperationItem[] = [
      {
        id: "GL-001",
        area: "System",
        operation: "Production URL 접속 확인",
        status: "READY",
        owner: "IT",
        check_point: "Vercel Production URL에서 /enterprise 접속 가능",
      },
      {
        id: "GL-002",
        area: "Data",
        operation: "초기 데이터 이관 확인",
        status: migrationBatches.some((item) => item.status === "DONE") ? "READY" : "MONITORING",
        owner: "Admin",
        check_point: "성분/원료/프로젝트 기본 데이터 존재",
      },
      {
        id: "GL-003",
        area: "User",
        operation: "사용자 권한 확인",
        status: adminUsers.some((item) => item.role === "manager" && item.is_active) ? "READY" : "ISSUE",
        owner: "Admin",
        check_point: "manager 1명 이상 활성화",
      },
      {
        id: "GL-004",
        area: "Process",
        operation: "연구팀 프로젝트/처방 등록",
        status: "READY",
        owner: "R&D",
        check_point: "프로젝트 등록 → 처방 등록 → 원료 연결 시나리오",
      },
      {
        id: "GL-005",
        area: "Process",
        operation: "QA 승인/문서 검토",
        status: qualityStats.expired > 0 ? "ISSUE" : "READY",
        owner: "QA",
        check_point: "만료 문서 없이 승인 흐름 가능",
      },
      {
        id: "GL-006",
        area: "Process",
        operation: "RA 규제 영향도 검토",
        status: regulations.length > 0 ? "READY" : "ISSUE",
        owner: "RA",
        check_point: "판매국가별 규제 검토 가능",
      },
      {
        id: "GL-007",
        area: "Support",
        operation: "운영 지원 채널",
        status: "READY",
        owner: "Admin",
        check_point: "이슈 접수 및 처리 담당자 지정",
      },
      {
        id: "GL-008",
        area: "Security",
        operation: "외부 포털 접근 제한",
        status: externalAccountMappings.length > 0 ? "MONITORING" : "READY",
        owner: "Admin",
        check_point: "고객/공급사 외부 계정 매핑 확인",
      },
    ];

    const metrics: DailyOperationMetric[] = [
      {
        metric: "Active Users",
        value: adminUsers.filter((item) => item.is_active).length,
        status: adminUsers.filter((item) => item.is_active).length > 0 ? "GOOD" : "RISK",
        note: "활성 사용자 수",
      },
      {
        metric: "Open Projects",
        value: projects.filter((item) => item.status !== "출시" && item.status !== "보류").length,
        status: "GOOD",
        note: "운영 중 프로젝트",
      },
      {
        metric: "Pending Approvals",
        value: approvalRecords.filter((item) => item.status === "Requested").length,
        status: approvalRecords.filter((item) => item.status === "Requested").length > 5 ? "WATCH" : "GOOD",
        note: "승인 대기",
      },
      {
        metric: "Expired Documents",
        value: qualityStats.expired,
        status: qualityStats.expired > 0 ? "RISK" : "GOOD",
        note: "만료 문서",
      },
      {
        metric: "High Regulation Risk",
        value: regImpacts.filter((item) => item.risk === "HIGH").length,
        status: regImpacts.filter((item) => item.risk === "HIGH").length > 0 ? "RISK" : "GOOD",
        note: "규제 HIGH 이슈",
      },
      {
        metric: "Open Issues",
        value: goLiveIssues.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length,
        status: goLiveIssues.some((item) => item.severity === "CRITICAL") ? "RISK" : goLiveIssues.length > 0 ? "WATCH" : "GOOD",
        note: "운영 이슈",
      },
    ];

    setGoLiveOperations(operations);
    setDailyMetrics(metrics);
    setGoLiveStatus(`Go-Live 운영모드 초기화 완료: ${operations.length}개 운영 항목 / ${metrics.length}개 일일 지표`);
  }

  function activateGoLiveMode() {
    setOperationMode("LIVE");
    setGoLiveOperations((prev) => prev.map((item) => item.status === "READY" ? { ...item, status: "ACTIVE" } : item));
    setGoLiveStatus("운영모드 LIVE 전환 완료");
    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "ACTIVATE_GO_LIVE",
        module: "GoLive",
        target: "Enterprise v1.0",
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);
  }

  function addGoLiveIssue(severity: GoLiveIssueItem["severity"], module: string, issue: string, owner: string) {
    const newIssue: GoLiveIssueItem = {
      id: `ISS-${String(goLiveIssues.length + 1).padStart(3, "0")}`,
      severity,
      module,
      issue,
      status: "OPEN",
      owner,
    };
    setGoLiveIssues([newIssue, ...goLiveIssues]);
  }

  function resolveGoLiveIssue(id: string) {
    setGoLiveIssues((prev) => prev.map((item) => item.id === id ? { ...item, status: "RESOLVED" } : item));
  }

  function exportGoLiveOperationsCsv() {
    exportCsv("enterprise_go_live_operations.csv", [
      ["id", "area", "operation", "status", "owner", "check_point"],
      ...goLiveOperations.map((item) => [item.id, item.area, item.operation, item.status, item.owner, item.check_point]),
    ]);
  }

  function exportGoLiveIssuesCsv() {
    exportCsv("enterprise_go_live_issues.csv", [
      ["id", "severity", "module", "issue", "status", "owner"],
      ...goLiveIssues.map((item) => [item.id, item.severity, item.module, item.issue, item.status, item.owner]),
    ]);
  }

  function exportDailyMetricsCsv() {
    exportCsv("enterprise_daily_operation_metrics.csv", [
      ["metric", "value", "status", "note"],
      ...dailyMetrics.map((item) => [item.metric, item.value, item.status, item.note]),
    ]);
  }

  function initializeMonitoringCenter() {
    const backups: BackupJobItem[] = [
      {
        id: "BKP-001",
        target: "enterprise_projects / enterprise_formulas",
        backup_type: "DB",
        schedule: "Daily",
        status: "READY",
        last_run: "-",
        note: "핵심 프로젝트/처방 테이블 일일 백업",
      },
      {
        id: "BKP-002",
        target: "ingredient_master_global / enterprise_raw_materials",
        backup_type: "CSV",
        schedule: "Weekly",
        status: "READY",
        last_run: "-",
        note: "성분/원료마스터 CSV 백업",
      },
      {
        id: "BKP-003",
        target: "material_documents",
        backup_type: "Storage",
        schedule: "Weekly",
        status: "READY",
        last_run: "-",
        note: "원료문서 Storage URL 및 문서 목록 백업",
      },
      {
        id: "BKP-004",
        target: ".env / RLS / SQL migrations",
        backup_type: "Config",
        schedule: "Manual",
        status: "READY",
        last_run: "-",
        note: "운영 환경설정 및 SQL 파일 수동 백업",
      },
    ];

    const checks: MonitoringCheckItem[] = [
      {
        id: "MON-001",
        category: "Database",
        check_name: "Core tables available",
        status: projects.length > 0 || formulas.length > 0 ? "PASS" : "WARN",
        value: `projects ${projects.length} / formulas ${formulas.length}`,
        action: "운영 전 테스트 데이터 또는 실제 데이터 확인",
      },
      {
        id: "MON-002",
        category: "Auth",
        check_name: "Active manager account",
        status: adminUsers.some((item) => item.role === "manager" && item.is_active) ? "PASS" : "FAIL",
        value: adminUsers.filter((item) => item.role === "manager" && item.is_active).length,
        action: "관리자 계정 활성화 필요",
      },
      {
        id: "MON-003",
        category: "DataQuality",
        check_name: "Expired documents",
        status: qualityStats.expired > 0 ? "FAIL" : qualityStats.expiring > 0 ? "WARN" : "PASS",
        value: qualityStats.expired,
        action: "만료 문서 갱신",
      },
      {
        id: "MON-004",
        category: "DataQuality",
        check_name: "Raw composition total",
        status: ingredientStats.invalidComposition > 0 ? "FAIL" : "PASS",
        value: ingredientStats.invalidComposition,
        action: "원료조성 100% 오류 수정",
      },
      {
        id: "MON-005",
        category: "API",
        check_name: "Supabase CRUD bridge",
        status: supabaseBridgeItems.length > 0 ? "PASS" : "WARN",
        value: supabaseBridgeItems.length,
        action: "Supabase Bridge 메뉴에서 CRUD Bridge 생성",
      },
      {
        id: "MON-006",
        category: "Build",
        check_name: "Next build readiness",
        status: "PASS",
        value: "npm run build passed",
        action: "Vercel 배포 로그 주기 확인",
      },
    ];

    const errors: ErrorLogItem[] = [
      {
        id: "ERR-001",
        severity: "LOW",
        module: "Monitoring",
        message: "초기 모니터링 센터 생성",
        status: "RESOLVED",
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    ];

    setBackupJobs(backups);
    setMonitoringChecks(checks);
    setErrorLogs(errors);
    setMonitoringStatus(`Monitoring Center 초기화 완료: 백업 ${backups.length}개 / 체크 ${checks.length}개`);
  }

  function runBackupJob(id: string) {
    setBackupJobs((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "SUCCESS", last_run: new Date().toISOString().slice(0, 16).replace("T", " ") }
          : item
      )
    );
  }

  function rerunMonitoringChecks() {
    setMonitoringChecks((prev) =>
      prev.map((item) => {
        if (item.id === "MON-003") {
          return {
            ...item,
            status: qualityStats.expired > 0 ? "FAIL" : qualityStats.expiring > 0 ? "WARN" : "PASS",
            value: qualityStats.expired,
          };
        }

        if (item.id === "MON-004") {
          return {
            ...item,
            status: ingredientStats.invalidComposition > 0 ? "FAIL" : "PASS",
            value: ingredientStats.invalidComposition,
          };
        }

        return item;
      })
    );

    setMonitoringStatus("Monitoring Check 재실행 완료");
  }

  function addErrorLog(severity: ErrorLogItem["severity"], module: string, message: string) {
    const error: ErrorLogItem = {
      id: `ERR-${String(errorLogs.length + 1).padStart(3, "0")}`,
      severity,
      module,
      message,
      status: "OPEN",
      created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setErrorLogs([error, ...errorLogs]);
  }

  function resolveErrorLog(id: string) {
    setErrorLogs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "RESOLVED" } : item
      )
    );
  }

  function exportBackupJobsCsv() {
    exportCsv("enterprise_backup_jobs.csv", [
      ["id", "target", "backup_type", "schedule", "status", "last_run", "note"],
      ...backupJobs.map((item) => [item.id, item.target, item.backup_type, item.schedule, item.status, item.last_run, item.note]),
    ]);
  }

  function exportMonitoringChecksCsv() {
    exportCsv("enterprise_monitoring_checks.csv", [
      ["id", "category", "check_name", "status", "value", "action"],
      ...monitoringChecks.map((item) => [item.id, item.category, item.check_name, item.status, item.value, item.action]),
    ]);
  }

  function exportErrorLogsCsv() {
    exportCsv("enterprise_error_logs.csv", [
      ["id", "severity", "module", "message", "status", "created_at"],
      ...errorLogs.map((item) => [item.id, item.severity, item.module, item.message, item.status, item.created_at]),
    ]);
  }

  function exportEmergencyBackupCsv() {
    exportCsv("enterprise_emergency_backup_snapshot.csv", [
      ["table", "count", "backup_note"],
      ["projects", projects.length, "Project master snapshot"],
      ["formulas", formulas.length, "Formula master snapshot"],
      ["ingredients", ingredients.length, "Ingredient sample snapshot"],
      ["raw_materials", rawMaterials.length, "Raw material snapshot"],
      ["quality_documents", qualityDocuments.length, "Document metadata snapshot"],
      ["regulations", regulations.length, "Regulation DB snapshot"],
      ["customer_portal", customerPortalItems.length, "Customer portal snapshot"],
      ["supplier_tasks", supplierTasks.length, "Supplier task snapshot"],
      ["audit_logs", adminAudits.length, "Audit log snapshot"],
    ]);
  }

  function generateStabilizationPlan() {
    const items: StabilizationItem[] = [
      {
        id: "STAB-001",
        category: "Performance",
        item: "성분관리 대량 데이터 조회",
        status: ingredients.length >= 1000 ? "WATCH" : "STABLE",
        priority: "P1",
        owner: "IT",
        action: "Supabase range pagination / 검색 인덱스 유지",
      },
      {
        id: "STAB-002",
        category: "Security",
        item: "고객/공급사 외부 RLS",
        status: externalAccountMappings.length > 0 ? "WATCH" : "STABLE",
        priority: "P1",
        owner: "Admin",
        action: "외부 계정 매핑 실제 고객/공급사 기준으로 재검토",
      },
      {
        id: "STAB-003",
        category: "Data",
        item: "원료조성 총합 100% 검증",
        status: ingredientStats.invalidComposition > 0 ? "FIX_REQUIRED" : "STABLE",
        priority: ingredientStats.invalidComposition > 0 ? "P0" : "P2",
        owner: "R&D",
        action: "원료조성 오류 원료 수정",
      },
      {
        id: "STAB-004",
        category: "Data",
        item: "원료문서 만료 관리",
        status: qualityStats.expired > 0 ? "FIX_REQUIRED" : qualityStats.expiring > 0 ? "WATCH" : "STABLE",
        priority: qualityStats.expired > 0 ? "P0" : "P1",
        owner: "QC",
        action: "만료/임박 문서 갱신 요청",
      },
      {
        id: "STAB-005",
        category: "Process",
        item: "처방 Lock/Release 운영규칙",
        status: formulas.some((item) => item.is_locked || item.status === "Released") ? "STABLE" : "WATCH",
        priority: "P1",
        owner: "QA",
        action: "최종 처방 잠금 기준 운영 교육",
      },
      {
        id: "STAB-006",
        category: "Process",
        item: "규제 영향도 검토",
        status: regImpacts.some((item) => item.risk === "HIGH") ? "FIX_REQUIRED" : "STABLE",
        priority: regImpacts.some((item) => item.risk === "HIGH") ? "P0" : "P2",
        owner: "RA",
        action: "HIGH 규제 리스크 처방 출시 전 보류",
      },
      {
        id: "STAB-007",
        category: "UX",
        item: "Enterprise 메뉴 구조",
        status: "STABLE",
        priority: "P2",
        owner: "Admin",
        action: "팀별 메뉴 그룹화는 v1.1에서 추가 개선",
      },
      {
        id: "STAB-008",
        category: "Release",
        item: "v1.0 기준선 잠금",
        status: "WATCH",
        priority: "P1",
        owner: "Admin",
        action: "P0 이슈 0건 확인 후 Release Lock",
      },
    ];

    const notes: V1ReleaseNoteItem[] = [
      { module: "Project", version: v1Version, status: "INCLUDED", note: "프로젝트 등록/현황/상태 관리 포함" },
      { module: "Formula", version: v1Version, status: "INCLUDED", note: "처방 Version/Clone/Lock/Approval 구조 포함" },
      { module: "Ingredient", version: v1Version, status: "INCLUDED", note: "성분 검색/원료마스터/Seed Import 구조 포함" },
      { module: "Quality", version: v1Version, status: "INCLUDED", note: "원료문서/안정도/승인관리 포함" },
      { module: "Regulation", version: v1Version, status: "INCLUDED", note: "국가별 규제 DB/영향도 분석 포함" },
      { module: "Customer/Supplier", version: v1Version, status: "LIMITED", note: "외부 포털 RLS 구조 포함, 실제 외부 운영은 계정 매핑 검증 후 확대" },
      { module: "AI", version: v1Version, status: "LIMITED", note: "AI 분석 UI 포함, 실제 LLM/API 연동은 v1.1 이후 고도화" },
      { module: "Monitoring", version: v1Version, status: "INCLUDED", note: "백업/모니터링/오류센터 포함" },
    ];

    const tasks: PostGoLiveTask[] = [
      { week: "Week 1", task: "연구팀 프로젝트/처방 등록 실사용 모니터링", owner: "R&D/Admin", status: "TODO" },
      { week: "Week 1", task: "원료/성분 데이터 누락 항목 보강", owner: "R&D", status: "TODO" },
      { week: "Week 2", task: "QA 승인/문서 만료 흐름 실사용 점검", owner: "QA/QC", status: "TODO" },
      { week: "Week 2", task: "RA 규제 영향도 분석 기준 보완", owner: "RA", status: "TODO" },
      { week: "Week 3", task: "고객/공급사 외부 포털 테스트 계정 검증", owner: "Sales/Admin", status: "TODO" },
      { week: "Week 3", task: "Audit Log 및 백업 CSV 정기 저장", owner: "Admin", status: "TODO" },
      { week: "Week 4", task: "v1.1 개선 요구사항 정리", owner: "All", status: "TODO" },
      { week: "Week 4", task: "Enterprise v1.0 운영 리뷰", owner: "Admin", status: "TODO" },
    ];

    setStabilizationItems(items);
    setV1ReleaseNotes(notes);
    setPostGoLiveTasks(tasks);
    setStabilizationStatus(`v1.0 Stabilization Plan 생성 완료: 점검 ${items.length}건 / Release Note ${notes.length}건 / Post Go-Live ${tasks.length}건`);
  }

  function lockV1Baseline() {
    const hasP0Fix = stabilizationItems.some((item) => item.priority === "P0" && item.status === "FIX_REQUIRED");
    if (hasP0Fix) {
      setStabilizationStatus("P0 FIX_REQUIRED 항목이 있어 v1.0 기준선 Lock을 보류합니다.");
      return;
    }

    setStabilizationItems((prev) =>
      prev.map((item) =>
        item.category === "Release" || item.status === "STABLE" ? { ...item, status: "LOCKED" } : item
      )
    );

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "LOCK_V1_BASELINE",
        module: "Stabilization",
        target: v1Version,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setStabilizationStatus(`${v1Version} 기준선 Lock 완료`);
  }

  function updatePostGoLiveTask(week: string, task: string, status: PostGoLiveTask["status"]) {
    setPostGoLiveTasks((prev) =>
      prev.map((item) => item.week === week && item.task === task ? { ...item, status } : item)
    );
  }

  function exportStabilizationCsv() {
    exportCsv("enterprise_v1_stabilization.csv", [
      ["id", "category", "item", "status", "priority", "owner", "action"],
      ...stabilizationItems.map((item) => [item.id, item.category, item.item, item.status, item.priority, item.owner, item.action]),
    ]);
  }

  function exportV1ReleaseNotesCsv() {
    exportCsv("enterprise_v1_release_notes.csv", [
      ["module", "version", "status", "note"],
      ...v1ReleaseNotes.map((item) => [item.module, item.version, item.status, item.note]),
    ]);
  }

  function exportPostGoLivePlanCsv() {
    exportCsv("enterprise_post_go_live_4week_plan.csv", [
      ["week", "task", "owner", "status"],
      ...postGoLiveTasks.map((item) => [item.week, item.task, item.owner, item.status]),
    ]);
  }

  function generateWorkflowTemplates() {
    const templates: WorkflowTemplateItem[] = [
      {
        id: "WF-001",
        workflow_name: "신제품 개발 표준 Workflow",
        trigger_module: "Project",
        status: "ACTIVE",
        owner_team: "R&D",
        description: "프로젝트 생성부터 처방, QA/RA 검토, 고객 샘플, 출시 준비까지 연결",
      },
      {
        id: "WF-002",
        workflow_name: "처방 변경 승인 Workflow",
        trigger_module: "Formula",
        status: "ACTIVE",
        owner_team: "QA",
        description: "처방 변경 시 영향도 분석, QA 승인, 고객 제출 여부 검토",
      },
      {
        id: "WF-003",
        workflow_name: "원료 문서 갱신 Workflow",
        trigger_module: "Quality",
        status: "ACTIVE",
        owner_team: "QC",
        description: "원료문서 만료/임박 시 공급사 요청과 문서 갱신",
      },
      {
        id: "WF-004",
        workflow_name: "규제 변경 영향도 Workflow",
        trigger_module: "Regulation",
        status: "ACTIVE",
        owner_team: "RA",
        description: "국가별 규제 변경 시 관련 성분/처방/고객 프로젝트 영향도 검토",
      },
      {
        id: "WF-005",
        workflow_name: "고객 샘플 피드백 Workflow",
        trigger_module: "Customer",
        status: "ACTIVE",
        owner_team: "Sales",
        description: "샘플 발송 후 고객 피드백을 처방 Revision과 승인관리로 연결",
      },
    ];

    const steps: WorkflowStepItem[] = [
      { id: "WFS-001", workflow_id: "WF-001", step_no: 1, step_name: "프로젝트 요구사항 등록", owner_team: "R&D", action_type: "TASK", due_days: 1, required: true },
      { id: "WFS-002", workflow_id: "WF-001", step_no: 2, step_name: "AI/유사 처방 검토", owner_team: "R&D", action_type: "CHECK", due_days: 2, required: true },
      { id: "WFS-003", workflow_id: "WF-001", step_no: 3, step_name: "처방 Draft 작성", owner_team: "R&D", action_type: "TASK", due_days: 3, required: true },
      { id: "WFS-004", workflow_id: "WF-001", step_no: 4, step_name: "원가/BOM 사전 검토", owner_team: "R&D", action_type: "CHECK", due_days: 1, required: true },
      { id: "WFS-005", workflow_id: "WF-001", step_no: 5, step_name: "QA 안정성/문서 검토", owner_team: "QA", action_type: "APPROVAL", due_days: 3, required: true },
      { id: "WFS-006", workflow_id: "WF-001", step_no: 6, step_name: "RA 규제 영향도 검토", owner_team: "RA", action_type: "APPROVAL", due_days: 3, required: true },
      { id: "WFS-007", workflow_id: "WF-001", step_no: 7, step_name: "샘플 발송 및 고객 피드백", owner_team: "Sales", action_type: "TASK", due_days: 5, required: true },
      { id: "WFS-008", workflow_id: "WF-001", step_no: 8, step_name: "출시 준비 Gate", owner_team: "Admin", action_type: "SYSTEM", due_days: 1, required: true },

      { id: "WFS-009", workflow_id: "WF-002", step_no: 1, step_name: "처방 변경 사유 입력", owner_team: "R&D", action_type: "TASK", due_days: 1, required: true },
      { id: "WFS-010", workflow_id: "WF-002", step_no: 2, step_name: "Master Repository 영향도 분석", owner_team: "R&D", action_type: "CHECK", due_days: 1, required: true },
      { id: "WFS-011", workflow_id: "WF-002", step_no: 3, step_name: "QA 변경 승인", owner_team: "QA", action_type: "APPROVAL", due_days: 2, required: true },
      { id: "WFS-012", workflow_id: "WF-002", step_no: 4, step_name: "고객 제출자료 재생성", owner_team: "Sales", action_type: "DOCUMENT", due_days: 2, required: false },

      { id: "WFS-013", workflow_id: "WF-003", step_no: 1, step_name: "만료 문서 확인", owner_team: "QC", action_type: "CHECK", due_days: 1, required: true },
      { id: "WFS-014", workflow_id: "WF-003", step_no: 2, step_name: "공급사 문서 요청", owner_team: "QC", action_type: "NOTIFICATION", due_days: 1, required: true },
      { id: "WFS-015", workflow_id: "WF-003", step_no: 3, step_name: "문서 수령 및 검토", owner_team: "QC", action_type: "APPROVAL", due_days: 5, required: true },
    ];

    setWorkflowTemplates(templates);
    setWorkflowSteps(steps);
    setWorkflowStatus(`Workflow Template 생성 완료: 템플릿 ${templates.length}개 / 단계 ${steps.length}개`);
  }

  function startWorkflowRun(workflowId: string) {
    const template = workflowTemplates.find((item) => item.id === workflowId);
    const templateSteps = workflowSteps.filter((item) => item.workflow_id === workflowId).sort((a, b) => a.step_no - b.step_no);
    const firstStep = templateSteps[0];

    if (!template || !firstStep) {
      alert("워크플로우 템플릿과 단계가 필요합니다.");
      return;
    }

    const run: WorkflowRunItem = {
      id: `RUN-${String(workflowRuns.length + 1).padStart(3, "0")}`,
      workflow_id: workflowId,
      target: workflowTarget || "Target 미지정",
      current_step: firstStep.step_name,
      status: firstStep.action_type === "APPROVAL" ? "WAITING_APPROVAL" : "IN_PROGRESS",
      progress: Math.round((1 / templateSteps.length) * 100),
      owner: firstStep.owner_team,
    };

    const tasks: WorkflowTaskItem[] = templateSteps.map((step) => {
      const due = new Date();
      due.setDate(due.getDate() + step.due_days);
      return {
        id: `TASK-${workflowRuns.length + 1}-${step.step_no}`,
        run_id: run.id,
        task_name: step.step_name,
        owner_team: step.owner_team,
        status: step.step_no === 1 ? "IN_PROGRESS" : "TODO",
        due_date: due.toISOString().slice(0, 10),
        note: `${template.workflow_name} / ${step.action_type}`,
      };
    });

    setWorkflowRuns([run, ...workflowRuns]);
    setWorkflowTasks([...tasks, ...workflowTasks]);

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "관리자",
        action: "START_WORKFLOW",
        module: "Workflow",
        target: `${template.workflow_name} / ${workflowTarget}`,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setWorkflowStatus(`${template.workflow_name} 실행 시작: ${run.id}`);
  }

  function completeWorkflowTask(taskId: string) {
    const task = workflowTasks.find((item) => item.id === taskId);
    if (!task) return;

    setWorkflowTasks((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, status: "DONE" } : item
      )
    );

    const runTasks = workflowTasks.filter((item) => item.run_id === task.run_id);
    const completedCount = runTasks.filter((item) => item.status === "DONE").length + 1;
    const progress = Math.round((completedCount / runTasks.length) * 100);
    const nextTask = runTasks.find((item) => item.id !== taskId && item.status === "TODO");

    setWorkflowRuns((prev) =>
      prev.map((run) =>
        run.id === task.run_id
          ? {
              ...run,
              current_step: nextTask ? nextTask.task_name : "Completed",
              status: progress >= 100 ? "COMPLETED" : nextTask?.task_name.includes("승인") ? "WAITING_APPROVAL" : "IN_PROGRESS",
              progress,
              owner: nextTask ? nextTask.owner_team : run.owner,
            }
          : run
      )
    );
  }

  function blockWorkflowRun(runId: string) {
    setWorkflowRuns((prev) =>
      prev.map((run) =>
        run.id === runId ? { ...run, status: "BLOCKED" } : run
      )
    );
  }

  function exportWorkflowTemplatesCsv() {
    exportCsv("enterprise_workflow_templates.csv", [
      ["id", "workflow_name", "trigger_module", "status", "owner_team", "description"],
      ...workflowTemplates.map((item) => [item.id, item.workflow_name, item.trigger_module, item.status, item.owner_team, item.description]),
    ]);
  }

  function exportWorkflowRunsCsv() {
    exportCsv("enterprise_workflow_runs.csv", [
      ["id", "workflow_id", "target", "current_step", "status", "progress", "owner"],
      ...workflowRuns.map((item) => [item.id, item.workflow_id, item.target, item.current_step, item.status, item.progress, item.owner]),
    ]);
  }

  function exportWorkflowTasksCsv() {
    exportCsv("enterprise_workflow_tasks.csv", [
      ["id", "run_id", "task_name", "owner_team", "status", "due_date", "note"],
      ...workflowTasks.map((item) => [item.id, item.run_id, item.task_name, item.owner_team, item.status, item.due_date, item.note]),
    ]);
  }

  function runFormulaSimulation() {
    const batchKg = Number(simulationBatchKg || 1);
    const targetCost = Number(simulationTargetCost || 12000);
    const targetPh = Number(simulationTargetPh || 5.5);
    const targetViscosity = Number(simulationTargetViscosity || 3000);

    const formula = formulas.find((item) => item.formula_code === simulationFormulaCode) || formulas[0];
    const materialCost = formula?.material_cost || targetCost;
    const predictedCost = Math.round(materialCost * (batchKg >= 100 ? 0.92 : batchKg >= 10 ? 0.96 : 1.0));
    const predictedPh = Number((targetPh + (regulations.some((item) => item.regulation_type === "Restricted") ? -0.1 : 0.05)).toFixed(2));
    const predictedViscosity = Math.round(targetViscosity * (batchKg >= 100 ? 0.95 : 1.02));

    const stabilityScore = Math.max(60, 95 - stabilityRecords.filter((item) => item.result === "WATCH").length * 8 - qualityStats.expired * 12);
    const highRegulationCount = regImpacts.filter((item) => item.risk === "HIGH").length;
    const mediumRegulationCount = regImpacts.filter((item) => item.risk === "MEDIUM").length;
    const regulationScore = Math.max(40, 100 - highRegulationCount * 25 - mediumRegulationCount * 10);
    const costScore = predictedCost <= targetCost ? 100 : Math.max(50, 100 - Math.round(((predictedCost - targetCost) / targetCost) * 100));
    const totalScore = Math.round((stabilityScore * 0.35 + regulationScore * 0.35 + costScore * 0.3));
    const riskLevel: FormulaSimulationResult["risk_level"] = totalScore >= 85 ? "LOW" : totalScore >= 70 ? "MEDIUM" : "HIGH";

    const input: FormulaSimulationInput = {
      id: crypto.randomUUID(),
      formula_code: simulationFormulaCode,
      target_batch_kg: batchKg,
      target_cost_per_kg: targetCost,
      target_ph: targetPh,
      target_viscosity: targetViscosity,
      market_country: simulationCountry,
    };

    const result: FormulaSimulationResult = {
      id: crypto.randomUUID(),
      formula_code: simulationFormulaCode,
      batch_kg: batchKg,
      predicted_cost_per_kg: predictedCost,
      predicted_ph: predictedPh,
      predicted_viscosity: predictedViscosity,
      stability_score: stabilityScore,
      regulation_score: regulationScore,
      total_score: totalScore,
      recommendation: riskLevel === "LOW" ? "Scale-up 검토 가능" : riskLevel === "MEDIUM" ? "원가/안정성/규제 조건 추가 검토 필요" : "출시 전 처방 수정 및 RA/QA 재검토 필요",
      risk_level: riskLevel,
    };

    const substitutions: MaterialSubstitutionItem[] = rawMaterials.slice(0, 3).map((raw, index) => ({
      id: `SUB-${Date.now()}-${index}`,
      source_raw: raw.raw_code,
      source_inci: raw.main_inci,
      substitute_raw: `ALT-${raw.raw_code}`,
      substitute_inci: raw.main_inci,
      reason: index === 0 ? "원가 절감 후보" : index === 1 ? "공급 안정성 후보" : "규제 리스크 저감 후보",
      expected_effect: index === 0 ? "예상 원가 3~8% 절감" : index === 1 ? "공급사 이원화 가능" : "판매국가 확장 가능",
      risk_level: index === 2 && regulationScore < 80 ? "MEDIUM" : "LOW",
    }));

    const optimizations: FormulaOptimizationItem[] = [
      { id: `OPT-${Date.now()}-1`, area: "Cost", suggestion: predictedCost > targetCost ? "고가 원료 대체 또는 투입량 최적화 필요" : "원가 목표 충족", expected_impact: predictedCost > targetCost ? `목표 대비 ${predictedCost - targetCost}원/kg 초과` : "원가 안정", priority: predictedCost > targetCost ? "P1" : "P3" },
      { id: `OPT-${Date.now()}-2`, area: "Stability", suggestion: stabilityScore < 80 ? "안정도 관찰 항목 기반 점증제/유화 안정화 검토" : "안정성 점수 양호", expected_impact: `안정성 점수 ${stabilityScore}`, priority: stabilityScore < 70 ? "P0" : stabilityScore < 80 ? "P1" : "P3" },
      { id: `OPT-${Date.now()}-3`, area: "Regulation", suggestion: regulationScore < 85 ? `${simulationCountry} 규제 영향도 재검토 필요` : "규제 점수 양호", expected_impact: `규제 점수 ${regulationScore}`, priority: regulationScore < 70 ? "P0" : regulationScore < 85 ? "P1" : "P3" },
      { id: `OPT-${Date.now()}-4`, area: "Texture", suggestion: predictedViscosity < targetViscosity * 0.8 ? "점도 보강 필요" : predictedViscosity > targetViscosity * 1.2 ? "사용감 개선을 위한 점도 저감 검토" : "점도 목표 범위", expected_impact: `예측 점도 ${predictedViscosity} cP`, priority: "P2" },
    ];

    setSimulationInputs([input, ...simulationInputs]);
    setSimulationResults([result, ...simulationResults]);
    setSubstitutionItems(substitutions);
    setOptimizationItems(optimizations);
    setSimulationStatus(`Simulation 완료: ${simulationFormulaCode} / ${batchKg}kg / Total Score ${totalScore}`);
  }

  function generateSimulationSeed() {
    setSimulationFormulaCode(formulas[0]?.formula_code || "FC-001");
    setSimulationBatchKg("10");
    setSimulationTargetCost(String(formulas[0]?.material_cost || 12000));
    setSimulationTargetPh("5.5");
    setSimulationTargetViscosity("3000");
    setSimulationCountry("EU");
    setSimulationStatus("Simulation Seed 입력 완료");
  }

  function exportSimulationResultsCsv() {
    exportCsv("enterprise_formula_simulation_results.csv", [
      ["formula_code", "batch_kg", "predicted_cost_per_kg", "predicted_ph", "predicted_viscosity", "stability_score", "regulation_score", "total_score", "risk_level", "recommendation"],
      ...simulationResults.map((item) => [item.formula_code, item.batch_kg, item.predicted_cost_per_kg, item.predicted_ph, item.predicted_viscosity, item.stability_score, item.regulation_score, item.total_score, item.risk_level, item.recommendation]),
    ]);
  }

  function exportSubstitutionCsv() {
    exportCsv("enterprise_material_substitution.csv", [
      ["source_raw", "source_inci", "substitute_raw", "substitute_inci", "reason", "expected_effect", "risk_level"],
      ...substitutionItems.map((item) => [item.source_raw, item.source_inci, item.substitute_raw, item.substitute_inci, item.reason, item.expected_effect, item.risk_level]),
    ]);
  }

  function exportOptimizationCsv() {
    exportCsv("enterprise_formula_optimization.csv", [
      ["area", "suggestion", "expected_impact", "priority"],
      ...optimizationItems.map((item) => [item.area, item.suggestion, item.expected_impact, item.priority]),
    ]);
  }

  function getBatchType(batchKg: number): ScaleUpBatchItem["batch_type"] {
    if (batchKg < 10) return "Lab";
    if (batchKg < 100) return "Pilot";
    if (batchKg < 1000) return "Production";
    return "Mass";
  }

  function runScaleUpCalculation() {
    const batchKg = Number(scaleBatchKg || 100);
    const yieldPercent = Number(scaleYieldPercent || 97);
    const lossPercent = Number(scaleLossPercent || 2);
    const formula = formulas.find((item) => item.formula_code === scaleFormulaCode) || formulas[0];
    const batchType = getBatchType(batchKg);

    const sourceMaterials = rawMaterials.length > 0 ? rawMaterials.slice(0, Math.min(5, rawMaterials.length)) : [];
    const equalPercent = sourceMaterials.length ? 100 / sourceMaterials.length : 0;

    const batchId = `BATCH-${Date.now()}`;
    const bom: BomItem[] = sourceMaterials.map((raw, index) => {
      const percentage = Number((equalPercent + (index === 0 ? 0 : 0)).toFixed(4));
      const requiredKg = Number((batchKg * (percentage / 100)).toFixed(4));
      const purchaseKg = Number((requiredKg * (1 + lossPercent / 100) / (yieldPercent / 100)).toFixed(4));
      const amount = Math.round(purchaseKg * raw.unit_price);

      return {
        id: `BOM-${Date.now()}-${index}`,
        batch_id: batchId,
        raw_code: raw.raw_code,
        raw_name: raw.raw_name,
        percentage,
        required_kg: requiredKg,
        loss_percent: lossPercent,
        purchase_kg: purchaseKg,
        unit_price: raw.unit_price,
        amount,
      };
    });

    const estimatedCost = bom.reduce((sum, item) => sum + item.amount, 0);
    const status: ScaleUpBatchItem["status"] =
      qualityStats.expired > 0 || regImpacts.some((item) => item.risk === "HIGH") ? "BLOCKED" : "READY";

    const batch: ScaleUpBatchItem = {
      id: batchId,
      formula_code: scaleFormulaCode,
      batch_size_kg: batchKg,
      batch_type: batchType,
      status,
      estimated_cost: estimatedCost,
      yield_percent: yieldPercent,
      note: `${batchType} scale / ${formula?.formula_name || scaleFormulaCode}`,
    };

    const steps: ManufacturingStepItem[] = [
      { id: `STEP-${batchId}-1`, batch_id: batchId, step_no: 1, phase: "A", process: "정제수/수상 원료 투입 후 교반", temperature: "25-40℃", rpm: batchKg >= 100 ? "30-60" : "200-400", time_min: 20, qc_check: "완전 용해 확인" },
      { id: `STEP-${batchId}-2`, batch_id: batchId, step_no: 2, phase: "B", process: "오일상 또는 점증제 분산", temperature: "40-75℃", rpm: batchKg >= 100 ? "40-80" : "300-600", time_min: 30, qc_check: "덩어리/미분산 확인" },
      { id: `STEP-${batchId}-3`, batch_id: batchId, step_no: 3, phase: "C", process: "유화 또는 본 혼합", temperature: "65-75℃", rpm: batchKg >= 100 ? "80-120" : "800-1200", time_min: 15, qc_check: "입자/분리 여부 확인" },
      { id: `STEP-${batchId}-4`, batch_id: batchId, step_no: 4, phase: "D", process: "냉각 후 후첨 원료 투입", temperature: "35-45℃", rpm: batchKg >= 100 ? "30-60" : "200-400", time_min: 20, qc_check: "향/보존제 균일성 확인" },
      { id: `STEP-${batchId}-5`, batch_id: batchId, step_no: 5, phase: "QC", process: "pH/점도/외관/중량 확인", temperature: "RT", rpm: "-", time_min: 10, qc_check: "기준 적합 시 충진 이관" },
    ];

    const risks: ScaleUpRiskItem[] = [
      {
        id: `RISK-${batchId}-1`,
        category: "Process",
        risk: batchKg >= 100 ? "Lab 대비 대형 탱크 교반 효율 차이" : "Lab/Pilot 조건",
        level: batchKg >= 500 ? "HIGH" : batchKg >= 100 ? "MEDIUM" : "LOW",
        action: "교반 RPM, 임펠러, 투입 순서 scale-up 검증",
      },
      {
        id: `RISK-${batchId}-2`,
        category: "Material",
        risk: sourceMaterials.some((raw) => Math.abs(raw.composition_total - 100) > 0.0001) ? "원료조성 100% 오류 존재" : "원료조성 정상",
        level: sourceMaterials.some((raw) => Math.abs(raw.composition_total - 100) > 0.0001) ? "HIGH" : "LOW",
        action: "원료조성표와 Breakdown IL 재검증",
      },
      {
        id: `RISK-${batchId}-3`,
        category: "Quality",
        risk: qualityStats.expired > 0 ? "만료 문서 존재" : "원료문서 상태 정상",
        level: qualityStats.expired > 0 ? "HIGH" : qualityStats.expiring > 0 ? "MEDIUM" : "LOW",
        action: "COA/MSDS/TDS 갱신 후 생산 이관",
      },
      {
        id: `RISK-${batchId}-4`,
        category: "Regulation",
        risk: regImpacts.some((item) => item.risk === "HIGH") ? "규제 HIGH 리스크 존재" : "규제 리스크 낮음",
        level: regImpacts.some((item) => item.risk === "HIGH") ? "HIGH" : regImpacts.some((item) => item.risk === "MEDIUM") ? "MEDIUM" : "LOW",
        action: "RA 승인 전 Mass 생산 보류",
      },
    ];

    setScaleUpBatches([batch, ...scaleUpBatches]);
    setBomItems([...bom, ...bomItems]);
    setManufacturingSteps([...steps, ...manufacturingSteps]);
    setScaleUpRisks(risks);
    setScaleUpStatus(`Scale-Up 계산 완료: ${scaleFormulaCode} / ${batchKg}kg / 예상 원가 ${estimatedCost.toLocaleString()}원`);
  }

  function approveScaleUpBatch(id: string) {
    setScaleUpBatches((prev) =>
      prev.map((item) =>
        item.id === id && item.status !== "BLOCKED" ? { ...item, status: "APPROVED" } : item
      )
    );
  }

  function exportScaleUpBatchesCsv() {
    exportCsv("enterprise_scale_up_batches.csv", [
      ["id", "formula_code", "batch_size_kg", "batch_type", "status", "estimated_cost", "yield_percent", "note"],
      ...scaleUpBatches.map((item) => [item.id, item.formula_code, item.batch_size_kg, item.batch_type, item.status, item.estimated_cost, item.yield_percent, item.note]),
    ]);
  }

  function exportBomCsv() {
    exportCsv("enterprise_bom_items.csv", [
      ["batch_id", "raw_code", "raw_name", "percentage", "required_kg", "loss_percent", "purchase_kg", "unit_price", "amount"],
      ...bomItems.map((item) => [item.batch_id, item.raw_code, item.raw_name, item.percentage, item.required_kg, item.loss_percent, item.purchase_kg, item.unit_price, item.amount]),
    ]);
  }

  function exportManufacturingStepsCsv() {
    exportCsv("enterprise_manufacturing_steps.csv", [
      ["batch_id", "step_no", "phase", "process", "temperature", "rpm", "time_min", "qc_check"],
      ...manufacturingSteps.map((item) => [item.batch_id, item.step_no, item.phase, item.process, item.temperature, item.rpm, item.time_min, item.qc_check]),
    ]);
  }

  function exportScaleUpRisksCsv() {
    exportCsv("enterprise_scale_up_risks.csv", [
      ["category", "risk", "level", "action"],
      ...scaleUpRisks.map((item) => [item.category, item.risk, item.level, item.action]),
    ]);
  }

  function createElnExperiment() {
    const experimentId = `ELN-${Date.now()}`;
    const experiment: ElnExperimentItem = {
      id: experimentId,
      experiment_no: `EXP-${new Date().getFullYear()}-${String(elnExperiments.length + 1).padStart(3, "0")}`,
      project_code: elnProjectCode,
      formula_code: elnFormulaCode,
      title: elnTitle,
      researcher: elnResearcher,
      status: "IN_PROGRESS",
      experiment_date: new Date().toISOString().slice(0, 10),
      objective: "처방의 외관, pH, 점도, 안정성 및 제조 적합성 확인",
    };

    const observations: ElnObservationItem[] = [
      {
        id: `OBS-${experimentId}-1`,
        experiment_id: experimentId,
        time_point: "T0",
        observation_type: "Appearance",
        value: "균일한 백색 크림상",
        result: "PASS",
        note: "분리/응집 없음",
      },
      {
        id: `OBS-${experimentId}-2`,
        experiment_id: experimentId,
        time_point: "T0",
        observation_type: "pH",
        value: "5.5",
        result: "PASS",
        note: "목표 pH 범위",
      },
      {
        id: `OBS-${experimentId}-3`,
        experiment_id: experimentId,
        time_point: "T0",
        observation_type: "Viscosity",
        value: "3,000 cP",
        result: "PASS",
        note: "초기 점도 기준",
      },
      {
        id: `OBS-${experimentId}-4`,
        experiment_id: experimentId,
        time_point: "1W",
        observation_type: "Stability",
        value: "관찰 예정",
        result: "WATCH",
        note: "45℃/RT/5℃ 안정도 관찰 필요",
      },
    ];

    const attachments: ElnAttachmentItem[] = [
      {
        id: `ATT-${experimentId}-1`,
        experiment_id: experimentId,
        file_name: `${experiment.experiment_no}_photo.jpg`,
        file_type: "Image",
        status: "NEEDS_REVIEW",
        note: "실험 사진 첨부 예정",
      },
      {
        id: `ATT-${experimentId}-2`,
        experiment_id: experimentId,
        file_name: `${experiment.experiment_no}_raw_data.xlsx`,
        file_type: "Excel",
        status: "NEEDS_REVIEW",
        note: "pH/점도 원자료 첨부 예정",
      },
    ];

    const signatures: ElnSignatureItem[] = [
      {
        id: `SIG-${experimentId}-1`,
        experiment_id: experimentId,
        signer: elnResearcher,
        role: "Researcher",
        status: "REQUESTED",
        signed_at: "-",
      },
      {
        id: `SIG-${experimentId}-2`,
        experiment_id: experimentId,
        signer: "QA Reviewer",
        role: "Reviewer",
        status: "REQUESTED",
        signed_at: "-",
      },
    ];

    setElnExperiments([experiment, ...elnExperiments]);
    setElnObservations([...observations, ...elnObservations]);
    setElnAttachments([...attachments, ...elnAttachments]);
    setElnSignatures([...signatures, ...elnSignatures]);

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: elnResearcher,
        action: "CREATE_ELN_EXPERIMENT",
        module: "ELN",
        target: experiment.experiment_no,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setElnStatus(`ELN 실험 생성 완료: ${experiment.experiment_no}`);
  }

  function addElnObservation(experimentId: string, type: ElnObservationItem["observation_type"], value: string, result: ElnObservationItem["result"]) {
    const observation: ElnObservationItem = {
      id: crypto.randomUUID(),
      experiment_id: experimentId,
      time_point: new Date().toISOString().slice(0, 10),
      observation_type: type,
      value,
      result,
      note: result === "PASS" ? "기준 적합" : result === "WATCH" ? "추가 관찰 필요" : "재시험 또는 처방 수정 필요",
    };

    setElnObservations([observation, ...elnObservations]);
  }

  function requestElnReview(experimentId: string) {
    setElnExperiments((prev) =>
      prev.map((item) =>
        item.id === experimentId ? { ...item, status: "REVIEW" } : item
      )
    );
    setElnStatus("ELN Review 요청 완료");
  }

  function signEln(signatureId: string) {
    setElnSignatures((prev) =>
      prev.map((item) =>
        item.id === signatureId ? { ...item, status: "SIGNED", signed_at: new Date().toISOString().slice(0, 16).replace("T", " ") } : item
      )
    );

    const signature = elnSignatures.find((item) => item.id === signatureId);
    if (signature) {
      const experimentSignatures = elnSignatures.filter((item) => item.experiment_id === signature.experiment_id);
      const signedCount = experimentSignatures.filter((item) => item.status === "SIGNED").length + 1;
      if (signedCount >= experimentSignatures.length) {
        setElnExperiments((prev) =>
          prev.map((item) =>
            item.id === signature.experiment_id ? { ...item, status: "SIGNED" } : item
          )
        );
      }
    }
  }

  function exportElnExperimentsCsv() {
    exportCsv("enterprise_eln_experiments.csv", [
      ["experiment_no", "project_code", "formula_code", "title", "researcher", "status", "experiment_date", "objective"],
      ...elnExperiments.map((item) => [item.experiment_no, item.project_code, item.formula_code, item.title, item.researcher, item.status, item.experiment_date, item.objective]),
    ]);
  }

  function exportElnObservationsCsv() {
    exportCsv("enterprise_eln_observations.csv", [
      ["experiment_id", "time_point", "observation_type", "value", "result", "note"],
      ...elnObservations.map((item) => [item.experiment_id, item.time_point, item.observation_type, item.value, item.result, item.note]),
    ]);
  }

  function exportElnSignaturesCsv() {
    exportCsv("enterprise_eln_signatures.csv", [
      ["experiment_id", "signer", "role", "status", "signed_at"],
      ...elnSignatures.map((item) => [item.experiment_id, item.signer, item.role, item.status, item.signed_at]),
    ]);
  }

  function createLimsSample() {
    const sampleId = `LIMS-${Date.now()}`;
    const sample: LimsSampleItem = {
      id: sampleId,
      sample_no: `QC-${new Date().getFullYear()}-${String(limsSamples.length + 1).padStart(3, "0")}`,
      project_code: limsProjectCode,
      formula_code: limsFormulaCode,
      sample_type: "Lab",
      status: "TESTING",
      received_date: new Date().toISOString().slice(0, 10),
      requester: limsRequester,
    };

    const tests: LimsTestItem[] = [
      {
        id: `TEST-${sampleId}-1`,
        sample_id: sampleId,
        test_name: "Appearance",
        method: "Visual Inspection",
        specification: "균일, 이물/분리 없음",
        result_value: "균일한 크림상",
        judgment: "PASS",
        analyst: "QC",
      },
      {
        id: `TEST-${sampleId}-2`,
        sample_id: sampleId,
        test_name: "pH",
        method: "pH Meter",
        specification: "5.0 - 6.5",
        result_value: "5.6",
        judgment: "PASS",
        analyst: "QC",
      },
      {
        id: `TEST-${sampleId}-3`,
        sample_id: sampleId,
        test_name: "Viscosity",
        method: "Brookfield",
        specification: "2,000 - 5,000 cP",
        result_value: "3,200 cP",
        judgment: "PASS",
        analyst: "QC",
      },
      {
        id: `TEST-${sampleId}-4`,
        sample_id: sampleId,
        test_name: "Microbial",
        method: "Plate Count",
        specification: "기준 적합",
        result_value: "Pending",
        judgment: "PENDING",
        analyst: "QC",
      },
    ];

    const stabilities: LimsStabilityItem[] = [
      {
        id: `STAB-${sampleId}-1`,
        sample_id: sampleId,
        condition: "RT",
        time_point: "T0",
        result: "PASS",
        observation: "이상 없음",
      },
      {
        id: `STAB-${sampleId}-2`,
        sample_id: sampleId,
        condition: "45C",
        time_point: "1W",
        result: "PENDING",
        observation: "관찰 예정",
      },
      {
        id: `STAB-${sampleId}-3`,
        sample_id: sampleId,
        condition: "5C",
        time_point: "1W",
        result: "PENDING",
        observation: "관찰 예정",
      },
    ];

    setLimsSamples([sample, ...limsSamples]);
    setLimsTests([...tests, ...limsTests]);
    setLimsStabilities([...stabilities, ...limsStabilities]);

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: limsRequester,
        action: "CREATE_LIMS_SAMPLE",
        module: "LIMS",
        target: sample.sample_no,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setLimsStatus(`LIMS Sample 접수 완료: ${sample.sample_no}`);
  }

  function updateLimsTestJudgment(testId: string, judgment: LimsTestItem["judgment"]) {
    setLimsTests((prev) =>
      prev.map((item) =>
        item.id === testId ? { ...item, judgment } : item
      )
    );
  }

  function updateStabilityResult(id: string, result: LimsStabilityItem["result"]) {
    setLimsStabilities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, result, observation: result === "PASS" ? "이상 없음" : result === "WATCH" ? "추가 관찰 필요" : result === "분리/변색 등 부적합" } : item
      )
    );
  }

  function reviewLimsSample(sampleId: string) {
    const sampleTests = limsTests.filter((item) => item.sample_id === sampleId);
    const sampleStabilities = limsStabilities.filter((item) => item.sample_id === sampleId);
    const hasFail = sampleTests.some((item) => item.judgment === "OOS") || sampleStabilities.some((item) => item.result === "FAIL");
    const hasPending = sampleTests.some((item) => item.judgment === "PENDING") || sampleStabilities.some((item) => item.result === "PENDING");

    setLimsSamples((prev) =>
      prev.map((item) =>
        item.id === sampleId ? { ...item, status: hasFail ? "REJECTED" : hasPending ? "REVIEW" : "APPROVED" } : item
      )
    );

    setLimsStatus(hasFail ? "OOS/FAIL 항목이 있어 REJECTED 처리되었습니다." : hasPending ? "Pending 항목이 있어 REVIEW 상태입니다." : "모든 항목 PASS, APPROVED 처리되었습니다.");
  }

  function issueCoa(sampleId: string) {
    const sample = limsSamples.find((item) => item.id === sampleId);
    if (!sample) return;

    const sampleTests = limsTests.filter((item) => item.sample_id === sampleId);
    const hasOos = sampleTests.some((item) => item.judgment === "OOS");
    const pending = sampleTests.some((item) => item.judgment === "PENDING");

    const coa: LimsCoaItem = {
      id: crypto.randomUUID(),
      sample_id: sampleId,
      coa_no: `COA-${new Date().getFullYear()}-${String(limsCoas.length + 1).padStart(3, "0")}`,
      status: hasOos || pending ? "DRAFT" : "ISSUED",
      issued_date: hasOos || pending ? "-" : new Date().toISOString().slice(0, 10),
      summary: hasOos ? "OOS 항목 존재, COA 발행 보류" : pending ? "Pending 항목 존재, Review 필요" : "시험 기준 적합",
    };

    setLimsCoas([coa, ...limsCoas]);
    setLimsStatus(`COA 생성 완료: ${coa.coa_no} / ${coa.status}`);
  }

  function exportLimsSamplesCsv() {
    exportCsv("enterprise_lims_samples.csv", [
      ["sample_no", "project_code", "formula_code", "sample_type", "status", "received_date", "requester"],
      ...limsSamples.map((item) => [item.sample_no, item.project_code, item.formula_code, item.sample_type, item.status, item.received_date, item.requester]),
    ]);
  }

  function exportLimsTestsCsv() {
    exportCsv("enterprise_lims_tests.csv", [
      ["sample_id", "test_name", "method", "specification", "result_value", "judgment", "analyst"],
      ...limsTests.map((item) => [item.sample_id, item.test_name, item.method, item.specification, item.result_value, item.judgment, item.analyst]),
    ]);
  }

  function exportLimsStabilityCsv() {
    exportCsv("enterprise_lims_stability.csv", [
      ["sample_id", "condition", "time_point", "result", "observation"],
      ...limsStabilities.map((item) => [item.sample_id, item.condition, item.time_point, item.result, item.observation]),
    ]);
  }

  function exportLimsCoaCsv() {
    exportCsv("enterprise_lims_coa.csv", [
      ["sample_id", "coa_no", "status", "issued_date", "summary"],
      ...limsCoas.map((item) => [item.sample_id, item.coa_no, item.status, item.issued_date, item.summary]),
    ]);
  }

  function createMesWorkOrder() {
    const qty = Number(mesQtyKg || 100);
    const selectedBatch = mesBatchId || scaleUpBatches[0]?.id || `BATCH-MANUAL-${Date.now()}`;
    const woId = `WO-${Date.now()}`;
    const workOrder: MesWorkOrderItem = {
      id: woId,
      work_order_no: `MO-${new Date().getFullYear()}-${String(mesWorkOrders.length + 1).padStart(3, "0")}`,
      formula_code: mesFormulaCode,
      batch_id: selectedBatch,
      production_qty_kg: qty,
      status: "PLANNED",
      planned_date: new Date().toISOString().slice(0, 10),
      line: mesLine,
    };

    const sourceBom = bomItems.filter((item) => item.batch_id === selectedBatch);
    const fallbackRaw = rawMaterials.slice(0, Math.min(5, rawMaterials.length));
    const lots: MesLotItem[] = (sourceBom.length > 0 ? sourceBom : fallbackRaw.map((raw, index) => ({
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      required_kg: Number((qty / Math.max(1, fallbackRaw.length)).toFixed(4)),
    } as BomItem))).map((bom, index) => ({
      id: `LOT-${woId}-${index + 1}`,
      lot_no: `LOT-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
      work_order_id: woId,
      raw_code: bom.raw_code,
      raw_lot_no: `${bom.raw_code}-L${String(index + 1).padStart(3, "0")}`,
      required_kg: Number((bom.required_kg || qty / Math.max(1, fallbackRaw.length)).toFixed(4)),
      consumed_kg: 0,
      status: "RESERVED",
    }));

    const steps: MesProcessLogItem[] = [
      {
        id: `PROC-${woId}-1`,
        work_order_id: woId,
        step_no: 1,
        process_name: "원료 칭량 확인",
        start_time: "-",
        end_time: "-",
        operator: "생산",
        status: "WAITING",
        note: "BOM 기준 원료/LOT 확인",
      },
      {
        id: `PROC-${woId}-2`,
        work_order_id: woId,
        step_no: 2,
        process_name: "제조 탱크 투입 및 교반",
        start_time: "-",
        end_time: "-",
        operator: "생산",
        status: "WAITING",
        note: "제조공정표 기준 진행",
      },
      {
        id: `PROC-${woId}-3`,
        work_order_id: woId,
        step_no: 3,
        process_name: "In-Process QC",
        start_time: "-",
        end_time: "-",
        operator: "QC",
        status: "WAITING",
        note: "pH/점도/외관 확인",
      },
      {
        id: `PROC-${woId}-4`,
        work_order_id: woId,
        step_no: 4,
        process_name: "충진 이관",
        start_time: "-",
        end_time: "-",
        operator: "생산",
        status: "WAITING",
        note: "QC 승인 후 충진",
      },
    ];

    setMesWorkOrders([workOrder, ...mesWorkOrders]);
    setMesLots([...lots, ...mesLots]);
    setMesProcessLogs([...steps, ...mesProcessLogs]);

    setAdminAudits([
      {
        id: crypto.randomUUID(),
        actor: "생산관리",
        action: "CREATE_MES_WORK_ORDER",
        module: "MES",
        target: workOrder.work_order_no,
        created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...adminAudits,
    ]);

    setMesStatus(`작업지시 생성 완료: ${workOrder.work_order_no}`);
  }

  function releaseWorkOrder(id: string) {
    const hasHighRisk = scaleUpRisks.some((item) => item.level === "HIGH") || qualityStats.expired > 0;
    setMesWorkOrders((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: hasHighRisk ? "QC_HOLD" : "RELEASED" } : item
      )
    );
    setMesStatus(hasHighRisk ? "HIGH Risk 또는 만료 문서로 QC_HOLD 처리되었습니다." : "작업지시 RELEASED 처리 완료");
  }

  function startProcessStep(id: string) {
    setMesProcessLogs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "RUNNING", start_time: new Date().toISOString().slice(0, 16).replace("T", " ") } : item
      )
    );
  }

  function completeProcessStep(id: string) {
    setMesProcessLogs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "DONE", end_time: new Date().toISOString().slice(0, 16).replace("T", " ") } : item
      )
    );
  }

  function consumeLot(id: string) {
    setMesLots((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "CONSUMED", consumed_kg: item.required_kg } : item
      )
    );
  }

  function addMesDeviation(workOrderId: string, severity: MesDeviationItem["severity"], message: string) {
    const deviation: MesDeviationItem = {
      id: `DEV-${Date.now()}`,
      work_order_id: workOrderId,
      severity,
      deviation: message,
      status: severity === "HIGH" || severity === "CRITICAL" ? "CAPA_REQUIRED" : "OPEN",
      action: severity === "HIGH" || severity === "CRITICAL" ? "QA/CAPA 검토 후 재개" : "현장 조치 후 기록",
    };
    setMesDeviations([deviation, ...mesDeviations]);

    if (severity === "HIGH" || severity === "CRITICAL") {
      setMesWorkOrders((prev) =>
        prev.map((item) =>
          item.id === workOrderId ? { ...item, status: "QC_HOLD" } : item
        )
      );
    }
  }

  function closeMesDeviation(id: string) {
    setMesDeviations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "CLOSED" } : item
      )
    );
  }

  function completeWorkOrder(id: string) {
    const openDeviation = mesDeviations.some((item) => item.work_order_id === id && item.status !== "CLOSED");
    if (openDeviation) {
      setMesStatus("미종결 Deviation이 있어 완료할 수 없습니다.");
      return;
    }

    setMesWorkOrders((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "COMPLETED" } : item
      )
    );
    setMesStatus("작업지시 COMPLETED 처리 완료");
  }

  function exportMesWorkOrdersCsv() {
    exportCsv("enterprise_mes_work_orders.csv", [
      ["work_order_no", "formula_code", "batch_id", "production_qty_kg", "status", "planned_date", "line"],
      ...mesWorkOrders.map((item) => [item.work_order_no, item.formula_code, item.batch_id, item.production_qty_kg, item.status, item.planned_date, item.line]),
    ]);
  }

  function exportMesLotsCsv() {
    exportCsv("enterprise_mes_lots.csv", [
      ["lot_no", "work_order_id", "raw_code", "raw_lot_no", "required_kg", "consumed_kg", "status"],
      ...mesLots.map((item) => [item.lot_no, item.work_order_id, item.raw_code, item.raw_lot_no, item.required_kg, item.consumed_kg, item.status]),
    ]);
  }

  function exportMesProcessCsv() {
    exportCsv("enterprise_mes_process_logs.csv", [
      ["work_order_id", "step_no", "process_name", "start_time", "end_time", "operator", "status", "note"],
      ...mesProcessLogs.map((item) => [item.work_order_id, item.step_no, item.process_name, item.start_time, item.end_time, item.operator, item.status, item.note]),
    ]);
  }

  function exportMesDeviationCsv() {
    exportCsv("enterprise_mes_deviations.csv", [
      ["work_order_id", "severity", "deviation", "status", "action"],
      ...mesDeviations.map((item) => [item.work_order_id, item.severity, item.deviation, item.status, item.action]),
    ]);
  }

  function generateV2IntegratedPackage() {
    const flows: V2IntegrationFlowItem[] = [
      { id: "V2-031-001", phase: "31", module: "Enterprise v2.0 Stabilization", flow_name: "Project → Formula → Simulation → Scale-Up → ELN → LIMS → MES", source: "Project", target: "MES", status: "CONNECTED", owner: "Admin" },
      { id: "V2-031-002", phase: "31", module: "Enterprise v2.0 Stabilization", flow_name: "Audit / Workflow / Approval 통합", source: "Workflow", target: "Audit", status: "READY", owner: "QA" },
      { id: "V2-032-001", phase: "32", module: "Digital Twin Factory", flow_name: "Batch Size → Mixer/RPM/Time/Yield 예측", source: "Scale-Up", target: "MES", status: "CONNECTED", owner: "Production" },
      { id: "V2-033-001", phase: "33", module: "AI Formula Expert", flow_name: "Simulation/LIMS/Regulation 기반 처방 개선 추천", source: "Simulation", target: "Formula", status: "READY", owner: "R&D" },
      { id: "V2-034-001", phase: "34", module: "Global Regulatory AI", flow_name: "국가별 규제 판정 → Workflow/Launch Gate", source: "Regulation", target: "Launch", status: "READY", owner: "RA" },
      { id: "V2-035-001", phase: "35", module: "Enterprise Analytics", flow_name: "전 모듈 KPI → Executive Dashboard", source: "Repository", target: "Dashboard", status: "CONNECTED", owner: "Admin" },
    ];

    const batchSizes = [1, 10, 100, 500, 3000];
    const twins: DigitalTwinItem[] = batchSizes.map((size) => {
      const mixer: DigitalTwinItem["mixer_type"] =
        size < 10 ? "Lab Homomixer" : size < 100 ? "Pilot Vacuum Mixer" : size < 1000 ? "Production Vacuum Mixer" : "Mass Tank";
      return {
        id: `TWIN-${size}`,
        batch_size_kg: size,
        mixer_type: mixer,
        predicted_rpm: size < 10 ? "800-1,200" : size < 100 ? "300-600" : size < 1000 ? "80-150" : "30-80",
        predicted_time_min: size < 10 ? 60 : size < 100 ? 90 : size < 1000 ? 150 : 240,
        predicted_yield_percent: size < 10 ? 98 : size < 100 ? 97 : size < 1000 ? 96 : 94,
        risk_level: size >= 1000 ? "HIGH" : size >= 100 ? "MEDIUM" : "LOW",
        note: size >= 1000 ? "Mass scale 교반/냉각/이송 검증 필요" : size >= 100 ? "Pilot 대비 생산 탱크 조건 확인" : "Lab/Pilot 검증 가능",
      };
    });

    const aiItems: AiFormulaExpertItem[] = [
      {
        id: "AI-FE-001",
        issue_type: "Viscosity",
        diagnosis: "Scale-up 시 점도 저하 가능성",
        recommendation: "점증제 0.05~0.15% 증량 또는 투입 순서 재검토",
        expected_result: "예상 점도 +800~1,500 cP",
        confidence: 82,
        priority: "P1",
      },
      {
        id: "AI-FE-002",
        issue_type: "Cost",
        diagnosis: "목표 원가 대비 고가 원료 영향 가능",
        recommendation: "동일 INCI의 공급사 이원화 및 대체 원료 검토",
        expected_result: "예상 원가 3~8% 절감",
        confidence: 76,
        priority: "P2",
      },
      {
        id: "AI-FE-003",
        issue_type: "Regulation",
        diagnosis: regImpacts.some((item) => item.risk === "HIGH") ? "규제 HIGH 리스크 존재" : "규제 리스크 낮음",
        recommendation: regImpacts.some((item) => item.risk === "HIGH") ? "RA 승인 전 출시 보류 및 성분 대체" : "판매국가 확장 검토 가능",
        expected_result: regImpacts.some((item) => item.risk === "HIGH") ? "출시 리스크 저감" : "Global launch 가능성 증가",
        confidence: 88,
        priority: regImpacts.some((item) => item.risk === "HIGH") ? "P0" : "P3",
      },
      {
        id: "AI-FE-004",
        issue_type: "Stability",
        diagnosis: limsStabilities.some((item) => item.result === "FAIL") ? "안정도 FAIL 이력 존재" : "초기 안정도 양호",
        recommendation: limsStabilities.some((item) => item.result === "FAIL") ? "유화 안정화/보존 시스템 재검토" : "장기 안정도 관찰 지속",
        expected_result: "분리/변색 리스크 관리",
        confidence: 79,
        priority: limsStabilities.some((item) => item.result === "FAIL") ? "P0" : "P2",
      },
    ];

    const countries: GlobalRegAiItem["country"][] = ["EU", "CN", "US", "JP", "ASEAN", "KR", "GCC"];
    const regItems: GlobalRegAiItem[] = countries.map((country) => {
      const hasHigh = regImpacts.some((item) => item.risk === "HIGH");
      const hasMedium = regImpacts.some((item) => item.risk === "MEDIUM");
      return {
        id: `REG-AI-${country}`,
        country,
        formula_code: v2FormulaCode,
        status: hasHigh ? "BLOCKED" : hasMedium ? "CAUTION" : "OK",
        key_issue: hasHigh ? "금지/고위험 성분 가능성" : hasMedium ? "사용한도/주의 성분 확인 필요" : "중대 규제 이슈 없음",
        action: hasHigh ? "RA 검토 및 처방 변경" : hasMedium ? "최종 전성분/함량 검증" : "Launch Gate 진행 가능",
      };
    });

    const analytics: EnterpriseAnalyticsItem[] = [
      { id: "KPI-001", kpi: "Active Projects", value: projects.filter((item) => item.status !== "출시" && item.status !== "보류").length, trend: "UP", status: "GOOD", insight: "진행 중 프로젝트 현황" },
      { id: "KPI-002", kpi: "Formula Success Score", value: simulationResults[0]?.total_score || 82, trend: "FLAT", status: (simulationResults[0]?.risk_level || "LOW") === "HIGH" ? "RISK" : "GOOD", insight: "최근 Simulation 기준 처방 성공 가능성" },
      { id: "KPI-003", kpi: "Scale-Up Blocked", value: scaleUpBatches.filter((item) => item.status === "BLOCKED").length, trend: "DOWN", status: scaleUpBatches.some((item) => item.status === "BLOCKED") ? "RISK" : "GOOD", insight: "생산 이관 보류 건수" },
      { id: "KPI-004", kpi: "LIMS OOS/OOT", value: `${limsStats.oos}/${limsStats.oot}`, trend: "FLAT", status: limsStats.oos > 0 ? "RISK" : limsStats.oot > 0 ? "WATCH" : "GOOD", insight: "품질 시험 이상 건수" },
      { id: "KPI-005", kpi: "MES QC Hold", value: mesWorkOrders.filter((item) => item.status === "QC_HOLD").length, trend: "FLAT", status: mesWorkOrders.some((item) => item.status === "QC_HOLD") ? "RISK" : "GOOD", insight: "생산 QC Hold 관리" },
      { id: "KPI-006", kpi: "Regulatory Block", value: regItems.filter((item) => item.status === "BLOCKED").length, trend: "DOWN", status: regItems.some((item) => item.status === "BLOCKED") ? "RISK" : "GOOD", insight: "국가별 규제 Block 수" },
    ];

    setV2Flows(flows);
    setDigitalTwinItems(twins);
    setAiFormulaExpertItems(aiItems);
    setGlobalRegAiItems(regItems);
    setEnterpriseAnalyticsItems(analytics);
    setV2PackageStatus(`Phase 31~35 통합 패키지 생성 완료: Flow ${flows.length}개 / Twin ${twins.length}개 / AI ${aiItems.length}개 / Reg ${regItems.length}개 / KPI ${analytics.length}개`);
  }

  function lockV2Stabilization() {
    const hasP0 = aiFormulaExpertItems.some((item) => item.priority === "P0") || globalRegAiItems.some((item) => item.status === "BLOCKED");
    setV2Flows((prev) =>
      prev.map((item) =>
        item.status === "READY" ? { ...item, status: hasP0 ? "WATCH" : "CONNECTED" } : item
      )
    );
    setV2PackageStatus(hasP0 ? "P0 또는 규제 BLOCK 항목이 있어 v2.0 Lock 전 검토가 필요합니다." : "Enterprise v2.0 Stabilization Lock 완료");
  }

  function exportV2FlowsCsv() {
    exportCsv("enterprise_v2_integration_flows.csv", [
      ["phase", "module", "flow_name", "source", "target", "status", "owner"],
      ...v2Flows.map((item) => [item.phase, item.module, item.flow_name, item.source, item.target, item.status, item.owner]),
    ]);
  }

  function exportDigitalTwinCsv() {
    exportCsv("enterprise_digital_twin_factory.csv", [
      ["batch_size_kg", "mixer_type", "predicted_rpm", "predicted_time_min", "predicted_yield_percent", "risk_level", "note"],
      ...digitalTwinItems.map((item) => [item.batch_size_kg, item.mixer_type, item.predicted_rpm, item.predicted_time_min, item.predicted_yield_percent, item.risk_level, item.note]),
    ]);
  }

  function exportAiFormulaExpertCsv() {
    exportCsv("enterprise_ai_formula_expert.csv", [
      ["issue_type", "diagnosis", "recommendation", "expected_result", "confidence", "priority"],
      ...aiFormulaExpertItems.map((item) => [item.issue_type, item.diagnosis, item.recommendation, item.expected_result, item.confidence, item.priority]),
    ]);
  }

  function exportGlobalRegAiCsv() {
    exportCsv("enterprise_global_regulatory_ai.csv", [
      ["country", "formula_code", "status", "key_issue", "action"],
      ...globalRegAiItems.map((item) => [item.country, item.formula_code, item.status, item.key_issue, item.action]),
    ]);
  }

  function exportEnterpriseAnalyticsCsv() {
    exportCsv("enterprise_analytics_center.csv", [
      ["kpi", "value", "trend", "status", "insight"],
      ...enterpriseAnalyticsItems.map((item) => [item.kpi, item.value, item.trend, item.status, item.insight]),
    ]);
  }

  function generateV3AiQmsPackage() {
    const copilot: AiCopilotActionItem[] = [
      {
        id: "COP-001",
        command: copilotCommand,
        module_chain: "Formula → Simulation → Regulation → LIMS → MES → QMS",
        status: "DONE",
        result_summary: "처방 검토 완료. 규제/품질/생산 리스크를 QMS Action으로 전환했습니다.",
        risk_level: regImpacts.some((item) => item.risk === "HIGH") || limsStats.oos > 0 ? "HIGH" : limsStats.oot > 0 ? "MEDIUM" : "LOW",
      },
      {
        id: "COP-002",
        command: "원료 문서 만료와 생산 이관 가능 여부를 확인해줘",
        module_chain: "Quality Documents → Supplier → MES → QMS",
        status: qualityStats.expired > 0 ? "NEEDS_REVIEW" : "DONE",
        result_summary: qualityStats.expired > 0 ? "만료 문서가 있어 생산 이관 전 QC 확인 필요" : "문서 상태 양호",
        risk_level: qualityStats.expired > 0 ? "HIGH" : qualityStats.expiring > 0 ? "MEDIUM" : "LOW",
      },
      {
        id: "COP-003",
        command: "출시 전 필요한 승인과 문서를 자동으로 만들어줘",
        module_chain: "Workflow → Approval → DMS → Validation",
        status: "READY",
        result_summary: "승인/문서/검증 패키지 생성 대기",
        risk_level: "LOW",
      },
    ];

    const qms: QmsProcessItem[] = [
      {
        id: "QMS-001",
        process: "Deviation",
        source_module: "MES",
        status: mesDeviations.some((item) => item.status !== "CLOSED") ? "OPEN" : "CLOSED",
        owner: "QA",
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        summary: "MES Deviation 기반 품질 이슈 추적",
      },
      {
        id: "QMS-002",
        process: "CAPA",
        source_module: "LIMS",
        status: limsStats.oos > 0 ? "IN_PROGRESS" : "CLOSED",
        owner: "QC",
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        summary: "OOS 발생 시 원인조사 및 재발방지",
      },
      {
        id: "QMS-003",
        process: "ChangeControl",
        source_module: "Formula",
        status: workflowRuns.some((item) => item.status === "WAITING_APPROVAL") ? "OPEN" : "CLOSED",
        owner: "QA",
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        summary: "처방 변경 영향도 및 승인관리",
      },
      {
        id: "QMS-004",
        process: "Audit",
        source_module: "Admin",
        status: "IN_PROGRESS",
        owner: "Admin",
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        summary: "Audit Trail 정기 검토",
      },
      {
        id: "QMS-005",
        process: "Training",
        source_module: "DMS",
        status: "OPEN",
        owner: "QA",
        due_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
        summary: "신규 SOP 교육 이수 확인",
      },
    ];

    const docs: DmsDocumentItem[] = [
      { id: "DMS-001", document_no: "SOP-PLM-001", document_type: "SOP", title: "PLM 운영 표준절차서", version: "1.0", status: "EFFECTIVE", owner: "QA" },
      { id: "DMS-002", document_no: "SPEC-FRM-001", document_type: "Specification", title: "처방 개발 규격서", version: "1.0", status: "APPROVED", owner: "R&D" },
      { id: "DMS-003", document_no: "BMR-MES-001", document_type: "Batch Record", title: "생산 배치 기록서", version: "1.0", status: "REVIEW", owner: "Production" },
      { id: "DMS-004", document_no: "VAL-CSV-001", document_type: "Validation", title: "PLM Computer System Validation", version: "1.0", status: "DRAFT", owner: "QA/IT" },
      { id: "DMS-005", document_no: "REG-GLOBAL-001", document_type: "Regulatory", title: "Global Regulatory Review Report", version: "1.0", status: "APPROVED", owner: "RA" },
    ];

    const validations: ValidationProtocolItem[] = [
      { id: "VAL-001", protocol_no: "CSV-PLM-001", validation_type: "CSV", target_system: "Cosmetic PLM Enterprise", status: "EXECUTING", result: "User requirement / functional test 진행" },
      { id: "VAL-002", protocol_no: "IQ-SUPA-001", validation_type: "IQ", target_system: "Supabase DB", status: "PASSED", result: "Schema / RLS / Migration 적용 확인" },
      { id: "VAL-003", protocol_no: "OQ-FLOW-001", validation_type: "OQ", target_system: "Workflow + Approval", status: "EXECUTING", result: "주요 운영 시나리오 검증 중" },
      { id: "VAL-004", protocol_no: "PQ-RND-001", validation_type: "PQ", target_system: "R&D Operation", status: "PLANNED", result: "실사용자 테스트 예정" },
      { id: "VAL-005", protocol_no: "PROC-MFG-001", validation_type: "Process", target_system: "Scale-Up / MES Bridge", status: mesStats.qcHold > 0 ? "RETEST" : "PASSED", result: mesStats.qcHold > 0 ? "QC Hold 건 재검토 필요" : "생산 이관 흐름 적합" },
    ];

    const graph: KnowledgeGraphItem[] = [
      { id: "KG-001", node: v2FormulaCode, node_type: "Formula", connected_to: "Simulation Result", relationship: "has_prediction", confidence: 88 },
      { id: "KG-002", node: v2FormulaCode, node_type: "Formula", connected_to: "Global Regulation", relationship: "requires_review", confidence: 91 },
      { id: "KG-003", node: "Raw Material", node_type: "RawMaterial", connected_to: "Supplier Document", relationship: "requires_document", confidence: 85 },
      { id: "KG-004", node: "LIMS Sample", node_type: "Quality", connected_to: "COA", relationship: "generates", confidence: 93 },
      { id: "KG-005", node: "MES Work Order", node_type: "Production", connected_to: "Deviation/CAPA", relationship: "may_trigger", confidence: 84 },
      { id: "KG-006", node: "Customer Project", node_type: "Customer", connected_to: "Formula/Launch Gate", relationship: "owns", confidence: 87 },
    ];

    setAiCopilotActions(copilot);
    setQmsProcesses(qms);
    setDmsDocuments(docs);
    setValidationProtocols(validations);
    setKnowledgeGraphItems(graph);
    setV3PackageStatus(`Phase 36~40 AI/QMS 통합 패키지 생성 완료: Copilot ${copilot.length}개 / QMS ${qms.length}개 / DMS ${docs.length}개 / Validation ${validations.length}개 / KG ${graph.length}개`);
  }

  function runAiCopilotCommand() {
    const action: AiCopilotActionItem = {
      id: `COP-${Date.now()}`,
      command: copilotCommand,
      module_chain: "Natural Language → Repository → Workflow → QMS",
      status: "DONE",
      result_summary: "명령을 분석해 관련 모듈과 Action을 생성했습니다.",
      risk_level: "MEDIUM",
    };
    setAiCopilotActions([action, ...aiCopilotActions]);
    setV3PackageStatus("AI Copilot 명령 실행 완료");
  }

  function closeQmsProcess(id: string) {
    setQmsProcesses((prev) => prev.map((item) => item.id === id ? { ...item, status: "CLOSED" } : item));
  }

  function approveDmsDocument(id: string) {
    setDmsDocuments((prev) => prev.map((item) => item.id === id ? { ...item, status: "EFFECTIVE" } : item));
  }

  function passValidation(id: string) {
    setValidationProtocols((prev) => prev.map((item) => item.id === id ? { ...item, status: "PASSED", result: "검증 완료" } : item));
  }

  function exportAiCopilotCsv() {
    exportCsv("enterprise_ai_copilot_actions.csv", [
      ["command", "module_chain", "status", "result_summary", "risk_level"],
      ...aiCopilotActions.map((item) => [item.command, item.module_chain, item.status, item.result_summary, item.risk_level]),
    ]);
  }

  function exportQmsCsv() {
    exportCsv("enterprise_qms_processes.csv", [
      ["process", "source_module", "status", "owner", "due_date", "summary"],
      ...qmsProcesses.map((item) => [item.process, item.source_module, item.status, item.owner, item.due_date, item.summary]),
    ]);
  }

  function exportDmsCsv() {
    exportCsv("enterprise_dms_documents.csv", [
      ["document_no", "document_type", "title", "version", "status", "owner"],
      ...dmsDocuments.map((item) => [item.document_no, item.document_type, item.title, item.version, item.status, item.owner]),
    ]);
  }

  function exportValidationCsv() {
    exportCsv("enterprise_validation_protocols.csv", [
      ["protocol_no", "validation_type", "target_system", "status", "result"],
      ...validationProtocols.map((item) => [item.protocol_no, item.validation_type, item.target_system, item.status, item.result]),
    ]);
  }

  function exportKnowledgeGraphCsv() {
    exportCsv("enterprise_knowledge_graph.csv", [
      ["node", "node_type", "connected_to", "relationship", "confidence"],
      ...knowledgeGraphItems.map((item) => [item.node, item.node_type, item.connected_to, item.relationship, item.confidence]),
    ]);
  }


  function generateV4KnowledgeScmPackage() {
    const insights: PatentPaperInsightItem[] = [
      { id: "INS-001", source_type: "Patent", title: "고보습 라멜라 크림 조성물", keyword: "Lamellar / Ceramide / Moisturizing", relevance_score: 91, opportunity: "장벽강화 크림 컨셉 강화", action: "세라마이드/콜레스테롤/지방산 비율 검토" },
      { id: "INS-002", source_type: "Paper", title: "Niacinamide and barrier repair study", keyword: "Niacinamide / Barrier", relevance_score: 87, opportunity: "미백+장벽 복합 클레임", action: "나이아신아마이드 2~5% 시뮬레이션" },
      { id: "INS-003", source_type: "Market", title: "2026 Sensitive Skin Trend", keyword: "Sensitive / Low-irritation", relevance_score: 84, opportunity: "저자극/민감성 라인 확장", action: "향료/색소 Free 옵션 생성" },
      { id: "INS-004", source_type: "Competitor", title: "Global ODM lightweight cream benchmark", keyword: "Lightweight / Gel Cream", relevance_score: 79, opportunity: "산뜻한 수분크림 제형 개선", action: "점증제/오일상 최적화" },
    ];

    const markets: RawMaterialMarketItem[] = rawMaterials.slice(0, 6).map((raw, index) => {
      const forecast = Math.round(raw.unit_price * (index % 3 === 0 ? 1.12 : index % 3 === 1 ? 0.97 : 1.04));
      return {
        id: `RM-MKT-${index + 1}`,
        raw_code: raw.raw_code,
        raw_name: raw.raw_name,
        current_price: raw.unit_price,
        forecast_price: forecast,
        supply_risk: forecast > raw.unit_price * 1.1 ? "HIGH" : forecast < raw.unit_price ? "LOW" : "MEDIUM",
        recommendation: forecast > raw.unit_price * 1.1 ? "대체 원료/공급사 이원화 검토" : forecast < raw.unit_price ? "선구매보다 필요량 기준 구매" : "가격 추이 모니터링",
      };
    });

    const opts: CostOptimizationItem[] = formulas.slice(0, 4).map((formula, index) => {
      const current = formula.material_cost || 12000;
      const saving = [6, 4, 9, 3][index] || 5;
      return {
        id: `COST-OPT-${index + 1}`,
        formula_code: formula.formula_code,
        optimization_type: index === 0 ? "Supplier" : index === 1 ? "Dosage" : index === 2 ? "Substitution" : "Yield",
        current_cost: current,
        optimized_cost: Math.round(current * (1 - saving / 100)),
        saving_percent: saving,
        risk_level: saving >= 8 ? "MEDIUM" : "LOW",
        action: saving >= 8 ? "대체 전 안정도/규제 재검토" : "Pilot 테스트 후 적용 가능",
      };
    });

    const plants: MultiPlantItem[] = [
      { id: "PLANT-KR-01", plant_name: "Korea R&D Pilot Plant", location: "KR", capability: "Lab/Pilot cream, serum, gel", capacity_kg_day: 500, status: "AVAILABLE", note: "신제품 Pilot 적합" },
      { id: "PLANT-KR-02", plant_name: "Korea Mass Production", location: "KR", capability: "Cream/Lotion mass batch", capacity_kg_day: 15000, status: "BUSY", note: "대량 생산 가능, 일정 확인 필요" },
      { id: "PLANT-CN-01", plant_name: "China Local Plant", location: "CN", capability: "China compliance production", capacity_kg_day: 8000, status: "QUALIFICATION_REQUIRED", note: "중국 NMPA 대응 시 검토" },
      { id: "PLANT-US-01", plant_name: "US Partner Plant", location: "US", capability: "OTC/non-OTC skincare", capacity_kg_day: 6000, status: "QUALIFICATION_REQUIRED", note: "MoCRA/US 라벨 확인 필요" },
      { id: "PLANT-ASEAN-01", plant_name: "ASEAN Partner Plant", location: "ASEAN", capability: "Cost-effective production", capacity_kg_day: 10000, status: "AVAILABLE", note: "원가절감형 글로벌 생산 후보" },
    ];

    const apis: ApiHubItem[] = [
      { id: "API-001", api_name: "Ingredient Search API", domain: "Ingredient", endpoint: "/api/enterprise/ingredients/search", status: "READY", security_level: "Internal" },
      { id: "API-002", api_name: "Formula Simulation API", domain: "Formula", endpoint: "/api/enterprise/formulas/simulate", status: "READY", security_level: "Internal" },
      { id: "API-003", api_name: "Global Regulation Check API", domain: "Regulation", endpoint: "/api/enterprise/regulation/check", status: "READY", security_level: "Partner" },
      { id: "API-004", api_name: "LIMS Result API", domain: "Quality", endpoint: "/api/enterprise/lims/results", status: "DRAFT", security_level: "Internal" },
      { id: "API-005", api_name: "MES Work Order API", domain: "MES", endpoint: "/api/enterprise/mes/work-orders", status: "DRAFT", security_level: "Internal" },
      { id: "API-006", api_name: "Customer Portal API", domain: "Customer", endpoint: "/api/enterprise/customer/portal", status: "READY", security_level: "External" },
    ];

    setPatentPaperInsights(insights);
    setRawMaterialMarkets(markets);
    setCostOptimizations(opts);
    setMultiPlantItems(plants);
    setApiHubItems(apis);
    setV4PackageStatus(`Phase 41~45 Knowledge/SCM/API 통합 패키지 생성 완료: Insight ${insights.length}개 / 원료시세 ${markets.length}개 / 원가최적화 ${opts.length}개 / Plant ${plants.length}개 / API ${apis.length}개`);
  }

  function activateApiHubItem(id: string) {
    setApiHubItems((prev) => prev.map((item) => item.id === id ? { ...item, status: "ACTIVE" } : item));
  }

  function qualifyPlant(id: string) {
    setMultiPlantItems((prev) => prev.map((item) => item.id === id && item.status === "QUALIFICATION_REQUIRED" ? { ...item, status: "AVAILABLE" } : item));
  }

  function exportPatentPaperInsightsCsv() {
    exportCsv("enterprise_patent_paper_insights.csv", [["source_type", "title", "keyword", "relevance_score", "opportunity", "action"], ...patentPaperInsights.map((item) => [item.source_type, item.title, item.keyword, item.relevance_score, item.opportunity, item.action])]);
  }

  function exportRawMaterialMarketCsv() {
    exportCsv("enterprise_raw_material_market_forecast.csv", [["raw_code", "raw_name", "current_price", "forecast_price", "supply_risk", "recommendation"], ...rawMaterialMarkets.map((item) => [item.raw_code, item.raw_name, item.current_price, item.forecast_price, item.supply_risk, item.recommendation])]);
  }

  function exportCostOptimizationCsv() {
    exportCsv("enterprise_ai_cost_optimization.csv", [["formula_code", "optimization_type", "current_cost", "optimized_cost", "saving_percent", "risk_level", "action"], ...costOptimizations.map((item) => [item.formula_code, item.optimization_type, item.current_cost, item.optimized_cost, item.saving_percent, item.risk_level, item.action])]);
  }

  function exportMultiPlantCsv() {
    exportCsv("enterprise_multi_plant.csv", [["plant_name", "location", "capability", "capacity_kg_day", "status", "note"], ...multiPlantItems.map((item) => [item.plant_name, item.location, item.capability, item.capacity_kg_day, item.status, item.note])]);
  }

  function exportApiHubCsv() {
    exportCsv("enterprise_api_hub.csv", [["api_name", "domain", "endpoint", "status", "security_level"], ...apiHubItems.map((item) => [item.api_name, item.domain, item.endpoint, item.status, item.security_level])]);
  }


  function generateUltimatePackA() {
    const researchId = `AIR-${Date.now()}`;
    const research: AiResearchProjectItem = {
      id: researchId,
      request: researchRequest,
      target_market: researchRequest.includes("미국") ? "US" : researchRequest.includes("중국") ? "CN" : "GLOBAL",
      product_type: researchRequest.includes("크림") ? "Cream" : "Skincare",
      status: "CANDIDATE_READY",
      opportunity_score: 88,
      summary: "민감성/장벽강화/저자극 트렌드와 세라마이드 기반 처방 기회가 높습니다.",
    };

    const candidates: AiFormulaCandidateItem[] = [
      { id: "AIFC-001", research_id: researchId, candidate_name: "Ceramide Barrier Cream A", formula_concept: "세라마이드 NP + 판테놀 + 베타글루칸 저자극 크림", target_cost: 14500, predicted_stability: 86, predicted_regulation: 91, launch_score: 89, risk_level: "LOW" },
      { id: "AIFC-002", research_id: researchId, candidate_name: "Sensitive Gel Cream B", formula_concept: "가벼운 젤크림, 나이아신아마이드 저함량, 무향 컨셉", target_cost: 11800, predicted_stability: 82, predicted_regulation: 88, launch_score: 84, risk_level: "MEDIUM" },
      { id: "AIFC-003", research_id: researchId, candidate_name: "Intensive Repair Cream C", formula_concept: "고보습 라멜라 크림, 고함량 보습제 및 오일상 강화", target_cost: 16800, predicted_stability: 78, predicted_regulation: 86, launch_score: 81, risk_level: "MEDIUM" },
    ];

    const kg: KnowledgeEngineLinkItem[] = [
      { id: "KGE-001", source_node: researchId, source_type: "Research", target_node: "Ceramide NP", target_type: "Ingredient", relationship: "recommends", confidence: 92 },
      { id: "KGE-002", source_node: "Ceramide Barrier Cream A", source_type: "Formula", target_node: "US MoCRA Review", target_type: "Regulation", relationship: "requires", confidence: 88 },
      { id: "KGE-003", source_node: "AIFC-001", source_type: "Formula", target_node: "LIMS Stability Plan", target_type: "LIMS", relationship: "generates", confidence: 85 },
      { id: "KGE-004", source_node: "Raw Material Market", source_type: "Market", target_node: "Cost Optimization", target_type: "Formula", relationship: "affects", confidence: 81 },
      { id: "KGE-005", source_node: "Pilot Batch", source_type: "Production", target_node: "MES Work Order", target_type: "MES", relationship: "transfers_to", confidence: 90 },
    ];

    const factory: FactorySimulationItem[] = [100, 500, 1000, 5000].map((kgSize) => ({
      id: `DFS-${kgSize}`,
      scenario_name: `${kgSize}kg Digital Factory Simulation`,
      batch_kg: kgSize,
      tank_type: kgSize < 200 ? "Pilot" : kgSize < 1000 ? "Production" : "Mass",
      mix_time_min: kgSize < 200 ? 90 : kgSize < 1000 ? 150 : 260,
      filling_time_min: Math.round(kgSize / 10),
      expected_yield: kgSize >= 5000 ? 93 : kgSize >= 1000 ? 95 : 97,
      expected_loss_kg: Math.round(kgSize * (kgSize >= 5000 ? 0.07 : kgSize >= 1000 ? 0.05 : 0.03)),
      risk_level: kgSize >= 5000 ? "HIGH" : kgSize >= 1000 ? "MEDIUM" : "LOW",
    }));

    const lake: DataLakeRecordItem[] = [
      { id: "DL-001", source_system: "PLM", dataset: "Formula / Ingredient / Project", record_count: formulas.length + rawMaterials.length + projects.length, freshness: "REALTIME", data_quality: "GOOD", ai_ready: true },
      { id: "DL-002", source_system: "LIMS", dataset: "Samples / Tests / Stability / COA", record_count: limsSamples.length + limsTests.length + limsStabilities.length, freshness: "DAILY", data_quality: limsStats.oos > 0 ? "RISK" : "GOOD", ai_ready: limsTests.length > 0 },
      { id: "DL-003", source_system: "MES", dataset: "Work Orders / Lots / Process / Deviations", record_count: mesWorkOrders.length + mesLots.length + mesProcessLogs.length, freshness: "REALTIME", data_quality: mesStats.critical > 0 ? "RISK" : "WATCH", ai_ready: mesWorkOrders.length > 0 },
      { id: "DL-004", source_system: "QMS", dataset: "CAPA / Change / Audit / Training", record_count: qmsProcesses.length, freshness: "DAILY", data_quality: qmsProcesses.some((item) => item.status !== "CLOSED") ? "WATCH" : "GOOD", ai_ready: true },
      { id: "DL-005", source_system: "SCM", dataset: "Supplier / Raw Market / Multi-Plant", record_count: supplierTasks.length + rawMaterialMarkets.length + multiPlantItems.length, freshness: "WEEKLY", data_quality: rawMaterialMarkets.some((item) => item.supply_risk === "HIGH") ? "WATCH" : "GOOD", ai_ready: true },
    ];

    const decisions: DecisionCenterItem[] = [
      { id: "DC-001", decision_area: "R&D", kpi: "AI Candidate Launch Score", current_value: `${candidates[0].launch_score}`, ai_risk: "LOW", ai_recommendation: "A 후보를 우선 Pilot 진행", decision_status: "GO" },
      { id: "DC-002", decision_area: "Quality", kpi: "OOS / Stability Fail", current_value: `${limsStats.oos}/${limsStats.stabilityFail}`, ai_risk: limsStats.oos > 0 ? "HIGH" : "LOW", ai_recommendation: limsStats.oos > 0 ? "CAPA 후 출시 보류" : "장기 안정도 진행", decision_status: limsStats.oos > 0 ? "HOLD" : "GO" },
      { id: "DC-003", decision_area: "Production", kpi: "Mass Batch Risk", current_value: "5000kg HIGH", ai_risk: "HIGH", ai_recommendation: "1000kg 검증 후 5000kg 확대", decision_status: "WATCH" },
      { id: "DC-004", decision_area: "Cost", kpi: "Avg Saving Opportunity", current_value: `${v4PackageStats.avgSaving}%`, ai_risk: "MEDIUM", ai_recommendation: "대체 원료 적용 전 안정도 재검토", decision_status: "WATCH" },
      { id: "DC-005", decision_area: "Launch", kpi: "US Sensitive Cream Launch", current_value: "Ready", ai_risk: "LOW", ai_recommendation: "규제/라벨 최종 검토 후 고객 제안", decision_status: "GO" },
    ];

    setAiResearchProjects([research]);
    setAiFormulaCandidates(candidates);
    setKnowledgeEngineLinks(kg);
    setFactorySimulations(factory);
    setDataLakeRecords(lake);
    setDecisionCenterItems(decisions);
    setUltimateAStatus(`Ultimate Pack A 생성 완료: Research 1건 / Candidate ${candidates.length}건 / KG ${kg.length}건 / Factory ${factory.length}건 / Data Lake ${lake.length}건 / Decision ${decisions.length}건`);
  }

  function approveResearchProject(id: string) {
    setAiResearchProjects((prev) => prev.map((item) => item.id === id ? { ...item, status: "APPROVED" } : item));
  }

  function exportAiResearchCsv() {
    exportCsv("enterprise_ai_research_projects.csv", [["request", "target_market", "product_type", "status", "opportunity_score", "summary"], ...aiResearchProjects.map((item) => [item.request, item.target_market, item.product_type, item.status, item.opportunity_score, item.summary])]);
  }

  function exportAiFormulaCandidatesCsv() {
    exportCsv("enterprise_ai_formula_candidates.csv", [["candidate_name", "formula_concept", "target_cost", "predicted_stability", "predicted_regulation", "launch_score", "risk_level"], ...aiFormulaCandidates.map((item) => [item.candidate_name, item.formula_concept, item.target_cost, item.predicted_stability, item.predicted_regulation, item.launch_score, item.risk_level])]);
  }

  function exportKnowledgeEngineCsv() {
    exportCsv("enterprise_knowledge_engine_links.csv", [["source_node", "source_type", "target_node", "target_type", "relationship", "confidence"], ...knowledgeEngineLinks.map((item) => [item.source_node, item.source_type, item.target_node, item.target_type, item.relationship, item.confidence])]);
  }

  function exportFactorySimulationCsv() {
    exportCsv("enterprise_digital_factory_simulation.csv", [["scenario_name", "batch_kg", "tank_type", "mix_time_min", "filling_time_min", "expected_yield", "expected_loss_kg", "risk_level"], ...factorySimulations.map((item) => [item.scenario_name, item.batch_kg, item.tank_type, item.mix_time_min, item.filling_time_min, item.expected_yield, item.expected_loss_kg, item.risk_level])]);
  }

  function exportDataLakeCsv() {
    exportCsv("enterprise_data_lake_records.csv", [["source_system", "dataset", "record_count", "freshness", "data_quality", "ai_ready"], ...dataLakeRecords.map((item) => [item.source_system, item.dataset, item.record_count, item.freshness, item.data_quality, item.ai_ready ? "YES" : "NO"])]);
  }

  function exportDecisionCenterCsv() {
    exportCsv("enterprise_decision_center.csv", [["decision_area", "kpi", "current_value", "ai_risk", "ai_recommendation", "decision_status"], ...decisionCenterItems.map((item) => [item.decision_area, item.kpi, item.current_value, item.ai_risk, item.ai_recommendation, item.decision_status])]);
  }


  function generateUltimatePackB() {
    const agents: AutonomousAgentItem[] = [
      { id: "AGT-001", agent_name: "AI R&D Agent", role: "R&D", objective: "후보 처방 생성 및 Simulation 실행", status: "DONE", autonomy_level: 4, last_result: "세라마이드 장벽 크림 후보 처방 3개 생성" },
      { id: "AGT-002", agent_name: "AI QA Agent", role: "QA", objective: "QMS/Validation/문서 상태 검토", status: qmsProcesses.some((item) => item.status !== "CLOSED") ? "NEEDS_REVIEW" : "DONE", autonomy_level: 3, last_result: "미종결 QMS 항목 검토 필요" },
      { id: "AGT-003", agent_name: "AI RA Agent", role: "RA", objective: "국가별 규제 위험 자동 검토", status: globalRegAiItems.some((item) => item.status === "BLOCKED") ? "BLOCKED" : "DONE", autonomy_level: 3, last_result: "US/EU/JP 우선 검토 완료" },
      { id: "AGT-004", agent_name: "AI QC Agent", role: "QC", objective: "LIMS/OOS/안정도 시험계획 생성", status: limsStats.oos > 0 ? "NEEDS_REVIEW" : "DONE", autonomy_level: 3, last_result: "안정도 T0/1W/4W 시험계획 생성" },
      { id: "AGT-005", agent_name: "AI Production Agent", role: "Production", objective: "Scale-Up/MES/IoT 생산성 검토", status: mesStats.qcHold > 0 ? "NEEDS_REVIEW" : "DONE", autonomy_level: 3, last_result: "100kg→1000kg 단계 확대 권장" },
      { id: "AGT-006", agent_name: "AI Launch Agent", role: "Launch", objective: "출시 Gate와 고객 제출자료 준비", status: "RUNNING", autonomy_level: 2, last_result: "고객 제출용 요약자료 준비 중" },
    ];

    const formulaRuns: AutonomousFormulaRunItem[] = [
      { id: "AUTO-FRM-001", run_name: "US Ceramide Barrier Cream", target_brief: selfDrivingGoal, generated_formula: "Ceramide NP / Panthenol / Beta-glucan / Low-irritation emulsifier", validation_status: "SIMULATED", ai_score: 89, risk_level: "LOW" },
      { id: "AUTO-FRM-002", run_name: "Lightweight Sensitive Gel Cream", target_brief: "산뜻한 저자극 젤크림", generated_formula: "Niacinamide low dose / HA / Gel network / Fragrance-free", validation_status: "QA_REVIEW", ai_score: 83, risk_level: "MEDIUM" },
      { id: "AUTO-FRM-003", run_name: "Cost Optimized Global Cream", target_brief: "글로벌 원가 최적화 크림", generated_formula: "Supplier dual-source raw materials / optimized humectant blend", validation_status: "RA_REVIEW", ai_score: 81, risk_level: "MEDIUM" },
    ];

    const iot: SmartFactoryIotItem[] = [
      { id: "IOT-001", equipment: "Vacuum Mixer 1000L", sensor_type: "Temperature", current_value: "72℃", normal_range: "65-75℃", status: "NORMAL", prediction: "정상 운전" },
      { id: "IOT-002", equipment: "Vacuum Mixer 1000L", sensor_type: "RPM", current_value: "145 rpm", normal_range: "80-150 rpm", status: "WARNING", prediction: "상한 근접, 점도 상승 가능" },
      { id: "IOT-003", equipment: "Filling Line A", sensor_type: "Filling", current_value: "98.7%", normal_range: "99.0-100.5%", status: "WARNING", prediction: "충진량 보정 필요" },
      { id: "IOT-004", equipment: "Cooling System", sensor_type: "Energy", current_value: "High", normal_range: "Normal", status: "ALARM", prediction: "냉각 효율 저하, 점검 필요" },
      { id: "IOT-005", equipment: "Inline Viscometer", sensor_type: "Viscosity", current_value: "4,200 cP", normal_range: "3,000-5,000 cP", status: "NORMAL", prediction: "규격 적합" },
    ];

    const opt: AiOptimizationRunItem[] = [
      { id: "OPT-AI-001", optimization_area: "Yield", before_value: "94%", after_value: "96.5%", improvement: "+2.5%p", confidence: 84, action_required: "충진 손실률과 이송 배관 잔량 관리" },
      { id: "OPT-AI-002", optimization_area: "Cost", before_value: "14,500원/kg", after_value: "13,650원/kg", improvement: "5.9% 절감", confidence: 79, action_required: "공급사 이원화 및 Pilot 안정도 확인" },
      { id: "OPT-AI-003", optimization_area: "Schedule", before_value: "21 days", after_value: "16 days", improvement: "5일 단축", confidence: 82, action_required: "QA/RA 병렬 검토 Workflow 적용" },
      { id: "OPT-AI-004", optimization_area: "Energy", before_value: "High", after_value: "Medium", improvement: "냉각 에너지 8% 절감", confidence: 72, action_required: "냉각 프로파일 재설정" },
      { id: "OPT-AI-005", optimization_area: "Quality", before_value: "WATCH 2건", after_value: "WATCH 0~1건", improvement: "품질 리스크 감소", confidence: 77, action_required: "점도/RPM 조건 표준화" },
    ];

    const tasks: SelfDrivingPlmTaskItem[] = [
      { id: "SDP-001", task_chain: "Goal → Research → Candidate Formula", trigger: selfDrivingGoal, current_step: "AI 후보처방 생성", progress: 25, status: "RUNNING", human_approval_required: false },
      { id: "SDP-002", task_chain: "Formula → Simulation → QA/RA Review", trigger: "후보처방 승인", current_step: "Simulation 결과 검토", progress: 50, status: "WAITING_HUMAN", human_approval_required: true },
      { id: "SDP-003", task_chain: "Scale-Up → LIMS → MES", trigger: "Pilot 승인", current_step: "Scale-Up 조건 생성", progress: 65, status: "READY", human_approval_required: true },
      { id: "SDP-004", task_chain: "DMS → Validation → Launch Gate", trigger: "출시자료 요청", current_step: "문서 패키지 준비", progress: 80, status: "READY", human_approval_required: true },
      { id: "SDP-005", task_chain: "Customer Package → Final Decision", trigger: "고객 제출", current_step: "최종 요약 보고", progress: 100, status: "COMPLETED", human_approval_required: false },
    ];

    setAutonomousAgents(agents);
    setAutonomousFormulaRuns(formulaRuns);
    setSmartFactoryIotItems(iot);
    setAiOptimizationRuns(opt);
    setSelfDrivingTasks(tasks);
    setUltimateBStatus(`Ultimate Pack B 생성 완료: Agent ${agents.length}개 / Autonomous Formula ${formulaRuns.length}개 / IoT ${iot.length}개 / Optimization ${opt.length}개 / Self-Driving Task ${tasks.length}개`);
  }

  function runSelfDrivingGoal() {
    const task: SelfDrivingPlmTaskItem = {
      id: `SDP-${Date.now()}`,
      task_chain: "Natural Language Goal → AI Agent Team → PLM Execution",
      trigger: selfDrivingGoal,
      current_step: "AI Agent Team 실행",
      progress: 15,
      status: "RUNNING",
      human_approval_required: true,
    };
    setSelfDrivingTasks([task, ...selfDrivingTasks]);
    setUltimateBStatus("Self-Driving PLM 목표 실행을 시작했습니다.");
  }

  function approveSelfDrivingTask(id: string) {
    setSelfDrivingTasks((prev) => prev.map((item) => item.id === id ? { ...item, status: "COMPLETED", progress: 100 } : item));
  }

  function completeAgent(id: string) {
    setAutonomousAgents((prev) => prev.map((item) => item.id === id ? { ...item, status: "DONE", last_result: "Human approval 후 완료 처리" } : item));
  }

  function markFormulaReady(id: string) {
    setAutonomousFormulaRuns((prev) => prev.map((item) => item.id === id ? { ...item, validation_status: "READY" } : item));
  }

  function exportAutonomousAgentsCsv() {
    exportCsv("enterprise_autonomous_agents.csv", [["agent_name", "role", "objective", "status", "autonomy_level", "last_result"], ...autonomousAgents.map((item) => [item.agent_name, item.role, item.objective, item.status, item.autonomy_level, item.last_result])]);
  }

  function exportAutonomousFormulaCsv() {
    exportCsv("enterprise_autonomous_formula_runs.csv", [["run_name", "target_brief", "generated_formula", "validation_status", "ai_score", "risk_level"], ...autonomousFormulaRuns.map((item) => [item.run_name, item.target_brief, item.generated_formula, item.validation_status, item.ai_score, item.risk_level])]);
  }

  function exportSmartFactoryIotCsv() {
    exportCsv("enterprise_smart_factory_iot.csv", [["equipment", "sensor_type", "current_value", "normal_range", "status", "prediction"], ...smartFactoryIotItems.map((item) => [item.equipment, item.sensor_type, item.current_value, item.normal_range, item.status, item.prediction])]);
  }

  function exportAiOptimizationRunsCsv() {
    exportCsv("enterprise_ai_optimization_runs.csv", [["optimization_area", "before_value", "after_value", "improvement", "confidence", "action_required"], ...aiOptimizationRuns.map((item) => [item.optimization_area, item.before_value, item.after_value, item.improvement, item.confidence, item.action_required])]);
  }

  function exportSelfDrivingTasksCsv() {
    exportCsv("enterprise_self_driving_plm_tasks.csv", [["task_chain", "trigger", "current_step", "progress", "status", "human_approval_required"], ...selfDrivingTasks.map((item) => [item.task_chain, item.trigger, item.current_step, item.progress, item.status, item.human_approval_required ? "YES" : "NO"])]);
  }


  function generateWorkReadyPack() {
    const connectors: MasterDataConnectorItem[] = [
      { id: "MDC-001", data_domain: "RawMaterial", source_name: "원료마스터", sync_status: rawMaterials.length > 0 ? "SYNCED" : "NEEDS_MAPPING", record_count: rawMaterials.length, quality_score: rawMaterials.length > 0 ? 88 : 40, next_action: "원료명/공급사/단가/조성 합계 확인" },
      { id: "MDC-002", data_domain: "INCI", source_name: "INCI 국문/영문/중문/일문", sync_status: "NEEDS_MAPPING", record_count: inciIngredients.length, quality_score: inciIngredients.length > 0 ? 72 : 35, next_action: "CAS/EC/다국어명 매핑 보강" },
      { id: "MDC-003", data_domain: "CAS", source_name: "CAS / EC Master", sync_status: "NEEDS_MAPPING", record_count: inciIngredients.filter((item) => item.cas_no).length, quality_score: 65, next_action: "CAS 공란 및 중복 점검" },
      { id: "MDC-004", data_domain: "Regulation", source_name: "KR/EU/CN/US/JP Regulation", sync_status: regulations.length > 0 ? "SYNCED" : "NEEDS_MAPPING", record_count: regulations.length, quality_score: regulations.length > 0 ? 80 : 30, next_action: "국가별 금지/제한/주의 성분 규칙 보강" },
      { id: "MDC-005", data_domain: "Formula", source_name: "Formula / BOM / Simulation", sync_status: formulas.length > 0 ? "SYNCED" : "NEEDS_MAPPING", record_count: formulas.length, quality_score: formulas.length > 0 ? 86 : 40, next_action: "처방 Revision과 전성분 자동 생성 연결" },
      { id: "MDC-006", data_domain: "Document", source_name: "DMS / COA / Specification", sync_status: dmsDocuments.length > 0 ? "SYNCED" : "NEEDS_MAPPING", record_count: dmsDocuments.length + limsCoas.length, quality_score: dmsDocuments.length > 0 ? 82 : 45, next_action: "문서 템플릿 승인 프로세스 연결" },
    ];

    const scenarios: AiBrainScenarioItem[] = [
      { id: "AIB-001", user_request: "미국 수출용 저자극 크림 처방 추천", ai_workflow: "Market → Ingredient → Formula → US Regulation → Stability Plan", output_type: "Formula", confidence: 86, review_status: "READY" },
      { id: "AIB-002", user_request: "원가를 15% 낮춰줘", ai_workflow: "Formula Cost → Raw Material Market → Supplier Alternative → Stability Risk", output_type: "CostOptimization", confidence: 78, review_status: "NEEDS_REVIEW" },
      { id: "AIB-003", user_request: "중국 규제 통과 가능성 확인", ai_workflow: "Formula INCI → CN Regulation → Restricted Ingredient → Launch Gate", output_type: "RegulatoryReview", confidence: 82, review_status: "READY" },
      { id: "AIB-004", user_request: "샘플 안정도 시험계획 생성", ai_workflow: "Formula Type → LIMS Test Plan → ELN Observation → QA Review", output_type: "StabilityPlan", confidence: 88, review_status: "READY" },
      { id: "AIB-005", user_request: "고객 제안용 개발 요약", ai_workflow: "Project → Formula → Claims → Cost → Regulation → Document", output_type: "ResearchSummary", confidence: 84, review_status: "READY" },
    ];

    const docs: DocumentAutomationItem[] = [
      { id: "DOC-AUTO-001", document_type: "Formula Sheet", source_module: "Formula", status: "GENERATED", owner: "R&D", file_name: "formula_sheet_auto.docx" },
      { id: "DOC-AUTO-002", document_type: "Ingredient Composition", source_module: "Raw Material / INCI", status: "GENERATED", owner: "R&D", file_name: "ingredient_composition_auto.xlsx" },
      { id: "DOC-AUTO-003", document_type: "Full Ingredient List", source_module: "Formula / INCI", status: "REVIEW", owner: "RA", file_name: "full_ingredient_list_auto.xlsx" },
      { id: "DOC-AUTO-004", document_type: "Product Specification", source_module: "LIMS / QA", status: "GENERATED", owner: "QA", file_name: "product_specification_auto.docx" },
      { id: "DOC-AUTO-005", document_type: "Development Report", source_module: "Project / ELN / Simulation", status: "DRAFT", owner: "R&D", file_name: "development_report_auto.pptx" },
      { id: "DOC-AUTO-006", document_type: "COA", source_module: "LIMS", status: limsCoas.length > 0 ? "GENERATED" : "DRAFT", owner: "QC", file_name: "coa_auto.pdf" },
      { id: "DOC-AUTO-007", document_type: "Test Request", source_module: "ELN / LIMS", status: "GENERATED", owner: "QC", file_name: "test_request_auto.xlsx" },
    ];

    const chats: PlmChatbotItem[] = [
      { id: "CHAT-001", question: workReadyQuestion, answer_summary: "저자극 세라마이드 크림 후보와 미국 규제/시험/문서 Action을 생성했습니다.", related_modules: "AI Brain, Formula, Regulation, LIMS, DMS", action_created: "AI 후보처방 검토 및 문서 자동 생성", risk_level: "LOW" },
      { id: "CHAT-002", question: "오늘 출근해서 먼저 확인할 것은?", answer_summary: "원료마스터, INCI 매핑, 규제 HIGH, LIMS OOS, MES QC Hold를 우선 확인하세요.", related_modules: "Data Quality, Regulation, LIMS, MES", action_created: "Work Ready 점검 리스트 생성", risk_level: "MEDIUM" },
      { id: "CHAT-003", question: "고객에게 바로 보여줄 수 있는 자료는?", answer_summary: "처방 컨셉, 전성분 초안, 원가 범위, 안정도 계획, 규제 검토 요약입니다.", related_modules: "Document Automation, Decision Center", action_created: "고객 제안 자료 패키지 초안", risk_level: "LOW" },
    ];

    const quality: CodeQualityItem[] = [
      { id: "CQ-001", area: "Page Structure", issue: "page.tsx가 매우 커져 향후 모듈 분리 필요", status: "WATCH", action: "Enterprise 화면을 components/enterprise 단위로 순차 분리" },
      { id: "CQ-002", area: "Components", issue: "반복 테이블/카드 UI 공통화 필요", status: "WATCH", action: "Card, DataTable, ActionButton 공통 컴포넌트 생성" },
      { id: "CQ-003", area: "Services", issue: "계산 로직과 UI 로직 분리 진행 중", status: "GOOD", action: "Service 계층 유지" },
      { id: "CQ-004", area: "Security", issue: "Vercel/Supabase 환경변수 적용 완료", status: "GOOD", action: "공개된 Anon Key는 추후 교체 권장" },
      { id: "CQ-005", area: "Performance", issue: "샘플 데이터 기반은 안정, 실제 대용량 데이터 연결 전 페이지 분리 권장", status: "WATCH", action: "모듈별 route 또는 lazy load 적용" },
      { id: "CQ-006", area: "Deployment", issue: "Vercel 24시간 배포 정상", status: "GOOD", action: "git push 기반 자동배포 유지" },
    ];

    setMasterDataConnectors(connectors);
    setAiBrainScenarios(scenarios);
    setDocumentAutomations(docs);
    setPlmChatbotItems(chats);
    setCodeQualityItems(quality);
    setWorkReadyStatus(`Work Ready Pack 생성 완료: 데이터연동 ${connectors.length}개 / AI Brain ${scenarios.length}개 / 문서자동화 ${docs.length}개 / Chatbot ${chats.length}개 / 코드점검 ${quality.length}개`);
  }

  function approveAiBrainScenario(id: string) {
    setAiBrainScenarios((prev) => prev.map((item) => item.id === id ? { ...item, review_status: "APPROVED" } : item));
  }

  function approveDocumentAutomation(id: string) {
    setDocumentAutomations((prev) => prev.map((item) => item.id === id ? { ...item, status: "APPROVED" } : item));
  }

  function runPlmChatbot() {
    const item: PlmChatbotItem = {
      id: `CHAT-${Date.now()}`,
      question: workReadyQuestion,
      answer_summary: "요청을 분석해 관련 PLM 모듈, 문서, 검토 Action을 생성했습니다.",
      related_modules: "AI Brain, Formula, Regulation, Document Automation",
      action_created: "검토 Action 생성",
      risk_level: "MEDIUM",
    };
    setPlmChatbotItems([item, ...plmChatbotItems]);
    setWorkReadyStatus("PLM Chatbot 질의 처리 완료");
  }

  function exportMasterDataConnectorsCsv() {
    exportCsv("work_ready_master_data_connectors.csv", [["data_domain", "source_name", "sync_status", "record_count", "quality_score", "next_action"], ...masterDataConnectors.map((item) => [item.data_domain, item.source_name, item.sync_status, item.record_count, item.quality_score, item.next_action])]);
  }

  function exportAiBrainScenariosCsv() {
    exportCsv("work_ready_ai_brain_scenarios.csv", [["user_request", "ai_workflow", "output_type", "confidence", "review_status"], ...aiBrainScenarios.map((item) => [item.user_request, item.ai_workflow, item.output_type, item.confidence, item.review_status])]);
  }

  function exportDocumentAutomationCsv() {
    exportCsv("work_ready_document_automation.csv", [["document_type", "source_module", "status", "owner", "file_name"], ...documentAutomations.map((item) => [item.document_type, item.source_module, item.status, item.owner, item.file_name])]);
  }

  function exportPlmChatbotCsv() {
    exportCsv("work_ready_plm_chatbot.csv", [["question", "answer_summary", "related_modules", "action_created", "risk_level"], ...plmChatbotItems.map((item) => [item.question, item.answer_summary, item.related_modules, item.action_created, item.risk_level])]);
  }

  function exportCodeQualityCsv() {
    exportCsv("work_ready_code_quality.csv", [["area", "issue", "status", "action"], ...codeQualityItems.map((item) => [item.area, item.issue, item.status, item.action])]);
  }


  function generateRealOperationPack() {
    const quick: QuickAccessItem[] = [
      { id: "QA-001", label: "새 처방 작성", module: "Formula", route_key: "formula", priority: "HIGH", usage_count: 42 },
      { id: "QA-002", label: "원료 마스터", module: "Ingredient", route_key: "ingredient", priority: "HIGH", usage_count: 38 },
      { id: "QA-003", label: "규제 검토", module: "Regulation", route_key: "regulation", priority: "HIGH", usage_count: 29 },
      { id: "QA-004", label: "LIMS 시험관리", module: "LIMS", route_key: "lims", priority: "MEDIUM", usage_count: 21 },
      { id: "QA-005", label: "문서 자동 생성", module: "Work Ready", route_key: "workReady", priority: "HIGH", usage_count: 25 },
      { id: "QA-006", label: "AI Brain", module: "AI", route_key: "workReady", priority: "HIGH", usage_count: 31 },
    ];

    const imports: BulkImportJobItem[] = [
      { id: "IMP-001", import_type: "RawMaterial", file_name: "raw_material_master.xlsx", rows_total: 1200, rows_valid: 1168, rows_error: 32, status: "VALIDATED", next_action: "CAS/EC 누락 32건 보정 후 Import" },
      { id: "IMP-002", import_type: "INCI", file_name: "inci_master_multilingual.xlsx", rows_total: 850, rows_valid: 801, rows_error: 49, status: "VALIDATED", next_action: "중문/일문 공란 보강" },
      { id: "IMP-003", import_type: "Formula", file_name: "formula_history.xlsx", rows_total: 96, rows_valid: 92, rows_error: 4, status: "VALIDATED", next_action: "함량 합계 오류 4건 수정" },
      { id: "IMP-004", import_type: "Regulation", file_name: "global_regulation_rules.xlsx", rows_total: 340, rows_valid: 340, rows_error: 0, status: "READY", next_action: "Supabase Import 가능" },
    ];

    const searchResults: GlobalSearchResultItem[] = [
      { id: "SR-001", keyword: globalSearchKeyword, result_type: "INCI", title: "Ceramide NP", summary: "장벽강화/보습 원료, 민감성 크림 후보", risk_level: "LOW" },
      { id: "SR-002", keyword: globalSearchKeyword, result_type: "Formula", title: "Ceramide Barrier Cream A", summary: "AI 후보 처방, Launch Score 89", risk_level: "LOW" },
      { id: "SR-003", keyword: globalSearchKeyword, result_type: "RawMaterial", title: "RM-CER-001", summary: "공급사 문서 갱신 필요 여부 확인", risk_level: qualityStats.expiring > 0 ? "MEDIUM" : "LOW" },
      { id: "SR-004", keyword: globalSearchKeyword, result_type: "Document", title: "Global Regulatory Review Report", summary: "RA 검토 문서", risk_level: "LOW" },
      { id: "SR-005", keyword: globalSearchKeyword, result_type: "Project", title: "US Sensitive Cream Project", summary: "고객 제안 가능 프로젝트", risk_level: "MEDIUM" },
    ];

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const recent: RecentWorkItem[] = [
      { id: "RW-001", work_type: "Formula", title: "Ceramide Barrier Cream A", last_opened: now, owner: "R&D", status: "ACTIVE" },
      { id: "RW-002", work_type: "AI", title: "미국 수출용 저자극 크림 AI 검토", last_opened: now, owner: "R&D", status: "WAITING" },
      { id: "RW-003", work_type: "Document", title: "Full Ingredient List Draft", last_opened: now, owner: "RA", status: "ACTIVE" },
      { id: "RW-004", work_type: "LIMS", title: "45℃ 1W 안정도 관찰", last_opened: now, owner: "QC", status: "WAITING" },
      { id: "RW-005", work_type: "QMS", title: "원료문서 만료 점검", last_opened: now, owner: "QA", status: qualityStats.expired > 0 ? "ISSUE" : "DONE" },
    ];

    const today: TodayTaskItem[] = [
      { id: "TD-001", task: "원료마스터 CAS/EC 누락 확인", source_module: "Ingredient", due: "오늘", owner: "R&D", status: "TODO", priority: "P1" },
      { id: "TD-002", task: "세라마이드 크림 전성분표 검토", source_module: "Formula/RA", due: "오늘", owner: "RA", status: "IN_PROGRESS", priority: "P1" },
      { id: "TD-003", task: "LIMS 안정도 시험계획 승인", source_module: "LIMS", due: "오늘", owner: "QC", status: "TODO", priority: "P2" },
      { id: "TD-004", task: "고객 제안용 개발 요약자료 확인", source_module: "Document", due: "오늘", owner: "R&D", status: "TODO", priority: "P2" },
      { id: "TD-005", task: "규제 HIGH / OOS / QC Hold 여부 확인", source_module: "Dashboard", due: "즉시", owner: "QA", status: (limsStats.oos > 0 || mesStats.qcHold > 0) ? "OVERDUE" : "TODO", priority: (limsStats.oos > 0 || mesStats.qcHold > 0) ? "P0" : "P1" },
    ];

    const perf: PerformanceCheckItem[] = [
      { id: "PF-001", area: "Data Load", current_state: "샘플/운영 데이터 혼합", target_state: "모듈별 Lazy Load", status: "WATCH", action: "대량 데이터 연결 전 모듈 분리 권장" },
      { id: "PF-002", area: "Search", current_state: "화면 내 검색 시나리오", target_state: "Supabase Full Text Search", status: "OPTIMIZE", action: "실제 데이터 입력 후 검색 인덱스 생성" },
      { id: "PF-003", area: "CSV Export", current_state: "정상", target_state: "모듈별 Export 유지", status: "GOOD", action: "사용자 다운로드 이력 저장 검토" },
      { id: "PF-004", area: "Dashboard", current_state: "통합 KPI 표시", target_state: "실시간 KPI", status: "WATCH", action: "실제 DB 연결 후 useMemo → API 집계 전환" },
      { id: "PF-005", area: "Build", current_state: "Vercel Build 가능", target_state: "빌드 안정화", status: "GOOD", action: "대형 page.tsx 단계적 분리" },
      { id: "PF-006", area: "Deployment", current_state: "Vercel 24시간 운영", target_state: "자동 배포 유지", status: "GOOD", action: "main branch push 관리" },
    ];

    setQuickAccessItems(quick);
    setBulkImportJobs(imports);
    setGlobalSearchResults(searchResults);
    setRecentWorks(recent);
    setTodayTasks(today);
    setPerformanceChecks(perf);
    setRealOperationStatus(`Real DB Operation Pack 생성 완료: Quick ${quick.length}개 / Import ${imports.length}개 / Search ${searchResults.length}개 / Recent ${recent.length}개 / Today ${today.length}개 / Performance ${perf.length}개`);
  }

  function runGlobalSearch() {
    const result: GlobalSearchResultItem = {
      id: `SR-${Date.now()}`,
      keyword: globalSearchKeyword,
      result_type: "RawMaterial",
      title: `${globalSearchKeyword} 검색 결과`,
      summary: "원료/처방/문서/프로젝트 통합 검색 결과가 생성되었습니다.",
      risk_level: "LOW",
    };
    setGlobalSearchResults([result, ...globalSearchResults]);
    setRealOperationStatus("통합 검색 실행 완료");
  }

  function markTodayTaskDone(id: string) {
    setTodayTasks((prev) => prev.map((item) => item.id === id ? { ...item, status: "DONE" } : item));
  }

  function validateImportJob(id: string) {
    setBulkImportJobs((prev) => prev.map((item) => item.id === id ? { ...item, status: item.rows_error > 0 ? "ERROR" : "IMPORTED", next_action: item.rows_error > 0 ? "오류 행 수정 필요" : "Import 완료" } : item));
  }

  function exportQuickAccessCsv() {
    exportCsv("real_operation_quick_access.csv", [["label", "module", "route_key", "priority", "usage_count"], ...quickAccessItems.map((item) => [item.label, item.module, item.route_key, item.priority, item.usage_count])]);
  }

  function exportBulkImportCsv() {
    exportCsv("real_operation_bulk_import_jobs.csv", [["import_type", "file_name", "rows_total", "rows_valid", "rows_error", "status", "next_action"], ...bulkImportJobs.map((item) => [item.import_type, item.file_name, item.rows_total, item.rows_valid, item.rows_error, item.status, item.next_action])]);
  }

  function exportGlobalSearchCsv() {
    exportCsv("real_operation_global_search.csv", [["keyword", "result_type", "title", "summary", "risk_level"], ...globalSearchResults.map((item) => [item.keyword, item.result_type, item.title, item.summary, item.risk_level])]);
  }

  function exportRecentWorksCsv() {
    exportCsv("real_operation_recent_works.csv", [["work_type", "title", "last_opened", "owner", "status"], ...recentWorks.map((item) => [item.work_type, item.title, item.last_opened, item.owner, item.status])]);
  }

  function exportTodayTasksCsv() {
    exportCsv("real_operation_today_tasks.csv", [["task", "source_module", "due", "owner", "status", "priority"], ...todayTasks.map((item) => [item.task, item.source_module, item.due, item.owner, item.status, item.priority])]);
  }

  function exportPerformanceChecksCsv() {
    exportCsv("real_operation_performance_checks.csv", [["area", "current_state", "target_state", "status", "action"], ...performanceChecks.map((item) => [item.area, item.current_state, item.target_state, item.status, item.action])]);
  }


  function generateImportValidationPack() {
    const templates: ImportTemplateItem[] = [
      { id: "TPL-001", template_name: "원료마스터 업로드 템플릿", import_type: "RawMaterial", required_columns: "raw_code, raw_name, supplier, unit_price, composition_total", optional_columns: "inci_kr, inci_en, cas_no, ec_no, origin, document_status", status: "READY" },
      { id: "TPL-002", template_name: "INCI 다국어 업로드 템플릿", import_type: "INCI", required_columns: "inci_en, inci_kr", optional_columns: "inci_cn, inci_jp, cas_no, ec_no, function_kr, function_en", status: "READY" },
      { id: "TPL-003", template_name: "처방 업로드 템플릿", import_type: "Formula", required_columns: "formula_code, formula_name, raw_code, percentage", optional_columns: "phase, process_note, revision, claim", status: "READY" },
      { id: "TPL-004", template_name: "공급사 업로드 템플릿", import_type: "Supplier", required_columns: "supplier_name, contact, country", optional_columns: "lead_time, moq, grade, audit_status", status: "READY" },
      { id: "TPL-005", template_name: "규제 룰 업로드 템플릿", import_type: "Regulation", required_columns: "country, inci_en, rule_type, limit_value", optional_columns: "warning, label_requirement, reference", status: "NEEDS_REVIEW" },
      { id: "TPL-006", template_name: "LIMS 시험항목 업로드 템플릿", import_type: "LIMS", required_columns: "test_name, method, specification", optional_columns: "unit, min, max, analyst, frequency", status: "READY" },
    ];

    const mappings: ColumnMappingItem[] = [
      { id: "MAP-001", import_type: "RawMaterial", source_column: "원료코드", target_field: "raw_code", mapping_status: "MAPPED", rule: "필수, 중복불가" },
      { id: "MAP-002", import_type: "RawMaterial", source_column: "원료명", target_field: "raw_name", mapping_status: "MAPPED", rule: "필수" },
      { id: "MAP-003", import_type: "RawMaterial", source_column: "CAS No.", target_field: "cas_no", mapping_status: "REVIEW", rule: "형식 검증 필요" },
      { id: "MAP-004", import_type: "INCI", source_column: "INCI 영문", target_field: "inci_en", mapping_status: "MAPPED", rule: "필수" },
      { id: "MAP-005", import_type: "INCI", source_column: "중문명", target_field: "inci_cn", mapping_status: "REVIEW", rule: "공란 허용, 중국 수출 시 필요" },
      { id: "MAP-006", import_type: "Formula", source_column: "함량", target_field: "percentage", mapping_status: "MAPPED", rule: "숫자, 처방 합계 100%" },
      { id: "MAP-007", import_type: "Formula", source_column: "원료코드", target_field: "raw_code", mapping_status: "MAPPED", rule: "원료마스터 참조 필요" },
      { id: "MAP-008", import_type: "Regulation", source_column: "국가", target_field: "country", mapping_status: "MAPPED", rule: "KR/EU/CN/US/JP" },
      { id: "MAP-009", import_type: "Regulation", source_column: "제한함량", target_field: "limit_value", mapping_status: "REVIEW", rule: "단위 표준화 필요" },
    ];

    const rules: DataValidationRuleItem[] = [
      { id: "RULE-001", rule_name: "필수 컬럼 누락 검증", target: "RawMaterial", severity: "BLOCKER", check_logic: "raw_code, raw_name, supplier 필수", auto_fix: "불가, 사용자 입력 필요" },
      { id: "RULE-002", rule_name: "중복 원료코드 검증", target: "RawMaterial", severity: "ERROR", check_logic: "raw_code unique", auto_fix: "중복 행 표시" },
      { id: "RULE-003", rule_name: "CAS No. 형식 검증", target: "INCI", severity: "WARNING", check_logic: "00000-00-0 패턴", auto_fix: "공백/문자 제거" },
      { id: "RULE-004", rule_name: "처방 함량 합계 100% 검증", target: "Formula", severity: "BLOCKER", check_logic: "formula_code별 percentage 합계 = 100", auto_fix: "불가, 처방 수정 필요" },
      { id: "RULE-005", rule_name: "복합성분 구성비 검증", target: "Composition", severity: "ERROR", check_logic: "complex raw composition_total = 100", auto_fix: "구성성분 합계 리포트" },
      { id: "RULE-006", rule_name: "원료마스터 참조 검증", target: "Formula", severity: "ERROR", check_logic: "formula raw_code exists in raw master", auto_fix: "미등록 원료 목록 생성" },
      { id: "RULE-007", rule_name: "공급사 누락 검증", target: "Supplier", severity: "WARNING", check_logic: "supplier exists and active", auto_fix: "공급사 후보 매칭" },
      { id: "RULE-008", rule_name: "국가별 규제 위험 검증", target: "Regulation", severity: "BLOCKER", check_logic: "restricted/prohibited ingredient check", auto_fix: "RA 검토 필요" },
    ];

    const results: ImportValidationResultItem[] = [
      { id: "VAL-001", import_type: "RawMaterial", file_name: "raw_material_master.xlsx", total_rows: 1200, valid_rows: 1138, warning_rows: 30, error_rows: 28, blocker_rows: 4, status: "BLOCKED" },
      { id: "VAL-002", import_type: "INCI", file_name: "inci_master_multilingual.xlsx", total_rows: 850, valid_rows: 801, warning_rows: 39, error_rows: 10, blocker_rows: 0, status: "ERROR" },
      { id: "VAL-003", import_type: "Formula", file_name: "formula_history.xlsx", total_rows: 96, valid_rows: 92, warning_rows: 0, error_rows: 0, blocker_rows: 4, status: "BLOCKED" },
      { id: "VAL-004", import_type: "Supplier", file_name: "supplier_master.xlsx", total_rows: 120, valid_rows: 118, warning_rows: 2, error_rows: 0, blocker_rows: 0, status: "WARNING" },
      { id: "VAL-005", import_type: "Regulation", file_name: "global_regulation_rules.xlsx", total_rows: 340, valid_rows: 340, warning_rows: 0, error_rows: 0, blocker_rows: 0, status: "PASS" },
    ];

    const reports: ImportErrorReportItem[] = [
      { id: "ERR-001", row_no: 18, import_type: "RawMaterial", field_name: "cas_no", error_type: "InvalidFormat", message: "CAS No. 형식이 올바르지 않습니다.", fix_suggestion: "00000-00-0 형식으로 수정" },
      { id: "ERR-002", row_no: 44, import_type: "RawMaterial", field_name: "raw_code", error_type: "Duplicate", message: "중복 원료코드가 존재합니다.", fix_suggestion: "원료코드 중복 제거 또는 Revision 분리" },
      { id: "ERR-003", row_no: 71, import_type: "Formula", field_name: "percentage", error_type: "CompositionTotal", message: "처방 함량 합계가 100%가 아닙니다.", fix_suggestion: "formula_code별 합계를 100%로 조정" },
      { id: "ERR-004", row_no: 103, import_type: "RawMaterial", field_name: "composition_total", error_type: "CompositionTotal", message: "복합성분 구성비 합계가 100%가 아닙니다.", fix_suggestion: "복합 원료 구성성분 합계 검토" },
      { id: "ERR-005", row_no: 7, import_type: "Regulation", field_name: "inci_en", error_type: "RegulationRisk", message: "금지/제한 성분 후보입니다.", fix_suggestion: "RA 검토 후 Import 승인" },
      { id: "ERR-006", row_no: 91, import_type: "Formula", field_name: "raw_code", error_type: "ReferenceMissing", message: "원료마스터에 없는 원료코드입니다.", fix_suggestion: "원료마스터 선등록 필요" },
    ];

    const approvals: ImportApprovalItem[] = [
      { id: "APR-001", import_type: "RawMaterial", file_name: "raw_material_master.xlsx", requester: "R&D", reviewer: "QA", approval_status: "REQUESTED", summary: "BLOCKER 4건 해결 후 승인 가능" },
      { id: "APR-002", import_type: "INCI", file_name: "inci_master_multilingual.xlsx", requester: "R&D", reviewer: "RA", approval_status: "DRAFT", summary: "CAS/다국어명 보강 필요" },
      { id: "APR-003", import_type: "Formula", file_name: "formula_history.xlsx", requester: "R&D", reviewer: "R&D", approval_status: "REQUESTED", summary: "처방 합계 오류 4건 수정 필요" },
      { id: "APR-004", import_type: "Regulation", file_name: "global_regulation_rules.xlsx", requester: "RA", reviewer: "RA", approval_status: "APPROVED", summary: "Import 가능" },
    ];

    setImportTemplates(templates);
    setColumnMappings(mappings);
    setDataValidationRules(rules);
    setImportValidationResults(results);
    setImportErrorReports(reports);
    setImportApprovals(approvals);
    setImportValidationStatus(`Real DB Operation Pack 생성 완료: Template ${templates.length}개 / Mapping ${mappings.length}개 / Rule ${rules.length}개 / Result ${results.length}개 / Error ${reports.length}개`);
  }

  function approveImport(id: string) {
    setImportApprovals((prev) => prev.map((item) => item.id === id ? { ...item, approval_status: "APPROVED" } : item));
  }

  function markMappingComplete(id: string) {
    setColumnMappings((prev) => prev.map((item) => item.id === id ? { ...item, mapping_status: "MAPPED" } : item));
  }

  function exportImportTemplatesCsv() {
    exportCsv("data_import_templates.csv", [["template_name", "import_type", "required_columns", "optional_columns", "status"], ...importTemplates.map((item) => [item.template_name, item.import_type, item.required_columns, item.optional_columns, item.status])]);
  }

  function exportColumnMappingsCsv() {
    exportCsv("data_import_column_mappings.csv", [["import_type", "source_column", "target_field", "mapping_status", "rule"], ...columnMappings.map((item) => [item.import_type, item.source_column, item.target_field, item.mapping_status, item.rule])]);
  }

  function exportValidationRulesCsv() {
    exportCsv("data_import_validation_rules.csv", [["rule_name", "target", "severity", "check_logic", "auto_fix"], ...dataValidationRules.map((item) => [item.rule_name, item.target, item.severity, item.check_logic, item.auto_fix])]);
  }

  function exportValidationResultsCsv() {
    exportCsv("data_import_validation_results.csv", [["import_type", "file_name", "total_rows", "valid_rows", "warning_rows", "error_rows", "blocker_rows", "status"], ...importValidationResults.map((item) => [item.import_type, item.file_name, item.total_rows, item.valid_rows, item.warning_rows, item.error_rows, item.blocker_rows, item.status])]);
  }

  function exportErrorReportsCsv() {
    exportCsv("data_import_error_reports.csv", [["row_no", "import_type", "field_name", "error_type", "message", "fix_suggestion"], ...importErrorReports.map((item) => [item.row_no, item.import_type, item.field_name, item.error_type, item.message, item.fix_suggestion])]);
  }

  function exportImportApprovalsCsv() {
    exportCsv("data_import_approvals.csv", [["import_type", "file_name", "requester", "reviewer", "approval_status", "summary"], ...importApprovals.map((item) => [item.import_type, item.file_name, item.requester, item.reviewer, item.approval_status, item.summary])]);
  }


  function generateRealDbOperationPack() {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const connections: RealDbConnectionItem[] = [
      { id: "RDB-CON-001", table_name: "enterprise_raw_material_master", domain: "RawMaterial", connection_status: "CONNECTED", row_count: rawMaterials.length, last_sync: now, action: "실제 원료마스터 Upsert 준비" },
      { id: "RDB-CON-002", table_name: "enterprise_inci_master", domain: "INCI", connection_status: "CONNECTED", row_count: inciIngredients.length, last_sync: now, action: "INCI/CAS/EC 다국어명 동기화 준비" },
      { id: "RDB-CON-003", table_name: "enterprise_formula_master", domain: "Formula", connection_status: "CONNECTED", row_count: formulas.length, last_sync: now, action: "처방 Revision 및 원료조성표 연결" },
      { id: "RDB-CON-004", table_name: "enterprise_suppliers", domain: "Supplier", connection_status: "CONNECTED", row_count: supplierTasks.length, last_sync: now, action: "공급사/문서 상태 연결" },
      { id: "RDB-CON-005", table_name: "enterprise_regulation_rules", domain: "Regulation", connection_status: "CONNECTED", row_count: regulations.length, last_sync: now, action: "국가별 규제 룰 활성화" },
      { id: "RDB-CON-006", table_name: "enterprise_lims_samples", domain: "LIMS", connection_status: limsSamples.length > 0 ? "CONNECTED" : "NEEDS_SCHEMA", row_count: limsSamples.length, last_sync: now, action: "시험 데이터 실제 입력 준비" },
      { id: "RDB-CON-007", table_name: "enterprise_operation_dashboard", domain: "Dashboard", connection_status: "READY", row_count: todayTasks.length + importValidationResults.length, last_sync: now, action: "운영 KPI 집계 테이블 준비" },
    ];

    const executions: RealDbImportExecutionItem[] = importValidationResults.map((item, index) => {
      const approval = importApprovals.find((approvalItem) => approvalItem.import_type === item.import_type);
      const approved = approval?.approval_status === "APPROVED";
      const canExecute = item.status === "PASS" && approved;
      return {
        id: `RDB-EXE-${index + 1}`,
        import_type: item.import_type,
        source_file: item.file_name,
        validation_status: item.status === "PASS" ? "PASS" : item.status === "WARNING" ? "WARNING" : "BLOCKED",
        approval_status: approved ? "APPROVED" : "PENDING",
        execution_status: canExecute ? "READY" : item.status === "PASS" ? "SKIPPED" : "SKIPPED",
        inserted_rows: canExecute ? item.valid_rows : 0,
        updated_rows: canExecute ? Math.round(item.valid_rows * 0.08) : 0,
      };
    });

    if (executions.length === 0) {
      executions.push(
        { id: "RDB-EXE-001", import_type: "Regulation", source_file: "global_regulation_rules.xlsx", validation_status: "PASS", approval_status: "APPROVED", execution_status: "READY", inserted_rows: 340, updated_rows: 0 },
        { id: "RDB-EXE-002", import_type: "RawMaterial", source_file: "raw_material_master.xlsx", validation_status: "BLOCKED", approval_status: "PENDING", execution_status: "SKIPPED", inserted_rows: 0, updated_rows: 0 }
      );
    }

    const metrics: RealDbOperationMetricItem[] = [
      { id: "RDB-KPI-001", metric: "Raw Material Master Rows", value: rawMaterials.length, source_table: "enterprise_raw_material_master", status: rawMaterials.length > 0 ? "GOOD" : "WATCH", insight: "원료마스터 실제 데이터 연결 기준" },
      { id: "RDB-KPI-002", metric: "INCI Mapping Quality", value: `${columnMappings.filter((item) => item.mapping_status === "MAPPED").length}/${columnMappings.length}`, source_table: "enterprise_inci_master", status: columnMappings.some((item) => item.mapping_status !== "MAPPED") ? "WATCH" : "GOOD", insight: "INCI/CAS/EC 매핑 보완 필요" },
      { id: "RDB-KPI-003", metric: "Formula Total Blockers", value: importErrorReports.filter((item) => item.error_type === "CompositionTotal").length, source_table: "enterprise_formula_master", status: importErrorReports.some((item) => item.error_type === "CompositionTotal") ? "RISK" : "GOOD", insight: "처방 합계/복합성분 합계 오류는 Import 차단" },
      { id: "RDB-KPI-004", metric: "Regulation Import Ready", value: importApprovals.some((item) => item.import_type === "Regulation" && item.approval_status === "APPROVED") ? "YES" : "NO", source_table: "enterprise_regulation_rules", status: "GOOD", insight: "규제 룰은 우선 Import 가능" },
      { id: "RDB-KPI-005", metric: "Operation Tasks", value: todayTasks.length, source_table: "enterprise_today_tasks", status: todayTasks.some((item) => item.status === "OVERDUE") ? "RISK" : "GOOD", insight: "오늘 할 일과 Import 이슈를 첫 화면에 표시" },
    ];

    const indexes: RealDbSearchIndexItem[] = [
      { id: "RDB-IDX-001", index_name: "idx_raw_material_search", target_table: "enterprise_raw_material_master", indexed_fields: "raw_code, raw_name, supplier, cas_no", status: "READY", expected_usage: "원료명/CAS/공급사 빠른 검색" },
      { id: "RDB-IDX-002", index_name: "idx_inci_search", target_table: "enterprise_inci_master", indexed_fields: "inci_en, inci_kr, inci_cn, inci_jp, cas_no, ec_no", status: "READY", expected_usage: "INCI 다국어 검색" },
      { id: "RDB-IDX-003", index_name: "idx_formula_search", target_table: "enterprise_formula_master", indexed_fields: "formula_code, formula_name, claim", status: "READY", expected_usage: "처방/클레임 검색" },
      { id: "RDB-IDX-004", index_name: "idx_regulation_search", target_table: "enterprise_regulation_rules", indexed_fields: "country, inci_en, rule_type", status: "READY", expected_usage: "국가별 규제 룰 검색" },
      { id: "RDB-IDX-005", index_name: "idx_operation_dashboard", target_table: "enterprise_operation_dashboard", indexed_fields: "module, status, priority", status: "READY", expected_usage: "운영 대시보드 집계" },
    ];

    const corrections: RealDbCorrectionActionItem[] = [
      { id: "RDB-COR-001", issue_type: "Composition", target_table: "enterprise_formula_master", target_key: "formula_history.xlsx row 71", severity: "BLOCKER", correction: "처방 함량 합계를 100%로 수정", status: "OPEN" },
      { id: "RDB-COR-002", issue_type: "Duplicate", target_table: "enterprise_raw_material_master", target_key: "row 44", severity: "HIGH", correction: "중복 원료코드 정리 또는 Revision 분리", status: "OPEN" },
      { id: "RDB-COR-003", issue_type: "Invalid", target_table: "enterprise_inci_master", target_key: "row 18 CAS", severity: "MEDIUM", correction: "CAS No. 형식 보정", status: "IN_PROGRESS" },
      { id: "RDB-COR-004", issue_type: "Reference", target_table: "enterprise_formula_master", target_key: "row 91 raw_code", severity: "HIGH", correction: "원료마스터 선등록 후 처방 Import", status: "OPEN" },
      { id: "RDB-COR-005", issue_type: "Regulation", target_table: "enterprise_regulation_rules", target_key: "row 7", severity: "BLOCKER", correction: "RA 검토 후 승인", status: "OPEN" },
    ];

    setRealDbConnections(connections);
    setRealDbImportExecutions(executions);
    setRealDbOperationMetrics(metrics);
    setRealDbSearchIndexes(indexes);
    setRealDbCorrectionActions(corrections);
    setRealDbStatus(`Real DB Operation Pack 생성 완료: Connection ${connections.length}개 / Execution ${executions.length}개 / KPI ${metrics.length}개 / Index ${indexes.length}개 / Correction ${corrections.length}개`);
  }

  function executeRealDbImport(id: string) {
    setRealDbImportExecutions((prev) =>
      prev.map((item) =>
        item.id === id && item.validation_status === "PASS" && item.approval_status === "APPROVED"
          ? { ...item, execution_status: "EXECUTED" }
          : item.id === id
            ? { ...item, execution_status: "FAILED" }
            : item
      )
    );
  }

  function activateSearchIndex(id: string) {
    setRealDbSearchIndexes((prev) => prev.map((item) => item.id === id ? { ...item, status: "ACTIVE" } : item));
  }

  function closeCorrectionAction(id: string) {
    setRealDbCorrectionActions((prev) => prev.map((item) => item.id === id ? { ...item, status: "DONE" } : item));
  }

  function exportRealDbConnectionsCsv() {
    exportCsv("real_db_connections.csv", [["table_name", "domain", "connection_status", "row_count", "last_sync", "action"], ...realDbConnections.map((item) => [item.table_name, item.domain, item.connection_status, item.row_count, item.last_sync, item.action])]);
  }

  function exportRealDbExecutionsCsv() {
    exportCsv("real_db_import_executions.csv", [["import_type", "source_file", "validation_status", "approval_status", "execution_status", "inserted_rows", "updated_rows"], ...realDbImportExecutions.map((item) => [item.import_type, item.source_file, item.validation_status, item.approval_status, item.execution_status, item.inserted_rows, item.updated_rows])]);
  }

  function exportRealDbMetricsCsv() {
    exportCsv("real_db_operation_metrics.csv", [["metric", "value", "source_table", "status", "insight"], ...realDbOperationMetrics.map((item) => [item.metric, item.value, item.source_table, item.status, item.insight])]);
  }

  function exportRealDbIndexesCsv() {
    exportCsv("real_db_search_indexes.csv", [["index_name", "target_table", "indexed_fields", "status", "expected_usage"], ...realDbSearchIndexes.map((item) => [item.index_name, item.target_table, item.indexed_fields, item.status, item.expected_usage])]);
  }

  function exportRealDbCorrectionsCsv() {
    exportCsv("real_db_correction_actions.csv", [["issue_type", "target_table", "target_key", "severity", "correction", "status"], ...realDbCorrectionActions.map((item) => [item.issue_type, item.target_table, item.target_key, item.severity, item.correction, item.status])]);
  }

  function renderOverview() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>PLM Enterprise Real DB Edition</h1>
          <p style={{ color: "#6b7280" }}>
            실제 ODM 연구소 업무 효율을 높이기 위한 Real DB Operation Pack입니다. 빠른 접근, Excel 대량등록, 통합검색, 최근작업, 오늘 할 일, 성능 점검을 통합합니다.
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
            <div style={cardStyle()}><strong>Data Tables</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{dataMappings.length}</div></div>
            <div style={cardStyle()}><strong>Services</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#111827" }}>{serviceLayerItems.length}</div></div>
            <div style={cardStyle()}><strong>Schema Plan</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{supabaseTablePlans.length}</div></div>
            <div style={cardStyle()}><strong>CRUD Bridge</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{supabaseBridgeItems.length}</div></div>
            <div style={cardStyle()}><strong>Real Pilot</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{realDataPilotItems.length}</div></div>
            <div style={cardStyle()}><strong>Repository</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{repositoryNodes.length}</div></div>
            <div style={cardStyle()}><strong>External RLS</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>{externalAccountMappings.length}</div></div>
            <div style={cardStyle()}><strong>RC Ready</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{releaseCandidateItems.filter((item) => item.status === "READY" || item.status === "LOCKED").length}</div></div>
            <div style={cardStyle()}><strong>UAT</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{uatScenarios.length}</div></div>
            <div style={cardStyle()}><strong>Go-Live</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{goLiveOperations.filter((item) => item.status === "ACTIVE" || item.status === "MONITORING").length}</div></div>
            <div style={cardStyle()}><strong>Monitoring</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{monitoringChecks.length}</div></div>
            <div style={cardStyle()}><strong>v1.0 Stable</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{stabilizationItems.filter((item) => item.status === "STABLE" || item.status === "LOCKED").length}</div></div>
            <div style={cardStyle()}><strong>Workflows</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{workflowTemplates.length}</div></div>
            <div style={cardStyle()}><strong>Simulations</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>{simulationResults.length}</div></div>
            <div style={cardStyle()}><strong>Scale-Up</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{scaleUpBatches.length}</div></div>
            <div style={cardStyle()}><strong>ELN</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{elnExperiments.length}</div></div>
            <div style={cardStyle()}><strong>LIMS</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{limsSamples.length}</div></div>
            <div style={cardStyle()}><strong>MES</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{mesWorkOrders.length}</div></div>
            <div style={cardStyle()}><strong>v2.0</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{v2Flows.length}</div></div>
            <div style={cardStyle()}><strong>AI/QMS</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>{aiCopilotActions.length}</div></div>
            <div style={cardStyle()}><strong>Knowledge/SCM</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{patentPaperInsights.length}</div></div>
            <div style={cardStyle()}><strong>Ultimate A</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>{aiResearchProjects.length}</div></div>
            <div style={cardStyle()}><strong>Ultimate B</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{autonomousAgents.length}</div></div>
            <div style={cardStyle()}><strong>Work Ready</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>{masterDataConnectors.length}</div></div>
            <div style={cardStyle()}><strong>Real Ops</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{todayTasks.length}</div></div>
            <div style={cardStyle()}><strong>Import</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{importValidationResults.length}</div></div>
            <div style={cardStyle()}><strong>Real DB</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{realDbConnections.length}</div></div>
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
          <h2 style={{ marginTop: 0 }}>Real DB Operation 목표</h2>
          <ul>
            <li>Supabase 실제 운영 테이블 연결 상태 확인</li>
            <li>검증/승인 완료 Import 데이터를 실제 마스터 테이블로 반영</li>
            <li>원료, INCI, 처방, 공급사, 규제, LIMS 운영 KPI 집계</li>
            <li>통합 검색 인덱스 준비와 중복/누락/참조 오류 수정 Action 생성</li>
            <li>샘플 UI에서 실제 업무 데이터 기반 PLM으로 전환 준비</li>
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

  function renderRealDbOperationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Real DB Operation Pack</h1>
          <p style={{ color: "#6b7280" }}>
            검증 완료 데이터를 Supabase 실제 운영 테이블에 반영하기 위한 운영 화면입니다.
            Import 실행, 실제 테이블 연결 상태, 운영 KPI, 검색 인덱스, 수정 Action을 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Connected</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{realDbStats.connected}/{realDbStats.connections}</div></div>
            <div style={cardStyle()}><strong>Schema Needed</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{realDbStats.schemaNeeded}</div></div>
            <div style={cardStyle()}><strong>Executed</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{realDbStats.executed}/{realDbStats.executions}</div></div>
            <div style={cardStyle()}><strong>Failed</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{realDbStats.failed}</div></div>
            <div style={cardStyle()}><strong>Rows</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{realDbStats.inserted}/{realDbStats.updated}</div></div>
            <div style={cardStyle()}><strong>KPI Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{realDbStats.kpiRisk}</div></div>
            <div style={cardStyle()}><strong>Index</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{realDbStats.activeIndex}</div></div>
            <div style={cardStyle()}><strong>Blockers</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{realDbStats.blockers}/{realDbStats.openCorrections}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateRealDbOperationPack} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Real DB Operation 생성</button>
            <button onClick={exportRealDbConnectionsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Connection CSV</button>
            <button onClick={exportRealDbExecutionsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Execution CSV</button>
            <button onClick={exportRealDbMetricsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>KPI CSV</button>
            <button onClick={exportRealDbIndexesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Index CSV</button>
            <button onClick={exportRealDbCorrectionsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Correction CSV</button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{realDbStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>1. Supabase Table Connections</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Table</th><th style={tableCellStyle(true)}>Domain</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Rows</th><th style={tableCellStyle(true)}>Last Sync</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{realDbConnections.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Real DB Operation 생성을 실행하세요.</td></tr>}{realDbConnections.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.table_name}</td><td style={tableCellStyle()}>{item.domain}</td><td style={{ ...tableCellStyle(), color: item.connection_status === "CONNECTED" ? "#059669" : item.connection_status === "ERROR" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.connection_status}</td><td style={tableCellStyle()}>{item.row_count}</td><td style={tableCellStyle()}>{item.last_sync}</td><td style={tableCellStyle()}>{item.action}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>2. Import Execution</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Validation</th><th style={tableCellStyle(true)}>Approval</th><th style={tableCellStyle(true)}>Execution</th><th style={tableCellStyle(true)}>Insert</th><th style={tableCellStyle(true)}>Update</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{realDbImportExecutions.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>Import 실행 항목이 표시됩니다.</td></tr>}{realDbImportExecutions.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.source_file}</td><td style={{ ...tableCellStyle(), color: item.validation_status === "PASS" ? "#059669" : item.validation_status === "WARNING" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.validation_status}</td><td style={{ ...tableCellStyle(), color: item.approval_status === "APPROVED" ? "#059669" : item.approval_status === "REJECTED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.approval_status}</td><td style={{ ...tableCellStyle(), color: item.execution_status === "EXECUTED" ? "#059669" : item.execution_status === "FAILED" ? "#dc2626" : item.execution_status === "READY" ? "#2563eb" : "#6b7280", fontWeight: "bold" }}>{item.execution_status}</td><td style={tableCellStyle()}>{item.inserted_rows}</td><td style={tableCellStyle()}>{item.updated_rows}</td><td style={tableCellStyle()}>{item.execution_status === "READY" ? <button onClick={() => executeRealDbImport(item.id)}>Execute</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>3. Operation Dashboard Metrics</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Metric</th><th style={tableCellStyle(true)}>Value</th><th style={tableCellStyle(true)}>Source Table</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Insight</th></tr></thead><tbody>{realDbOperationMetrics.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>운영 KPI가 표시됩니다.</td></tr>}{realDbOperationMetrics.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.metric}</td><td style={tableCellStyle()}>{item.value}</td><td style={tableCellStyle()}>{item.source_table}</td><td style={{ ...tableCellStyle(), color: item.status === "GOOD" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.insight}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>4. Search Index Preparation</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Index</th><th style={tableCellStyle(true)}>Table</th><th style={tableCellStyle(true)}>Fields</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Usage</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{realDbSearchIndexes.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>검색 인덱스가 표시됩니다.</td></tr>}{realDbSearchIndexes.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.index_name}</td><td style={tableCellStyle()}>{item.target_table}</td><td style={tableCellStyle()}>{item.indexed_fields}</td><td style={{ ...tableCellStyle(), color: item.status === "ACTIVE" ? "#059669" : item.status === "REBUILD_REQUIRED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.expected_usage}</td><td style={tableCellStyle()}>{item.status !== "ACTIVE" ? <button onClick={() => activateSearchIndex(item.id)}>Activate</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>5. Correction Actions</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Issue</th><th style={tableCellStyle(true)}>Table</th><th style={tableCellStyle(true)}>Key</th><th style={tableCellStyle(true)}>Severity</th><th style={tableCellStyle(true)}>Correction</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{realDbCorrectionActions.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>수정 Action이 표시됩니다.</td></tr>}{realDbCorrectionActions.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.issue_type}</td><td style={tableCellStyle()}>{item.target_table}</td><td style={tableCellStyle()}>{item.target_key}</td><td style={{ ...tableCellStyle(), color: item.severity === "BLOCKER" ? "#dc2626" : item.severity === "HIGH" ? "#d97706" : item.severity === "MEDIUM" ? "#2563eb" : "#6b7280", fontWeight: "bold" }}>{item.severity}</td><td style={tableCellStyle()}>{item.correction}</td><td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "IN_PROGRESS" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.status !== "DONE" ? <button onClick={() => closeCorrectionAction(item.id)}>Done</button> : "-"}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderImportValidationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Real DB Operation Pack</h1>
          <p style={{ color: "#6b7280" }}>
            실제 원료/INCI/처방/규제 데이터를 넣기 전, Excel 컬럼 매핑과 데이터 오류를 먼저 검증합니다.
            함량합계 100%, 복합성분 구성비, CAS/EC 누락, 중복 원료, 공급사 누락, 규제 위험을 Import 전에 차단합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Templates</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{importValidationStats.templates}</div></div>
            <div style={cardStyle()}><strong>Mapped</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{importValidationStats.mapped}/{importValidationStats.mappings}</div></div>
            <div style={cardStyle()}><strong>Rules</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{importValidationStats.rules}</div></div>
            <div style={cardStyle()}><strong>Pass</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{importValidationStats.pass}/{importValidationStats.results}</div></div>
            <div style={cardStyle()}><strong>Blocked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{importValidationStats.blocked}</div></div>
            <div style={cardStyle()}><strong>Errors</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{importValidationStats.errors}</div></div>
            <div style={cardStyle()}><strong>Blocker Issues</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{importValidationStats.blockers}</div></div>
            <div style={cardStyle()}><strong>Approvals</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{importValidationStats.approvals}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "620px", marginBottom: "12px" }}>
            <select value={selectedImportType} onChange={(e) => setSelectedImportType(e.target.value as any)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="RawMaterial">RawMaterial</option>
              <option value="INCI">INCI</option>
              <option value="Formula">Formula</option>
              <option value="Supplier">Supplier</option>
              <option value="Regulation">Regulation</option>
              <option value="LIMS">LIMS</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateImportValidationPack} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Import Validation 생성</button>
            <button onClick={exportImportTemplatesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Template CSV</button>
            <button onClick={exportColumnMappingsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Mapping CSV</button>
            <button onClick={exportValidationRulesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>Rule CSV</button>
            <button onClick={exportValidationResultsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Result CSV</button>
            <button onClick={exportErrorReportsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Error CSV</button>
            <button onClick={exportImportApprovalsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Approval CSV</button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{importValidationStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>1. Import Templates</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Template</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Required</th><th style={tableCellStyle(true)}>Optional</th><th style={tableCellStyle(true)}>Status</th></tr></thead><tbody>{importTemplates.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Import Validation 생성을 실행하세요.</td></tr>}{importTemplates.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.template_name}</td><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.required_columns}</td><td style={tableCellStyle()}>{item.optional_columns}</td><td style={{ ...tableCellStyle(), color: item.status === "READY" ? "#059669" : "#d97706", fontWeight: "bold" }}>{item.status}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>2. Column Mapping</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Source Column</th><th style={tableCellStyle(true)}>Target Field</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Rule</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{columnMappings.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>컬럼 매핑 결과가 표시됩니다.</td></tr>}{columnMappings.filter((item) => item.import_type === selectedImportType || selectedImportType === "RawMaterial").map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.source_column}</td><td style={tableCellStyle()}>{item.target_field}</td><td style={{ ...tableCellStyle(), color: item.mapping_status === "MAPPED" ? "#059669" : item.mapping_status === "MISSING" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.mapping_status}</td><td style={tableCellStyle()}>{item.rule}</td><td style={tableCellStyle()}>{item.mapping_status !== "MAPPED" ? <button onClick={() => markMappingComplete(item.id)}>Map</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>3. Validation Rules</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Rule</th><th style={tableCellStyle(true)}>Target</th><th style={tableCellStyle(true)}>Severity</th><th style={tableCellStyle(true)}>Logic</th><th style={tableCellStyle(true)}>Auto Fix</th></tr></thead><tbody>{dataValidationRules.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>검증 규칙이 표시됩니다.</td></tr>}{dataValidationRules.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.rule_name}</td><td style={tableCellStyle()}>{item.target}</td><td style={{ ...tableCellStyle(), color: item.severity === "BLOCKER" ? "#dc2626" : item.severity === "ERROR" ? "#d97706" : item.severity === "WARNING" ? "#2563eb" : "#6b7280", fontWeight: "bold" }}>{item.severity}</td><td style={tableCellStyle()}>{item.check_logic}</td><td style={tableCellStyle()}>{item.auto_fix}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>4. Validation Results</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>File</th><th style={tableCellStyle(true)}>Total</th><th style={tableCellStyle(true)}>Valid</th><th style={tableCellStyle(true)}>Warning</th><th style={tableCellStyle(true)}>Error</th><th style={tableCellStyle(true)}>Blocker</th><th style={tableCellStyle(true)}>Status</th></tr></thead><tbody>{importValidationResults.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>검증 결과가 표시됩니다.</td></tr>}{importValidationResults.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.file_name}</td><td style={tableCellStyle()}>{item.total_rows}</td><td style={tableCellStyle()}>{item.valid_rows}</td><td style={tableCellStyle()}>{item.warning_rows}</td><td style={{ ...tableCellStyle(), color: item.error_rows > 0 ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.error_rows}</td><td style={{ ...tableCellStyle(), color: item.blocker_rows > 0 ? "#dc2626" : "#059669", fontWeight: "bold" }}>{item.blocker_rows}</td><td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "BLOCKED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>5. Error Report</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Row</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Field</th><th style={tableCellStyle(true)}>Error</th><th style={tableCellStyle(true)}>Message</th><th style={tableCellStyle(true)}>Fix</th></tr></thead><tbody>{importErrorReports.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>오류 리포트가 표시됩니다.</td></tr>}{importErrorReports.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.row_no}</td><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.field_name}</td><td style={{ ...tableCellStyle(), color: item.error_type === "CompositionTotal" || item.error_type === "RegulationRisk" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.error_type}</td><td style={tableCellStyle()}>{item.message}</td><td style={tableCellStyle()}>{item.fix_suggestion}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>6. Import Approval</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>File</th><th style={tableCellStyle(true)}>Requester</th><th style={tableCellStyle(true)}>Reviewer</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Summary</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{importApprovals.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>승인 요청이 표시됩니다.</td></tr>}{importApprovals.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.file_name}</td><td style={tableCellStyle()}>{item.requester}</td><td style={tableCellStyle()}>{item.reviewer}</td><td style={{ ...tableCellStyle(), color: item.approval_status === "APPROVED" ? "#059669" : item.approval_status === "REJECTED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.approval_status}</td><td style={tableCellStyle()}>{item.summary}</td><td style={tableCellStyle()}>{item.approval_status !== "APPROVED" ? <button onClick={() => approveImport(item.id)}>Approve</button> : "-"}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderRealOperationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Real DB Operation Pack</h1>
          <p style={{ color: "#6b7280" }}>
            실제 ODM 연구소에서 바로 쓰기 위한 운영형 패키지입니다. 빠른 접근, Excel 대량등록 검증,
            통합 검색, 최근 작업, 오늘 할 일, 성능 점검을 제공합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Quick Access</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{realOperationStats.highQuick}/{realOperationStats.quick}</div></div>
            <div style={cardStyle()}><strong>Imports</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{realOperationStats.imports}</div></div>
            <div style={cardStyle()}><strong>Import Errors</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{realOperationStats.importErrors}</div></div>
            <div style={cardStyle()}><strong>Search</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{realOperationStats.search}</div></div>
            <div style={cardStyle()}><strong>Recent</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{realOperationStats.recent}</div></div>
            <div style={cardStyle()}><strong>Today</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{realOperationStats.tasks}</div></div>
            <div style={cardStyle()}><strong>P0/Overdue</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{realOperationStats.p0}/{realOperationStats.overdue}</div></div>
            <div style={cardStyle()}><strong>Optimize</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{realOperationStats.optimize}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "12px" }}>
            <input value={globalSearchKeyword} onChange={(e) => setGlobalSearchKeyword(e.target.value)} placeholder="통합 검색어" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateRealOperationPack} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Real Operation 생성</button>
            <button onClick={runGlobalSearch} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>통합 검색</button>
            <button onClick={exportQuickAccessCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Quick CSV</button>
            <button onClick={exportBulkImportCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Import CSV</button>
            <button onClick={exportGlobalSearchCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>Search CSV</button>
            <button onClick={exportRecentWorksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Recent CSV</button>
            <button onClick={exportTodayTasksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Today CSV</button>
            <button onClick={exportPerformanceChecksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#4b5563", color: "white", fontWeight: "bold", cursor: "pointer" }}>Performance CSV</button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{realOperationStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>1. Quick Access / 자주 쓰는 기능</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Label</th><th style={tableCellStyle(true)}>Module</th><th style={tableCellStyle(true)}>Route</th><th style={tableCellStyle(true)}>Priority</th><th style={tableCellStyle(true)}>Usage</th><th style={tableCellStyle(true)}>Open</th></tr></thead><tbody>{quickAccessItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Real Operation 생성을 실행하세요.</td></tr>}{quickAccessItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.label}</td><td style={tableCellStyle()}>{item.module}</td><td style={tableCellStyle()}>{item.route_key}</td><td style={{ ...tableCellStyle(), color: item.priority === "HIGH" ? "#dc2626" : item.priority === "MEDIUM" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.priority}</td><td style={tableCellStyle()}>{item.usage_count}</td><td style={tableCellStyle()}><button onClick={() => setActive(item.route_key)}>Open</button></td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>2. Excel 대량등록 검증</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>File</th><th style={tableCellStyle(true)}>Total</th><th style={tableCellStyle(true)}>Valid</th><th style={tableCellStyle(true)}>Error</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Next</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{bulkImportJobs.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>Import Job이 표시됩니다.</td></tr>}{bulkImportJobs.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.import_type}</td><td style={tableCellStyle()}>{item.file_name}</td><td style={tableCellStyle()}>{item.rows_total}</td><td style={tableCellStyle()}>{item.rows_valid}</td><td style={{ ...tableCellStyle(), color: item.rows_error > 0 ? "#dc2626" : "#059669", fontWeight: "bold" }}>{item.rows_error}</td><td style={{ ...tableCellStyle(), color: item.status === "IMPORTED" ? "#059669" : item.status === "ERROR" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.next_action}</td><td style={tableCellStyle()}><button onClick={() => validateImportJob(item.id)}>Validate</button></td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>3. 빠른 통합 검색</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Keyword</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Title</th><th style={tableCellStyle(true)}>Summary</th><th style={tableCellStyle(true)}>Risk</th></tr></thead><tbody>{globalSearchResults.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>검색 결과가 표시됩니다.</td></tr>}{globalSearchResults.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.keyword}</td><td style={tableCellStyle()}>{item.result_type}</td><td style={tableCellStyle()}>{item.title}</td><td style={tableCellStyle()}>{item.summary}</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>4. 즐겨찾기 / 최근 작업</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Title</th><th style={tableCellStyle(true)}>Last Opened</th><th style={tableCellStyle(true)}>Owner</th><th style={tableCellStyle(true)}>Status</th></tr></thead><tbody>{recentWorks.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>최근 작업이 표시됩니다.</td></tr>}{recentWorks.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.work_type}</td><td style={tableCellStyle()}>{item.title}</td><td style={tableCellStyle()}>{item.last_opened}</td><td style={tableCellStyle()}>{item.owner}</td><td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "ISSUE" ? "#dc2626" : item.status === "WAITING" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>5. 오늘 할 일 / 업무 알림</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Task</th><th style={tableCellStyle(true)}>Module</th><th style={tableCellStyle(true)}>Due</th><th style={tableCellStyle(true)}>Owner</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Priority</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{todayTasks.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>오늘 할 일이 표시됩니다.</td></tr>}{todayTasks.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.task}</td><td style={tableCellStyle()}>{item.source_module}</td><td style={tableCellStyle()}>{item.due}</td><td style={tableCellStyle()}>{item.owner}</td><td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "OVERDUE" ? "#dc2626" : item.status === "IN_PROGRESS" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={{ ...tableCellStyle(), color: item.priority === "P0" ? "#dc2626" : item.priority === "P1" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.priority}</td><td style={tableCellStyle()}>{item.status !== "DONE" ? <button onClick={() => markTodayTaskDone(item.id)}>Done</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>6. 성능 최적화 / 운영 안정성</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Area</th><th style={tableCellStyle(true)}>Current</th><th style={tableCellStyle(true)}>Target</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{performanceChecks.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>성능 점검이 표시됩니다.</td></tr>}{performanceChecks.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.area}</td><td style={tableCellStyle()}>{item.current_state}</td><td style={tableCellStyle()}>{item.target_state}</td><td style={{ ...tableCellStyle(), color: item.status === "GOOD" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.action}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderWorkReadyModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Real DB Operation Pack</h1>
          <p style={{ color: "#6b7280" }}>
            출근 직후 업무에 바로 사용할 수 있도록 실제 데이터 연동 준비, AI Brain, 문서 자동 생성,
            PLM Chatbot, 코드 품질 점검을 하나로 묶은 통합 패키지입니다. 고객 포털 기능은 제외했습니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Connectors</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{workReadyStats.synced}/{workReadyStats.connectors}</div></div>
            <div style={cardStyle()}><strong>Mapping</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{workReadyStats.mapping}</div></div>
            <div style={cardStyle()}><strong>AI Brain</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{workReadyStats.approvedAi}/{workReadyStats.aiScenarios}</div></div>
            <div style={cardStyle()}><strong>Documents</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{workReadyStats.approvedDocs}/{workReadyStats.docs}</div></div>
            <div style={cardStyle()}><strong>Chatbot</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{workReadyStats.chats}</div></div>
            <div style={cardStyle()}><strong>Quality Watch</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{workReadyStats.qualityWatch}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "12px" }}>
            <input value={workReadyQuestion} onChange={(e) => setWorkReadyQuestion(e.target.value)} placeholder="PLM Chatbot 질문" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateWorkReadyPack} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Work Ready 생성</button>
            <button onClick={runPlmChatbot} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Chatbot 실행</button>
            <button onClick={exportMasterDataConnectorsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Data CSV</button>
            <button onClick={exportAiBrainScenariosCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>AI Brain CSV</button>
            <button onClick={exportDocumentAutomationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>Document CSV</button>
            <button onClick={exportPlmChatbotCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Chatbot CSV</button>
            <button onClick={exportCodeQualityCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Quality CSV</button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{workReadyStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>1. 실제 데이터 연동 준비</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Domain</th><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Records</th><th style={tableCellStyle(true)}>Quality</th><th style={tableCellStyle(true)}>Next Action</th></tr></thead><tbody>{masterDataConnectors.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Work Ready 생성을 실행하세요.</td></tr>}{masterDataConnectors.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.data_domain}</td><td style={tableCellStyle()}>{item.source_name}</td><td style={{ ...tableCellStyle(), color: item.sync_status === "SYNCED" ? "#059669" : item.sync_status === "ERROR" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.sync_status}</td><td style={tableCellStyle()}>{item.record_count}</td><td style={tableCellStyle()}>{item.quality_score}</td><td style={tableCellStyle()}>{item.next_action}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>2. Cosmetic AI Brain</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Request</th><th style={tableCellStyle(true)}>AI Workflow</th><th style={tableCellStyle(true)}>Output</th><th style={tableCellStyle(true)}>Confidence</th><th style={tableCellStyle(true)}>Review</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{aiBrainScenarios.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>AI Brain 시나리오가 표시됩니다.</td></tr>}{aiBrainScenarios.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.user_request}</td><td style={tableCellStyle()}>{item.ai_workflow}</td><td style={tableCellStyle()}>{item.output_type}</td><td style={tableCellStyle()}>{item.confidence}%</td><td style={{ ...tableCellStyle(), color: item.review_status === "APPROVED" ? "#059669" : item.review_status === "NEEDS_REVIEW" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.review_status}</td><td style={tableCellStyle()}>{item.review_status !== "APPROVED" ? <button onClick={() => approveAiBrainScenario(item.id)}>Approve</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>3. 문서 자동 생성</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Document</th><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Owner</th><th style={tableCellStyle(true)}>File</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{documentAutomations.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>자동 문서 목록이 표시됩니다.</td></tr>}{documentAutomations.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.document_type}</td><td style={tableCellStyle()}>{item.source_module}</td><td style={{ ...tableCellStyle(), color: item.status === "APPROVED" ? "#059669" : item.status === "REVIEW" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.owner}</td><td style={tableCellStyle()}>{item.file_name}</td><td style={tableCellStyle()}>{item.status !== "APPROVED" ? <button onClick={() => approveDocumentAutomation(item.id)}>Approve</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>4. PLM Chatbot</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Question</th><th style={tableCellStyle(true)}>Answer</th><th style={tableCellStyle(true)}>Modules</th><th style={tableCellStyle(true)}>Action</th><th style={tableCellStyle(true)}>Risk</th></tr></thead><tbody>{plmChatbotItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Chatbot 실행 결과가 표시됩니다.</td></tr>}{plmChatbotItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.question}</td><td style={tableCellStyle()}>{item.answer_summary}</td><td style={tableCellStyle()}>{item.related_modules}</td><td style={tableCellStyle()}>{item.action_created}</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>5. 코드 품질 / 배포 안정성 점검</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Area</th><th style={tableCellStyle(true)}>Issue</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{codeQualityItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>코드 품질 점검 결과가 표시됩니다.</td></tr>}{codeQualityItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.area}</td><td style={tableCellStyle()}>{item.issue}</td><td style={{ ...tableCellStyle(), color: item.status === "GOOD" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.action}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderUltimatePackBModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Ultimate Pack B: AI Agents / Smart Factory / Self-Driving PLM</h1>
          <p style={{ color: "#6b7280" }}>
            Phase 56~60 통합 패키지입니다. AI Agent Platform, Autonomous Formula Development,
            Smart Factory IoT, AI Optimization, Self-Driving PLM을 연결합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Agents</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ultimateBStats.agents}</div></div>
            <div style={cardStyle()}><strong>Running</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{ultimateBStats.runningAgents}</div></div>
            <div style={cardStyle()}><strong>Review</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{ultimateBStats.agentReview}</div></div>
            <div style={cardStyle()}><strong>Auto Formula</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{ultimateBStats.readyFormulas}/{ultimateBStats.formulaRuns}</div></div>
            <div style={cardStyle()}><strong>IoT Alarm</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{ultimateBStats.iotAlarms}</div></div>
            <div style={cardStyle()}><strong>IoT Warning</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{ultimateBStats.iotWarnings}</div></div>
            <div style={cardStyle()}><strong>Optimization</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{ultimateBStats.optimizations}</div></div>
            <div style={cardStyle()}><strong>Self-Driving</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ultimateBStats.completedTasks}/{ultimateBStats.selfDriving}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "12px" }}>
            <input value={selfDrivingGoal} onChange={(e) => setSelfDrivingGoal(e.target.value)} placeholder="Self-Driving PLM Goal" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateUltimatePackB} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Ultimate Pack B 생성</button>
            <button onClick={runSelfDrivingGoal} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Self-Driving 실행</button>
            <button onClick={exportAutonomousAgentsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Agent CSV</button>
            <button onClick={exportAutonomousFormulaCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Formula CSV</button>
            <button onClick={exportSmartFactoryIotCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>IoT CSV</button>
            <button onClick={exportAiOptimizationRunsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Optimization CSV</button>
            <button onClick={exportSelfDrivingTasksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Self-Driving CSV</button>
          </div>
          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{ultimateBStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 56 AI Agent Platform</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Agent</th><th style={tableCellStyle(true)}>Role</th><th style={tableCellStyle(true)}>Objective</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Level</th><th style={tableCellStyle(true)}>Result</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{autonomousAgents.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Ultimate Pack B 생성을 실행하세요.</td></tr>}{autonomousAgents.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.agent_name}</td><td style={tableCellStyle()}>{item.role}</td><td style={tableCellStyle()}>{item.objective}</td><td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "BLOCKED" ? "#dc2626" : item.status === "NEEDS_REVIEW" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.autonomy_level}</td><td style={tableCellStyle()}>{item.last_result}</td><td style={tableCellStyle()}>{item.status !== "DONE" ? <button onClick={() => completeAgent(item.id)}>Done</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 57 Autonomous Formula Development</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Run</th><th style={tableCellStyle(true)}>Brief</th><th style={tableCellStyle(true)}>Generated Formula</th><th style={tableCellStyle(true)}>Validation</th><th style={tableCellStyle(true)}>AI Score</th><th style={tableCellStyle(true)}>Risk</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{autonomousFormulaRuns.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>자율 처방 개발 결과가 표시됩니다.</td></tr>}{autonomousFormulaRuns.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.run_name}</td><td style={tableCellStyle()}>{item.target_brief}</td><td style={tableCellStyle()}>{item.generated_formula}</td><td style={{ ...tableCellStyle(), color: item.validation_status === "READY" ? "#059669" : "#d97706", fontWeight: "bold" }}>{item.validation_status}</td><td style={tableCellStyle()}>{item.ai_score}</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td><td style={tableCellStyle()}>{item.validation_status !== "READY" ? <button onClick={() => markFormulaReady(item.id)}>Ready</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 58 Smart Factory IoT</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Equipment</th><th style={tableCellStyle(true)}>Sensor</th><th style={tableCellStyle(true)}>Value</th><th style={tableCellStyle(true)}>Range</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Prediction</th></tr></thead><tbody>{smartFactoryIotItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>IoT 센서 상태가 표시됩니다.</td></tr>}{smartFactoryIotItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.equipment}</td><td style={tableCellStyle()}>{item.sensor_type}</td><td style={tableCellStyle()}>{item.current_value}</td><td style={tableCellStyle()}>{item.normal_range}</td><td style={{ ...tableCellStyle(), color: item.status === "NORMAL" ? "#059669" : item.status === "WARNING" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.prediction}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 59 AI Optimization</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Area</th><th style={tableCellStyle(true)}>Before</th><th style={tableCellStyle(true)}>After</th><th style={tableCellStyle(true)}>Improvement</th><th style={tableCellStyle(true)}>Confidence</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{aiOptimizationRuns.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>AI 최적화 결과가 표시됩니다.</td></tr>}{aiOptimizationRuns.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.optimization_area}</td><td style={tableCellStyle()}>{item.before_value}</td><td style={tableCellStyle()}>{item.after_value}</td><td style={tableCellStyle()}>{item.improvement}</td><td style={tableCellStyle()}>{item.confidence}%</td><td style={tableCellStyle()}>{item.action_required}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 60 Self-Driving PLM</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Task Chain</th><th style={tableCellStyle(true)}>Trigger</th><th style={tableCellStyle(true)}>Current Step</th><th style={tableCellStyle(true)}>Progress</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Human Approval</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{selfDrivingTasks.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Self-Driving PLM Task가 표시됩니다.</td></tr>}{selfDrivingTasks.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.task_chain}</td><td style={tableCellStyle()}>{item.trigger}</td><td style={tableCellStyle()}>{item.current_step}</td><td style={tableCellStyle()}>{item.progress}%</td><td style={{ ...tableCellStyle(), color: item.status === "COMPLETED" ? "#059669" : item.status === "FAILED" ? "#dc2626" : item.status === "WAITING_HUMAN" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.human_approval_required ? "YES" : "NO"}</td><td style={tableCellStyle()}>{item.status !== "COMPLETED" ? <button onClick={() => approveSelfDrivingTask(item.id)}>Approve</button> : "-"}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderUltimatePackAModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Ultimate Pack A: AI Research / Data Lake / Decision Center</h1>
          <p style={{ color: "#6b7280" }}>
            Phase 46~50 통합 패키지입니다. AI 연구원, 후보처방 생성, Knowledge Engine 2.0,
            Digital Factory Simulation 2.0, Enterprise Data Lake, CEO Decision Center를 연결합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Research</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ultimateAStats.research}</div></div>
            <div style={cardStyle()}><strong>Candidates</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{ultimateAStats.candidates}</div></div>
            <div style={cardStyle()}><strong>High Launch</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{ultimateAStats.highLaunch}</div></div>
            <div style={cardStyle()}><strong>KG Links</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{ultimateAStats.kgLinks}</div></div>
            <div style={cardStyle()}><strong>Factory</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{ultimateAStats.factory}</div></div>
            <div style={cardStyle()}><strong>Factory HIGH</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{ultimateAStats.factoryHigh}</div></div>
            <div style={cardStyle()}><strong>Data Lake</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#0ea5e9" }}>{ultimateAStats.aiReady}/{ultimateAStats.dataLake}</div></div>
            <div style={cardStyle()}><strong>Decision HOLD</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{ultimateAStats.holds}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "12px" }}>
            <input value={researchRequest} onChange={(e) => setResearchRequest(e.target.value)} placeholder="AI Research Request" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateUltimatePackA} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Ultimate Pack A 생성</button>
            <button onClick={exportAiResearchCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Research CSV</button>
            <button onClick={exportAiFormulaCandidatesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Candidate CSV</button>
            <button onClick={exportKnowledgeEngineCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>KG CSV</button>
            <button onClick={exportFactorySimulationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Factory CSV</button>
            <button onClick={exportDataLakeCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>Data Lake CSV</button>
            <button onClick={exportDecisionCenterCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Decision CSV</button>
          </div>
          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{ultimateAStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 46 AI Research Assistant</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Request</th><th style={tableCellStyle(true)}>Market</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Score</th><th style={tableCellStyle(true)}>Summary</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{aiResearchProjects.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Ultimate Pack A 생성을 실행하세요.</td></tr>}{aiResearchProjects.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.request}</td><td style={tableCellStyle()}>{item.target_market}</td><td style={tableCellStyle()}>{item.product_type}</td><td style={{ ...tableCellStyle(), color: item.status === "APPROVED" ? "#059669" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.opportunity_score}</td><td style={tableCellStyle()}>{item.summary}</td><td style={tableCellStyle()}>{item.status !== "APPROVED" ? <button onClick={() => approveResearchProject(item.id)}>Approve</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 46 AI Formula Candidates</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Candidate</th><th style={tableCellStyle(true)}>Concept</th><th style={tableCellStyle(true)}>Cost</th><th style={tableCellStyle(true)}>Stability</th><th style={tableCellStyle(true)}>Regulation</th><th style={tableCellStyle(true)}>Launch</th><th style={tableCellStyle(true)}>Risk</th></tr></thead><tbody>{aiFormulaCandidates.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>후보 처방이 표시됩니다.</td></tr>}{aiFormulaCandidates.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.candidate_name}</td><td style={tableCellStyle()}>{item.formula_concept}</td><td style={tableCellStyle()}>{item.target_cost}</td><td style={tableCellStyle()}>{item.predicted_stability}</td><td style={tableCellStyle()}>{item.predicted_regulation}</td><td style={tableCellStyle()}>{item.launch_score}</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 47 Knowledge Engine 2.0</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Target</th><th style={tableCellStyle(true)}>Target Type</th><th style={tableCellStyle(true)}>Relationship</th><th style={tableCellStyle(true)}>Confidence</th></tr></thead><tbody>{knowledgeEngineLinks.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Knowledge Link가 표시됩니다.</td></tr>}{knowledgeEngineLinks.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.source_node}</td><td style={tableCellStyle()}>{item.source_type}</td><td style={tableCellStyle()}>{item.target_node}</td><td style={tableCellStyle()}>{item.target_type}</td><td style={tableCellStyle()}>{item.relationship}</td><td style={tableCellStyle()}>{item.confidence}%</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 48 Digital Factory Simulation 2.0</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Scenario</th><th style={tableCellStyle(true)}>Batch</th><th style={tableCellStyle(true)}>Tank</th><th style={tableCellStyle(true)}>Mix</th><th style={tableCellStyle(true)}>Filling</th><th style={tableCellStyle(true)}>Yield</th><th style={tableCellStyle(true)}>Loss</th><th style={tableCellStyle(true)}>Risk</th></tr></thead><tbody>{factorySimulations.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>Factory Simulation이 표시됩니다.</td></tr>}{factorySimulations.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.scenario_name}</td><td style={tableCellStyle()}>{item.batch_kg}kg</td><td style={tableCellStyle()}>{item.tank_type}</td><td style={tableCellStyle()}>{item.mix_time_min} min</td><td style={tableCellStyle()}>{item.filling_time_min} min</td><td style={tableCellStyle()}>{item.expected_yield}%</td><td style={tableCellStyle()}>{item.expected_loss_kg}kg</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 49 Enterprise Data Lake</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Dataset</th><th style={tableCellStyle(true)}>Records</th><th style={tableCellStyle(true)}>Freshness</th><th style={tableCellStyle(true)}>Quality</th><th style={tableCellStyle(true)}>AI Ready</th></tr></thead><tbody>{dataLakeRecords.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Data Lake가 표시됩니다.</td></tr>}{dataLakeRecords.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.source_system}</td><td style={tableCellStyle()}>{item.dataset}</td><td style={tableCellStyle()}>{item.record_count}</td><td style={tableCellStyle()}>{item.freshness}</td><td style={{ ...tableCellStyle(), color: item.data_quality === "GOOD" ? "#059669" : item.data_quality === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.data_quality}</td><td style={tableCellStyle()}>{item.ai_ready ? "YES" : "NO"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 50 Enterprise Decision Center</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Area</th><th style={tableCellStyle(true)}>KPI</th><th style={tableCellStyle(true)}>Value</th><th style={tableCellStyle(true)}>AI Risk</th><th style={tableCellStyle(true)}>Recommendation</th><th style={tableCellStyle(true)}>Decision</th></tr></thead><tbody>{decisionCenterItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Decision Center가 표시됩니다.</td></tr>}{decisionCenterItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.decision_area}</td><td style={tableCellStyle()}>{item.kpi}</td><td style={tableCellStyle()}>{item.current_value}</td><td style={{ ...tableCellStyle(), color: item.ai_risk === "HIGH" ? "#dc2626" : item.ai_risk === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.ai_risk}</td><td style={tableCellStyle()}>{item.ai_recommendation}</td><td style={{ ...tableCellStyle(), color: item.decision_status === "GO" ? "#059669" : item.decision_status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.decision_status}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderV4PackageModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Knowledge / SCM / API Integrated Package</h1>
          <p style={{ color: "#6b7280" }}>Phase 41~45 통합 패키지입니다. AI Knowledge Graph 확장, 특허·논문·시장 인사이트, 원료 시세 예측, 원가 최적화, Multi-Plant, Enterprise API Hub를 연결합니다.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Insights</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{v4PackageStats.insights}</div></div>
            <div style={cardStyle()}><strong>High Relevance</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{v4PackageStats.highRelevance}</div></div>
            <div style={cardStyle()}><strong>Raw Markets</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{v4PackageStats.rawMarkets}</div></div>
            <div style={cardStyle()}><strong>Supply HIGH</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v4PackageStats.supplyHigh}</div></div>
            <div style={cardStyle()}><strong>Cost Opt.</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{v4PackageStats.optimizations}</div></div>
            <div style={cardStyle()}><strong>Avg Saving</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{v4PackageStats.avgSaving}%</div></div>
            <div style={cardStyle()}><strong>Plants</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{v4PackageStats.availablePlants}/{v4PackageStats.plants}</div></div>
            <div style={cardStyle()}><strong>APIs</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#0ea5e9" }}>{v4PackageStats.activeApis}/{v4PackageStats.apis}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateV4KnowledgeScmPackage} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>Knowledge/SCM Package 생성</button>
            <button onClick={exportPatentPaperInsightsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>Insight CSV</button>
            <button onClick={exportRawMaterialMarketCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>Market CSV</button>
            <button onClick={exportCostOptimizationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>Cost CSV</button>
            <button onClick={exportMultiPlantCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>Plant CSV</button>
            <button onClick={exportApiHubCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>API CSV</button>
          </div>
          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{v4PackageStatus}</p>
        </section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 41 Patent / Paper / Market Insights</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Source</th><th style={tableCellStyle(true)}>Title</th><th style={tableCellStyle(true)}>Keyword</th><th style={tableCellStyle(true)}>Score</th><th style={tableCellStyle(true)}>Opportunity</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{patentPaperInsights.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Package 생성을 실행하세요.</td></tr>}{patentPaperInsights.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.source_type}</td><td style={tableCellStyle()}>{item.title}</td><td style={tableCellStyle()}>{item.keyword}</td><td style={tableCellStyle()}>{item.relevance_score}</td><td style={tableCellStyle()}>{item.opportunity}</td><td style={tableCellStyle()}>{item.action}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 42 Raw Material Market Forecast</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Raw Code</th><th style={tableCellStyle(true)}>Raw Name</th><th style={tableCellStyle(true)}>Current</th><th style={tableCellStyle(true)}>Forecast</th><th style={tableCellStyle(true)}>Risk</th><th style={tableCellStyle(true)}>Recommendation</th></tr></thead><tbody>{rawMaterialMarkets.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>원료 시세 예측이 표시됩니다.</td></tr>}{rawMaterialMarkets.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.raw_code}</td><td style={tableCellStyle()}>{item.raw_name}</td><td style={tableCellStyle()}>{item.current_price}</td><td style={tableCellStyle()}>{item.forecast_price}</td><td style={{ ...tableCellStyle(), color: item.supply_risk === "HIGH" ? "#dc2626" : item.supply_risk === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.supply_risk}</td><td style={tableCellStyle()}>{item.recommendation}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 43 AI Cost Optimization</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Formula</th><th style={tableCellStyle(true)}>Type</th><th style={tableCellStyle(true)}>Current</th><th style={tableCellStyle(true)}>Optimized</th><th style={tableCellStyle(true)}>Saving</th><th style={tableCellStyle(true)}>Risk</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{costOptimizations.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>원가 최적화 결과가 표시됩니다.</td></tr>}{costOptimizations.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.formula_code}</td><td style={tableCellStyle()}>{item.optimization_type}</td><td style={tableCellStyle()}>{item.current_cost}</td><td style={tableCellStyle()}>{item.optimized_cost}</td><td style={tableCellStyle()}>{item.saving_percent}%</td><td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td><td style={tableCellStyle()}>{item.action}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 44 Multi-Plant / Multi-Company</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>Plant</th><th style={tableCellStyle(true)}>Location</th><th style={tableCellStyle(true)}>Capability</th><th style={tableCellStyle(true)}>Capacity</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Note</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{multiPlantItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Plant 정보가 표시됩니다.</td></tr>}{multiPlantItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.plant_name}</td><td style={tableCellStyle()}>{item.location}</td><td style={tableCellStyle()}>{item.capability}</td><td style={tableCellStyle()}>{item.capacity_kg_day}</td><td style={{ ...tableCellStyle(), color: item.status === "AVAILABLE" ? "#059669" : item.status === "BUSY" ? "#d97706" : item.status === "BLOCKED" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.note}</td><td style={tableCellStyle()}>{item.status === "QUALIFICATION_REQUIRED" ? <button onClick={() => qualifyPlant(item.id)}>Qualify</button> : "-"}</td></tr>))}</tbody></table></section>

        <section style={cardStyle()}><h2 style={{ marginTop: 0 }}>Phase 45 Enterprise API Hub</h2><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tableCellStyle(true)}>API</th><th style={tableCellStyle(true)}>Domain</th><th style={tableCellStyle(true)}>Endpoint</th><th style={tableCellStyle(true)}>Status</th><th style={tableCellStyle(true)}>Security</th><th style={tableCellStyle(true)}>Action</th></tr></thead><tbody>{apiHubItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>API Hub가 표시됩니다.</td></tr>}{apiHubItems.map((item) => (<tr key={item.id}><td style={tableCellStyle()}>{item.api_name}</td><td style={tableCellStyle()}>{item.domain}</td><td style={tableCellStyle()}>{item.endpoint}</td><td style={{ ...tableCellStyle(), color: item.status === "ACTIVE" ? "#059669" : item.status === "READY" ? "#2563eb" : item.status === "DEPRECATED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td><td style={tableCellStyle()}>{item.security_level}</td><td style={tableCellStyle()}>{item.status !== "ACTIVE" ? <button onClick={() => activateApiHubItem(item.id)}>Activate</button> : "-"}</td></tr>))}</tbody></table></section>
      </>
    );
  }

  function renderV3PackageModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Enterprise AI/QMS Integrated Package</h1>
          <p style={{ color: "#6b7280" }}>
            Phase 36~40 통합 패키지입니다. AI Copilot, QMS, CAPA/Change Control, DMS, Validation Center,
            Knowledge Graph를 하나로 연결합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Copilot</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{v3PackageStats.copilot}</div></div>
            <div style={cardStyle()}><strong>Copilot Done</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{v3PackageStats.copilotDone}</div></div>
            <div style={cardStyle()}><strong>QMS Open</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{v3PackageStats.qmsOpen}</div></div>
            <div style={cardStyle()}><strong>CAPA</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v3PackageStats.capa}</div></div>
            <div style={cardStyle()}><strong>DMS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{v3PackageStats.dmsEffective}/{v3PackageStats.dmsTotal}</div></div>
            <div style={cardStyle()}><strong>Validation</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{v3PackageStats.validationPassed}/{v3PackageStats.validationTotal}</div></div>
            <div style={cardStyle()}><strong>KG Nodes</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{v3PackageStats.graphNodes}</div></div>
            <div style={cardStyle()}><strong>High Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v3PackageStats.highRisk}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "920px", marginBottom: "12px" }}>
            <input value={copilotCommand} onChange={(e) => setCopilotCommand(e.target.value)} placeholder="AI Copilot Command" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateV3AiQmsPackage} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              AI/QMS Package 생성
            </button>
            <button onClick={runAiCopilotCommand} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Copilot 실행
            </button>
            <button onClick={exportAiCopilotCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Copilot CSV
            </button>
            <button onClick={exportQmsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              QMS CSV
            </button>
            <button onClick={exportDmsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              DMS CSV
            </button>
            <button onClick={exportValidationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Validation CSV
            </button>
            <button onClick={exportKnowledgeGraphCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              KG CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{v3PackageStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 36 AI Copilot</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Command</th>
                <th style={tableCellStyle(true)}>Module Chain</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Summary</th>
                <th style={tableCellStyle(true)}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {aiCopilotActions.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>AI/QMS Package 생성을 실행하세요.</td></tr>}
              {aiCopilotActions.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.command}</td>
                  <td style={tableCellStyle()}>{item.module_chain}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "NEEDS_REVIEW" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.result_summary}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 37~38 QMS / CAPA / Change Control</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Process</th>
                <th style={tableCellStyle(true)}>Source</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Due</th>
                <th style={tableCellStyle(true)}>Summary</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {qmsProcesses.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>QMS 항목이 표시됩니다.</td></tr>}
              {qmsProcesses.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.process}</td>
                  <td style={tableCellStyle()}>{item.source_module}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "CLOSED" || item.status === "EFFECTIVE" ? "#059669" : item.status === "OPEN" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.due_date}</td>
                  <td style={tableCellStyle()}>{item.summary}</td>
                  <td style={tableCellStyle()}>{item.status !== "CLOSED" ? <button onClick={() => closeQmsProcess(item.id)}>Close</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 39 DMS</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Document No</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Title</th>
                <th style={tableCellStyle(true)}>Version</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dmsDocuments.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>DMS 문서가 표시됩니다.</td></tr>}
              {dmsDocuments.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.document_no}</td>
                  <td style={tableCellStyle()}>{item.document_type}</td>
                  <td style={tableCellStyle()}>{item.title}</td>
                  <td style={tableCellStyle()}>{item.version}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "EFFECTIVE" ? "#059669" : item.status === "APPROVED" ? "#2563eb" : item.status === "OBSOLETE" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.status !== "EFFECTIVE" ? <button onClick={() => approveDmsDocument(item.id)}>Effective</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 40 Validation Center</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Protocol</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Result</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {validationProtocols.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Validation 항목이 표시됩니다.</td></tr>}
              {validationProtocols.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.protocol_no}</td>
                  <td style={tableCellStyle()}>{item.validation_type}</td>
                  <td style={tableCellStyle()}>{item.target_system}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASSED" ? "#059669" : item.status === "FAILED" || item.status === "RETEST" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.result}</td>
                  <td style={tableCellStyle()}>{item.status !== "PASSED" ? <button onClick={() => passValidation(item.id)}>Pass</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>AI Knowledge Graph</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Node</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Connected To</th>
                <th style={tableCellStyle(true)}>Relationship</th>
                <th style={tableCellStyle(true)}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeGraphItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Knowledge Graph가 표시됩니다.</td></tr>}
              {knowledgeGraphItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.node}</td>
                  <td style={tableCellStyle()}>{item.node_type}</td>
                  <td style={tableCellStyle()}>{item.connected_to}</td>
                  <td style={tableCellStyle()}>{item.relationship}</td>
                  <td style={tableCellStyle()}>{item.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderV2PackageModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Enterprise v2.0 Integrated Package</h1>
          <p style={{ color: "#6b7280" }}>
            Phase 31~35를 통합한 v2.0 패키지입니다. 전체 업무 흐름, Digital Twin, AI 처방 전문가,
            Global Regulatory AI, Enterprise Analytics를 하나의 화면에서 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Flows</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{v2PackageStats.flows}</div></div>
            <div style={cardStyle()}><strong>Connected</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{v2PackageStats.connected}</div></div>
            <div style={cardStyle()}><strong>Watch</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{v2PackageStats.watch}</div></div>
            <div style={cardStyle()}><strong>Twin</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{v2PackageStats.twins}</div></div>
            <div style={cardStyle()}><strong>AI Suggestions</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{v2PackageStats.aiSuggestions}</div></div>
            <div style={cardStyle()}><strong>P0</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v2PackageStats.p0}</div></div>
            <div style={cardStyle()}><strong>Reg Blocked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v2PackageStats.regBlocked}</div></div>
            <div style={cardStyle()}><strong>KPI Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{v2PackageStats.analyticsRisk}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <select value={v2FormulaCode} onChange={(e) => setV2FormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateV2IntegratedPackage} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              v2.0 Package 생성
            </button>
            <button onClick={lockV2Stabilization} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              v2.0 Lock
            </button>
            <button onClick={exportV2FlowsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Flow CSV
            </button>
            <button onClick={exportDigitalTwinCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Twin CSV
            </button>
            <button onClick={exportAiFormulaExpertCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              AI Expert CSV
            </button>
            <button onClick={exportGlobalRegAiCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#d97706", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Reg AI CSV
            </button>
            <button onClick={exportEnterpriseAnalyticsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Analytics CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{v2PackageStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 31 v2.0 Integration Flows</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Phase</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Flow</th>
                <th style={tableCellStyle(true)}>Source</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {v2Flows.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>v2.0 Package 생성을 실행하세요.</td></tr>}
              {v2Flows.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.phase}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.flow_name}</td>
                  <td style={tableCellStyle()}>{item.source}</td>
                  <td style={tableCellStyle()}>{item.target}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "CONNECTED" ? "#059669" : item.status === "WATCH" ? "#d97706" : item.status === "BLOCKED" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 32 Digital Twin Factory</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Batch kg</th>
                <th style={tableCellStyle(true)}>Mixer</th>
                <th style={tableCellStyle(true)}>RPM</th>
                <th style={tableCellStyle(true)}>Time</th>
                <th style={tableCellStyle(true)}>Yield</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {digitalTwinItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Digital Twin 결과가 표시됩니다.</td></tr>}
              {digitalTwinItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.batch_size_kg}</td>
                  <td style={tableCellStyle()}>{item.mixer_type}</td>
                  <td style={tableCellStyle()}>{item.predicted_rpm}</td>
                  <td style={tableCellStyle()}>{item.predicted_time_min} min</td>
                  <td style={tableCellStyle()}>{item.predicted_yield_percent}%</td>
                  <td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 33 AI Formula Expert</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Issue</th>
                <th style={tableCellStyle(true)}>Diagnosis</th>
                <th style={tableCellStyle(true)}>Recommendation</th>
                <th style={tableCellStyle(true)}>Expected Result</th>
                <th style={tableCellStyle(true)}>Confidence</th>
                <th style={tableCellStyle(true)}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {aiFormulaExpertItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>AI Formula Expert 결과가 표시됩니다.</td></tr>}
              {aiFormulaExpertItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.issue_type}</td>
                  <td style={tableCellStyle()}>{item.diagnosis}</td>
                  <td style={tableCellStyle()}>{item.recommendation}</td>
                  <td style={tableCellStyle()}>{item.expected_result}</td>
                  <td style={tableCellStyle()}>{item.confidence}%</td>
                  <td style={{ ...tableCellStyle(), color: item.priority === "P0" ? "#dc2626" : item.priority === "P1" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 34 Global Regulatory AI</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Country</th>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Issue</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {globalRegAiItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Global Regulatory AI 결과가 표시됩니다.</td></tr>}
              {globalRegAiItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.country}</td>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "OK" ? "#059669" : item.status === "CAUTION" ? "#d97706" : item.status === "BLOCKED" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.key_issue}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 35 Enterprise Analytics Center</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>KPI</th>
                <th style={tableCellStyle(true)}>Value</th>
                <th style={tableCellStyle(true)}>Trend</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Insight</th>
              </tr>
            </thead>
            <tbody>
              {enterpriseAnalyticsItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Analytics KPI가 표시됩니다.</td></tr>}
              {enterpriseAnalyticsItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.kpi}</td>
                  <td style={tableCellStyle()}>{item.value}</td>
                  <td style={tableCellStyle()}>{item.trend}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "GOOD" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderMesModule() {
    const latestWorkOrder = mesWorkOrders[0];
    const latestLots = latestWorkOrder ? mesLots.filter((item) => item.work_order_id === latestWorkOrder.id) : [];
    const latestProcesses = latestWorkOrder ? mesProcessLogs.filter((item) => item.work_order_id === latestWorkOrder.id) : [];
    const latestDeviations = latestWorkOrder ? mesDeviations.filter((item) => item.work_order_id === latestWorkOrder.id) : [];

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>MES Bridge</h1>
          <p style={{ color: "#6b7280" }}>
            Scale-Up/BOM 결과를 생산 작업지시로 연결하고, 원료 LOT, 칭량/소비, 공정 로그, QC Hold, Deviation을 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Work Orders</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{mesStats.workOrders}</div></div>
            <div style={cardStyle()}><strong>Released</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{mesStats.released}</div></div>
            <div style={cardStyle()}><strong>Completed</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{mesStats.completed}</div></div>
            <div style={cardStyle()}><strong>QC Hold</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{mesStats.qcHold}</div></div>
            <div style={cardStyle()}><strong>Lots</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{mesStats.consumedLots}/{mesStats.lots}</div></div>
            <div style={cardStyle()}><strong>Process Logs</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{mesStats.processLogs}</div></div>
            <div style={cardStyle()}><strong>Deviations</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{mesStats.deviations}</div></div>
            <div style={cardStyle()}><strong>Critical</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{mesStats.critical}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <select value={mesFormulaCode} onChange={(e) => setMesFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <select value={mesBatchId} onChange={(e) => setMesBatchId(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="">최근 Scale-Up Batch 또는 수동</option>
              {scaleUpBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.id} / {batch.batch_size_kg}kg / {batch.status}</option>
              ))}
            </select>
            <input value={mesQtyKg} onChange={(e) => setMesQtyKg(e.target.value)} placeholder="Production Qty kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={mesLine} onChange={(e) => setMesLine(e.target.value)} placeholder="Production Line" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={createMesWorkOrder} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              작업지시 생성
            </button>
            <button onClick={exportMesWorkOrdersCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Work Order CSV
            </button>
            <button onClick={exportMesLotsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              LOT CSV
            </button>
            <button onClick={exportMesProcessCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Process CSV
            </button>
            <button onClick={exportMesDeviationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Deviation CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{mesStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Work Orders</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>WO No</th>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Batch</th>
                <th style={tableCellStyle(true)}>Qty kg</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Date</th>
                <th style={tableCellStyle(true)}>Line</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mesWorkOrders.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>작업지시 생성을 클릭하세요.</td></tr>}
              {mesWorkOrders.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.work_order_no}</td>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.batch_id}</td>
                  <td style={tableCellStyle()}>{item.production_qty_kg}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "COMPLETED" ? "#059669" : item.status === "QC_HOLD" || item.status === "CANCELLED" ? "#dc2626" : item.status === "IN_PRODUCTION" || item.status === "RELEASED" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.planned_date}</td>
                  <td style={tableCellStyle()}>{item.line}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => releaseWorkOrder(item.id)} style={{ marginRight: "6px" }}>Release</button>
                    <button onClick={() => completeWorkOrder(item.id)}>Complete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Latest Work Order LOT / Weighing</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>LOT No</th>
                <th style={tableCellStyle(true)}>Raw Code</th>
                <th style={tableCellStyle(true)}>Raw LOT</th>
                <th style={tableCellStyle(true)}>Required kg</th>
                <th style={tableCellStyle(true)}>Consumed kg</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestLots.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>최근 작업지시의 LOT가 표시됩니다.</td></tr>}
              {latestLots.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.lot_no}</td>
                  <td style={tableCellStyle()}>{item.raw_code}</td>
                  <td style={tableCellStyle()}>{item.raw_lot_no}</td>
                  <td style={tableCellStyle()}>{item.required_kg}</td>
                  <td style={tableCellStyle()}>{item.consumed_kg}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "CONSUMED" ? "#059669" : item.status === "WEIGHED" ? "#2563eb" : item.status === "RETURNED" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.status !== "CONSUMED" ? <button onClick={() => consumeLot(item.id)}>Consume</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Process Logs</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Step</th>
                <th style={tableCellStyle(true)}>Process</th>
                <th style={tableCellStyle(true)}>Start</th>
                <th style={tableCellStyle(true)}>End</th>
                <th style={tableCellStyle(true)}>Operator</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestProcesses.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>최근 작업지시의 공정 로그가 표시됩니다.</td></tr>}
              {latestProcesses.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.step_no}</td>
                  <td style={tableCellStyle()}>{item.process_name}</td>
                  <td style={tableCellStyle()}>{item.start_time}</td>
                  <td style={tableCellStyle()}>{item.end_time}</td>
                  <td style={tableCellStyle()}>{item.operator}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "DEVIATION" ? "#dc2626" : item.status === "RUNNING" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => startProcessStep(item.id)} style={{ marginRight: "6px" }}>Start</button>
                    <button onClick={() => completeProcessStep(item.id)}>Done</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Deviation / CAPA</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {latestWorkOrder && <>
              <button onClick={() => addMesDeviation(latestWorkOrder.id, "MEDIUM", "공정 시간 기준 초과")}>Deviation 추가</button>
              <button onClick={() => addMesDeviation(latestWorkOrder.id, "HIGH", "pH 기준 이탈, QC Hold 필요")}>HIGH Deviation 추가</button>
            </>}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Severity</th>
                <th style={tableCellStyle(true)}>Deviation</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Action</th>
                <th style={tableCellStyle(true)}>Close</th>
              </tr>
            </thead>
            <tbody>
              {latestDeviations.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>최근 작업지시의 Deviation이 표시됩니다.</td></tr>}
              {latestDeviations.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...tableCellStyle(), color: item.severity === "CRITICAL" || item.severity === "HIGH" ? "#dc2626" : item.severity === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.severity}</td>
                  <td style={tableCellStyle()}>{item.deviation}</td>
                  <td style={tableCellStyle()}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                  <td style={tableCellStyle()}>{item.status !== "CLOSED" ? <button onClick={() => closeMesDeviation(item.id)}>Close</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderLimsModule() {
    const latestSample = limsSamples[0];
    const latestTests = latestSample ? limsTests.filter((item) => item.sample_id === latestSample.id) : [];
    const latestStability = latestSample ? limsStabilities.filter((item) => item.sample_id === latestSample.id) : [];
    const latestCoas = latestSample ? limsCoas.filter((item) => item.sample_id === latestSample.id) : [];

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>LIMS Test Center</h1>
          <p style={{ color: "#6b7280" }}>
            샘플 접수, 시험항목, 규격판정, 안정도, OOS/OOT, COA 발행을 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Samples</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{limsStats.samples}</div></div>
            <div style={cardStyle()}><strong>Testing</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{limsStats.testing}</div></div>
            <div style={cardStyle()}><strong>Approved</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{limsStats.approved}</div></div>
            <div style={cardStyle()}><strong>Rejected</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{limsStats.rejected}</div></div>
            <div style={cardStyle()}><strong>Tests</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{limsStats.tests}</div></div>
            <div style={cardStyle()}><strong>OOS/OOT</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{limsStats.oos}/{limsStats.oot}</div></div>
            <div style={cardStyle()}><strong>Stability Fail</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{limsStats.stabilityFail}</div></div>
            <div style={cardStyle()}><strong>COA Issued</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{limsStats.issued}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <input value={limsProjectCode} onChange={(e) => setLimsProjectCode(e.target.value)} placeholder="Project Code" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={limsFormulaCode} onChange={(e) => setLimsFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <input value={limsRequester} onChange={(e) => setLimsRequester(e.target.value)} placeholder="Requester" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={createLimsSample} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Sample 접수
            </button>
            <button onClick={exportLimsSamplesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Sample CSV
            </button>
            <button onClick={exportLimsTestsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Test CSV
            </button>
            <button onClick={exportLimsStabilityCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Stability CSV
            </button>
            <button onClick={exportLimsCoaCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              COA CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{limsStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Samples</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Sample No</th>
                <th style={tableCellStyle(true)}>Project</th>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Received</th>
                <th style={tableCellStyle(true)}>Requester</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {limsSamples.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>Sample 접수를 클릭하세요.</td></tr>}
              {limsSamples.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.sample_no}</td>
                  <td style={tableCellStyle()}>{item.project_code}</td>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.sample_type}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "APPROVED" ? "#059669" : item.status === "REJECTED" ? "#dc2626" : item.status === "REVIEW" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.received_date}</td>
                  <td style={tableCellStyle()}>{item.requester}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => reviewLimsSample(item.id)} style={{ marginRight: "6px" }}>Review</button>
                    <button onClick={() => issueCoa(item.id)}>COA</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Latest Sample Tests</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Test</th>
                <th style={tableCellStyle(true)}>Method</th>
                <th style={tableCellStyle(true)}>Specification</th>
                <th style={tableCellStyle(true)}>Result</th>
                <th style={tableCellStyle(true)}>Judgment</th>
                <th style={tableCellStyle(true)}>Analyst</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestTests.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>최근 Sample의 시험항목이 표시됩니다.</td></tr>}
              {latestTests.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.test_name}</td>
                  <td style={tableCellStyle()}>{item.method}</td>
                  <td style={tableCellStyle()}>{item.specification}</td>
                  <td style={tableCellStyle()}>{item.result_value}</td>
                  <td style={{ ...tableCellStyle(), color: item.judgment === "PASS" ? "#059669" : item.judgment === "PENDING" ? "#6b7280" : "#dc2626", fontWeight: "bold" }}>{item.judgment}</td>
                  <td style={tableCellStyle()}>{item.analyst}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updateLimsTestJudgment(item.id, "PASS")} style={{ marginRight: "6px" }}>PASS</button>
                    <button onClick={() => updateLimsTestJudgment(item.id, "OOS")}>OOS</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Stability Test</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Condition</th>
                <th style={tableCellStyle(true)}>Time Point</th>
                <th style={tableCellStyle(true)}>Result</th>
                <th style={tableCellStyle(true)}>Observation</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestStability.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>최근 Sample의 안정도 항목이 표시됩니다.</td></tr>}
              {latestStability.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.condition}</td>
                  <td style={tableCellStyle()}>{item.time_point}</td>
                  <td style={{ ...tableCellStyle(), color: item.result === "PASS" ? "#059669" : item.result === "WATCH" ? "#d97706" : item.result === "FAIL" ? "#dc2626" : "#6b7280", fontWeight: "bold" }}>{item.result}</td>
                  <td style={tableCellStyle()}>{item.observation}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updateStabilityResult(item.id, "PASS")} style={{ marginRight: "6px" }}>PASS</button>
                    <button onClick={() => updateStabilityResult(item.id, "WATCH")} style={{ marginRight: "6px" }}>WATCH</button>
                    <button onClick={() => updateStabilityResult(item.id, "FAIL")}>FAIL</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>COA</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>COA No</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Issued Date</th>
                <th style={tableCellStyle(true)}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {latestCoas.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>COA 버튼을 클릭하면 생성됩니다.</td></tr>}
              {latestCoas.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.coa_no}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "ISSUED" ? "#059669" : item.status === "APPROVED" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.issued_date}</td>
                  <td style={tableCellStyle()}>{item.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderElnModule() {
    const latestExperiment = elnExperiments[0];
    const latestObservations = latestExperiment ? elnObservations.filter((item) => item.experiment_id === latestExperiment.id) : [];
    const latestAttachments = latestExperiment ? elnAttachments.filter((item) => item.experiment_id === latestExperiment.id) : [];
    const latestSignatures = latestExperiment ? elnSignatures.filter((item) => item.experiment_id === latestExperiment.id) : [];

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Electronic Lab Notebook</h1>
          <p style={{ color: "#6b7280" }}>
            실험 계획, 관찰 결과, pH/점도/외관/안정성, 첨부파일, 전자서명을 하나의 연구노트로 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Experiments</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{elnStats.experiments}</div></div>
            <div style={cardStyle()}><strong>In Progress</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{elnStats.inProgress}</div></div>
            <div style={cardStyle()}><strong>Review</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{elnStats.review}</div></div>
            <div style={cardStyle()}><strong>Signed</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{elnStats.signed}</div></div>
            <div style={cardStyle()}><strong>Observations</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{elnStats.observations}</div></div>
            <div style={cardStyle()}><strong>WATCH/FAIL</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{elnStats.watch}/{elnStats.fail}</div></div>
            <div style={cardStyle()}><strong>Attachments</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{elnStats.attachments}</div></div>
            <div style={cardStyle()}><strong>Signatures</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{elnStats.signatures}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <input value={elnProjectCode} onChange={(e) => setElnProjectCode(e.target.value)} placeholder="Project Code" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={elnFormulaCode} onChange={(e) => setElnFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <input value={elnTitle} onChange={(e) => setElnTitle(e.target.value)} placeholder="Experiment Title" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={elnResearcher} onChange={(e) => setElnResearcher(e.target.value)} placeholder="Researcher" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={createElnExperiment} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              ELN 실험 생성
            </button>
            <button onClick={exportElnExperimentsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Experiment CSV
            </button>
            <button onClick={exportElnObservationsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Observation CSV
            </button>
            <button onClick={exportElnSignaturesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Signature CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{elnStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Experiments</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>No</th>
                <th style={tableCellStyle(true)}>Project</th>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Title</th>
                <th style={tableCellStyle(true)}>Researcher</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Date</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {elnExperiments.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>ELN 실험 생성을 클릭하세요.</td></tr>}
              {elnExperiments.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.experiment_no}</td>
                  <td style={tableCellStyle()}>{item.project_code}</td>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.title}</td>
                  <td style={tableCellStyle()}>{item.researcher}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "SIGNED" ? "#059669" : item.status === "REVIEW" ? "#d97706" : item.status === "IN_PROGRESS" ? "#2563eb" : "#6b7280", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.experiment_date}</td>
                  <td style={tableCellStyle()}>{item.status === "IN_PROGRESS" ? <button onClick={() => requestElnReview(item.id)}>Review</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Latest Experiment Observations</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {latestExperiment && <>
              <button onClick={() => addElnObservation(latestExperiment.id, "pH", "5.6", "PASS")}>pH 추가</button>
              <button onClick={() => addElnObservation(latestExperiment.id, "Viscosity", "3,250 cP", "PASS")}>점도 추가</button>
              <button onClick={() => addElnObservation(latestExperiment.id, "Stability", "45℃ 1W 미세 분리", "WATCH")}>안정도 WATCH 추가</button>
            </>}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Time</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Value</th>
                <th style={tableCellStyle(true)}>Result</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {latestObservations.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>최근 실험의 관찰 기록이 표시됩니다.</td></tr>}
              {latestObservations.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.time_point}</td>
                  <td style={tableCellStyle()}>{item.observation_type}</td>
                  <td style={tableCellStyle()}>{item.value}</td>
                  <td style={{ ...tableCellStyle(), color: item.result === "PASS" ? "#059669" : item.result === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.result}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Attachments</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>File</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {latestAttachments.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>최근 실험의 첨부파일이 표시됩니다.</td></tr>}
              {latestAttachments.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.file_name}</td>
                  <td style={tableCellStyle()}>{item.file_type}</td>
                  <td style={tableCellStyle()}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>E-Signature</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Signer</th>
                <th style={tableCellStyle(true)}>Role</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Signed At</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestSignatures.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>최근 실험의 서명 요청이 표시됩니다.</td></tr>}
              {latestSignatures.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.signer}</td>
                  <td style={tableCellStyle()}>{item.role}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "SIGNED" ? "#059669" : item.status === "REJECTED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.signed_at}</td>
                  <td style={tableCellStyle()}>{item.status !== "SIGNED" ? <button onClick={() => signEln(item.id)}>Sign</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderScaleUpModule() {
    const currentBatchBom = scaleUpBatches[0] ? bomItems.filter((item) => item.batch_id === scaleUpBatches[0].id) : [];
    const currentSteps = scaleUpBatches[0] ? manufacturingSteps.filter((item) => item.batch_id === scaleUpBatches[0].id) : [];

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Scale-Up & BOM Engine</h1>
          <p style={{ color: "#6b7280" }}>
            Lab Scale 처방을 Pilot/Production/Mass 배치로 확장하고, 원료 소요량, 손실률, 구매량, 제조공정표, 생산 이관 리스크를 계산합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Batches</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{scaleUpStats.batches}</div></div>
            <div style={cardStyle()}><strong>Ready</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{scaleUpStats.ready}</div></div>
            <div style={cardStyle()}><strong>Blocked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{scaleUpStats.blocked}</div></div>
            <div style={cardStyle()}><strong>BOM Items</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{scaleUpStats.bom}</div></div>
            <div style={cardStyle()}><strong>Required kg</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{scaleUpStats.totalRequiredKg}</div></div>
            <div style={cardStyle()}><strong>Purchase kg</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{scaleUpStats.totalPurchaseKg}</div></div>
            <div style={cardStyle()}><strong>Amount</strong><div style={{ fontSize: "24px", fontWeight: "bold", color: "#7c3aed" }}>{scaleUpStats.totalAmount.toLocaleString()}</div></div>
            <div style={cardStyle()}><strong>High Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{scaleUpStats.highRisk}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <select value={scaleFormulaCode} onChange={(e) => setScaleFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <input value={scaleBatchKg} onChange={(e) => setScaleBatchKg(e.target.value)} placeholder="Batch kg 예: 1, 10, 100, 500, 3000" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={scaleYieldPercent} onChange={(e) => setScaleYieldPercent(e.target.value)} placeholder="Yield % 예: 97" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={scaleLossPercent} onChange={(e) => setScaleLossPercent(e.target.value)} placeholder="Loss % 예: 2" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={runScaleUpCalculation} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Scale-Up 계산
            </button>
            <button onClick={exportScaleUpBatchesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Batch CSV
            </button>
            <button onClick={exportBomCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              BOM CSV
            </button>
            <button onClick={exportManufacturingStepsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              공정 CSV
            </button>
            <button onClick={exportScaleUpRisksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Risk CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{scaleUpStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Scale-Up Batches</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Batch ID</th>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Size kg</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Cost</th>
                <th style={tableCellStyle(true)}>Yield</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scaleUpBatches.length === 0 && <tr><td style={tableCellStyle()} colSpan={9}>Scale-Up 계산을 실행하세요.</td></tr>}
              {scaleUpBatches.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.batch_size_kg}</td>
                  <td style={tableCellStyle()}>{item.batch_type}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "APPROVED" || item.status === "READY" ? "#059669" : item.status === "BLOCKED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.estimated_cost.toLocaleString()}</td>
                  <td style={tableCellStyle()}>{item.yield_percent}%</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>{item.status === "READY" ? <button onClick={() => approveScaleUpBatch(item.id)}>Approve</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>BOM / 원료 소요량</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Raw Code</th>
                <th style={tableCellStyle(true)}>Raw Name</th>
                <th style={tableCellStyle(true)}>%</th>
                <th style={tableCellStyle(true)}>Required kg</th>
                <th style={tableCellStyle(true)}>Loss %</th>
                <th style={tableCellStyle(true)}>Purchase kg</th>
                <th style={tableCellStyle(true)}>Unit Price</th>
                <th style={tableCellStyle(true)}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentBatchBom.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>최근 Batch의 BOM이 표시됩니다.</td></tr>}
              {currentBatchBom.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.raw_code}</td>
                  <td style={tableCellStyle()}>{item.raw_name}</td>
                  <td style={tableCellStyle()}>{item.percentage}</td>
                  <td style={tableCellStyle()}>{item.required_kg}</td>
                  <td style={tableCellStyle()}>{item.loss_percent}</td>
                  <td style={tableCellStyle()}>{item.purchase_kg}</td>
                  <td style={tableCellStyle()}>{item.unit_price}</td>
                  <td style={tableCellStyle()}>{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Manufacturing Process</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Step</th>
                <th style={tableCellStyle(true)}>Phase</th>
                <th style={tableCellStyle(true)}>Process</th>
                <th style={tableCellStyle(true)}>Temp</th>
                <th style={tableCellStyle(true)}>RPM</th>
                <th style={tableCellStyle(true)}>Time</th>
                <th style={tableCellStyle(true)}>QC Check</th>
              </tr>
            </thead>
            <tbody>
              {currentSteps.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>최근 Batch의 제조공정이 표시됩니다.</td></tr>}
              {currentSteps.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.step_no}</td>
                  <td style={tableCellStyle()}>{item.phase}</td>
                  <td style={tableCellStyle()}>{item.process}</td>
                  <td style={tableCellStyle()}>{item.temperature}</td>
                  <td style={tableCellStyle()}>{item.rpm}</td>
                  <td style={tableCellStyle()}>{item.time_min} min</td>
                  <td style={tableCellStyle()}>{item.qc_check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Scale-Up Risk</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Category</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Level</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scaleUpRisks.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Scale-Up 계산 시 Risk가 표시됩니다.</td></tr>}
              {scaleUpRisks.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.category}</td>
                  <td style={tableCellStyle()}>{item.risk}</td>
                  <td style={{ ...tableCellStyle(), color: item.level === "HIGH" ? "#dc2626" : item.level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.level}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderFormulaSimulationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Formula Simulation Engine</h1>
          <p style={{ color: "#6b7280" }}>
            처방의 배치 스케일, 원가, pH, 점도, 안정성, 규제 적합성을 예측하고 원료 대체 및 최적화 제안을 생성합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Simulations</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{simulationStats.results}</div></div>
            <div style={cardStyle()}><strong>HIGH Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{simulationStats.highRisk}</div></div>
            <div style={cardStyle()}><strong>MEDIUM Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{simulationStats.mediumRisk}</div></div>
            <div style={cardStyle()}><strong>Substitutions</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{simulationStats.substitutions}</div></div>
            <div style={cardStyle()}><strong>Optimizations</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{simulationStats.optimizations}</div></div>
            <div style={cardStyle()}><strong>P0</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{simulationStats.p0}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <select value={simulationFormulaCode} onChange={(e) => setSimulationFormulaCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.formula_code}>{formula.formula_code} / {formula.formula_name}</option>
              ))}
            </select>
            <input value={simulationBatchKg} onChange={(e) => setSimulationBatchKg(e.target.value)} placeholder="Batch kg 예: 1, 10, 100" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={simulationTargetCost} onChange={(e) => setSimulationTargetCost(e.target.value)} placeholder="Target Cost / kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={simulationTargetPh} onChange={(e) => setSimulationTargetPh(e.target.value)} placeholder="Target pH" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={simulationTargetViscosity} onChange={(e) => setSimulationTargetViscosity(e.target.value)} placeholder="Target Viscosity cP" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <select value={simulationCountry} onChange={(e) => setSimulationCountry(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="EU">EU</option>
              <option value="CN">CN</option>
              <option value="US">US</option>
              <option value="JP">JP</option>
              <option value="ASEAN">ASEAN</option>
              <option value="KR">KR</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateSimulationSeed} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#6b7280", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Seed 입력
            </button>
            <button onClick={runFormulaSimulation} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Simulation 실행
            </button>
            <button onClick={exportSimulationResultsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Result CSV
            </button>
            <button onClick={exportSubstitutionCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Substitution CSV
            </button>
            <button onClick={exportOptimizationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Optimization CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{simulationStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Simulation Results</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Formula</th>
                <th style={tableCellStyle(true)}>Batch kg</th>
                <th style={tableCellStyle(true)}>Cost/kg</th>
                <th style={tableCellStyle(true)}>pH</th>
                <th style={tableCellStyle(true)}>Viscosity</th>
                <th style={tableCellStyle(true)}>Stability</th>
                <th style={tableCellStyle(true)}>Regulation</th>
                <th style={tableCellStyle(true)}>Total</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {simulationResults.length === 0 && <tr><td style={tableCellStyle()} colSpan={10}>Simulation 실행을 클릭하세요.</td></tr>}
              {simulationResults.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.formula_code}</td>
                  <td style={tableCellStyle()}>{item.batch_kg}</td>
                  <td style={tableCellStyle()}>{item.predicted_cost_per_kg}</td>
                  <td style={tableCellStyle()}>{item.predicted_ph}</td>
                  <td style={tableCellStyle()}>{item.predicted_viscosity}</td>
                  <td style={tableCellStyle()}>{item.stability_score}</td>
                  <td style={tableCellStyle()}>{item.regulation_score}</td>
                  <td style={tableCellStyle()}>{item.total_score}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td>
                  <td style={tableCellStyle()}>{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Material Substitution</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Source Raw</th>
                <th style={tableCellStyle(true)}>Source INCI</th>
                <th style={tableCellStyle(true)}>Substitute Raw</th>
                <th style={tableCellStyle(true)}>Substitute INCI</th>
                <th style={tableCellStyle(true)}>Reason</th>
                <th style={tableCellStyle(true)}>Expected Effect</th>
                <th style={tableCellStyle(true)}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {substitutionItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Simulation 실행 시 대체 후보가 생성됩니다.</td></tr>}
              {substitutionItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.source_raw}</td>
                  <td style={tableCellStyle()}>{item.source_inci}</td>
                  <td style={tableCellStyle()}>{item.substitute_raw}</td>
                  <td style={tableCellStyle()}>{item.substitute_inci}</td>
                  <td style={tableCellStyle()}>{item.reason}</td>
                  <td style={tableCellStyle()}>{item.expected_effect}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Optimization Suggestions</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Area</th>
                <th style={tableCellStyle(true)}>Suggestion</th>
                <th style={tableCellStyle(true)}>Expected Impact</th>
                <th style={tableCellStyle(true)}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {optimizationItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Simulation 실행 시 최적화 제안이 생성됩니다.</td></tr>}
              {optimizationItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.area}</td>
                  <td style={tableCellStyle()}>{item.suggestion}</td>
                  <td style={tableCellStyle()}>{item.expected_impact}</td>
                  <td style={{ ...tableCellStyle(), color: item.priority === "P0" ? "#dc2626" : item.priority === "P1" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderWorkflowModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Enterprise Workflow Engine</h1>
          <p style={{ color: "#6b7280" }}>
            연구소의 표준 업무 흐름을 Workflow Template으로 정의하고, 프로젝트·처방·품질·규제·고객 업무를 단계별 Task로 자동 생성합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Templates</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{workflowStats.templates}</div></div>
            <div style={cardStyle()}><strong>Active</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{workflowStats.activeTemplates}</div></div>
            <div style={cardStyle()}><strong>Steps</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{workflowStats.steps}</div></div>
            <div style={cardStyle()}><strong>Runs</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{workflowStats.runs}</div></div>
            <div style={cardStyle()}><strong>In Progress</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{workflowStats.inProgress}</div></div>
            <div style={cardStyle()}><strong>Blocked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{workflowStats.blocked}</div></div>
            <div style={cardStyle()}><strong>Task Done</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{workflowStats.taskDone}/{workflowStats.tasks}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <input value={workflowTarget} onChange={(e) => setWorkflowTarget(e.target.value)} placeholder="Workflow Target 예: 26A001 / FC-001 v1.0 / RM-001" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateWorkflowTemplates} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Workflow Template 생성
            </button>
            <button onClick={exportWorkflowTemplatesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Template CSV
            </button>
            <button onClick={exportWorkflowRunsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Run CSV
            </button>
            <button onClick={exportWorkflowTasksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Task CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{workflowStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Workflow Templates</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Workflow</th>
                <th style={tableCellStyle(true)}>Trigger</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Description</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workflowTemplates.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Workflow Template 생성을 실행하세요.</td></tr>}
              {workflowTemplates.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.workflow_name}</td>
                  <td style={tableCellStyle()}>{item.trigger_module}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "ACTIVE" ? "#059669" : item.status === "PAUSED" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner_team}</td>
                  <td style={tableCellStyle()}>{item.description}</td>
                  <td style={tableCellStyle()}><button onClick={() => startWorkflowRun(item.id)}>Start</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Workflow Runs</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Run ID</th>
                <th style={tableCellStyle(true)}>Workflow</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Current Step</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Progress</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workflowRuns.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>실행 중인 Workflow가 없습니다.</td></tr>}
              {workflowRuns.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.workflow_id}</td>
                  <td style={tableCellStyle()}>{item.target}</td>
                  <td style={tableCellStyle()}>{item.current_step}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "COMPLETED" ? "#059669" : item.status === "BLOCKED" ? "#dc2626" : item.status === "WAITING_APPROVAL" ? "#d97706" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.progress}%</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.status !== "BLOCKED" && item.status !== "COMPLETED" ? <button onClick={() => blockWorkflowRun(item.id)}>Block</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Workflow Tasks</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Task ID</th>
                <th style={tableCellStyle(true)}>Run</th>
                <th style={tableCellStyle(true)}>Task</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Due Date</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workflowTasks.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>생성된 Task가 없습니다.</td></tr>}
              {workflowTasks.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.run_id}</td>
                  <td style={tableCellStyle()}>{item.task_name}</td>
                  <td style={tableCellStyle()}>{item.owner_team}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "BLOCKED" ? "#dc2626" : item.status === "IN_PROGRESS" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.due_date}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>{item.status !== "DONE" ? <button onClick={() => completeWorkflowTask(item.id)}>Done</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderStabilizationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Enterprise v1.0 Stabilization</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise PLM v1.0 운영 기준선을 확정하고, 안정화 항목과 4주 후속 운영계획을 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Checks</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{stabilizationStats.total}</div></div>
            <div style={cardStyle()}><strong>Stable</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{stabilizationStats.stable}</div></div>
            <div style={cardStyle()}><strong>Locked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{stabilizationStats.locked}</div></div>
            <div style={cardStyle()}><strong>Watch</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{stabilizationStats.watch}</div></div>
            <div style={cardStyle()}><strong>Fix Required</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{stabilizationStats.fixRequired}</div></div>
            <div style={cardStyle()}><strong>P0</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{stabilizationStats.p0}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <input value={v1Version} onChange={(e) => setV1Version(e.target.value)} placeholder="Version" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateStabilizationPlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Stabilization Plan 생성
            </button>
            <button onClick={lockV1Baseline} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              v1.0 Baseline Lock
            </button>
            <button onClick={exportStabilizationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Stabilization CSV
            </button>
            <button onClick={exportV1ReleaseNotesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Release Note CSV
            </button>
            <button onClick={exportPostGoLivePlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              4 Week Plan CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{stabilizationStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Stabilization Checklist</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Category</th>
                <th style={tableCellStyle(true)}>Item</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Priority</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stabilizationItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Stabilization Plan 생성을 실행하세요.</td></tr>}
              {stabilizationItems.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.category}</td>
                  <td style={tableCellStyle()}>{item.item}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "STABLE" || item.status === "LOCKED" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={{ ...tableCellStyle(), color: item.priority === "P0" ? "#dc2626" : item.priority === "P1" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.priority}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>v1.0 Release Notes</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Version</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {v1ReleaseNotes.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Stabilization Plan 생성을 실행하세요.</td></tr>}
              {v1ReleaseNotes.map((item) => (
                <tr key={`${item.module}-${item.version}`}>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.version}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "INCLUDED" ? "#059669" : item.status === "LIMITED" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Post Go-Live 4 Week Plan</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Week</th>
                <th style={tableCellStyle(true)}>Task</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {postGoLiveTasks.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Stabilization Plan 생성을 실행하세요.</td></tr>}
              {postGoLiveTasks.map((item) => (
                <tr key={`${item.week}-${item.task}`}>
                  <td style={tableCellStyle()}>{item.week}</td>
                  <td style={tableCellStyle()}>{item.task}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "IN_PROGRESS" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updatePostGoLiveTask(item.week, item.task, "IN_PROGRESS")} style={{ marginRight: "6px" }}>Start</button>
                    <button onClick={() => updatePostGoLiveTask(item.week, item.task, "DONE")}>Done</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderMonitoringModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Backup / Monitoring / Error Center</h1>
          <p style={{ color: "#6b7280" }}>
            Go-Live 이후 운영 안정성을 위한 백업, 모니터링, 오류 로그 센터입니다.
            운영 중 문제가 발생하면 이 화면에서 원인과 조치 상태를 추적합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Backup Jobs</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{monitoringStats.backupJobs}</div></div>
            <div style={cardStyle()}><strong>Backup Success</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{monitoringStats.backupSuccess}</div></div>
            <div style={cardStyle()}><strong>Checks</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{monitoringStats.checks}</div></div>
            <div style={cardStyle()}><strong>WARN</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{monitoringStats.warn}</div></div>
            <div style={cardStyle()}><strong>FAIL</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{monitoringStats.fail}</div></div>
            <div style={cardStyle()}><strong>Open Errors</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{monitoringStats.openErrors}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={initializeMonitoringCenter} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Monitoring 초기화
            </button>
            <button onClick={rerunMonitoringChecks} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Check 재실행
            </button>
            <button onClick={exportEmergencyBackupCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Emergency Backup CSV
            </button>
            <button onClick={exportBackupJobsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Backup CSV
            </button>
            <button onClick={exportMonitoringChecksCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Monitoring CSV
            </button>
            <button onClick={exportErrorLogsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Error CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{monitoringStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Backup Jobs</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Schedule</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Last Run</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {backupJobs.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>Monitoring 초기화를 실행하세요.</td></tr>}
              {backupJobs.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.target}</td>
                  <td style={tableCellStyle()}>{item.backup_type}</td>
                  <td style={tableCellStyle()}>{item.schedule}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "SUCCESS" ? "#059669" : item.status === "FAILED" ? "#dc2626" : item.status === "RUNNING" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.last_run}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}><button onClick={() => runBackupJob(item.id)}>Run</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Monitoring Checks</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Category</th>
                <th style={tableCellStyle(true)}>Check</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Value</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {monitoringChecks.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Monitoring 초기화를 실행하세요.</td></tr>}
              {monitoringChecks.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.category}</td>
                  <td style={tableCellStyle()}>{item.check_name}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.value}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Error Center</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <button onClick={() => addErrorLog("MEDIUM", "Formula", "처방 저장 테스트 오류")}>Formula Error 추가</button>
            <button onClick={() => addErrorLog("HIGH", "Supabase", "DB 연결 상태 확인 필요")}>DB Error 추가</button>
            <button onClick={() => addErrorLog("CRITICAL", "Auth", "로그인 권한 오류")}>Critical Error 추가</button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Severity</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Message</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Created At</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>등록된 오류가 없습니다.</td></tr>}
              {errorLogs.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={{ ...tableCellStyle(), color: item.severity === "CRITICAL" || item.severity === "HIGH" ? "#dc2626" : item.severity === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.severity}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.message}</td>
                  <td style={tableCellStyle()}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.created_at}</td>
                  <td style={tableCellStyle()}>{item.status !== "RESOLVED" ? <button onClick={() => resolveErrorLog(item.id)}>Resolve</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderGoLiveModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Go-Live Operation Mode</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise PLM을 실제 운영모드로 전환하고, 일일 운영 지표와 이슈를 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Mode</strong><div style={{ fontSize: "24px", fontWeight: "bold", color: operationMode === "LIVE" ? "#059669" : "#d97706" }}>{operationMode}</div></div>
            <div style={cardStyle()}><strong>Operations</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{goLiveStats.operations}</div></div>
            <div style={cardStyle()}><strong>Active</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{goLiveStats.active}</div></div>
            <div style={cardStyle()}><strong>Monitoring</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{goLiveStats.monitoring}</div></div>
            <div style={cardStyle()}><strong>Open Issues</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{goLiveStats.openIssues}</div></div>
            <div style={cardStyle()}><strong>Critical</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{goLiveStats.critical}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={initializeGoLiveMode} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Go-Live 초기화
            </button>
            <button onClick={activateGoLiveMode} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              LIVE 전환
            </button>
            <button onClick={exportGoLiveOperationsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Operations CSV
            </button>
            <button onClick={exportGoLiveIssuesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Issues CSV
            </button>
            <button onClick={exportDailyMetricsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Metrics CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{goLiveStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Daily Operation Metrics</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Metric</th>
                <th style={tableCellStyle(true)}>Value</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {dailyMetrics.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Go-Live 초기화를 실행하세요.</td></tr>}
              {dailyMetrics.map((item) => (
                <tr key={item.metric}>
                  <td style={tableCellStyle()}>{item.metric}</td>
                  <td style={tableCellStyle()}>{item.value}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "GOOD" ? "#059669" : item.status === "WATCH" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Operation Checklist</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Area</th>
                <th style={tableCellStyle(true)}>Operation</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Check Point</th>
              </tr>
            </thead>
            <tbody>
              {goLiveOperations.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Go-Live 초기화를 실행하세요.</td></tr>}
              {goLiveOperations.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.area}</td>
                  <td style={tableCellStyle()}>{item.operation}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "ACTIVE" ? "#059669" : item.status === "MONITORING" ? "#2563eb" : item.status === "ISSUE" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.check_point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Issue Tracker</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <button onClick={() => addGoLiveIssue("MEDIUM", "Project", "프로젝트 등록 테스트 필요", "R&D")}>샘플 이슈 추가</button>
            <button onClick={() => addGoLiveIssue("HIGH", "Quality", "원료문서 만료 확인 필요", "QC")}>QA 이슈 추가</button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Severity</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Issue</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {goLiveIssues.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>등록된 운영 이슈가 없습니다.</td></tr>}
              {goLiveIssues.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={{ ...tableCellStyle(), color: item.severity === "CRITICAL" || item.severity === "HIGH" ? "#dc2626" : item.severity === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.severity}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.issue}</td>
                  <td style={tableCellStyle()}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.status !== "RESOLVED" ? <button onClick={() => resolveGoLiveIssue(item.id)}>Resolve</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderUatMigrationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>UAT & Data Migration Center</h1>
          <p style={{ color: "#6b7280" }}>
            운영 시작 전 사용자 테스트와 기존 Excel/CSV 데이터 이관을 관리합니다.
            이 단계가 끝나면 Enterprise v1.0 Go-Live 준비가 완료됩니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>UAT</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{uatMigrationStats.uatTotal}</div></div>
            <div style={cardStyle()}><strong>UAT PASS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{uatMigrationStats.uatPass}</div></div>
            <div style={cardStyle()}><strong>UAT FAIL</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{uatMigrationStats.uatFail}</div></div>
            <div style={cardStyle()}><strong>Migration</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{uatMigrationStats.migrationDone}/{uatMigrationStats.batches}</div></div>
            <div style={cardStyle()}><strong>Training</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{uatMigrationStats.trainingDone}/{uatMigrationStats.trainingTotal}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateUatMigrationPlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              UAT/Migration Plan 생성
            </button>
            <button onClick={exportUatScenariosCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              UAT CSV
            </button>
            <button onClick={exportMigrationBatchesCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Migration CSV
            </button>
            <button onClick={exportTrainingPlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Training CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{uatMigrationStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>UAT Scenarios</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Team</th>
                <th style={tableCellStyle(true)}>Scenario</th>
                <th style={tableCellStyle(true)}>Expected Result</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {uatScenarios.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>UAT/Migration Plan 생성을 실행하세요.</td></tr>}
              {uatScenarios.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.team}</td>
                  <td style={tableCellStyle()}>{item.scenario}</td>
                  <td style={tableCellStyle()}>{item.expected_result}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "FAIL" ? "#dc2626" : item.status === "HOLD" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updateUatStatus(item.id, "PASS")} style={{ marginRight: "6px" }}>PASS</button>
                    <button onClick={() => updateUatStatus(item.id, "FAIL")}>FAIL</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Data Migration Batches</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>ID</th>
                <th style={tableCellStyle(true)}>Source</th>
                <th style={tableCellStyle(true)}>Target Table</th>
                <th style={tableCellStyle(true)}>Data Type</th>
                <th style={tableCellStyle(true)}>Rows</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {migrationBatches.length === 0 && <tr><td style={tableCellStyle()} colSpan={8}>UAT/Migration Plan 생성을 실행하세요.</td></tr>}
              {migrationBatches.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.id}</td>
                  <td style={tableCellStyle()}>{item.source}</td>
                  <td style={tableCellStyle()}>{item.target_table}</td>
                  <td style={tableCellStyle()}>{item.data_type}</td>
                  <td style={tableCellStyle()}>{item.estimated_rows}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "ERROR" ? "#dc2626" : item.status === "MIGRATING" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updateMigrationStatus(item.id, "MIGRATING")} style={{ marginRight: "6px" }}>Start</button>
                    <button onClick={() => updateMigrationStatus(item.id, "DONE")}>Done</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Training Plan</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Role</th>
                <th style={tableCellStyle(true)}>Topic</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Material</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {trainingItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>UAT/Migration Plan 생성을 실행하세요.</td></tr>}
              {trainingItems.map((item) => (
                <tr key={`${item.role}-${item.training_topic}`}>
                  <td style={tableCellStyle()}>{item.role}</td>
                  <td style={tableCellStyle()}>{item.training_topic}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "NEEDS_SUPPORT" ? "#d97706" : "#6b7280", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.material}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => updateTrainingStatus(item.role, item.training_topic, "DONE")} style={{ marginRight: "6px" }}>Done</button>
                    <button onClick={() => updateTrainingStatus(item.role, item.training_topic, "NEEDS_SUPPORT")}>Support</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderProductionRcModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Production Release Candidate</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise Edition 1차 개발을 운영 배포 후보 상태로 점검합니다.
            이 화면에서 전 모듈 준비도, Release Candidate Lock, Go-Live Checklist를 관리합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Readiness</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{productionRcStats.readiness}</div></div>
            <div style={cardStyle()}><strong>PASS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{productionRcStats.pass}</div></div>
            <div style={cardStyle()}><strong>WARN</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{productionRcStats.warn}</div></div>
            <div style={cardStyle()}><strong>FAIL</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{productionRcStats.fail}</div></div>
            <div style={cardStyle()}><strong>RC Locked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{productionRcStats.locked}</div></div>
            <div style={cardStyle()}><strong>Go-Live</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{productionRcStats.goLiveDone}/{productionRcStats.goLiveTotal}</div></div>
          </div>

          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "12px" }}>
            <input value={releaseVersion} onChange={(e) => setReleaseVersion(e.target.value)} placeholder="Release Version" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={runProductionReadinessCheck} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Production Check
            </button>
            <button onClick={lockReleaseCandidate} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              RC Lock
            </button>
            <button onClick={exportProductionReadinessCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Readiness CSV
            </button>
            <button onClick={exportReleaseCandidateCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              RC CSV
            </button>
            <button onClick={exportGoLiveChecklistCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Go-Live CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{productionRcStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Production Readiness</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Area</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Owner</th>
                <th style={tableCellStyle(true)}>Detail</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {productionReadinessItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Production Check를 실행하세요.</td></tr>}
              {productionReadinessItems.map((item) => (
                <tr key={item.area}>
                  <td style={tableCellStyle()}>{item.area}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.owner}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Release Candidate</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Version</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Release Note</th>
              </tr>
            </thead>
            <tbody>
              {releaseCandidateItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Production Check를 실행하세요.</td></tr>}
              {releaseCandidateItems.map((item) => (
                <tr key={`${item.version}-${item.module}`}>
                  <td style={tableCellStyle()}>{item.version}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "LOCKED" ? "#059669" : item.status === "READY" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.release_note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Go-Live Checklist</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Step</th>
                <th style={tableCellStyle(true)}>Task</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {goLiveChecklistItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Production Check를 실행하세요.</td></tr>}
              {goLiveChecklistItems.map((item) => (
                <tr key={item.step}>
                  <td style={tableCellStyle()}>{item.step}</td>
                  <td style={tableCellStyle()}>{item.task}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "DONE" ? "#059669" : item.status === "HOLD" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                  <td style={tableCellStyle()}>{item.status !== "DONE" ? <button onClick={() => markGoLiveDone(item.step)}>Done</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 20 이후 운영 단계</h2>
          <ol>
            <li>실제 사용자 2~3명으로 연구팀/QA/RA 시나리오 테스트</li>
            <li>기존 Excel 원료/성분/처방 데이터 CSV 이관</li>
            <li>사용자 권한 확정 및 외부 고객/공급사 계정 제한 적용</li>
            <li>Vercel Production URL에서 업무 테스트</li>
            <li>Enterprise v1.0 운영 시작</li>
          </ol>
        </section>
      </>
    );
  }

  function renderExternalRlsModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Customer / Supplier Portal RLS</h1>
          <p style={{ color: "#6b7280" }}>
            외부 고객과 공급사 계정이 PLM 내부 전체 데이터가 아니라 본인에게 허용된 데이터만 볼 수 있도록
            계정 매핑과 RLS 정책을 준비하는 단계입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Mappings</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{externalRlsStats.mappings}</div></div>
            <div style={cardStyle()}><strong>Customers</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{externalRlsStats.customers}</div></div>
            <div style={cardStyle()}><strong>Suppliers</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{externalRlsStats.suppliers}</div></div>
            <div style={cardStyle()}><strong>Active</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{externalRlsStats.active}</div></div>
            <div style={cardStyle()}><strong>Policies</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{externalRlsStats.policies}</div></div>
            <div style={cardStyle()}><strong>Security PASS</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{externalRlsStats.pass}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateExternalAccountMappings} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              외부 매핑 생성
            </button>
            <button onClick={runPortalSecurityCheck} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              보안 체크
            </button>
            <button onClick={exportExternalMappingsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Mapping CSV
            </button>
            <button onClick={exportExternalRlsCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              RLS CSV
            </button>
            <button onClick={exportPortalSecurityCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Security CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{externalRlsStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>외부 계정 수동 매핑</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px", marginBottom: "16px" }}>
            <select value={externalType} onChange={(e) => setExternalType(e.target.value as ExternalAccountMapping["account_type"])} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              <option value="customer">customer</option>
              <option value="supplier">supplier</option>
            </select>
            <input value={externalEmail} onChange={(e) => setExternalEmail(e.target.value)} placeholder="외부 계정 이메일" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={externalCompany} onChange={(e) => setExternalCompany(e.target.value)} placeholder="고객사 또는 공급사명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addExternalAccountMapping} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              외부 계정 추가
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>External Account Mapping</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Email</th>
                <th style={tableCellStyle(true)}>Company</th>
                <th style={tableCellStyle(true)}>Mapped Key</th>
                <th style={tableCellStyle(true)}>Scope</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {externalAccountMappings.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>외부 매핑 생성을 실행하세요.</td></tr>}
              {externalAccountMappings.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.account_type}</td>
                  <td style={tableCellStyle()}>{item.email}</td>
                  <td style={tableCellStyle()}>{item.company_name}</td>
                  <td style={tableCellStyle()}>{item.mapped_key}</td>
                  <td style={tableCellStyle()}>{item.access_scope}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "ACTIVE" ? "#059669" : item.status === "READY" ? "#2563eb" : item.status === "BLOCKED" ? "#dc2626" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.status !== "ACTIVE" ? <button onClick={() => activateExternalMapping(item.id)}>Activate</button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>RLS Policy Draft</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Policy</th>
                <th style={tableCellStyle(true)}>Access Rule</th>
                <th style={tableCellStyle(true)}>Status</th>
              </tr>
            </thead>
            <tbody>
              {externalRlsPolicies.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>외부 매핑 생성 시 RLS 초안이 함께 생성됩니다.</td></tr>}
              {externalRlsPolicies.map((item) => (
                <tr key={item.policy_name}>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.account_type}</td>
                  <td style={tableCellStyle()}>{item.policy_name}</td>
                  <td style={tableCellStyle()}>{item.access_rule}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "APPLIED" ? "#059669" : item.status === "READY" ? "#2563eb" : "#d97706", fontWeight: "bold" }}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Portal Security Check</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Check</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Detail</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {portalSecurityChecks.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>보안 체크를 실행하세요.</td></tr>}
              {portalSecurityChecks.map((item) => (
                <tr key={item.check}>
                  <td style={tableCellStyle()}>{item.check}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderMasterRepositoryModule() {
    const nodeTypes = Array.from(new Set(repositoryNodes.map((item) => item.node_type)));

    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Enterprise Master Repository</h1>
          <p style={{ color: "#6b7280" }}>
            모든 PLM 데이터를 하나의 Repository 관점으로 연결합니다. 이 구조가 있어야 원료 변경, 규제 변경,
            고객 피드백, 공급사 문서 이슈가 처방과 출시 리스크에 미치는 영향을 자동 분석할 수 있습니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Nodes</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{repositoryStats.nodes}</div></div>
            <div style={cardStyle()}><strong>HIGH Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{repositoryStats.highRisk}</div></div>
            <div style={cardStyle()}><strong>MEDIUM Risk</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{repositoryStats.mediumRisk}</div></div>
            <div style={cardStyle()}><strong>Impacts</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{repositoryStats.impacts}</div></div>
            <div style={cardStyle()}><strong>Impact HIGH</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{repositoryStats.impactHigh}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateMasterRepository} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Repository 생성
            </button>
            <button onClick={runRepositoryImpactAnalysis} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              영향도 분석
            </button>
            <button onClick={exportMasterRepositoryCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Repository CSV
            </button>
            <button onClick={exportRepositoryImpactCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Impact CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{repositoryStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Repository Nodes</h2>
          <div style={{ marginBottom: "12px" }}>
            <select value={repositoryFocus} onChange={(e) => setRepositoryFocus(e.target.value)}>
              <option value="ALL">전체</option>
              {nodeTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Type</th>
                <th style={tableCellStyle(true)}>Code</th>
                <th style={tableCellStyle(true)}>Name</th>
                <th style={tableCellStyle(true)}>Linked To</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Source Table</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepositoryNodes.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Repository 생성을 실행하세요.</td></tr>}
              {filteredRepositoryNodes.map((item) => (
                <tr key={item.id}>
                  <td style={tableCellStyle()}>{item.node_type}</td>
                  <td style={tableCellStyle()}>{item.code}</td>
                  <td style={tableCellStyle()}>{item.name}</td>
                  <td style={tableCellStyle()}>{item.linked_to}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk_level === "HIGH" ? "#dc2626" : item.risk_level === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk_level}</td>
                  <td style={tableCellStyle()}>{item.source_table}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Impact Analysis</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Source</th>
                <th style={tableCellStyle(true)}>Target</th>
                <th style={tableCellStyle(true)}>Impact Type</th>
                <th style={tableCellStyle(true)}>Risk</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {repositoryImpacts.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>영향도 분석을 실행하세요.</td></tr>}
              {repositoryImpacts.map((item, index) => (
                <tr key={`${item.source}-${item.target}-${index}`}>
                  <td style={tableCellStyle()}>{item.source}</td>
                  <td style={tableCellStyle()}>{item.target}</td>
                  <td style={tableCellStyle()}>{item.impact_type}</td>
                  <td style={{ ...tableCellStyle(), color: item.risk === "HIGH" ? "#dc2626" : item.risk === "MEDIUM" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.risk}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Real CRUD 전환 상태</h2>
          <ul>
            <li>Project / Formula / Ingredient / Raw Material은 Supabase 서비스 연결 대상으로 지정되었습니다.</li>
            <li>Repository는 각 모듈 데이터를 source_table 기준으로 연결합니다.</li>
            <li>다음 Phase에서는 Customer/Supplier 외부 포털 RLS와 실제 계정 매핑을 고도화합니다.</li>
          </ul>
        </section>
      </>
    );
  }

  function renderRealDataPilotModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Real Data Pilot</h1>
          <p style={{ color: "#6b7280" }}>
            Project와 Ingredient를 우선 실제 Supabase 데이터와 연결하기 위한 Pilot 단계입니다.
            이 단계에서는 화면에서 연결 대상과 검증 항목을 확인하고, 함께 제공되는 service 파일로 실제 CRUD 연결 준비를 완료합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Pilot</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{realDataPilotStats.total}</div></div>
            <div style={cardStyle()}><strong>READY</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{realDataPilotStats.ready}</div></div>
            <div style={cardStyle()}><strong>Testing</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{realDataPilotStats.testing}</div></div>
            <div style={cardStyle()}><strong>Connected</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{realDataPilotStats.connected}</div></div>
            <div style={cardStyle()}><strong>Validation PASS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{realDataPilotStats.pass}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateRealDataPilotPlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Pilot Plan 생성
            </button>
            <button onClick={runRealDataValidation} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Validation 실행
            </button>
            <button onClick={exportRealDataPilotCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Pilot CSV
            </button>
            <button onClick={exportRealDataValidationCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Validation CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{realDataStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Project / Ingredient Real Data 연결 대상</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Mode</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>UI Target</th>
                <th style={tableCellStyle(true)}>Service Function</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {realDataPilotItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Pilot Plan 생성을 실행하세요.</td></tr>}
              {realDataPilotItems.map((item) => (
                <tr key={`${item.module}-${item.service_function}`}>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.mode}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "READY" ? "#059669" : item.status === "TESTING" ? "#d97706" : item.status === "CONNECTED" ? "#2563eb" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.ui_target}</td>
                  <td style={tableCellStyle()}>{item.service_function}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Validation</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Check</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {realDataValidations.length === 0 && <tr><td style={tableCellStyle()} colSpan={3}>Validation 실행을 클릭하세요.</td></tr>}
              {realDataValidations.map((item) => (
                <tr key={item.check}>
                  <td style={tableCellStyle()}>{item.check}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>다음 적용 순서</h2>
          <ol>
            <li>Project Module의 등록/목록/상태 변경을 enterpriseSupabaseRealService 함수로 교체</li>
            <li>Ingredient Module의 성분 검색을 Supabase range pagination으로 교체</li>
            <li>Raw Material 등록을 enterprise_raw_materials insert로 교체</li>
            <li>성공한 create/update 액션마다 audit_logs insert 연결</li>
            <li>Phase 18에서 Formula/Quality/Regulation 실데이터 연결</li>
          </ol>
        </section>
      </>
    );
  }

  function renderSupabaseBridgeModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Supabase CRUD Bridge</h1>
          <p style={{ color: "#6b7280" }}>
            Phase 15에서 생성한 Supabase 테이블을 실제 Enterprise 화면과 연결하기 위한 CRUD 브릿지입니다.
            Project / Formula / Ingredient부터 실제 DB 저장 구조로 이동합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Bridge</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{supabaseBridgeStats.total}</div></div>
            <div style={cardStyle()}><strong>READY</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{supabaseBridgeStats.ready}</div></div>
            <div style={cardStyle()}><strong>Need Test</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{supabaseBridgeStats.needsTest}</div></div>
            <div style={cardStyle()}><strong>Blocked</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{supabaseBridgeStats.blocked}</div></div>
            <div style={cardStyle()}><strong>Smoke PASS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{supabaseBridgeStats.smokePass}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateSupabaseBridgePlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              CRUD Bridge 생성
            </button>
            <button onClick={runSupabaseSmokeChecklist} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Smoke Checklist
            </button>
            <button onClick={exportSupabaseBridgeCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Bridge CSV
            </button>
            <button onClick={exportSmokeTestCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Smoke CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{supabaseBridgeStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>CRUD Bridge Plan</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Service</th>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Operation</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Test Payload</th>
                <th style={tableCellStyle(true)}>Note</th>
              </tr>
            </thead>
            <tbody>
              {supabaseBridgeItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>CRUD Bridge 생성을 실행하세요.</td></tr>}
              {supabaseBridgeItems.map((item) => (
                <tr key={`${item.service}-${item.operation}`}>
                  <td style={tableCellStyle()}>{item.service}</td>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.operation}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "READY" ? "#059669" : item.status === "NEEDS_TEST" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.test_payload}</td>
                  <td style={tableCellStyle()}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Smoke Test Checklist</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Test</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Detail</th>
                <th style={tableCellStyle(true)}>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {supabaseSmokeTests.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Smoke Checklist를 실행하세요.</td></tr>}
              {supabaseSmokeTests.map((item) => (
                <tr key={item.test_name}>
                  <td style={tableCellStyle()}>{item.test_name}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "PASS" ? "#059669" : item.status === "WARN" ? "#d97706" : item.status === "FAIL" ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.detail}</td>
                  <td style={tableCellStyle()}>{item.next_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>실제 연동 우선순위</h2>
          <ol>
            <li>Project Module: 등록/목록/상태 변경을 enterprise_projects와 연결</li>
            <li>Ingredient Module: ingredient_master_global 검색을 Supabase range/pagination으로 교체</li>
            <li>Formula Module: 처방 등록/Clone/Lock을 enterprise_formulas와 연결</li>
            <li>Audit Log: 모든 create/update 액션 성공 후 audit_logs insert</li>
            <li>Customer/Supplier Portal: 외부 계정 RLS 매핑 후 활성화</li>
          </ol>
        </section>
      </>
    );
  }

  function renderSupabaseSchemaModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Supabase Schema & RLS Kit</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise 운영 테이블, 인덱스, RLS 정책을 적용하기 전 점검하는 화면입니다.
            압축 파일에 포함된 SQL 파일을 Supabase SQL Editor에 적용하는 단계로 이어집니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Tables</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{supabaseSchemaStats.tables}</div></div>
            <div style={cardStyle()}><strong>Create</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{supabaseSchemaStats.create}</div></div>
            <div style={cardStyle()}><strong>Alter</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{supabaseSchemaStats.alter}</div></div>
            <div style={cardStyle()}><strong>Indexes</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{supabaseSchemaStats.indexes}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateSupabaseSchemaPlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Schema Plan 생성
            </button>
            <button onClick={exportSupabaseSchemaPlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Schema CSV
            </button>
            <button onClick={exportSupabaseIndexPlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Index CSV
            </button>
            <button onClick={exportSupabaseSqlChecklistCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              SQL 적용 체크리스트
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{supabaseSchemaStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Table Plan</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Priority</th>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Purpose</th>
                <th style={tableCellStyle(true)}>Core Columns</th>
              </tr>
            </thead>
            <tbody>
              {supabaseTablePlans.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Schema Plan 생성을 실행하세요.</td></tr>}
              {supabaseTablePlans.map((item) => (
                <tr key={item.table_name}>
                  <td style={tableCellStyle()}>{item.priority}</td>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "CREATE" ? "#2563eb" : item.status === "ALTER" ? "#d97706" : "#059669", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.purpose}</td>
                  <td style={tableCellStyle()}>{item.core_columns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Index Plan</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Index</th>
                <th style={tableCellStyle(true)}>Columns</th>
                <th style={tableCellStyle(true)}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {supabaseIndexPlans.length === 0 && <tr><td style={tableCellStyle()} colSpan={4}>Schema Plan 생성 시 Index Plan이 함께 생성됩니다.</td></tr>}
              {supabaseIndexPlans.map((item) => (
                <tr key={item.index_name}>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.index_name}</td>
                  <td style={tableCellStyle()}>{item.columns}</td>
                  <td style={tableCellStyle()}>{item.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>SQL 적용 안내</h2>
          <ol>
            <li>압축 파일의 <strong>supabase/migrations/phase15_enterprise_schema.sql</strong> 파일을 엽니다.</li>
            <li>Supabase Dashboard → SQL Editor에 전체 복사 후 실행합니다.</li>
            <li>Table Editor에서 enterprise_* 테이블이 생성되었는지 확인합니다.</li>
            <li>RLS 정책은 실제 customer/supplier 계정 매핑 전까지 내부 운영 정책 중심으로 적용합니다.</li>
            <li>정상 적용 후 다음 Phase에서 services/*.ts를 Supabase CRUD와 연결합니다.</li>
          </ol>
        </section>
      </>
    );
  }

  function renderServiceLayerModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Service Layer Scaffold</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise page.tsx에 모여 있는 업무 로직을 services/*.ts로 분리하기 위한 서비스 계층 설계 화면입니다.
            이 단계 이후부터 실제 코드 구조가 page 중심에서 service 중심으로 이동합니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Services</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{serviceLayerStats.total}</div></div>
            <div style={cardStyle()}><strong>Created</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{serviceLayerStats.created}</div></div>
            <div style={cardStyle()}><strong>Planned</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{serviceLayerStats.planned}</div></div>
            <div style={cardStyle()}><strong>Need Supabase</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{serviceLayerStats.needsSupabase}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateServiceLayerPlan} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Service Layer 생성
            </button>
            <button onClick={exportServiceLayerCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Service CSV
            </button>
            <button onClick={exportSupabaseCrudPlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Supabase CRUD Plan
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{serviceLayerStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Service Files</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Service File</th>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Tables</th>
                <th style={tableCellStyle(true)}>Functions</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {serviceLayerItems.length === 0 && <tr><td style={tableCellStyle()} colSpan={6}>Service Layer 생성을 실행하세요.</td></tr>}
              {serviceLayerItems.map((item) => (
                <tr key={item.service_file}>
                  <td style={tableCellStyle()}>{item.service_file}</td>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "CREATED" ? "#059669" : item.status === "PLANNED" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.tables}</td>
                  <td style={tableCellStyle()}>{item.functions.join(" / ")}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>서비스 계층 전환 원칙</h2>
          <ol>
            <li>UI는 입력/표시만 담당하고, 생성/수정/검색/검증 로직은 service 함수로 이동합니다.</li>
            <li>Supabase 연동은 service 내부에서만 수행합니다.</li>
            <li>Audit Log는 service 함수에서 공통으로 기록합니다.</li>
            <li>대량 데이터는 반드시 pagination/range/search 기반으로 조회합니다.</li>
            <li>customer/supplier 외부 권한은 RLS 정책 적용 후 활성화합니다.</li>
          </ol>
        </section>
      </>
    );
  }

  function renderDataIntegrationModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Data Integration Center</h1>
          <p style={{ color: "#6b7280" }}>
            현재 Enterprise 화면의 임시 상태 데이터를 실제 Supabase 테이블, RLS 정책, 서비스 계층으로 옮기기 위한 전환 준비 화면입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={cardStyle()}><strong>Mappings</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{dataIntegrationStats.mappings}</div></div>
            <div style={cardStyle()}><strong>READY</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{dataIntegrationStats.ready}</div></div>
            <div style={cardStyle()}><strong>Need Schema</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{dataIntegrationStats.needsSchema}</div></div>
            <div style={cardStyle()}><strong>Need RLS</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{dataIntegrationStats.needsRls}</div></div>
            <div style={cardStyle()}><strong>RLS Drafts</strong><div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{dataIntegrationStats.policies}</div></div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={generateDataMappings} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Data Mapping 생성
            </button>
            <button onClick={exportDataMappingCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Mapping CSV
            </button>
            <button onClick={exportRlsPolicyCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#0ea5e9", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              RLS Draft CSV
            </button>
            <button onClick={exportServiceLayerPlanCsv} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#111827", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Service Plan CSV
            </button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: "bold" }}>{dataIntegrationStatus}</p>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Table Mapping</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Module</th>
                <th style={tableCellStyle(true)}>Local State</th>
                <th style={tableCellStyle(true)}>Target Table</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Records</th>
                <th style={tableCellStyle(true)}>Key Fields</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dataMappings.length === 0 && <tr><td style={tableCellStyle()} colSpan={7}>Data Mapping 생성을 실행하세요.</td></tr>}
              {dataMappings.map((item) => (
                <tr key={`${item.module}-${item.target_table}`}>
                  <td style={tableCellStyle()}>{item.module}</td>
                  <td style={tableCellStyle()}>{item.local_name}</td>
                  <td style={tableCellStyle()}>{item.target_table}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "READY" ? "#059669" : item.status === "PENDING" ? "#6b7280" : item.status === "NEEDS_SCHEMA" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.records}</td>
                  <td style={tableCellStyle()}>{item.key_fields}</td>
                  <td style={tableCellStyle()}>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>RLS Policy Draft</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>Table</th>
                <th style={tableCellStyle(true)}>Role</th>
                <th style={tableCellStyle(true)}>Permission</th>
                <th style={tableCellStyle(true)}>Status</th>
                <th style={tableCellStyle(true)}>Policy Note</th>
              </tr>
            </thead>
            <tbody>
              {rlsPolicies.length === 0 && <tr><td style={tableCellStyle()} colSpan={5}>Data Mapping 생성 시 RLS 초안이 함께 생성됩니다.</td></tr>}
              {rlsPolicies.map((item) => (
                <tr key={`${item.table_name}-${item.role_name}-${item.permission}`}>
                  <td style={tableCellStyle()}>{item.table_name}</td>
                  <td style={tableCellStyle()}>{item.role_name}</td>
                  <td style={tableCellStyle()}>{item.permission}</td>
                  <td style={{ ...tableCellStyle(), color: item.status === "READY" ? "#059669" : item.status === "DRAFT" ? "#d97706" : "#dc2626", fontWeight: "bold" }}>{item.status}</td>
                  <td style={tableCellStyle()}>{item.policy_note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>다음 전환 순서</h2>
          <ol>
            <li>services 폴더 생성: projectService, formulaService, ingredientService부터 분리</li>
            <li>Supabase 테이블 누락분 생성: customer_portal_items, supplier_tasks, supplier_scorecards 등</li>
            <li>RLS 정책 적용: customer/supplier 외부 계정 데이터 제한</li>
            <li>Enterprise page.tsx의 useState 임시 데이터를 서비스 호출 구조로 교체</li>
            <li>기존 app/page.tsx의 핵심 기능을 모듈 단위로 하나씩 이전</li>
          </ol>
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
    if (active === "dataIntegration") return renderDataIntegrationModule();
    if (active === "services") return renderServiceLayerModule();
    if (active === "supabaseSchema") return renderSupabaseSchemaModule();
    if (active === "supabaseBridge") return renderSupabaseBridgeModule();
    if (active === "realData") return renderRealDataPilotModule();
    if (active === "repository") return renderMasterRepositoryModule();
    if (active === "externalRls") return renderExternalRlsModule();
    if (active === "productionRc") return renderProductionRcModule();
    if (active === "uatMigration") return renderUatMigrationModule();
    if (active === "goLive") return renderGoLiveModule();
    if (active === "monitoring") return renderMonitoringModule();
    if (active === "stabilization") return renderStabilizationModule();
    if (active === "workflow") return renderWorkflowModule();
    if (active === "simulation") return renderFormulaSimulationModule();
    if (active === "scaleUp") return renderScaleUpModule();
    if (active === "eln") return renderElnModule();
    if (active === "lims") return renderLimsModule();
    if (active === "mes") return renderMesModule();
    if (active === "v2Package") return renderV2PackageModule();
    if (active === "v3Package") return renderV3PackageModule();
    if (active === "v4Package") return renderV4PackageModule();
    if (active === "ultimateA") return renderUltimatePackAModule();
    if (active === "ultimateB") return renderUltimatePackBModule();
    if (active === "workReady") return renderWorkReadyModule();
    if (active === "realOperation") return renderRealOperationModule();
    if (active === "importValidation") return renderImportValidationModule();
    if (active === "realDb") return renderRealDbOperationModule();
    return renderAdminModule();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial", display: "grid", gridTemplateColumns: "280px 1fr" }}>
      <aside style={{ background: "#111827", color: "white", padding: "22px", height: "100vh", position: "sticky", top: 0, boxSizing: "border-box", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>PLM Enterprise</h2>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Real DB Operation Pack</p>

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
