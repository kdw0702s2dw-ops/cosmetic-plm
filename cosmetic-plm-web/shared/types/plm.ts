export type EnterpriseModuleStatus = "READY" | "IN_PROGRESS" | "PLANNED";

export type EnterpriseModule = {
  version: string;
  title: string;
  team: "Sales" | "R&D" | "QA" | "RA" | "Management";
  status: EnterpriseModuleStatus;
  purpose: string;
  outputs: string[];
};
