import { useState } from "react";
import { api } from "../../lib/api";

interface Msg { role: "user" | "assistant"; content: string; }

export default function PatientChatbot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me about your exercises, past sessions, or progress. I can't diagnose or change your treatment — for that, message your therapist." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await api.chatbot.send({ message: userMsg.content });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Ask about your care</h1>
      <div className="card" style={{ marginTop: 16, minHeight: 400, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "grid", gap: 12, marginBottom: 16 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--color-primary)" : "#F1EFE8",
                color: m.role === "user" ? "white" : "var(--color-ink)",
                padding: "8px 12px",
                borderRadius: 10,
                maxWidth: "80%",
                fontSize: 14,
              }}
            >
              {m.content}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="e.g. What exercises am I doing this week?"
          />
          <button className="btn btn-primary" onClick={send} disabled={sending}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
