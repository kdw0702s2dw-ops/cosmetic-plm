// Phase 21 UAT & Data Migration Service

export function getUatProgress(items: { status: string }[]) {
  const total = items.length;
  const pass = items.filter((item) => item.status === "PASS").length;
  const fail = items.filter((item) => item.status === "FAIL").length;
  return {
    total,
    pass,
    fail,
    percent: total ? Math.round((pass / total) * 100) : 0,
  };
}

export function getMigrationProgress(items: { status: string }[]) {
  const total = items.length;
  const done = items.filter((item) => item.status === "DONE").length;
  const error = items.filter((item) => item.status === "ERROR").length;
  return {
    total,
    done,
    error,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

export function validateCsvRequiredColumns(headers: string[], required: string[]) {
  const missing = required.filter((item) => !headers.includes(item));
  return {
    ok: missing.length === 0,
    missing,
  };
}
