"use client";

import { ReactNode } from "react";

export default function V51SafePanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="v50-panel">
      <h2>{title}</h2>
      {description && <p style={{ color: "#64748b", lineHeight: 1.6 }}>{description}</p>}
      {children}
    </section>
  );
}

export function V51EmptyState({
  title = "데이터가 없습니다.",
  description = "먼저 데이터를 생성하거나 새로고침을 실행하세요.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <article className="v50-card" style={{ textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 22, fontWeight: 950 }}>{title}</div>
      <p style={{ color: "#64748b", marginTop: 8 }}>{description}</p>
      <a className="v50-button-light" href="/enterprise">Workspace로 돌아가기</a>
    </article>
  );
}

export function translateV51Status(status?: string | null) {
  const map: Record<string, string> = {
    READY: "준비완료",
    WATCH: "검토필요",
    BLOCK: "차단",
    PASS: "통과",
    FAIL: "실패",
    GENERATED: "생성완료",
    DRAFT: "초안",
    PLANNED: "예정",
    IN_PROGRESS: "진행중",
    COMPLETED: "완료",
    RELEASED: "출시완료",
  };
  return map[String(status || "")] || String(status || "-");
}
