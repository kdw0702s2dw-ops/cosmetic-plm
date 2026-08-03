import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서버 전용 - service_role 키. 클라이언트 번들에는 절대 포함되지 않음 (app/api 라우트는 서버에서만 실행)
// 모듈 최상단에서 즉시 생성하면 빌드의 "Collecting page data" 단계에서 이 파일이 평가될 때
// 환경변수가 없을 경우 build 자체가 실패하므로, 요청이 실제로 들어올 때만 생성한다.
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

const ALLOWED_ROLES = ["Admin", "Researcher", "QA", "Viewer", "Production"];

// Authorization: Bearer <access_token> 을 검증해서 호출자가 활성 Admin인지 확인
async function requireAdmin(req: NextRequest) {
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

  if (profileError || !profile || profile.role !== "Admin" || !profile.is_active) {
    return { error: NextResponse.json({ error: "Admin 권한이 필요합니다." }, { status: 403 }) };
  }

  return { callerId: userData.user.id };
}

export async function POST(req: NextRequest) {
  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "서버 설정 오류" }, { status: 500 });
  }

  const check = await requireAdmin(req);
  if (check.error) return check.error;

  const { email, password, role, display_name } = await req.json();

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "올바른 이메일을 입력하세요." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "올바르지 않은 역할입니다." }, { status: 400 });
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "계정 생성 실패" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("plm_user_profiles")
    .upsert({
      id: created.user.id,
      email,
      display_name: display_name || email.split("@")[0],
      role,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (profileError) {
    // 프로필 생성 실패 시 방금 만든 Auth 계정도 롤백
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ user: profile });
}

export async function DELETE(req: NextRequest) {
  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "서버 설정 오류" }, { status: 500 });
  }

  const check = await requireAdmin(req);
  if (check.error) return check.error;

  const { id } = await req.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "삭제할 사용자 id가 필요합니다." }, { status: 400 });
  }
  if (id === check.callerId) {
    return NextResponse.json({ error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await supabaseAdmin
    .from("plm_user_profiles")
    .delete()
    .eq("id", id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
