import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ScrollReveal from "../../components/ScrollReveal";

interface ReminderRow {
  id: string;
  appointment_id: string;
  whatsapp_url: string;
  created_at: string;
  sent_at: string | null;
  appointments?: {
    starts_at: string;
    ends_at: string;
    visit_address: string | null;
    users?: { full_name: string; phone: string | null };
  };
}

export default function DoctorReminders() {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { reminders } = (await api.doctor.reminders()) as { reminders: ReminderRow[] };
      setReminders(reminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reminders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markSent(id: string) {
    setBusyId(id);
    try {
      await api.doctor.markReminderSent(id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-pending" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Auto-generated daily
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>Reminders to Send</h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Reminder links for sessions happening in the next 24 hours. Click a link to open WhatsApp, send it,
            then mark it as sent. Nothing is ever sent automatically.
          </p>
        </div>
      </ScrollReveal>

      {error && (
        <div style={{ padding: "12px 16px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "var(--radius-xs)", marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {loading ? (
          <p style={{ color: "var(--color-ink-muted)" }}>Loading reminders…</p>
        ) : reminders.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>✅</div>
            <h3 style={{ fontSize: 17, marginBottom: 6 }}>No reminders pending</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
              There are no upcoming sessions needing a reminder right now.
            </p>
          </div>
        ) : (
          reminders.map((r, i) => {
            const appt = r.appointments;
            const patientName = appt?.users?.full_name ?? "Patient";
            return (
              <ScrollReveal key={r.id} from="up" delay={i * 50}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-brand-accent)", padding: "18px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>{patientName}</div>
                      <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginTop: 2 }}>
                        {appt
                          ? `📅 ${new Date(appt.starts_at).toLocaleString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}`
                          : "Session"}
                        {appt?.visit_address ? ` · 📍 ${appt.visit_address}` : ""}
                      </div>
                      {!appt?.users?.phone && (
                        <div style={{ fontSize: 12, color: "var(--color-warning)", marginTop: 4 }}>
                          No phone number on file — cannot send via WhatsApp.
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a
                        className="btn btn-outline"
                        href={r.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: "#E8F8EE", color: "#1E7E34", borderColor: "#C3E6CB", fontSize: 13 }}
                      >
                        Open WhatsApp
                      </a>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 13, padding: "8px 14px" }}
                        disabled={busyId === r.id}
                        onClick={() => markSent(r.id)}
                      >
                        {busyId === r.id ? "Saving…" : "Mark as sent"}
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })
        )}
      </div>
    </div>
  );
}