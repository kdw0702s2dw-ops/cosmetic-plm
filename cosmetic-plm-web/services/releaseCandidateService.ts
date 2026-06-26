// Final Sprint E: Enterprise Release Candidate Service

export function getReleaseDecision(scores: number[]) {
  const avg = scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1);
  if (avg >= 85) return "GO";
  if (avg >= 70) return "WATCH";
  return "HOLD";
}

export function getRcCheckResult(input: { buildOk: boolean; dataReady: boolean; permissionReady: boolean }) {
  if (!input.buildOk) return "FAIL";
  if (!input.dataReady || !input.permissionReady) return "WATCH";
  return "PASS";
}

export function isReadyForWork(gates: { decision: string }[]) {
  return gates.filter((gate) => gate.decision === "HOLD").length === 0;
}
