"use client";

import { useMemo, useState } from "react";

type ProjectStatus = "개발중" | "샘플발송" | "양산승인" | "출시" | "보류";
type FormulaStatus = "Draft" | "Review" | "Approved" | "Released" | "Locked";
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

type EnterpriseFormula = {
  id: string;
  formula_code: string;
  formula_name: string;
  version: string;
  project_code: string;
  status: FormulaStatus;
  total_percent: number;
  material_cost: number;
  is_locked: boolean;
  revision_note: string;
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

const initialFormulas: EnterpriseFormula[] = [
  {
    id: "F-001",
    formula_code: "FC-001",
    formula_name: "고보습 비건 크림 1차",
    version: "1.0",
    project_code: "26A001",
    status: "Draft",
    total_percent: 100,
    material_cost: 4280,
    is_locked: false,
    revision_note: "초기 처방",
  },
  {
    id: "F-002",
    formula_code: "FC-002",
    formula_name: "저자극 장벽 세럼 2차",
    version: "2.0",
    project_code: "26A002",
    status: "Review",
    total_percent: 100,
    material_cost: 5150,
    is_locked: false,
    revision_note: "고객 피드백 반영",
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

function nextFormulaCode(formulas: EnterpriseFormula[]) {
  return `FC-${String(formulas.length + 1).padStart(3, "0")}`;
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

  const [formulas, setFormulas] = useState<EnterpriseFormula[]>(initialFormulas);
  const [formulaSearch, setFormulaSearch] = useState("");
  const [formulaProjectCode, setFormulaProjectCode] = useState("26A001");
  const [formulaName, setFormulaName] = useState("");
  const [formulaCost, setFormulaCost] = useState("");
  const [formulaNote, setFormulaNote] = useState("");
  const [migrationNote, setMigrationNote] = useState("");

  const filteredProjects = useMemo(() => {
    const keyword = projectSearch.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter((project) =>
      [project.project_code, project.customer_name, project.project_name, project.researcher, project.status, project.memo]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [projectSearch, projects]);

  const filteredFormulas = useMemo(() => {
    const keyword = formulaSearch.trim().toLowerCase();
    if (!keyword) return formulas;
    return formulas.filter((formula) =>
      [formula.formula_code, formula.formula_name, formula.version, formula.project_code, formula.status, formula.revision_note]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [formulaSearch, formulas]);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      developing: projects.filter((item) => item.status === "개발중").length,
      sample: projects.filter((item) => item.status === "샘플발송").length,
      approved: projects.filter((item) => item.status === "양산승인").length,
      launched: projects.filter((item) => item.status === "출시").length,
    };
  }, [projects]);

  const formulaStats = useMemo(() => {
    return {
      total: formulas.length,
      draft: formulas.filter((item) => item.status === "Draft").length,
      review: formulas.filter((item) => item.status === "Review").length,
      approved: formulas.filter((item) => item.status === "Approved").length,
      released: formulas.filter((item) => item.status === "Released").length,
      locked: formulas.filter((item) => item.is_locked).length,
      avgCost: formulas.length ? formulas.reduce((sum, item) => sum + item.material_cost, 0) / formulas.length : 0,
    };
  }, [formulas]);

  function addEnterpriseProject() {
    if (!customerName || !projectName) {
      alert("고객사와 프로젝트명을 입력하세요.");
      return;
    }

    const newProject: EnterpriseProject = {
      id: crypto.randomUUID(),
      project_code: nextProjectCode(projects),
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
        project.id === projectId ? { ...project, status, progress: progressByStatus(status) } : project
      )
    );
  }

  function addEnterpriseFormula() {
    if (!formulaName) {
      alert("처방명을 입력하세요.");
      return;
    }

    const newFormula: EnterpriseFormula = {
      id: crypto.randomUUID(),
      formula_code: nextFormulaCode(formulas),
      formula_name: formulaName,
      version: "1.0",
      project_code: formulaProjectCode,
      status: "Draft",
      total_percent: 100,
      material_cost: Number(formulaCost || 0),
      is_locked: false,
      revision_note: formulaNote || "신규 처방",
    };

    setFormulas([newFormula, ...formulas]);
    setFormulaName("");
    setFormulaCost("");
    setFormulaNote("");
  }

  function updateFormulaStatus(formulaId: string, status: FormulaStatus) {
    setFormulas((prev) =>
      prev.map((formula) =>
        formula.id === formulaId
          ? {
              ...formula,
              status,
              is_locked: status === "Locked" || status === "Released" ? true : formula.is_locked,
            }
          : formula
      )
    );
  }

  function cloneFormula(formulaId: string) {
    const source = formulas.find((formula) => formula.id === formulaId);
    if (!source) return;

    const nextVersionNumber = Number(source.version || "1") + 0.1;

    const cloned: EnterpriseFormula = {
      ...source,
      id: crypto.randomUUID(),
      formula_code: nextFormulaCode(formulas),
      version: nextVersionNumber.toFixed(1),
      status: "Draft",
      is_locked: false,
      revision_note: `Clone from ${source.formula_code} v${source.version}`,
    };

    setFormulas([cloned, ...formulas]);
  }

  function toggleFormulaLock(formulaId: string) {
    setFormulas((prev) =>
      prev.map((formula) =>
        formula.id === formulaId
          ? {
              ...formula,
              is_locked: !formula.is_locked,
              status: !formula.is_locked ? "Locked" : "Draft",
            }
          : formula
      )
    );
  }

  function exportCsv(filename: string, rows: (string | number | boolean)[][]) {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportProjectCsv() {
    exportCsv("enterprise_project_module.csv", [
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
    ]);
  }

  function exportFormulaCsv() {
    exportCsv("enterprise_formula_module.csv", [
      ["formula_code", "formula_name", "version", "project_code", "status", "total_percent", "material_cost", "is_locked", "revision_note"],
      ...filteredFormulas.map((formula) => [
        formula.formula_code,
        formula.formula_name,
        formula.version,
        formula.project_code,
        formula.status,
        formula.total_percent,
        formula.material_cost,
        formula.is_locked,
        formula.revision_note,
      ]),
    ]);
  }

  function renderOverview() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>PLM Enterprise Edition Phase 4</h1>
          <p style={{ color: "#6b7280" }}>
            Project Module에 이어 Formula Module을 Enterprise 구조로 분리합니다. 현재는 기존 PLM과 독립된 안전한 검증 단계입니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
            <div style={cardStyle()}><strong>프로젝트</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{projectStats.total}</div></div>
            <div style={cardStyle()}><strong>처방</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{formulaStats.total}</div></div>
            <div style={cardStyle()}><strong>검토중</strong><div style={{ fontSize: "32px", fontWeight: "bold" }}>{formulaStats.review}</div></div>
            <div style={cardStyle()}><strong>배포/잠금</strong><div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>{formulaStats.locked}</div></div>
            <div style={cardStyle()}><strong>평균 원가</strong><div style={{ fontSize: "28px", fontWeight: "bold" }}>{formulaStats.avgCost.toFixed(0)}</div></div>
          </div>
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Phase 4 목표</h2>
          <ul>
            <li>Formula Module 독립 UI 검증</li>
            <li>처방 코드 자동 생성</li>
            <li>Version / Clone / Status / Lock 흐름 검증</li>
            <li>다음 단계에서 실제 Supabase formulas, formula_items와 연결</li>
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

          <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="프로젝트 코드, 고객사, 프로젝트명, 담당자 검색" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />

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

  function renderFormulaModule() {
    return (
      <>
        <section style={cardStyle()}>
          <h1 style={{ marginTop: 0 }}>Formula Module</h1>
          <p style={{ color: "#6b7280" }}>
            처방관리, Version Control, Revision Clone, Formula Lock 흐름을 Enterprise 구조로 분리하기 위한 검증 화면입니다.
          </p>

          <h2>처방 등록</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "820px" }}>
            <select value={formulaProjectCode} onChange={(e) => setFormulaProjectCode(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
              {projects.map((project) => (
                <option key={project.id} value={project.project_code}>
                  {project.project_code} / {project.customer_name} / {project.project_name}
                </option>
              ))}
            </select>
            <input value={formulaName} onChange={(e) => setFormulaName(e.target.value)} placeholder="처방명" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <input value={formulaCost} onChange={(e) => setFormulaCost(e.target.value)} placeholder="원료원가 원/kg" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <textarea value={formulaNote} onChange={(e) => setFormulaNote(e.target.value)} placeholder="Revision Note" rows={3} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} />
            <button onClick={addEnterpriseFormula} style={{ border: 0, borderRadius: "8px", padding: "11px 14px", background: "#7c3aed", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              처방 등록
            </button>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0 }}>처방 목록</h2>
            <button onClick={exportFormulaCsv} style={{ border: 0, borderRadius: "8px", padding: "9px 12px", background: "#059669", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              CSV Export
            </button>
          </div>

          <input value={formulaSearch} onChange={(e) => setFormulaSearch(e.target.value)} placeholder="처방코드, 처방명, 프로젝트코드 검색" style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", width: "100%", boxSizing: "border-box", marginBottom: "12px" }} />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableCellStyle(true)}>처방코드</th>
                <th style={tableCellStyle(true)}>처방명</th>
                <th style={tableCellStyle(true)}>Version</th>
                <th style={tableCellStyle(true)}>프로젝트</th>
                <th style={tableCellStyle(true)}>상태</th>
                <th style={tableCellStyle(true)}>총합%</th>
                <th style={tableCellStyle(true)}>원료원가</th>
                <th style={tableCellStyle(true)}>LOCK</th>
                <th style={tableCellStyle(true)}>Revision Note</th>
                <th style={tableCellStyle(true)}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormulas.map((formula) => (
                <tr key={formula.id}>
                  <td style={tableCellStyle()}>{formula.formula_code}</td>
                  <td style={tableCellStyle()}>{formula.formula_name}</td>
                  <td style={tableCellStyle()}>{formula.version}</td>
                  <td style={tableCellStyle()}>{formula.project_code}</td>
                  <td style={tableCellStyle()}>
                    <select value={formula.status} onChange={(e) => updateFormulaStatus(formula.id, e.target.value as FormulaStatus)}>
                      <option value="Draft">Draft</option>
                      <option value="Review">Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Released">Released</option>
                      <option value="Locked">Locked</option>
                    </select>
                  </td>
                  <td style={{ ...tableCellStyle(), color: Math.abs(formula.total_percent - 100) < 0.0001 ? "green" : "red", fontWeight: "bold" }}>
                    {formula.total_percent.toFixed(4)}
                  </td>
                  <td style={tableCellStyle()}>{formula.material_cost.toLocaleString()}</td>
                  <td style={{ ...tableCellStyle(), color: formula.is_locked ? "red" : "green", fontWeight: "bold" }}>
                    {formula.is_locked ? "LOCKED" : "EDITABLE"}
                  </td>
                  <td style={tableCellStyle()}>{formula.revision_note}</td>
                  <td style={tableCellStyle()}>
                    <button onClick={() => cloneFormula(formula.id)} style={{ marginRight: "6px" }}>Clone</button>
                    <button onClick={() => toggleFormulaLock(formula.id)}>{formula.is_locked ? "Unlock" : "Lock"}</button>
                  </td>
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
    if (active === "formula") return renderFormulaModule();
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
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Phase 4 Formula Module</p>

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
