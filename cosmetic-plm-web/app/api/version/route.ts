import { NextResponse } from "next/server";

// 클라이언트(UpdateWatcher)가 주기적으로 이 값을 조회해서, 처음 페이지를 열었을 때 번들에 박혀 있던
// 버전과 다르면 "새 배포가 있다"고 판단한다. 캐시되면 옛 값을 계속 돌려줘서 감지가 안 되므로 캐시를 끈다.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { version: process.env.APP_BUILD_VERSION || "dev" },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
