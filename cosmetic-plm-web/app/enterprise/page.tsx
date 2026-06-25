"use client";

import { useMemo, useState } from "react";

type ProjectStatus = "개발중" | "샘플발송" | "양산승인" | "출시" | "보류";
type ModuleKey =
  | "overview"
  | "project"
  | "formula"
  | "ingredient"
  | "ai"
  | "quality"
  | "regulation"
  | "customer"
  | "supplier"
  | "admin";

type EnterpriseProject = {
  id: string;
  project_code: string;
  customer_name: string;
  project_name: string;
  researcher: string;
  status: ProjectStatus;
  progress: number;
  launch_target: string;
  memo: string;
};

const menus: { key: ModuleKey; label: string }[] = [
  { key: "overview", label: "Enterprise Overview" },
  { key: "project", label: "Project Module" },
  { key: "formula", label: "Formula Module" },
  { key: "ingredient", label: "Ingredient Module" },
  { key: "ai", label: "AI Module" },
  { key: "quality", label: "Quality Module" },
  { key: "regulation", label: "Regulation Module" },
  { key: "customer", label: "Customer Module" },
  { key: "supplier", label: "Supplier Module" },
  { key: "admin", label: "Admin Module" },
];

const initialProjects: EnterpriseProject[] = [
  {
    id: "P-001",
    project_code: "26A001",
    customer_name: "ABC 브랜드",
    project_name: "고보습 비건 크림",
    researcher: "홍길동",
    status: "개발중",
    progress: 35,
    launch_target: "2026-08-30",
    memo: "1차 제형 개발 중",
  },
  {
    id: "P-002",
    project_code: "26A002",
    customer_name: "DEF 코스메틱",
    project_name: "저자극 장벽 세럼",
    researcher: "김동욱",
    status: "샘플발송",
    progress: 55,
    launch_target: "2026-09-15",
    memo: "2차 샘플 피드백 대기",
  },
];

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "white",
    padding: "18px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
}

function tableCellStyle(header = false): React.CSSProperties {
  return {
    border: "1px solid #d1d5db",
    padding: "10px",
    textAlign: "left",
    verticalAlign: "top",
    background: header ? "#f3f4f6" : "white",
    fontWeight: header ? "bold" : "normal",
  };
}

function progressByStatus(status: ProjectStatus) {
  if (status === "개발중") return 30;
  if (status === "샘플발송") return 55;
  if (status === "양산승인") return 80;
  if (status === "출시") return 100;
  return 10;
}

function nextProjectCode(projects: EnterpriseProject[]) {
  const year = String(new Date().getFullYear()).slice(2);
  const count = projects.length + 1;
  return `${year}A${String(count).padStart(3, "0")}`;
}

export default function EnterprisePage() {
  const [active, setActive] = useState<ModuleKey>("overview");
  const [projects, setProjects] = useState<EnterpriseProject[]>(initialProjects);
  const [projectSearch, setProjectSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [researcher, setResearcher] = useState("");
  const [projectMemo, setProjectMemo] = useState("");
  const [launchTarget, setLaunchTarget] = useState("");
  const [migrationNote, setMigrationNote] = useState("");

  const filteredProjects = useMemo(() => {
    const keyword = projectSearch.trim().toLowerCase();

    if (!keyword) return projects;

    return projects.filter((project) => {
      const text = [
        project.project_code,
        project.customer_name,
        project.project_name,
        project.researcher,
        project.status,
        project.memo,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [projectSearch, projects]);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      developing: projects.filter((item) => item.status === "개발중").length,
      sample: projects.filter((item) => item.status === "샘플발송").length,
      approved: projects.filter((item) => item.status === "양산승인").length,
      launched: projects.filter((item) => item.status === "출시").length,
    };
  }, [projects]);

  function addEnterpriseProject() {
    if (!customerName || !projectName) {
      alert("고객사와 프로젝트명을 입력하세요.");
      return;
    }

    const code = nextProjectCode(projects);

    const newProject: EnterpriseProject = {
      id: crypto.randomUUID(),
      project_code: code,
      customer_name: customerName,
      project_name: projectName,
      researcher: researcher || "미지정",
      status: "개발중",
      progress: 30,
      launch_target: launchTarget || "",
      memo: projectMemo || "",
    };

    setProjects([newProject, ...projects]);
    setCustomerName("");
    setProjectName("");
    setResearcher("");
    setProjectMemo("");
    setLaunchTarget("");
  }

  function updateProjectStatus(projectId: string, status: ProjectStatus) {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, status, progress: progressByStatus(status) }
          : project
      )
    );
  }

  function exportProjectCsv() {
    const rows = [
      ["project_code", "customer_name", "project_name", "researcher", "status", "progress", "launch_target", "memo"],
      ...filteredProjects.map((project) => [
        project.project_code,
        project.customer_name,
        project.project_name,
        project.researcher,
        project.status,
        project.progress,
        project.launch_target,
        project.memo,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enterprise_project_module.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderOverview() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>PLM Enterprise Edition Phase 3</h1>
          <p style={{ color: "#6b7280" }}>
            Project Module을 Enterprise 구조로 먼저 분리합니다. 현재 단계는 기존 PLM 데이터에 영향을 주지 않는 안전한 독립 검증 단계입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
            <div style={cardStyle()}><strong>전체 프로젝트</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.total}</div></div>
            <div style={cardStyle()}><strong>개발중</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.developing}</div></div>
            <div style={cardStyle()}><strong>샘플발송</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.sample}</div></div>
            <div style={cardStyle()}><strong>양산승인</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.approved}</div></div>
            <div style={cardStyle()}><strong>출시</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{projectStats.launched}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 3 목표</h2>
          <ul>
            <li>프로젝트관리와 개발일정을 하나의 Project Module로 통합</li>
            <li>프로젝트 코드: 년도 + A + 자동체번 구조 검증</li>
            <li>상태를 클릭/선택으로 개발중 → 샘플발송 → 양산승인 → 출시로 변경</li>
            <li>다음 단계에서 Supabase projects 테이블과 실제 연동</li>
          </ul>
        </section>
      </>
    );
  }

  function renderProjectModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Project Module</h1>
          <p style={{ color: "#6b7280" }}>
            Enterprise 구조의 첫 번째 실제 모듈입니다. 기존 프로젝트관리 기능을 분리하기 전 UI/업무 흐름을 검증합니다.
          </p>

          <h2>프로젝트 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="고객사" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={researcher} onChange={(e) => setResearcher(e.target.value)} placeholder="담당 연구원" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={launchTarget} onChange={(e) => setLaunchTarget(e.target.value)} placeholder="목표 출시일 예: 2026-09-30" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={projectMemo} onChange={(e) => setProjectMemo(e.target.value)} placeholder="메모" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addEnterpriseProject} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              프로젝트 등록
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>프로젝트 목록</h2>
            <button onClick={exportProjectCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              CSV Export
            </button>
          </div>

          <input
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="프로젝트 코드, 고객사, 프로젝트명, 담당자 검색"
            style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }}
          />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>프로젝트 코드</th>
                <th style={tableCellStyle(true)}>고객사</th>
                <th style={tableCellStyle(true)}>프로젝트명</th>
                <th style={tableCellStyle(true)}>담당</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>진행률</th>
                <th style={tableCellStyle(true)}>목표출시</th>
                <th style={tableCellStyle(true)}>메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td style={tableCellStyle()}>{project.project_code}</td>
                  <td style={tableCellStyle()}>{project.customer_name}</td>
                  <td style={tableCellStyle()}>{project.project_name}</td>
                  <td style={tableCellStyle()}>{project.researcher}</td>
                  <td style={tableCellStyle()}>
                    <select value={project.status} onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}>
                      <option value="개발중">개발중</option>
                      <option value="샘플발송">샘플발송</option>
                      <option value="양산승인">양산승인</option>
                      <option value="출시">출시</option>
                      <option value="보류">보류</option>
                    </select>
                  </td>
                  <td style={tableCellStyle()}>
                    <div style={{ background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", height: "10px" }}>
                      <div style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#059669" : "#2563eb", height: "10px" }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{project.progress}%</div>
                  </td>
                  <td style={tableCellStyle()}>{project.launch_target || "-"}</td>
                  <td style={tableCellStyle()}>{project.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  }

  function renderSimpleModule(title: string, items: string[]) {
    return (
      <section style={cardStyle()}>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p style={{ color: "#6b7280" }}>다음 Phase에서 실제 데이터 연동과 모듈 분리를 진행합니다.</p>
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    );
  }

  function renderActive() {
    if (active === "overview") return renderOverview();
    if (active === "project") return renderProjectModule();
    if (active === "formula") return renderSimpleModule("Formula Module", ["처방관리", "Version Control", "Revision History", "Formula Lock", "Formula Sheet"]);
    if (active === "ingredient") return renderSimpleModule("Ingredient Module", ["원료마스터", "성분마스터", "Global Ingredient", "원료조성표", "CSV Import"]);
    if (active === "ai") return renderSimpleModule("AI Module", ["AI 처방", "AI 성분분석", "AI 규제", "AI 안정성", "AI BOM", "AI Copilot"]);
    if (active === "quality") return renderSimpleModule("Quality Module", ["원료문서센터", "Supplier Portal", "안정도관리", "AI 안정성예측"]);
    if (active === "regulation") return renderSimpleModule("Regulation Module", ["규제검증", "국가별규제", "Regulation Update", "AI 규제질의", "PIF/CPSR"]);
    if (active === "customer") return renderSimpleModule("Customer Module", ["Customer Portal Lite", "고객제출패키지", "샘플 피드백", "고객별 현황"]);
    if (active === "supplier") return renderSimpleModule("Supplier Module", ["Supplier Portal Lite", "문서 요청", "만료 알림", "업로드 양식"]);
    return renderSimpleModule("Admin Module", ["사용자/권한", "Audit Log", "System Health", "Production Readiness", "Backup"]);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial", display: "grid", gridTemplateColumns: "280px 1fr" }}>
      <aside style={{ background: "#111827", color: "white", padding: "22px", height: "100vh", position: "sticky", top: 0, boxSizing: "border-box", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>PLM Enterprise</h2>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Phase 3 Project Module</p>

        {menus.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              border: 0,
              borderRadius: "10px",
              padding: "10px",
              marginBottom: "8px",
              cursor: "pointer",
              background: active === item.key ? "#2563eb" : "#374151",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {item.label}
          </button>
        ))}

        <textarea
          value={migrationNote}
          onChange={(e) => setMigrationNote(e.target.value)}
          placeholder="전환 메모"
          rows={5}
          style={{ marginTop: "14px", width: "100%", boxSizing: "border-box", borderRadius: "8px", padding: "8px" }}
        />
      </aside>

      <section style={{ padding: "28px", display: "grid", gap: "18px", alignContent: "start", overflowX: "auto" }}>
        {renderActive()}
      </section>
    </main>
  );
}
