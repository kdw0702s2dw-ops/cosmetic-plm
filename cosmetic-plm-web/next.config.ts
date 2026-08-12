import type { NextConfig } from "next";

// 새 배포가 올라오면 값이 바뀌어야 하는 빌드 버전 - Vercel이 자동으로 주는 커밋 SHA가 있으면 그걸 쓰고
// (배포마다 항상 달라짐), 없으면(로컬 실행 등) 빌드 시각으로 대체한다.
// next.config의 env로 넣으면 서버(app/api/version)와 클라이언트 번들 양쪽에 빌드 시점 값이 그대로 박힌다 -
// 그래서 이미 열려있는 탭(옛 번들)의 값과, 새로 배포된 서버가 돌려주는 값을 비교해 업데이트 여부를 판단할 수 있다.
const APP_BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now()}`;

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    APP_BUILD_VERSION,
  },
};

export default nextConfig;