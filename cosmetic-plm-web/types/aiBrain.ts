export type AiBrainRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
export type AiBrainAdvisorType = "Formula" | "Regulation" | "Cost" | "Stability" | "Launch" | "Executive";

export type AiBrainAdvisor = {
  id: string;
  advisor: AiBrainAdvisorType;
  title: string;
  score: number;
  risk_level: AiBrainRiskLevel;
  recommendation: string;
  action_owner: "R&D" | "QA" | "RA" | "QC" | "Sales" | "Management";
};

export type AiBrainAction = {
  id: string;
  action_type: "FormulaImprove" | "CostDown" | "RegReview" | "StabilityTest" | "DocumentFix" | "LaunchGate";
  task: string;
  priority: "P0" | "P1" | "P2" | "P3";
  owner: "R&D" | "QA" | "RA" | "QC" | "Sales";
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

export type AiBrainSummary = {
  id: string;
  summary_type: "Researcher" | "QA" | "RA" | "Sales" | "Executive";
  headline: string;
  summary: string;
  confidence: number;
};
