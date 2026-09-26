import { useState } from "react";
import { api } from "../../lib/api";
import ScrollReveal from "../../components/ScrollReveal";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function PatientChatbot() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your Neuro TeleRehab care assistant. Ask me questions about your prescribed exercises, past clinical session summaries, or how to log progress. Please note: I cannot diagnose conditions or modify clinical treatments — for medical changes, consult Dr. Neha Dhanokar.",
    },
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
    <div style={{ maxWidth: 740 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 24 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> AI Care Assistant
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 6 }}>
            Ask About Your Care
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Query your clinical instructions, prescribed exercise forms, and treatment plans in natural language.
          </p>
        </div>
      </ScrollReveal>

      {/* Chat Canvas */}
      <ScrollReveal from="up" delay={80}>
        <div
          className="card"
          style={{
            minHeight: 480,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Chat Header Bar */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--color-surface-subtle)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--color-brand-teal)",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                💬
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>Neuro Assistant</div>
                <div style={{ fontSize: 11, color: "var(--color-brand-emerald)", fontWeight: 500 }}>● Connected to patient context</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--color-ink-faint)" }}>DPDP-Protected</span>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              maxHeight: "440px",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-ink-faint)",
                    marginBottom: 4,
                    padding: "0 4px",
                  }}
                >
                  {m.role === "user" ? "You" : "Care Assistant"}
                </div>
                <div
                  style={{
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, var(--color-brand-teal-light), var(--color-brand-teal))"
                        : "var(--color-surface-subtle)",
                    color: m.role === "user" ? "#FFFFFF" : "var(--color-ink)",
                    padding: "12px 18px",
                    borderRadius:
                      m.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    fontSize: 14,
                    lineHeight: 1.55,
                    border: m.role === "user" ? "none" : "1px solid var(--color-border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: 16, background: "var(--color-surface-subtle)", fontSize: 13, color: "var(--color-ink-muted)" }}>
                Thinking…
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. What exercises am I doing this week? Or how many reps?"
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "12px 20px",
              }}
            />
            <button
              className="btn btn-primary"
              onClick={send}
              disabled={sending || !input.trim()}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "10px 22px",
                whiteSpace: "nowrap",
              }}
            >
              {sending ? "Sending…" : "Ask"}
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
