"use client";

import type { ReactNode } from "react";

export default function EnterprisePageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="enterprise-v41-hero">
      <div>
        <h1 className="enterprise-v41-title">{title}</h1>
        <p className="enterprise-v41-subtitle">{description}</p>
      </div>
      {action}
    </section>
  );
}
