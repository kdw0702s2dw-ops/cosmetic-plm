export function countByStatus<T extends { status: string }>(rows: T[], status: string) {
  return rows.filter((item) => item.status === status).length;
}

export function nowAuditTime() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
