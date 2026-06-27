export type UxModuleStatus = "LIVE" | "WATCH" | "EMPTY" | "ERROR";

export type UxKpi = {
  label: string;
  value: string | number;
  hint: string;
  status: UxModuleStatus;
};

export type UxWorkItem = {
  title: string;
  area: string;
  status: string;
  href: string;
  priority: "P0" | "P1" | "P2";
};

export type UxModule = {
  title: string;
  description: string;
  href: string;
  status: UxModuleStatus;
  count: number;
};
