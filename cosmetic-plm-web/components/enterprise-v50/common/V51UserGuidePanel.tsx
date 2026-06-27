"use client";

import "@/styles/enterprise-v50.css";

const steps = [
  ["1", "AI 도우미", "제품 컨셉을 입력하고 AI 처방 초안을 생성합니다."],
  ["2", "처방관리 PRO", "처방을 선택하고 원료, 함량, 검증, 원가, 문서를 관리합니다."],
  ["3", "스마트 처방엔진", "총합, 원가, pH, 점도, 전성분, Batch 소요량을 확인합니다."],
  ["4", "스마트 문서·Batch", "스마트 리포트, 문서 패키지, Batch를 생성합니다."],
  ["5", "출시 준비도 PRO", "Go/No-Go 출시 판단을 실행합니다."],
  ["6", "시스템 점검", "핵심 DB와 릴리즈 적용 상태를 점검합니다."],
];

export default function V51UserGuidePanel() {
  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">v5.1 사용 가이드</h1>
          <p className="v50-desc">처음 사용하는 연구원도 순서대로 따라 할 수 있는 업무 흐름입니다.</p>
        </div>
        <a className="v50-button" href="/enterprise">Workspace 시작</a>
      </section>

      <section className="v50-grid-3">
        {steps.map(([no, title, desc]) => (
          <article key={no} className="v50-card">
            <div className="v50-badge">{no}</div>
            <h3>{title}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>{desc}</p>
          </article>
        ))}
      </section>

      <section className="v50-panel" style={{ marginTop: 18 }}>
        <h2>추천 테스트 순서</h2>
        <ol style={{ lineHeight: 1.9, color: "#334155" }}>
          <li>시스템 점검에서 주요 테이블 상태를 확인합니다.</li>
          <li>AI 도우미에서 처방을 하나 생성합니다.</li>
          <li>처방관리 PRO에서 해당 처방을 열고 함량을 수정합니다.</li>
          <li>스마트 처방엔진에서 총합과 전성분을 확인합니다.</li>
          <li>스마트 문서·Batch에서 문서 패키지와 Batch를 생성합니다.</li>
          <li>출시 준비도 PRO에서 Go/No-Go를 계산합니다.</li>
        </ol>
      </section>
    </div>
  );
}
