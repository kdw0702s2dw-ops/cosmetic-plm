export type EnterpriseRole = "R&D" | "QA/QC" | "RA" | "Production" | "Sales" | "Admin";
export type ReadinessStatus = "READY" | "WATCH" | "BLOCK" | "RELEASED";
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export type RoleWorkspaceCard = {
  title: string;
  description: string;
  href: string;
  count: number;
  priority: "P0" | "P1" | "P2";
};

export type LaunchReadinessItem = {
  area: "Formula" | "Validation" | "Cost" | "Intelligence" | "Documents" | "AI" | "Manufacturing" | "Release";
  status: ReadinessStatus;
  score: number;
  message: string;
  href: string;
};

export type EnterpriseNotification = {
  id?: string;
  notification_code: string;
  title: string;
  message: string;
  area: string;
  href: string | null;
  status: NotificationStatus;
  priority: "P0" | "P1" | "P2";
  created_at?: string | null;
};

export type ActivityEvent = {
  id?: string;
  event_code: string;
  area: string;
  action: string;
  title: string;
  description: string | null;
  href: string | null;
  created_by: string | null;
  created_at?: string | null;
};
