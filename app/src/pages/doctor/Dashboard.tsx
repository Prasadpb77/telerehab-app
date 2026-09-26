import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { Appointment, AppUser, AvailabilitySlot } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsById, setPatientsById] = useState<Record<string, AppUser>>({});
  const [openSlots, setOpenSlots] = useState<AvailabilitySlot[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newSlotChoice, setNewSlotChoice] = useState("");
  const [whatsappLink, setWhatsappLink] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [{ appointments: appts }, { data: pts }, { data: slots }] = await Promise.all([
        api.appointments.list(),
        supabase.from("users").select("*").eq("role", "patient"),
        supabase
          .from("availability_slots")
          .select("*")
          .eq("is_booked", false)
          .gt("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true }),
      ]);
      setAppointments(appts);
      const map: Record<string, AppUser> = {};
      ((pts as AppUser[]) ?? []).forEach((p) => {
        map[p.id] = p;
      });
      setPatientsById(map);
      setOpenSlots((slots as AvailabilitySlot[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.accept(id);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReschedule(id: string) {
    if (!newSlotChoice) return;
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.reschedule(id, newSlotChoice);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      setReschedulingId(null);
      setNewSlotChoice("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.cancel(id);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = appointments.filter((a) => a.status === "pending");
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
  const today = appointments.filter((a) => a.status === "scheduled" && isToday(a.starts_at));

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header & Status Metrics */}
      <ScrollReveal from="subtle-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
              <span className="badge-dot" /> Clinical Workspace
            </div>
            <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>
              Requests & Today's Schedule
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
              Review pending patient session requests, dispatch confirmations, and launch Google Meet video calls.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/doctor/calendar" className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
              </svg>
              Open Slots & Calendar
            </Link>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-xs)", background: "var(--color-danger-bg)", color: "var(--color-danger)", marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Clinical Metric Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Pending Action Requests</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: pending.length > 0 ? "var(--color-brand-accent)" : "var(--color-ink)" }}>
              {pending.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>Awaiting therapist confirmation</div>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Scheduled for Today</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: "var(--color-brand-teal)" }}>
              {today.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>In-home & TeleRehab sessions</div>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Available Slots Open</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: "var(--color-ink)" }}>
              {openSlots.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>Ready for booking by patients</div>
          </div>
        </div>
      </ScrollReveal>

      {/* Pending Requests Section */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Pending Requests</h2>
          <span className="badge badge-pending">{pending.length}</span>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {pending.length === 0 && (
            <div className="card" style={{ padding: "28px", textAlign: "center" }}>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
                No new pending session requests. All patient requests have been addressed.
              </p>
            </div>
          )}

          {pending.map((a, i) => {
            const patient = patientsById[a.patient_id];
            return (
              <ScrollReveal key={a.id} from="up" delay={i * 60}>
                <div
                  className="card"
                  style={{
                    borderLeft: "4px solid var(--color-brand-accent)",
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <Link
                          to={`/doctor/patients/${a.patient_id}`}
                          style={{ fontSize: 17, fontWeight: 600, color: "var(--color-brand-teal)", textDecoration: "none" }}
                        >
                          {patient?.full_name ?? "Patient"}
                        </Link>
                        <span className="badge badge-pending">Requested Slot</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)", marginBottom: 6 }}>
                        📅 {formatSlot(a.starts_at)}
                      </div>
                      {a.visit_address && (
                        <div style={{ fontSize: 13, color: "var(--color-ink-secondary)", marginBottom: 2 }}>
                          📍 Home Visit: {a.visit_address}
                        </div>
                      )}
                      {a.notes && (
                        <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginTop: 4 }}>
                          Clinical Note: "{a.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <button
                        className="btn btn-primary"
                        disabled={busyId === a.id}
                        onClick={() => handleAccept(a.id)}
                        style={{ padding: "9px 16px" }}
                      >
                        {busyId === a.id ? "Processing…" : "Accept + Create Meet"}
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyId === a.id}
                        onClick={() => handleCancel(a.id)}
                        style={{ padding: "9px 16px" }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {whatsappLink?.id === a.id && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border-subtle)" }}>
                      <a
                        className="btn btn-outline"
                        style={{
                          background: "#E8F8EE",
                          color: "#1E7E34",
                          borderColor: "#C3E6CB",
                          fontSize: 13,
                        }}
                        href={whatsappLink.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        Send WhatsApp Confirmation to Patient →
                      </a>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Today's Schedule Section */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Today's Clinical Schedule</h2>
          <span className="badge badge-scheduled">{today.length} today</span>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {today.length === 0 && (
            <div className="card" style={{ padding: "28px", textAlign: "center" }}>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
                No sessions scheduled for today. Check Calendar to open new slots or inspect upcoming dates.
              </p>
            </div>
          )}

          {today.map((a, i) => {
            const patient = patientsById[a.patient_id];
            return (
              <ScrollReveal key={a.id} from="up" delay={i * 60}>
                <div
                  className="card"
                  style={{
                    borderLeft: "4px solid var(--color-brand-teal)",
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>
                        <Link to={`/doctor/patients/${a.patient_id}`} style={{ color: "var(--color-ink)", textDecoration: "none" }}>
                          {patient?.full_name ?? "Patient"}
                        </Link>
                      </div>
                      <div style={{ fontSize: 14, color: "var(--color-ink-muted)", marginTop: 2 }}>
                        ⏰ {new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {a.visit_address ? ` · 📍 ${a.visit_address}` : " · 💻 TeleRehab Video"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {a.google_meet_url && (
                        <a
                          className="btn btn-primary pulse-active"
                          href={a.google_meet_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                          </svg>
                          Start Meet
                        </a>
                      )}
                      <button
                        className="btn btn-outline"
                        onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyId === a.id}
                        onClick={() => handleCancel(a.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {reschedulingId === a.id && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "16px",
                        background: "var(--color-surface-subtle)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <select
                        value={newSlotChoice}
                        onChange={(e) => setNewSlotChoice(e.target.value)}
                        style={{ maxWidth: 280 }}
                      >
                        <option value="" disabled>
                          Select a new open slot
                        </option>
                        {openSlots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatSlot(s.starts_at)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        disabled={!newSlotChoice || busyId === a.id}
                        onClick={() => handleReschedule(a.id)}
                      >
                        Confirm New Time
                      </button>
                      <button className="btn btn-ghost" onClick={() => setReschedulingId(null)}>
                        Cancel
                      </button>
                    </div>
                  )}

                  {whatsappLink?.id === a.id && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border-subtle)" }}>
                      <a
                        className="btn btn-outline"
                        style={{ background: "#E8F8EE", color: "#1E7E34", borderColor: "#C3E6CB", fontSize: 13 }}
                        href={whatsappLink.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Send WhatsApp Update to Patient →
                      </a>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
