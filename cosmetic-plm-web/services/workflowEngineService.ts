// Phase 25 Enterprise Workflow Engine Service

import { todayLocalStr, addLocalDays } from "@/lib/localDate";

export function calculateWorkflowProgress(doneTasks: number, totalTasks: number) {
  if (!totalTasks) return 0;
  return Math.round((doneTasks / totalTasks) * 100);
}

export function getWorkflowRunStatus(progress: number, hasBlockedTask: boolean, isWaitingApproval: boolean) {
  if (hasBlockedTask) return "BLOCKED";
  if (progress >= 100) return "COMPLETED";
  if (isWaitingApproval) return "WAITING_APPROVAL";
  return "IN_PROGRESS";
}

export function getDueDate(days: number) {
  return addLocalDays(todayLocalStr(), days);
}

export function isWorkflowOverdue(dueDate: string) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}
