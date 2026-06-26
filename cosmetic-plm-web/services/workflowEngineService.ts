// Phase 25 Enterprise Workflow Engine Service

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
  const due = new Date();
  due.setDate(due.getDate() + days);
  return due.toISOString().slice(0, 10);
}

export function isWorkflowOverdue(dueDate: string) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}
