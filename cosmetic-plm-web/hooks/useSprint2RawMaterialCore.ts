"use client";

import { useEffect, useMemo, useState } from "react";
import { buildComponentInciList, componentTotalPercent, deleteSprint2RawComponent, duplicateSprint2RawMaterial, fetchSprint2RawComponents, fetchSprint2RawMaterials, nextRawComponentNo, softDeleteSprint2RawMaterial, syncSprint2RawFromComponents, upsertSprint2RawComponent, upsertSprint2RawMaterial, type RawMaterialComponentCore, type RawMaterialCore } from "@/services/sprint2/rawMaterialCoreService";

const emptyRaw: RawMaterialCore = { raw_code:"", raw_name:"", trade_name:"", raw_type:"SINGLE", manufacturer:"", supplier:"", unit_price:0, currency:"KRW", moq:"", lead_time:"", origin_country:"", inci_kr:"", inci_en:"", inci_cn:"", inci_jp:"", cas_no:"", ec_no:"", function_kr:"", function_en:"", regulatory_note:"", note:"", is_active:true };
const PAGE_SIZE = 20;

export function useSprint2RawMaterialCore() {
  const [rows,setRows]=useState<any[]>([]);
  const [components,setComponents]=useState<RawMaterialComponentCore[]>([]);
  const [raw,setRaw]=useState<RawMaterialCore>(emptyRaw);
  const [component,setComponent]=useState<RawMaterialComponentCore>({raw_code:"",component_no:1,composition_percent:100});
  const [keyword,setKeyword]=useState("");
  const [message,setMessage]=useState("원료관리 Core 준비 완료");
  const [loading,setLoading]=useState(false);
  const [page,setPage]=useState(1);

  const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  const pagedRows=useMemo(()=>rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[rows,page]);
  const componentTotal=componentTotalPercent(components);
  const componentInciKr=buildComponentInciList(components,"kr");
  const componentInciEn=buildComponentInciList(components,"en");

  async function load(k=keyword){setLoading(true);try{const data=await fetchSprint2RawMaterials(k);setRows(data);setPage(1);setMessage(`원료 ${data.length}건 조회 완료 / 20개씩 표시`);}catch(e){setMessage(e instanceof Error?e.message:"원료 조회 오류");}finally{setLoading(false);}}
  async function openRaw(item:any){setRaw({...emptyRaw,...item});const comps=await fetchSprint2RawComponents(item.raw_code);setComponents(comps as RawMaterialComponentCore[]);setComponent({raw_code:item.raw_code,component_no:nextRawComponentNo(comps as RawMaterialComponentCore[]),composition_percent:comps.length===0?100:0});setMessage(`${item.raw_name} 열기 완료`);}
  function newRaw(){const code=`RM-${Date.now().toString().slice(-6)}`;setRaw({...emptyRaw,raw_code:code});setComponents([]);setComponent({raw_code:code,component_no:1,composition_percent:100});setMessage("신규 원료 작성 시작");}
  async function saveRaw(){if(!raw.raw_code||!raw.raw_name){setMessage("원료코드와 원료명은 필수입니다.");return;}setLoading(true);try{const saved=await upsertSprint2RawMaterial(raw);setRaw({...emptyRaw,...saved});await load();setMessage("원료 저장 완료");}catch(e){setMessage(e instanceof Error?e.message:"원료 저장 오류");}finally{setLoading(false);}}
  async function removeRaw(){if(!raw.raw_code||!confirm("원료를 삭제 처리하시겠습니까?"))return;setLoading(true);try{await softDeleteSprint2RawMaterial(raw.raw_code);setRaw(emptyRaw);setComponents([]);await load();setMessage("원료 삭제 처리 완료");}catch(e){setMessage(e instanceof Error?e.message:"원료 삭제 오류");}finally{setLoading(false);}}
  async function copyRaw(){if(!raw.raw_code)return;setLoading(true);try{const saved=await duplicateSprint2RawMaterial(raw,components);await openRaw(saved);await load();setMessage("원료 복사 완료");}catch(e){setMessage(e instanceof Error?e.message:"원료 복사 오류");}finally{setLoading(false);}}
  async function saveComponent(){if(!raw.raw_code){setMessage("먼저 원료를 저장하거나 선택하세요.");return;}setLoading(true);try{await upsertSprint2RawComponent({...component,raw_code:raw.raw_code});const comps=await fetchSprint2RawComponents(raw.raw_code);setComponents(comps as RawMaterialComponentCore[]);setComponent({raw_code:raw.raw_code,component_no:nextRawComponentNo(comps as RawMaterialComponentCore[]),composition_percent:0});setMessage("구성성분 저장 완료");}catch(e){setMessage(e instanceof Error?e.message:"구성성분 저장 오류");}finally{setLoading(false);}}
  async function removeComponent(componentNo:number){setLoading(true);try{await deleteSprint2RawComponent(raw.raw_code,componentNo);setComponents(await fetchSprint2RawComponents(raw.raw_code) as RawMaterialComponentCore[]);setMessage("구성성분 삭제 완료");}catch(e){setMessage(e instanceof Error?e.message:"구성성분 삭제 오류");}finally{setLoading(false);}}
  async function syncFromComponents(){setLoading(true);try{const saved=await syncSprint2RawFromComponents(raw.raw_code);if(saved)setRaw({...emptyRaw,...saved});await load();setMessage("구성성분 기준 INCI/CAS/EC/기능 자동 반영 완료");}catch(e){setMessage(e instanceof Error?e.message:"구성성분 자동 반영 오류");}finally{setLoading(false);}}

  useEffect(()=>{load("");},[]);
  return {rows,pagedRows,page,setPage,totalPages,pageSize:PAGE_SIZE,components,raw,setRaw,component,setComponent,keyword,setKeyword,message,loading,componentTotal,componentInciKr,componentInciEn,load,openRaw,newRaw,saveRaw,removeRaw,copyRaw,saveComponent,removeComponent,syncFromComponents};
}
