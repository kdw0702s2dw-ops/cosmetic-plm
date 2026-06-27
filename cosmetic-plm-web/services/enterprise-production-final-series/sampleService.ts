"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export async function fetchSamples() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_sample_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSampleRequest(formula: any, customer: string, purpose: string) {
  const sampleCode = `SAMPLE-${new Date().toISOString().slice(2,10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const { data, error } = await supabaseProductionFinal
    .from("gold_sample_requests")
    .insert({
      sample_code: sampleCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      customer,
      purpose,
      due_date: null,
      status: "REQUESTED",
      note: "Created from Enterprise Production Final Series",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSampleStatus(sampleCode: string, status: string) {
  const { error } = await supabaseProductionFinal
    .from("gold_sample_requests")
    .update({ status })
    .eq("sample_code", sampleCode);
  if (error) throw error;
}
