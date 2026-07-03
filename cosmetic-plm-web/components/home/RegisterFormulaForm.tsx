"use client";

import { useEffect, useState } from "react";
import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

interface FormulaOption {
  formula_code: string;
  revision: string;
  formula_name: string;
}

export default function RegisterFormulaForm({
  onRegistered,
}: {
  onRegistered: (input: { formula_code: string; revision: string; researcher: string; customer: string }) => Promise<{ error: string | null }>;
}) {
  const [options, setOptions] = useState<FormulaOption[]>([]);
  const [selected, setSelected] = useState("");
  const [researcher, setResearcher] = useState("");
  const [customer, setCustomer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabaseProductionFinal
      .from("v_home_recent_formulas")
      .select("formula_code, revision, formula_name")
      .then(({ data }) => setOptions((data as FormulaOption[]) ?? []));
  }, []);

  const submit = async () => {
    if (!selected || !researcher.trim()) {
      setMessage("처방과 담당 연구원은 필수입니다.");
      return;
    }
    const [formula_code, revision] = selected.split("|||");
    setSubmitting(true);
    setMessage(null);
    const res = await onRegistered({ formula_code, revision, researcher, customer });
    setSubmitting(false);
    if (res.error) setMessage(res.error);
    else {
      setMessage("등록되었습니다.");
      setSelected("");
      setResearcher("");
      setCustomer("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        padding: 12,
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        marginBottom: 12,
      }}
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}
      >
        <option value="">처방 선택...</option>
        {options.map((o) => (
          <option key={`${o.formula_code}-${o.revision}`} value={`${o.formula_code}|||${o.revision}`}>
            {o.formula_name} ({o.formula_code}/{o.revision})
          </option>
        ))}
      </select>
      <input
        placeholder="담당 연구원"
        value={researcher}
        onChange={(e) => setResearcher(e.target.value)}
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", width: 120 }}
      />
      <input
        placeholder="고객사"
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", width: 120 }}
      />
      <button onClick={submit} disabled={submitting}>
        진행표에 등록
      </button>
      {message && <span style={{ fontSize: 12, color: "#64748b" }}>{message}</span>}
    </div>
  );
}
