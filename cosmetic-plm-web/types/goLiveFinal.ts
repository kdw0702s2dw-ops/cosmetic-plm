export type GoLiveStatus = "PASS" | "WATCH" | "BLOCK";

export type GoLiveChecklistItem = {
  id: string;
  area: "Build" | "Deploy" | "Database" | "Login" | "CRUD" | "Document" | "AI" | "Backup" | "User";
  task: string;
  status: GoLiveStatus;
  owner: "Admin" | "R&D" | "QA" | "RA" | "QC" | "Sales";
  action: string;
};

export type GoLiveQuickStartItem = {
  id: string;
  order: number;
  title: string;
  description: string;
  url: string;
};

export type GoLiveDataSeedItem = {
  id: string;
  dataDomain: "Raw Material" | "INCI" | "Formula" | "Regulation" | "Supplier" | "Customer" | "LIMS" | "Document";
  priority: "P0" | "P1" | "P2";
  minimumRows: number;
  status: "READY" | "NEEDS_INPUT";
};

export type GoLiveIssueItem = {
  id: string;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  workaround: string;
  status: "OPEN" | "CLOSED";
};
