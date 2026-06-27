"use client";

import "@/styles/enterprise-v50.css";

export default function V51Loading({ message = "화면을 준비하고 있습니다." }: { message?: string }) {
  return (
    <div className="v50-root">
      <div className="v50-content" style={{ minHeight: "100vh" }}>
        <div className="v50-page">
          <section className="v50-hero">
            <div>
              <h1 className="v50-title">잠시만 기다려주세요</h1>
              <p className="v50-desc">{message}</p>
            </div>
          </section>
          <section className="v50-grid-4">
            {[1, 2, 3, 4].map((x) => (
              <article key={x} className="v50-card">
                <div style={{ height: 14, background: "#e2e8f0", borderRadius: 999, marginBottom: 14 }} />
                <div style={{ height: 32, background: "#f1f5f9", borderRadius: 12 }} />
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
