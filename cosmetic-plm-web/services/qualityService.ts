export function getDocumentStatusByExpiry(expiry: string) {
  if (!expiry) return "MISSING";
  const today = new Date();
  const expiryDate = new Date(expiry);
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 60) return "EXPIRING";
  return "OK";
}

export function predictStabilityResult(finding: string) {
  if (finding.includes("분리") || finding.includes("변색")) return "WATCH";
  return "PASS";
}
