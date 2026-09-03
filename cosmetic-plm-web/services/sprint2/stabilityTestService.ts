"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { openPrintDocument, downloadHtmlDocument } from "./documentPdfService";

// 품질관리 - 화장품 안정성시험(장기보존/가속/가혹/냉동해동/광안정성) 관리.
// 구조: 시료(plm_stability_tests, 처방 1건 연동) -> 시험조건 트랙(plm_stability_conditions, 조건별 1개)
//      -> 체크포인트(plm_stability_checkpoints, 조건별 시점 여러 개). 결과는 체크포인트에 jsonb 배열로 저장한다
//      (항목을 자유롭게 추가/삭제할 수 있어야 해서 별도 테이블 대신 jsonb를 선택 - ODM 실무에서도 처방마다
//      평가 항목 구성이 조금씩 달라진다).
export { openPrintDocument, downloadHtmlDocument };

export const STABILITY_CONDITION_TYPES = ["장기보존", "가속", "가혹", "냉동해동", "광안정성", "커스텀"] as const;
export type StabilityConditionType = (typeof STABILITY_CONDITION_TYPES)[number];

export const STABILITY_TEST_STATUSES = ["진행중", "완료", "중단"] as const;
export type StabilityTestStatus = (typeof STABILITY_TEST_STATUSES)[number];

export type StabilityItemType = "text" | "number";

export type StabilityItemTemplate = {
  key: string;
  label: string;
  type: StabilityItemType;
  unit?: string;
  spec_text?: string; // 텍스트형 항목의 기준 설명 (예: "변화 없음")
  spec_min?: number | null; // 숫자형 항목의 기준 하한
  spec_max?: number | null; // 숫자형 항목의 기준 상한
};

export type StabilityResultItem = {
  key: string;
  label: string;
  type: StabilityItemType;
  value: string;
  judgement: "적합" | "부적합" | "관찰필요" | "";
  memo?: string;
};

export type StabilityTest = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string | null;
  confirmed_code?: string | null;
  sample_name?: string | null;
  lot_no?: string | null;
  manufacture_date?: string | null;
  storage_location?: string | null;
  assignee?: string | null;
  status: StabilityTestStatus;
  memo?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StabilityCondition = {
  id: string;
  test_id: string;
  condition_type: StabilityConditionType;
  condition_label: string;
  start_date: string;
  item_templates: StabilityItemTemplate[];
  status: "진행중" | "완료" | "중단";
  created_at?: string;
  updated_at?: string;
};

export type StabilityCheckpoint = {
  id: string;
  condition_id: string;
  checkpoint_label: string;
  due_date: string;
  status: "예정" | "완료";
  results: StabilityResultItem[];
  photo_urls: string[];
  memo?: string | null;
  recorded_by?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StabilityConditionWithCheckpoints = StabilityCondition & { checkpoints: StabilityCheckpoint[] };

// 품질관리 홈(달력/알림)에서 쓰는 형태 - 체크포인트 하나에 그 상위 조건/시료 정보까지 함께 담아,
// 어느 처방/시료의 몇 번째 시점인지, 담당자가 누구인지를 한 번에 보여줄 수 있게 한다.
export type CheckpointWithContext = StabilityCheckpoint & {
  condition: {
    id: string;
    condition_label: string;
    condition_type: StabilityConditionType;
    test: {
      id: string;
      formula_code: string;
      sample_name: string | null;
      formula_name: string | null;
      assignee: string | null;
      status: StabilityTestStatus;
    } | null;
  } | null;
};

// 조건 프리셋 - 시작일 기준 체크포인트 일정을 자동 생성하는 데 쓰는 오프셋(일수) 목록.
// ODM(콜마/코스맥스 등) 관행에 맞춰 장기보존/가속은 월단위, 가혹은 주단위, 냉동해동은 사이클단위로 구성.
export const STABILITY_CONDITION_PRESETS: { type: StabilityConditionType; label: string; checkpointOffsets: { label: string; days: number }[] }[] = [
  {
    type: "장기보존",
    label: "장기보존 (25℃/60%RH)",
    checkpointOffsets: [
      { label: "0개월", days: 0 }, { label: "1개월", days: 30 }, { label: "2개월", days: 60 },
      { label: "3개월", days: 90 }, { label: "6개월", days: 180 }, { label: "9개월", days: 270 }, { label: "12개월", days: 360 },
    ],
  },
  {
    type: "가속",
    label: "가속 (40℃/75%RH)",
    checkpointOffsets: [
      { label: "0개월", days: 0 }, { label: "1개월", days: 30 }, { label: "2개월", days: 60 }, { label: "3개월", days: 90 }, { label: "6개월", days: 180 },
    ],
  },
  {
    type: "가혹",
    label: "가혹 (50℃)",
    checkpointOffsets: [
      { label: "0주", days: 0 }, { label: "1주", days: 7 }, { label: "2주", days: 14 }, { label: "4주", days: 28 },
    ],
  },
  {
    type: "냉동해동",
    label: "냉동-해동 반복 (-15~-20℃ ↔ 25℃)",
    checkpointOffsets: [
      { label: "1사이클", days: 2 }, { label: "2사이클", days: 4 }, { label: "3사이클", days: 6 }, { label: "4사이클", days: 8 }, { label: "5사이클", days: 10 },
    ],
  },
  {
    type: "광안정성",
    label: "광안정성 (ICH Q1B)",
    checkpointOffsets: [
      { label: "조사 전", days: 0 }, { label: "조사 후", days: 10 },
    ],
  },
  {
    type: "커스텀",
    label: "커스텀 조건",
    checkpointOffsets: [{ label: "0일차", days: 0 }],
  },
];

// 평가 항목 프리셋 - 화장품 공통 항목. 숫자형(pH/점도/비중/미생물)은 기준범위를 넣어두면 자동판정에 쓰인다.
export const STABILITY_ITEM_PRESETS: StabilityItemTemplate[] = [
  { key: "appearance", label: "성상(외관)", type: "text", spec_text: "변화 없음" },
  { key: "color", label: "색상", type: "text", spec_text: "변화 없음" },
  { key: "odor", label: "향취", type: "text", spec_text: "변화 없음" },
  { key: "separation", label: "분리", type: "text", spec_text: "분리 없음" },
  { key: "ph", label: "pH", type: "number", unit: "" },
  { key: "viscosity", label: "점도", type: "number", unit: "cPs" },
  { key: "specific_gravity", label: "비중", type: "number", unit: "" },
  { key: "microbial_total", label: "총호기성생균수", type: "number", unit: "CFU/g", spec_max: 1000 },
  { key: "microbial_pathogen", label: "특정세균(대장균/녹농균/황색포도상구균)", type: "text", spec_text: "불검출" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 완료가 아닌데 예정일이 지났으면 지연으로 본다(생산일정관리와 동일한 판정 방식).
export function isCheckpointOverdue(cp: StabilityCheckpoint): boolean {
  if (cp.status === "완료") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${cp.due_date}T00:00:00`).getTime() < today.getTime();
}

// 아직 지연은 아니지만 예정일이 days일 이내로 임박했으면 true - 지연되기 전에 미리 알 수 있게 하기 위함
// (원료 소싱 일정관리의 isDueSoonOrOverdue와 같은 취지, 여기서는 지연/임박을 분리해서 색상을 다르게 쓴다).
export function isCheckpointDueSoon(cp: StabilityCheckpoint, days = 3): boolean {
  if (cp.status === "완료") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${cp.due_date}T00:00:00`);
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}

// 체크포인트 결과 항목들의 종합판정 - 하나라도 부적합이면 부적합, 하나라도 관찰필요면 관찰필요, 전부 적합이면 적합.
export function computeOverallJudgement(results: StabilityResultItem[]): "적합" | "부적합" | "관찰필요" | "미입력" {
  if (!results || results.length === 0) return "미입력";
  if (results.some((r) => r.judgement === "부적합")) return "부적합";
  if (results.some((r) => r.judgement === "관찰필요")) return "관찰필요";
  if (results.every((r) => r.judgement === "적합")) return "적합";
  return "미입력";
}

// 숫자형 항목의 기준범위와 입력값을 비교해 판정을 제안한다(사용자가 다시 수동으로 바꿀 수 있음).
export function suggestJudgement(item: StabilityItemTemplate, value: string): "적합" | "부적합" | "" {
  if (item.type !== "number") return "";
  if (value.trim() === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  if (item.spec_min == null && item.spec_max == null) return "";
  if (item.spec_min != null && num < item.spec_min) return "부적합";
  if (item.spec_max != null && num > item.spec_max) return "부적합";
  return "적합";
}

export { searchFormulasByCodeOrConfirmedCode } from "./sourcingScheduleService";

export async function fetchStabilityTests(): Promise<StabilityTest[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_tests")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []) as StabilityTest[];
}

export async function saveStabilityTest(entry: StabilityTest): Promise<StabilityTest> {
  const { id, ...rest } = entry;
  if (id) {
    const { data, error } = await supabaseProductionFinal
      .from("plm_stability_tests")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as StabilityTest;
  }
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_tests")
    .insert({ ...rest, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as StabilityTest;
}

export async function deleteStabilityTest(id: string) {
  // ON DELETE CASCADE로 하위 조건/체크포인트도 함께 삭제된다.
  const { error } = await supabaseProductionFinal.from("plm_stability_tests").delete().eq("id", id);
  if (error) throw error;
}

const CHECKPOINT_CONTEXT_SELECT =
  "*, condition:plm_stability_conditions(id, condition_label, condition_type, test:plm_stability_tests(id, formula_code, sample_name, formula_name, assignee, status))";

// 품질관리 홈 달력용 - 특정 월(from~to, YYYY-MM-DD, inclusive)에 예정일이 있는 체크포인트를 시료/조건 정보와
// 함께 전부 가져온다. 시료 전체를 대상으로 하므로(하나의 시료만 보는 fetchStabilityConditions와 다름) 별도 함수로 둔다.
export async function fetchAllStabilityCheckpoints(from: string, to: string): Promise<CheckpointWithContext[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_checkpoints")
    .select(CHECKPOINT_CONTEXT_SELECT)
    .gte("due_date", from)
    .lte("due_date", to)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as CheckpointWithContext[];
}

// 품질관리 홈 알림 배너/뱃지용 - 아직 완료되지 않은(예정) 체크포인트를 월과 무관하게 전부 가져온다.
// 지연/임박 판정과 "내 담당만" 필터링은 호출부(훅)에서 한다 - 날짜 계산은 클라이언트 로컬 시간 기준이 맞기 때문.
export async function fetchOpenStabilityAlerts(): Promise<CheckpointWithContext[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_checkpoints")
    .select(CHECKPOINT_CONTEXT_SELECT)
    .eq("status", "예정")
    .order("due_date", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data || []) as unknown as CheckpointWithContext[];
}

export async function fetchStabilityConditions(testId: string): Promise<StabilityConditionWithCheckpoints[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_conditions")
    .select("*, checkpoints:plm_stability_checkpoints(*)")
    .eq("test_id", testId)
    .order("created_at", { ascending: true })
    .order("due_date", { foreignTable: "plm_stability_checkpoints", ascending: true });
  if (error) throw error;
  return (data || []) as StabilityConditionWithCheckpoints[];
}

// 조건 추가 - 프리셋의 체크포인트 오프셋을 시작일 기준으로 날짜로 환산해 한 번에 생성한다.
export async function addStabilityCondition(params: {
  test_id: string;
  condition_type: StabilityConditionType;
  condition_label: string;
  start_date: string;
  item_templates: StabilityItemTemplate[];
}): Promise<StabilityConditionWithCheckpoints> {
  const { data: condition, error: condErr } = await supabaseProductionFinal
    .from("plm_stability_conditions")
    .insert({
      test_id: params.test_id,
      condition_type: params.condition_type,
      condition_label: params.condition_label,
      start_date: params.start_date,
      item_templates: params.item_templates,
    })
    .select("*")
    .single();
  if (condErr) throw condErr;

  const preset = STABILITY_CONDITION_PRESETS.find((p) => p.type === params.condition_type);
  const offsets = preset?.checkpointOffsets || [{ label: "0일차", days: 0 }];
  const checkpointRows = offsets.map((o) => ({
    condition_id: condition.id,
    checkpoint_label: o.label,
    due_date: addDays(params.start_date, o.days),
  }));
  const { data: checkpoints, error: cpErr } = await supabaseProductionFinal
    .from("plm_stability_checkpoints")
    .insert(checkpointRows)
    .select("*");
  if (cpErr) throw cpErr;

  return { ...(condition as StabilityCondition), checkpoints: (checkpoints || []) as StabilityCheckpoint[] };
}

export async function deleteStabilityCondition(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_stability_conditions").delete().eq("id", id);
  if (error) throw error;
}

// 커스텀 조건(또는 프리셋에 없던 시점)에 체크포인트를 수동으로 추가할 때 사용.
export async function addStabilityCheckpoint(conditionId: string, label: string, dueDate: string): Promise<StabilityCheckpoint> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_checkpoints")
    .insert({ condition_id: conditionId, checkpoint_label: label, due_date: dueDate })
    .select("*")
    .single();
  if (error) throw error;
  return data as StabilityCheckpoint;
}

export async function deleteStabilityCheckpoint(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_stability_checkpoints").delete().eq("id", id);
  if (error) throw error;
}

export async function saveCheckpointResult(
  checkpointId: string,
  patch: { results: StabilityResultItem[]; photo_urls: string[]; memo?: string; recorded_by?: string }
): Promise<StabilityCheckpoint> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_stability_checkpoints")
    .update({
      results: patch.results,
      photo_urls: patch.photo_urls,
      memo: patch.memo || null,
      recorded_by: patch.recorded_by || null,
      status: "완료",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkpointId)
    .select("*")
    .single();
  if (error) throw error;
  return data as StabilityCheckpoint;
}

const STABILITY_BUCKET = "stability-test-photos";

// 체크포인트 시점의 외관 사진 업로드 - 여러 장 첨부 가능(호출부에서 파일별로 반복 호출 후 URL 배열에 추가).
export async function uploadStabilityPhoto(testId: string, checkpointId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${testId}/${checkpointId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseProductionFinal.storage.from(STABILITY_BUCKET).upload(path, file);
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
  const { data } = supabaseProductionFinal.storage.from(STABILITY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function esc(v: any) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 안정성시험 성적서 HTML - documentPdfService의 openPrintDocument/downloadHtmlDocument와 그대로 호환되는
// {html_content, document_code} 형태를 만든다. baseHtml(알러젠 표시 섹션과 결합됨)을 재사용하지 않고
// 이 문서 전용의 가벼운 템플릿을 쓴다.
export function buildStabilityCertificateHtml(test: StabilityTest, conditions: StabilityConditionWithCheckpoints[]): { html_content: string; document_code: string } {
  const documentCode = `STB-${test.formula_code}-${test.lot_no || (test.id || "").slice(0, 8)}`;

  const metaRows = [
    ["처방코드", test.formula_code], ["확정코드", test.confirmed_code || "-"],
    ["시료명", test.sample_name || test.formula_name || "-"], ["Revision", test.revision],
    ["Lot No.", test.lot_no || "-"], ["제조일자", test.manufacture_date || "-"],
    ["보관 위치", test.storage_location || "-"], ["담당자", test.assignee || "-"],
  ]
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="colon">:</td><td class="v">${esc(v)}</td></tr>`)
    .join("");

  const conditionBlocks = conditions
    .map((c) => {
      const rows = (c.checkpoints || [])
        .map((cp) => {
          const overall = computeOverallJudgement(cp.results);
          const itemRows = (cp.results && cp.results.length > 0
            ? cp.results
            : (c.item_templates || []).map((t) => ({ key: t.key, label: t.label, type: t.type, value: "", judgement: "" as const, memo: "" }))
          )
            .map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.value) || "-"}</td><td>${esc(r.judgement) || "-"}</td></tr>`)
            .join("");
          const photos = (cp.photo_urls || [])
            .map((url) => `<img src="${esc(url)}" style="width:90px;height:90px;object-fit:cover;border:1px solid #cbd5e1;border-radius:4px;margin:2px" />`)
            .join("");
          return `
<div class="box">
  <div class="bt">${esc(cp.checkpoint_label)} (예정일 ${esc(cp.due_date)}, ${esc(cp.status)}${cp.status === "완료" ? ` · 종합판정 ${esc(overall)}` : ""})</div>
  <div class="bb" style="text-align:left">
    <table class="grid"><thead><tr><th>항목</th><th>측정값</th><th>판정</th></tr></thead><tbody>${itemRows}</tbody></table>
    ${photos ? `<div style="margin-top:8px">${photos}</div>` : ""}
    ${cp.memo ? `<p style="font-size:11px;color:#475569;margin-top:6px">메모: ${esc(cp.memo)}</p>` : ""}
  </div>
</div>`;
        })
        .join("");
      return `<h3 style="margin-top:22px">${esc(c.condition_label)} <span style="font-weight:400;color:#64748b;font-size:12px">(시작일 ${esc(c.start_date)})</span></h3>${rows}`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>안정성시험 성적서</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,'Malgun Gothic','Noto Sans KR',sans-serif}
.page{width:1040px;margin:24px auto;background:white;padding:40px 44px;border:1px solid #dbe3ef}
.doctitle{text-align:center;font-size:22px;font-weight:800;margin:0 0 20px}
.meta{border-collapse:collapse;margin-bottom:20px}
.meta td{padding:3px 6px;font-size:12px;vertical-align:top}
.meta .k{color:#334155;white-space:nowrap}
.meta .colon{color:#94a3b8;padding:0 8px}
.meta .v{color:#0f172a}
table.grid{width:100%;border-collapse:collapse;margin-top:4px}
table.grid th{background:#e8e6df;color:#1b1f1d;font-weight:700}
table.grid th,table.grid td{border:1px solid #999;padding:6px 8px;font-size:11px;vertical-align:top;line-height:1.55}
.box{border:1px solid #888;margin-top:10px}
.box .bt{background:#f3f4f6;text-align:center;font-weight:800;padding:8px;border-bottom:1px solid #888;font-size:13px}
.box .bb{padding:12px;font-size:12px;line-height:1.7}
.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:14px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
<div class="doctitle">안정성시험 성적서</div>
<table class="meta">${metaRows}</table>
${conditionBlocks || "<p>등록된 시험조건이 없습니다.</p>"}
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;

  return { html_content: html, document_code: documentCode };
}
