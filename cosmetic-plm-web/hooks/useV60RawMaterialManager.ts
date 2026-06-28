"use client";

import { useEffect, useState } from "react";
import {
  deleteRawComponent,
  deleteRawMaterial,
  fetchRawComponents,
  fetchRawMaterials,
  syncRawInciFromComponents,
  upsertRawComponent,
  upsertRawMaterial,
} from "@/services/enterprise-v60/operationalCoreService";
import type { RawMaterialMaster, RawMaterialComponent } from "@/types/enterpriseV60Operational";

const emptyRaw: RawMaterialMaster = {
  raw_code: "",
  raw_name: "",
  trade_name: "",
  raw_type: "SINGLE",
  supplier: "",
  manufacturer: "",
  unit_price: 0,
  currency: "KRW",
  moq: "",
  lead_time: "",
  inci_kr: "",
  inci_en: "",
  inci_cn: "",
  inci_jp: "",
  cas_no: "",
  ec_no: "",
  function_kr: "",
  function_en: "",
  note: "",
};

export function useV60RawMaterialManager() {
  const [rows, setRows] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [form, setForm] = useState<RawMaterialMaster>(emptyRaw);
  const [componentForm, setComponentForm] = useState<RawMaterialComponent>({
    raw_code: "",
    component_no: 1,
    composition_percent: 100,
  });
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("원료관리 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load(k = keyword) {
    setLoading(true);
    try {
      const data = await fetchRawMaterials(k);
      setRows(data);
      setMessage(`원료 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function select(raw: any) {
    setForm({ ...emptyRaw, ...raw });
    setComponentForm((prev) => ({ ...prev, raw_code: raw.raw_code }));
    const comps = await fetchRawComponents(raw.raw_code);
    setComponents(comps);
    setMessage(`${raw.raw_name} 선택 완료`);
  }

  async function saveRaw() {
    if (!form.raw_code || !form.raw_name) {
      setMessage("원료코드와 원료명은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const saved = await upsertRawMaterial(form);
      await select(saved);
      await load();
      setMessage("원료 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeRaw(rawCode: string) {
    if (!confirm("원료와 구성성분을 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await deleteRawMaterial(rawCode);
      setForm(emptyRaw);
      setComponents([]);
      await load();
      setMessage("원료 삭제 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveComponent() {
    if (!form.raw_code) {
      setMessage("먼저 원료를 저장 또는 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      await upsertRawComponent({ ...componentForm, raw_code: form.raw_code });
      const comps = await fetchRawComponents(form.raw_code);
      setComponents(comps);
      setComponentForm({ raw_code: form.raw_code, component_no: comps.length + 1, composition_percent: 0 });
      setMessage("구성성분 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "구성성분 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeComponent(componentNo: number) {
    setLoading(true);
    try {
      await deleteRawComponent(form.raw_code, componentNo);
      setComponents(await fetchRawComponents(form.raw_code));
      setMessage("구성성분 삭제 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "구성성분 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function syncInci() {
    setLoading(true);
    try {
      const saved = await syncRawInciFromComponents(form.raw_code);
      if (saved) setForm({ ...emptyRaw, ...saved });
      await load();
      setMessage("구성성분 기준 INCI/기능 자동 반영 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "INCI 자동 반영 오류");
    } finally {
      setLoading(false);
    }
  }

  function newRaw() {
    const code = `RM-${Date.now().toString().slice(-6)}`;
    setForm({ ...emptyRaw, raw_code: code });
    setComponents([]);
    setComponentForm({ raw_code: code, component_no: 1, composition_percent: 100 });
  }

  useEffect(() => { load(""); }, []);

  return {
    rows, components, form, setForm, componentForm, setComponentForm, keyword, setKeyword,
    message, loading, load, select, saveRaw, removeRaw, saveComponent, removeComponent, syncInci, newRaw
  };
}
