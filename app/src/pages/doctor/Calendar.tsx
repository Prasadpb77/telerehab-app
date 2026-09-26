import { useEffect, useState, FormEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Appointment, AppUser, AvailabilitySlot } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function DoctorCalendar() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [openSlots, setOpenSlots] = useState<AvailabilitySlot[]>([]);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [{ appointments }, { data: pts }, { data: slots }] = await Promise.all([
        api.appointments.list(),
        supabase.from("users").select("*").eq("role", "patient"),
        supabase.from("availability_slots").select("*").eq("is_booked", false).order("starts_at", { ascending: true }),
      ]);
      setAppointments(appointments);
      setPatients((pts as AppUser[]) ?? []);
      setOpenSlots((slots as AvailabilitySlot[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSlotError(null);
    setCreatingSlot(true);
    try {
      const starts = new Date(`${slotDate}T${slotTime}`);
      const ends = new Date(starts.getTime() + slotDuration * 60000);
      const { error } = await supabase.from("availability_slots").insert({
        doctor_id: profile.id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      });
      if (error) throw new Error(error.message);
      setSlotDate("");
      setSlotTime("");
      await load();
    } catch (err: any) {
      setSlotError(err.message);
    } finally {
      setCreatingSlot(false);
    }
  }

  async function deleteSlot(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    await load();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const starts = new Date(`${date}T${time}`);
      const ends = new Date(starts.getTime() + durationMin * 60000);
      await api.appointments.create({
        patient_id: patientId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      });
      setPatientId("");
      setDate("");
      setTime("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment? This will also cancel the Google Calendar event.")) return;
    await api.appointments.cancel(id);
    await load();
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Google Calendar & TeleRehab Sync
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>
            Calendar & Slot Management
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Open slots for patient self-booking or schedule a direct appointment with an automated Google Meet video link.
          </p>
        </div>
      </ScrollReveal>

      {/* Two Column Forms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24, marginBottom: 36 }}>
        {/* Form 1: Open Slot for Self-Booking */}
        <ScrollReveal from="up" delay={50}>
          <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>⏱️</span>
              <h3 style={{ fontSize: 17, margin: 0 }}>Open a Booking Slot</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 18 }}>
              Makes a slot visible in the patient booking catalog. Google Meet links are generated when you accept a request.
            </p>

            <form onSubmit={handleCreateSlot} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label>Date</label>
                  <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} required />
                </div>
                <div>
                  <label>Start Time</label>
                  <input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={slotDuration}
                  min={15}
                  step={15}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                />
              </div>

              {slotError && (
                <div style={{ padding: "8px 12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 12, borderRadius: 6 }}>
                  {slotError}
                </div>
              )}

              <button className="btn btn-outline" type="submit" disabled={creatingSlot} style={{ justifyContent: "center" }}>
                {creatingSlot ? "Opening slot…" : "+ Publish Open Slot"}
              </button>
            </form>

            {/* List of currently open slots */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border-subtle)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Active Open Slots ({openSlots.length})
              </div>
              {openSlots.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-faint)", margin: 0 }}>No open slots published.</p>
              ) : (
                <div style={{ display: "grid", gap: 8, maxHeight: "180px", overflowY: "auto" }}>
                  {openSlots.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "var(--color-surface-subtle)",
                        borderRadius: "var(--radius-xs)",
                        fontSize: 13,
                      }}
                    >
                      <span>
                        {new Date(s.starts_at).toLocaleString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "2px 8px", fontSize: 11, color: "var(--color-danger)" }}
                        onClick={() => deleteSlot(s.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Form 2: Direct Schedule + Google Meet creation */}
        <ScrollReveal from="up" delay={100}>
          <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>📅</span>
              <h3 style={{ fontSize: 17, margin: 0 }}>Direct Appointment & Meet Link</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 18 }}>
              Directly books a patient session, synchronises with Google Calendar, and creates a Google Meet video conference.
            </p>

            <form onSubmit={handleCreate} style={{ display: "grid", gap: 14 }}>
              <div>
                <label>Select Patient</label>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                  <option value="" disabled>
                    Choose patient…
                  </option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label>Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>

              <div>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={durationMin}
                  min={15}
                  step={15}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                />
              </div>

              {error && (
                <div style={{ padding: "8px 12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 12, borderRadius: 6 }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={creating || !patientId}
                style={{ justifyContent: "center", marginTop: "auto" }}
              >
                {creating ? "Creating Meet Link…" : "Confirm Appointment & Meet"}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>

      {/* Upcoming Scheduled Appointments */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Upcoming Confirmed Sessions</h2>
          <span className="badge badge-scheduled">
            {appointments.filter((a) => a.status === "scheduled").length} confirmed
          </span>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {appointments.filter((a) => a.status === "scheduled").length === 0 ? (
            <div className="card" style={{ padding: "28px", textAlign: "center" }}>
              <p style={{ color: "var(--color-ink-muted)", margin: 0, fontSize: 14 }}>
                No upcoming confirmed sessions.
              </p>
            </div>
          ) : (
            appointments
              .filter((a) => a.status === "scheduled")
              .map((a, i) => {
                const patient = patients.find((p) => p.id === a.patient_id);
                return (
                  <ScrollReveal key={a.id} from="up" delay={i * 40}>
                    <div
                      className="card"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 20px",
                        borderLeft: "4px solid var(--color-brand-teal)",
                        flexWrap: "wrap",
                        gap: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>
                          {patient?.full_name ?? "Patient"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginTop: 2 }}>
                          📅 {new Date(a.starts_at).toLocaleString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {a.visit_address ? ` · 📍 ${a.visit_address}` : " · 💻 Google Meet"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {a.google_meet_url && (
                          <a className="btn btn-outline" href={a.google_meet_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                            Launch Meet ↗
                          </a>
                        )}
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 13, padding: "8px 12px" }}
                          onClick={() => handleCancel(a.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })
          )}
        </div>
      </section>
    </div>
  );
}
