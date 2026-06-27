"use client";

import type { ReactNode } from "react";
import "@/styles/enterprise-v50.css";

export default function V51StandaloneShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
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
            <a className="v50-button" href="/enterprise">통합 Workspace로 이동</a>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
