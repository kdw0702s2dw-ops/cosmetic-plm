export type LiveCrudModule =
  | "Formula"
  | "Ingredient"
  | "Customer"
  | "Supplier"
  | "Product"
  | "Document"
  | "Workflow"
  | "Approval"
  | "QMS"
  | "Regulation";

export type LiveCrudOperation = "INSERT" | "UPDATE" | "DELETE" | "UPSERT" | "LOAD" | "REALTIME";

export type AiCopilotIntent =
  | "CreateFormula"
  | "OptimizeCost"
  | "CheckRegulation"
  | "GenerateDocument"
  | "CreateWorkflow"
  | "LaunchReview";
