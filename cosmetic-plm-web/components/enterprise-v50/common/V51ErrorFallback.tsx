"use client";

import "@/styles/enterprise-v50.css";

export default function V51ErrorFallback({
  title = "화면을 불러오는 중 문제가 발생했습니다.",
  description = "새로고침 후에도 문제가 반복되면 시스템 점검 화면에서 DB 상태를 확인하세요.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="v50-root">
      <div className="v50-content" style={{ minHeight: "100vh" }}>
        <div className="v50-page">
          <section className="v50-hero">
            <div>
              <h1 className="v50-title">{title}</h1>
              <p className="v50-desc">{description}</p>
            </div>
            <div className="v50-flow">
              <a className="v50-button" href="/enterprise">Workspace로 이동</a>
              <a className="v50-button-light" href="/enterprise-v5/system-health">시스템 점검</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
