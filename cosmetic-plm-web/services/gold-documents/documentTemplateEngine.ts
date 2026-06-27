import type { DocumentType, FormulaDocumentSource } from "@/types/goldDocuments";

function safe(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function buildDocumentContent(documentType: DocumentType, source: FormulaDocumentSource) {
  const header = source.header || {};
  const lines = source.lines || [];
  const base = {
    formula_code: header.formula_code,
    revision: header.revision,
    formula_name: header.formula_name,
    status: header.status,
    customer: header.customer,
    target_country: header.target_country,
    claim: header.claim,
    generated_at: new Date().toISOString(),
  };

  if (documentType === "FORMULA_SHEET") {
    return {
      ...base,
      sections: [
        { title: "Formula Header", rows: [base] },
        { title: "Formula Lines", rows: lines },
      ],
    };
  }

  if (documentType === "INGREDIENT_COMPOSITION") {
    return {
      ...base,
      composition: lines.map((line: any) => ({
        line_no: line.line_no,
        phase: line.phase,
        raw_code: line.raw_code,
        raw_name: line.raw_name,
        percentage: line.percentage,
        inci_kr: line.inci_kr,
        inci_en: line.inci_en,
      })),
      total_percent: lines.reduce((sum: number, line: any) => sum + Number(line.percentage || 0), 0),
    };
  }

  if (documentType === "FULL_INGREDIENT_LIST") {
    return {
      ...base,
      inci_kr: lines.map((line: any) => line.inci_kr).filter(Boolean).join(", "),
      inci_en: lines.map((line: any) => line.inci_en).filter(Boolean).join(", "),
    };
  }

  if (documentType === "PRODUCT_SPEC") {
    return {
      ...base,
      product_type: header.product_type,
      validation: source.validation,
      cost: source.cost,
      score: source.score,
      specification: {
        appearance: "TBD",
        odor: "TBD",
        ph: "TBD",
        viscosity: "TBD",
        microbiology: "TBD",
      },
    };
  }

  if (documentType === "COA") {
    return {
      ...base,
      coa_items: [
        { test: "Appearance", specification: "TBD", result: "", judgment: "" },
        { test: "Odor", specification: "TBD", result: "", judgment: "" },
        { test: "pH", specification: "TBD", result: "", judgment: "" },
        { test: "Viscosity", specification: "TBD", result: "", judgment: "" },
        { test: "Microbiology", specification: "TBD", result: "", judgment: "" },
      ],
    };
  }

  if (documentType === "TEST_REQUEST") {
    return {
      ...base,
      tests: [
        "High temperature stability",
        "Low temperature stability",
        "Freeze-thaw",
        "pH",
        "Viscosity",
        "Microbiology",
        "Compatibility",
      ],
      priority: "NORMAL",
    };
  }

  if (documentType === "BOM") {
    return {
      ...base,
      bom: lines.map((line: any) => ({
        raw_code: line.raw_code,
        raw_name: line.raw_name,
        percentage: line.percentage,
        cost_per_kg: source.cost?.total_cost_per_kg || null,
      })),
    };
  }

  if (documentType === "MANUFACTURING_SHEET") {
    return {
      ...base,
      manufacturing_steps: [
        "Phase A 투입 및 교반",
        "Phase B 별도 가온/용해",
        "유화 및 냉각",
        "Phase C 후첨",
        "탈포 및 충진",
      ],
      lines,
    };
  }

  return {
    ...base,
    summary: {
      validation: source.validation,
      cost: source.cost,
      score: source.score,
      stability_risks: source.stability,
      regulation_risks: source.regulation,
      recommendations: source.recommendations,
    },
  };
}

export function documentToCsv(content: any) {
  const rows: string[][] = [];
  rows.push(["Field", "Value"]);
  for (const [key, value] of Object.entries(content)) {
    if (Array.isArray(value) || typeof value === "object") {
      rows.push([key, JSON.stringify(value)]);
    } else {
      rows.push([key, safe(value)]);
    }
  }
  return rows.map((row) => row.map((cell) => `"${safe(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

export function documentToHtml(content: any) {
  const title = `${safe(content.formula_code)} ${safe(content.revision)} ${safe(content.formula_name)}`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body{font-family:Arial, sans-serif; padding:24px; line-height:1.5;}
h1{color:#111827;}
table{width:100%; border-collapse:collapse; margin-top:12px;}
td,th{border:1px solid #ddd; padding:8px; vertical-align:top;}
th{background:#f3f4f6;}
pre{white-space:pre-wrap;}
</style>
</head>
<body>
<h1>${title}</h1>
<table>
<tbody>
${Object.entries(content).map(([key, value]) => `<tr><th>${key}</th><td><pre>${safe(typeof value === "object" ? JSON.stringify(value, null, 2) : value)}</pre></td></tr>`).join("")}
</tbody>
</table>
</body>
</html>`;
}
