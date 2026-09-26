import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { AppUser } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function DoctorChatbot() {
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [patientId, setPatientId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .eq("role", "patient")
      .then(({ data }) => setPatients((data as AppUser[]) ?? []));
  }, []);

  async function send() {
    if (!input.trim() || !patientId) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await api.chatbot.send({ message: userMsg.content, patient_id: patientId });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 24 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Clinical AI Copilot
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 6 }}>
            Clinical Assistant
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Query individual patient history, past session clinical notes, and assigned motor therapies.
          </p>
        </div>
      </ScrollReveal>

      {/* Patient Selector */}
      <ScrollReveal from="up" delay={50}>
        <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 8 }}>
            Select Active Patient Context
          </label>
          <select
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setMessages([]);
            }}
            style={{ fontSize: 14 }}
          >
            <option value="" disabled>
              Choose a patient to load their chart into assistant memory…
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.email})
              </option>
            ))}
          </select>
        </div>
      </ScrollReveal>

      {/* Chat Container */}
      <ScrollReveal from="up" delay={100}>
        <div
          className="card"
          style={{
            minHeight: 460,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Header Strip */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--color-surface-subtle)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                  Clinical Note & Rehab Copilot
                </div>
                <div style={{ fontSize: 11, color: selectedPatient ? "var(--color-brand-emerald)" : "var(--color-ink-faint)" }}>
                  {selectedPatient ? `● Active: ${selectedPatient.full_name}` : "○ No patient selected"}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>Doctor Mode</span>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              maxHeight: "400px",
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", margin: "auto", padding: "40px 20px" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
                  {patientId
                    ? `Ready to query records for ${selectedPatient?.full_name}. Ask for session summaries, pain trends, or exercise compliance.`
                    : "Please select a patient above to initiate clinical questions."}
                </p>
              </div>
            )}

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
                <div style={{ fontSize: 11, color: "var(--color-ink-faint)", marginBottom: 4, padding: "0 4px" }}>
                  {m.role === "user" ? "Dr. Neha" : "Clinical AI"}
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
                Retrieving clinical context…
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
              disabled={!patientId}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                patientId
                  ? `Ask about ${selectedPatient?.full_name}'s history (e.g. Summarize their last 2 sessions)`
                  : "Select a patient above first"
              }
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "12px 20px",
              }}
            />
            <button
              className="btn btn-primary"
              onClick={send}
              disabled={sending || !patientId || !input.trim()}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "10px 22px",
                whiteSpace: "nowrap",
              }}
            >
              {sending ? "…" : "Ask AI"}
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
