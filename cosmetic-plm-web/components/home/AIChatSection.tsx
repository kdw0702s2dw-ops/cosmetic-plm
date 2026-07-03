"use client";

import { useState } from "react";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export default function AIChatSection() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });
      const data = await res.json();
      if (data.error) {
        setMsgs((m) => [...m, { role: "assistant", text: `오류: ${data.error}` }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", text: data.reply }]);
        setHistory(data.history);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "요청 중 오류가 발생했습니다." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["컨펌 안 된 처방 몇 개야?", "문서 미출력된 처방 알려줘", "최신 규제 알림 요약해줘"];

  return (
    <article className="v50-panel">
      <h2>AI 업무 어시스턴트</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: 360,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {msgs.length === 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              <p style={{ color: "#64748b", fontSize: 12 }}>이렇게 물어보세요:</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="v50-button-light"
                  style={{ textAlign: "left" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#0f172a" : "#f1f5f9",
                color: m.role === "user" ? "#fff" : "#0f172a",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && <div style={{ color: "#64748b", fontSize: 12 }}>답변 생성 중...</div>}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #e2e8f0" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="DB에 대해 물어보세요..."
            style={{ flex: 1, borderRadius: 6, border: "1px solid #e2e8f0", padding: "8px 10px", fontSize: 14 }}
          />
          <button onClick={send} disabled={loading}>
            전송
          </button>
        </div>
      </div>
    </article>
  );
}
