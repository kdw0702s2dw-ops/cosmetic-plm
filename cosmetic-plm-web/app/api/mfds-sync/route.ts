import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서버 전용 - service_role 키 + MFDS_COSMETIC_API_KEY. 클라이언트 번들에는 절대 포함되지 않음
// (app/api 라우트는 서버에서만 실행됨 - admin/users route와 동일 패턴)
let cachedAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!cachedAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("서버에 Supabase 환경변수(SUPABASE_SERVICE_ROLE_KEY)가 설정되어 있지 않습니다.");
    cachedAdmin = createClient(url, key);
  }
  return cachedAdmin;
}

// staging 테이블 쓰기 권한(RLS)과 동일하게 Admin/QA만 동기화를 실행할 수 있게 한다
async function requireAdminOrQa(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: NextResponse.json({ error: "유효하지 않은 인증 정보입니다." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("plm_user_profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile || !["Admin", "QA"].includes(profile.role) || !profile.is_active) {
    return { error: NextResponse.json({ error: "Admin 또는 QA 권한이 필요합니다." }, { status: 403 }) };
  }
  return {};
}

const REGION_MAP: Record<string, string> = {
  한국: "KR", EU: "EU", 중국: "CN", 아세안: "ASEAN", 일본: "JP", 미국: "US",
  대만: "TW", 아르헨티나: "AR", 브라질: "BR", 캐나다: "CA",
};

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;
function extractValidCas(raw: unknown): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[,\r\n]+/)
    .map((c) => c.trim())
    .filter((c) => CAS_RE.test(c));
}
function normalize(s: unknown): string {
  if (!s) return "";
  return String(s).replace(/\s+/g, " ").trim().toLowerCase();
}

async function fetchMfdsPages(url: string, serviceKey: string) {
  const PAGE_SIZE = 500;
  let pageNo = 1;
  let totalCount: number | null = null;
  const items: any[] = [];
  while (true) {
    const full = `${url}?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}&type=json`;
    const res = await fetch(full);
    const json = await res.json();
    if (json?.header?.resultCode !== "00") {
      throw new Error(`MFDS API 오류 (page ${pageNo}): ${json?.header?.resultCode} ${json?.header?.resultMsg}`);
    }
    const body = json.body;
    if (totalCount === null) totalCount = body.totalCount;
    const pageItems = body.items || [];
    items.push(...pageItems);
    if (pageItems.length === 0 || items.length >= (totalCount ?? 0)) break;
    pageNo++;
  }
  return items;
}

export async function POST(req: NextRequest) {
  let supabaseAdmin: SupabaseClient;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "서버 설정 오류" }, { status: 500 });
  }

  const check = await requireAdminOrQa(req);
  if (check.error) return check.error;

  const serviceKey = process.env.MFDS_COSMETIC_API_KEY;
  if (!serviceKey) return NextResponse.json({ error: "MFDS_COSMETIC_API_KEY가 서버에 설정되어 있지 않습니다." }, { status: 500 });

  try {
    // 1) 우리 시스템의 INCI 목록 (원료 상위 필드 + 구성성분 전체, distinct)
    const [{ data: rawMaterials, error: rmErr }, { data: components, error: compErr }] = await Promise.all([
      supabaseAdmin.from("plm_raw_materials").select("inci_kr, inci_en, cas_no").eq("is_active", true),
      supabaseAdmin.from("plm_raw_material_components").select("inci_kr, inci_en, cas_no, raw_code"),
    ]);
    if (rmErr) throw rmErr;
    if (compErr) throw compErr;

    const ourKrSet = new Set<string>();
    const ourEnSet = new Set<string>();
    const ourCasSet = new Set<string>();
    const codesByKr = new Map<string, Set<string>>();
    const codesByEn = new Map<string, Set<string>>();
    const codesByCas = new Map<string, Set<string>>();
    const addCode = (map: Map<string, Set<string>>, key: string, code: string | null | undefined) => {
      if (!key || !code) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(code);
    };
    for (const r of [...(rawMaterials || []), ...(components || [])] as any[]) {
      const kr = normalize(r.inci_kr);
      const en = normalize(r.inci_en);
      if (kr) { ourKrSet.add(kr); addCode(codesByKr, kr, r.raw_code); }
      if (en) { ourEnSet.add(en); addCode(codesByEn, en, r.raw_code); }
      for (const c of extractValidCas(r.cas_no)) { ourCasSet.add(c); addCode(codesByCas, c, r.raw_code); }
    }

    function matchAndCodes(krName: string, enName: string, casRaw: unknown) {
      const kr = normalize(krName);
      const en = normalize(enName);
      const cas = extractValidCas(casRaw);
      const krHit = kr && ourKrSet.has(kr);
      const enHit = en && ourEnSet.has(en);
      const casHits = cas.filter((c) => ourCasSet.has(c));
      const hit = krHit || enHit || casHits.length > 0;
      if (!hit) return null;
      const matchType = [krHit && "KR", enHit && "EN", casHits.length > 0 && "CAS"].filter(Boolean).join("+");
      const codes = new Set<string>();
      if (krHit) for (const c of codesByKr.get(kr) || []) codes.add(c);
      if (enHit) for (const c of codesByEn.get(en) || []) codes.add(c);
      for (const cas1 of casHits) for (const c of codesByCas.get(cas1) || []) codes.add(c);
      return { matchType, codes: Array.from(codes) };
    }

    // 2) MFDS API2/API3 전량 호출 + 매칭
    const api2 = await fetchMfdsPages("https://apis.data.go.kr/1471000/CsmtcsUseRstrcInfoService/getCsmtcsUseRstrcInfoService", serviceKey);
    const api3 = await fetchMfdsPages("https://apis.data.go.kr/1471000/CsmtcsUseRstrcInfoService/getCsmtcsUseRstrcNatnInfoService", serviceKey);

    const rowsToInsert: any[] = [];

    for (const item of api2) {
      const m = matchAndCodes(item.INGR_STD_NAME, item.INGR_ENG_NAME, item.CAS_NO);
      if (!m) continue;
      const regionMapped = REGION_MAP[item.COUNTRY_NAME] || null;
      const regulateType = item.REGULATE_TYPE as string;
      const allowedStatusSuggested = regulateType === "금지" ? "BANNED" : regulateType === "한도" ? "LIMITED" : regulateType === "한도/금지" ? "LIMITED" : "REVIEW_REQUIRED";
      rowsToInsert.push({
        source_api: "MFDS_API2",
        raw_payload: item,
        region_raw: item.COUNTRY_NAME,
        region_mapped: regionMapped,
        ingredient_name_kr: item.INGR_STD_NAME || null,
        ingredient_name_en: item.INGR_ENG_NAME || null,
        cas_no: item.CAS_NO || null,
        match_type: m.matchType,
        matched_raw_material_codes: m.codes,
        regulate_type: regulateType || null,
        allowed_status_suggested: allowedStatusSuggested,
        limit_cond_raw: item.LIMIT_COND || null,
      });
    }

    for (const item of api3) {
      const en = normalize(item.NOTICE_INGR_NAME);
      if (!en || !ourEnSet.has(en)) continue;
      const codes = Array.from(codesByEn.get(en) || []);
      rowsToInsert.push({
        source_api: "MFDS_API3",
        raw_payload: item,
        region_raw: item.COUNTRY_NAME,
        region_mapped: REGION_MAP[item.COUNTRY_NAME] || null,
        ingredient_name_kr: null,
        ingredient_name_en: item.NOTICE_INGR_NAME || null,
        cas_no: null,
        match_type: "EN(NOTICE_INGR_NAME)",
        matched_raw_material_codes: codes,
        regulate_type: null,
        allowed_status_suggested: "REVIEW_REQUIRED",
        limit_cond_raw: item.LIMIT_COND || null,
      });
    }

    // 3) 이미 staging에 있는 동일 항목(중복 재수집 방지) - source_api+region_raw+ingredient_name_kr/en+cas_no 기준
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("plm_regulatory_rules_staging")
      .select("source_api, region_raw, ingredient_name_kr, ingredient_name_en, cas_no");
    if (existingErr) throw existingErr;

    const existingKeys = new Set(
      (existing || []).map((r: any) => [r.source_api, r.region_raw, r.ingredient_name_kr, r.ingredient_name_en, r.cas_no].join("||"))
    );
    const newRows = rowsToInsert.filter(
      (r) => !existingKeys.has([r.source_api, r.region_raw, r.ingredient_name_kr, r.ingredient_name_en, r.cas_no].join("||"))
    );

    if (newRows.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("plm_regulatory_rules_staging").insert(newRows);
      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      api2Total: api2.length,
      api3Total: api3.length,
      api2Matched: rowsToInsert.filter((r) => r.source_api === "MFDS_API2").length,
      api3Matched: rowsToInsert.filter((r) => r.source_api === "MFDS_API3").length,
      inserted: newRows.length,
      skippedDuplicates: rowsToInsert.length - newRows.length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "MFDS 동기화 오류" }, { status: 500 });
  }
}
