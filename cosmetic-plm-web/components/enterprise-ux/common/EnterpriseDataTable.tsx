"use client";

import type { ReactNode } from "react";

export default function EnterpriseDataTable({ children }: { children: ReactNode }) {
  return (
    <div className="enterprise-v41-table-wrap">
      <table className="enterprise-v41-table">{children}</table>
    </div>
  );
}
