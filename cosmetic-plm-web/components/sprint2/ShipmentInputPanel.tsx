"use client";

import { useState } from "react";
import {
  addShipmentRecord,
  newShipmentDraft,
  FUNCTIONAL_CLAIM_OPTIONS,
  TEST_PROGRESS_OPTIONS,
  type ShipmentRecordInput,
} from "@/services/sprint2/shipmentRecordService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import Toast, { type ToastState } from "@/components/common/Toast";
import CompanyAutocompleteField from "@/components/common/CompanyAutocompleteField";
import "@/styles/enterprise-v50.css";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

/**
 * 출고관리 > 입력 - 출고 건을 새로 등록하는 폼(전체 목록/업체별 보기와 분리된 독립 입력 화면).
 */
export default function ShipmentInputPanel() {
  const auth = useSprint1Auth();
  const canWrite = auth.canWriteProduction;
  const [draft, setDraft] = useState<ShipmentRecordInput>(newShipmentDraft());
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleAdd() {
    setAdding(true);
    try {
      await addShipmentRecord(draft, auth.profile?.email);
      setDraft(newShipmentDraft());
      setToast({ type: "success", text: "출고 등록 완료 - \"전체 목록\" 탭에서 확인할 수 있습니다." });
    } catch (e) {
      setToast({ type: "error", text: e instanceof Error ? e.message : "등록 중 오류가 발생했습니다." });
    } finally {
      setAdding(false);
    }
  }

  if (!canWrite) {
    return <p style={{ color: "#64748b" }}>출고 등록 권한이 없습니다. &quot;전체 목록&quot; 탭에서 조회만 가능합니다.</p>;
  }

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        출고 건을 직접 입력해서 등록합니다. 등록된 내용은 &quot;전체 목록&quot;과 &quot;업체별 보기&quot; 탭에서 확인·수정할 수 있습니다.
      </p>

      <section className="v50-panel">
        <h2>출고 등록</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
          <Field label="출고일">
            <input className="v50-input" type="date" value={draft.shipment_date || ""} onChange={(e) => setDraft({ ...draft, shipment_date: e.target.value || null })} />
          </Field>
          {/* 원료관리의 Manufacturer/Supplier 입력칸과 동일한 형태(업체관리 자동완성 + 그 자리에서
              새 업체 등록) - components/common/CompanyAutocompleteField.tsx 공용 컴포넌트 재사용 */}
          <CompanyAutocompleteField
            label="고객사" preferredCategory="고객사"
            value={draft.customer || ""} companyId={draft.customer_company_id}
            onChange={(patch) => setDraft({ ...draft, customer: patch.value, customer_company_id: patch.companyId })}
          />
          <Field label="수량">
            <input className="v50-input" type="number" value={draft.quantity ?? ""} onChange={(e) => setDraft({ ...draft, quantity: e.target.value === "" ? null : Number(e.target.value) })} />
          </Field>
          <Field label="제품코드">
            <input className="v50-input" value={draft.product_code || ""} onChange={(e) => setDraft({ ...draft, product_code: e.target.value })} />
          </Field>
          <Field label="제품명">
            <input className="v50-input" value={draft.product_name || ""} onChange={(e) => setDraft({ ...draft, product_name: e.target.value })} />
          </Field>
          <Field label="LOT (EXP)">
            <input className="v50-input" value={draft.lot_exp || ""} onChange={(e) => setDraft({ ...draft, lot_exp: e.target.value })} />
          </Field>
          <Field label="기능성">
            <select className="v50-input" value={draft.functional_claim} onChange={(e) => setDraft({ ...draft, functional_claim: e.target.value as ShipmentRecordInput["functional_claim"] })}>
              {FUNCTIONAL_CLAIM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="중금속">
            <select className="v50-input" value={draft.heavy_metal_status} onChange={(e) => setDraft({ ...draft, heavy_metal_status: e.target.value as ShipmentRecordInput["heavy_metal_status"] })}>
              {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="미생물">
            <select className="v50-input" value={draft.microbial_status} onChange={(e) => setDraft({ ...draft, microbial_status: e.target.value as ShipmentRecordInput["microbial_status"] })}>
              {TEST_PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="v50-button" onClick={handleAdd} disabled={adding}>{adding ? "등록 중…" : "출고 등록"}</button>
        </div>
      </section>
    </div>
  );
}
