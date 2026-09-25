import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { AppUser } from "../../types/db";

interface Msg { role: "user" | "assistant"; content: string; }

export default function DoctorChatbot() {
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [patientId, setPatientId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("users").select("*").eq("role", "patient").then(({ data }) => setPatients((data as AppUser[]) ?? []));
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

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Patient assistant</h1>
      <label style={{ display: "block", marginTop: 12, marginBottom: 16 }}>
        Patient
        <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setMessages([]); }}>
          <option value="" disabled>Select a patient</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </label>

      <div className="card" style={{ minHeight: 380, display: "flex", flexDirection: "column" }}>
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
            disabled={!patientId}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={patientId ? "e.g. Summarize their last 3 sessions" : "Select a patient first"}
          />
          <button className="btn btn-primary" onClick={send} disabled={sending || !patientId}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
