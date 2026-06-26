// Final Sprint C: PDF / Excel / Word Export Generator Service

export function getExportFormat(documentType: string) {
  if (["Formula Sheet", "Ingredient Composition", "Full Ingredient List", "Test Request"].includes(documentType)) return "EXCEL";
  if (["Product Specification", "Development Report"].includes(documentType)) return "WORD";
  return "PDF";
}

export function canGenerateExport(status: string, blockerCount: number) {
  return blockerCount === 0 && status !== "BLOCKED";
}

export function buildExportFileName(documentType: string, formulaCode: string, ext: string) {
  const safeType = documentType.toLowerCase().replaceAll(" ", "_");
  return `${formulaCode}_${safeType}.${ext}`;
}
