import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { AppUser, SessionNote, PatientExercise, Exercise, Appointment } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

const SITE_URL = "https://telerehab-app.pages.dev";

type ApptWithPay = Appointment & { treatment_plan_id?: string | null; payment_status?: string; payment_amount?: number | null };

function toWhatsAppDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export default function DoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const { profile } = useAuth();
  const [patient, setPatient] = useState<AppUser | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [assignments, setAssignments] = useState<PatientExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [appointments, setAppointments] = useState<ApptWithPay[]>([]);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [regenerating, setRegenerating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [startingMeet, setStartingMeet] = useState(false);
  const [adhocMeetUrl, setAdhocMeetUrl] = useState<string | null>(null);

  const [seriesCount, setSeriesCount] = useState("6");
  const [seriesDate, setSeriesDate] = useState("");
  const [seriesTime, setSeriesTime] = useState("");
  const [seriesPattern, setSeriesPattern] = useState<"weekly" | "twice_weekly" | "custom">("weekly");
  const [seriesGapDays, setSeriesGapDays] = useState("10");
  const [seriesDuration, setSeriesDuration] = useState("30");
  const [seriesLabel, setSeriesLabel] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [seriesResult, setSeriesResult] = useState<{ created: number; requested: number; failures: number } | null>(null);

  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { status: string; amount: string }>>({});
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);

  // Insights profile fields (patients.area / patients.therapy_type).
  const [area, setArea] = useState("");
  const [therapyType, setTherapyType] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  async function loadAll() {
    if (!patientId) return;
    try {
      const [{ data: p }, { data: pr }, { data: n }, { data: a }, { data: lib }, { data: appts }] = await Promise.all([
        supabase.from("users").select("*").eq("id", patientId).single(),
        supabase.from("patients").select("area, therapy_type").eq("user_id", patientId).maybeSingle(),
        supabase.from("session_notes").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("patient_exercises").select("*, exercises(*)").eq("patient_id", patientId),
        supabase.from("exercises").select("*"),
        supabase.from("appointments").select("*").eq("patient_id", patientId).order("starts_at", { ascending: false }),
      ]);
      setPatient(p as AppUser);
      setArea((pr as { area?: string | null } | null)?.area ?? "");
      setTherapyType((pr as { therapy_type?: string | null } | null)?.therapy_type ?? "");
      setNotes((n as SessionNote[]) ?? []);
      setAssignments((a as PatientExercise[]) ?? []);
      setLibrary((lib as Exercise[]) ?? []);
      const apptRows = (appts as ApptWithPay[]) ?? [];
      setAppointments(apptRows);
      setPaymentDrafts((prev) => {
        const next = { ...prev };
        apptRows.forEach((ap) => {
          if (!next[ap.id]) {
            next[ap.id] = {
              status: ap.payment_status ?? "unpaid",
              amount: ap.payment_amount != null ? String(ap.payment_amount) : "",
            };
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [patientId]);

  async function saveNoteEdits() {
    if (!editingNote) return;
    setSavingNoteId(editingNote.id);
    try {
      await api.meetTranscript.updateNote(editingNote.id, {
        concerns: editingNote.concerns ?? "",
        therapy_discussed: editingNote.therapy_discussed ?? "",
        exercises_discussed: editingNote.exercises_discussed ?? "",
        patient_feedback: editingNote.patient_feedback ?? "",
        progress_notes: editingNote.progress_notes ?? "",
        follow_up: editingNote.follow_up ?? "",
      });
      setEditingNote(null);
      await loadAll();
    } finally {
      setSavingNoteId(null);
    }
  }

  async function approveNote(id: string) {
    setSavingNoteId(id);
    try {
      await api.meetTranscript.approveNote(id);
      await loadAll();
    } finally {
      setSavingNoteId(null);
    }
  }

  async function assignExercise(exerciseId: string) {
    if (!patientId || !profile) return;
    setAssigningId(exerciseId);
    try {
      await supabase.from("patient_exercises").insert({
        patient_id: patientId,
        exercise_id: exerciseId,
        assigned_by: profile.id,
        status: "active",
        frequency_per_week: 3,
      });
      await loadAll();
    } finally {
      setAssigningId(null);
    }
  }

  // Feature 1 - resend / regenerate a temporary password.
  async function regeneratePassword() {
    if (!patientId) return;
    setRegenerating(true);
    setActionError(null);
    setTempPassword(null);
    try {
      const res = (await api.doctor.regeneratePassword(patientId)) as { temp_password: string };
      setTempPassword(res.temp_password);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not regenerate password");
    } finally {
      setRegenerating(false);
    }
  }

  // Feature 6 - instant ad-hoc Meet.
  async function startMeetNow() {
    if (!patientId) return;
    setStartingMeet(true);
    setActionError(null);
    setAdhocMeetUrl(null);
    try {
      const res = (await api.appointments.adhoc(patientId)) as { google_meet_url: string | null };
      setAdhocMeetUrl(res.google_meet_url);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not start Meet");
    } finally {
      setStartingMeet(false);
    }
  }

  // Feature 3 - mark a past scheduled appointment as a no-show.
  async function markNoShow(id: string) {
    if (!confirm("Mark this session as a no-show?")) return;
    setActionError(null);
    try {
      await api.appointments.noShow(id);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not mark no-show");
    }
  }

  // Feature 7 - create a bulk/recurring series of sessions.
  async function createSeries(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setActionError(null);
    setSeriesResult(null);
    setCreatingSeries(true);
    try {
      const startIso = new Date(`${seriesDate}T${seriesTime}`).toISOString();
      const res = (await api.appointments.bulkCreate({
        patient_id: patientId,
        count: Number(seriesCount),
        start_iso: startIso,
        pattern: seriesPattern,
        gap_days: seriesPattern === "custom" ? Number(seriesGapDays) : undefined,
        duration_min: Number(seriesDuration),
        label: seriesLabel || undefined,
      })) as { created_count: number; requested_count: number; failures: unknown[] };
      setSeriesResult({
        created: res.created_count,
        requested: res.requested_count,
        failures: res.failures?.length ?? 0,
      });
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not create series");
    } finally {
      setCreatingSeries(false);
    }
  }

  // Insights profile fields - save area + therapy type (upsert so it works
  // even if the patients row was never created for this account).
  async function saveDetails() {
    if (!patientId) return;
    setSavingDetails(true);
    setActionError(null);
    try {
      const { error } = await supabase.from("patients").upsert(
        {
          user_id: patientId,
          area: area.trim() || null,
          therapy_type: therapyType || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw new Error(error.message);
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save details");
    } finally {
      setSavingDetails(false);
    }
  }

  // Feature 8 - save manual payment status/amount for one appointment.
  async function savePayment(id: string) {
    const draft = paymentDrafts[id];
    if (!draft) return;
    setSavingPaymentId(id);
    setActionError(null);
    try {
      await api.appointments.setPayment(id, {
        payment_status: draft.status,
        payment_amount: draft.amount === "" ? null : Number(draft.amount),
      });
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save payment");
    } finally {
      setSavingPaymentId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 960, padding: "40px 0" }}>
        <p style={{ color: "var(--color-ink-muted)" }}>Loading clinical chart…</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ maxWidth: 960, padding: "40px 0" }}>
        <p style={{ color: "var(--color-danger)" }}>Patient not found.</p>
        <Link to="/doctor/patients" className="btn btn-outline">
          ← Back to Patient Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Top Breadcrumb & Profile Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <Link to="/doctor/patients" style={{ fontSize: 13, color: "var(--color-ink-muted)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
            ← Back to Patient Directory
          </Link>
          <div
            className="card glass-panel"
            style={{
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              background: "linear-gradient(135deg, rgba(237, 243, 241, 0.7), rgba(255, 255, 255, 0.9))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--color-brand-teal)",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(36, 107, 95, 0.25)",
                }}
              >
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>{patient.full_name}</h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 18px", fontSize: 13, color: "var(--color-ink-muted)" }}>
                  <span>✉️ {patient.email}</span>
                  {patient.phone && <span>📞 {patient.phone}</span>}
                  <span className="badge badge-scheduled">Patient ID: {patient.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={startMeetNow} disabled={startingMeet} style={{ padding: "8px 16px", fontSize: 13 }}>
                {startingMeet ? "Starting…" : "Start Meet now"}
              </button>
              <button className="btn btn-outline" onClick={regeneratePassword} disabled={regenerating} style={{ padding: "8px 16px", fontSize: 13 }}>
                {regenerating ? "Generating…" : "Resend / reset password"}
              </button>
              <Link to="/doctor/calendar" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: 13 }}>
                Schedule Next Session
              </Link>
            </div>
          </div>

          {actionError && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "var(--radius-xs)", fontSize: 13 }}>
              {actionError}
            </div>
          )}

          {tempPassword && (
            <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--color-success-bg)", border: "1px solid rgba(21,128,61,0.2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-secondary)" }}>
                New temporary password: <strong style={{ fontFamily: "monospace" }}>{tempPassword}</strong>
                <br />The patient must set their own password on next login.
              </div>
              {patient.phone && (
                <a
                  className="btn"
                  href={buildWhatsAppLink(
                    patient.phone,
                    `Hi ${patient.full_name}, your Neuro TeleRehab login has been reset. Log in at ${SITE_URL} with ${patient.email} and this temporary password: ${tempPassword}. You'll be asked to set your own password on first login.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: 10, background: "#E8F8EE", color: "#1E7E34", borderColor: "#C3E6CB", fontSize: 13 }}
                >
                  Send via WhatsApp
                </a>
              )}
            </div>
          )}

          {adhocMeetUrl && (
            <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--color-info-bg)", border: "1px solid rgba(3,105,161,0.2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-secondary)" }}>Instant Meet created for this patient.</div>
              <a className="btn btn-primary pulse-active" href={adhocMeetUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                Join Google Meet ↗
              </a>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Insights profile fields */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <h3 style={{ fontSize: 15, margin: 0 }}>Patient Details</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
          <div>
            <label>Area</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Colaba, Worli"
            />
          </div>
          <div>
            <label>Therapy type</label>
            <select value={therapyType} onChange={(e) => setTherapyType(e.target.value)}>
              <option value="">Not set</option>
              <option value="Orthopaedic">Orthopaedic</option>
              <option value="Neuro">Neuro</option>
              <option value="Geriatric">Geriatric</option>
              <option value="Post-operative">Post-operative</option>
              <option value="Women's health">Women's health</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-outline"
            style={{ padding: "7px 16px", fontSize: 13 }}
            onClick={saveDetails}
            disabled={savingDetails}
          >
            {savingDetails ? "Saving…" : "Save details"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 28 }}>
        {/* Left Column: Session Clinical Notes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 19, margin: 0 }}>Clinical Session Notes</h2>
            <span className="badge">{notes.length} total</span>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {notes.length === 0 && (
              <div className="card" style={{ padding: "28px", textAlign: "center" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
                  No session notes on record for this patient yet. Notes generated from TeleRehab or home visits will appear here for review.
                </p>
              </div>
            )}

            {notes.map((n, i) => (
              <ScrollReveal key={n.id} from="up" delay={i * 50}>
                {editingNote?.id === n.id ? (
                  <div className="card" style={{ border: "2px solid var(--color-brand-teal)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-brand-teal)", marginBottom: 14 }}>
                      Editing Clinical Note (Reviewed by Dr. Neha)
                    </div>

                    {(
                      [
                        "concerns",
                        "therapy_discussed",
                        "exercises_discussed",
                        "patient_feedback",
                        "progress_notes",
                        "follow_up",
                      ] as const
                    ).map((field) => (
                      <div key={field} style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, textTransform: "capitalize", fontWeight: 600 }}>
                          {field.replace(/_/g, " ")}
                        </label>
                        <textarea
                          rows={2}
                          value={editingNote[field] ?? ""}
                          onChange={(e) => setEditingNote({ ...editingNote, [field]: e.target.value })}
                        />
                      </div>
                    ))}

                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        className="btn btn-primary"
                        onClick={saveNoteEdits}
                        disabled={savingNoteId === n.id}
                      >
                        {savingNoteId === n.id ? "Saving…" : "Save Changes"}
                      </button>
                      <button className="btn btn-outline" onClick={() => setEditingNote(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="card"
                    style={{
                      borderLeft: n.status === "approved" ? "4px solid var(--color-success)" : "4px solid var(--color-warning)",
                      padding: "20px 24px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`badge badge-${n.status}`}>
                          <span className="badge-dot" />
                          {n.status === "approved" ? "Approved for Patient" : "Draft / Needs Review"}
                          {n.ai_generated ? " · AI Summary" : ""}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                        {new Date(n.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 10, fontSize: 13, lineHeight: 1.55 }}>
                      <div>
                        <strong style={{ color: "var(--color-ink)", display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Concerns:
                        </strong>
                        <span style={{ color: "var(--color-ink-secondary)" }}>{n.concerns || "—"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--color-ink)", display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Therapy Administered:
                        </strong>
                        <span style={{ color: "var(--color-ink-secondary)" }}>{n.therapy_discussed || "—"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--color-ink)", display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Exercises:
                        </strong>
                        <span style={{ color: "var(--color-ink-secondary)" }}>{n.exercises_discussed || "—"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--color-ink)", display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Progress & Feedback:
                        </strong>
                        <span style={{ color: "var(--color-ink-secondary)" }}>{n.progress_notes || n.patient_feedback || "—"}</span>
                      </div>
                      {n.follow_up && (
                        <div style={{ padding: "8px 12px", background: "var(--color-surface-subtle)", borderRadius: "var(--radius-xs)" }}>
                          <strong style={{ color: "var(--color-brand-teal)", fontSize: 12, display: "block" }}>Follow-up:</strong>
                          <span style={{ color: "var(--color-ink-secondary)" }}>{n.follow_up}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--color-border-subtle)", display: "flex", gap: 8 }}>
                      <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setEditingNote(n)}>
                        Edit Note
                      </button>
                      {n.status === "draft" && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                          onClick={() => approveNote(n.id)}
                          disabled={savingNoteId === n.id}
                        >
                          {savingNoteId === n.id ? "Approving…" : "Approve for Patient View"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Right Column: Prescribed Therapy Plan & Exercise Library */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 19, margin: 0 }}>Active Therapy Plan</h2>
            <span className="badge badge-scheduled">{assignments.length} Active</span>
          </div>

          <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
            {assignments.length === 0 && (
              <div className="card" style={{ padding: "20px", textAlign: "center" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: 13, margin: 0 }}>
                  No exercises currently assigned. Assign movements from the library below.
                </p>
              </div>
            )}

            {assignments.map((a) => (
              <div
                key={a.id}
                className="card"
                style={{
                  padding: "16px 18px",
                  borderLeft: "3px solid var(--color-brand-teal)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>
                    {a.exercises?.title}
                  </div>
                  <span className="badge badge-scheduled" style={{ fontSize: 11 }}>{a.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
                  {a.sets ?? a.exercises?.default_sets} sets × {a.reps ?? a.exercises?.default_reps} reps · {a.frequency_per_week}x / week
                </div>
              </div>
            ))}
          </div>

          {/* Feature 7 - Create a series of sessions */}
          <div className="card" style={{ padding: "20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🔁</span>
              <h3 style={{ fontSize: 15, margin: 0 }}>Create a Series</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 14 }}>
              Schedule multiple sessions at once. Each session gets its own Calendar event and Meet link.
            </p>
            <form onSubmit={createSeries} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                <div>
                  <label>Date</label>
                  <input type="date" value={seriesDate} onChange={(e) => setSeriesDate(e.target.value)} required />
                </div>
                <div>
                  <label>Time</label>
                  <input type="time" value={seriesTime} onChange={(e) => setSeriesTime(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                <div>
                  <label>Sessions</label>
                  <input type="number" min={1} max={52} value={seriesCount} onChange={(e) => setSeriesCount(e.target.value)} />
                </div>
                <div>
                  <label>Duration (min)</label>
                  <input type="number" min={15} step={15} value={seriesDuration} onChange={(e) => setSeriesDuration(e.target.value)} />
                </div>
              </div>
              <div>
                <label>Recurrence</label>
                <select value={seriesPattern} onChange={(e) => setSeriesPattern(e.target.value as typeof seriesPattern)}>
                  <option value="weekly">Weekly</option>
                  <option value="twice_weekly">Twice weekly</option>
                  <option value="custom">Custom gap (days)</option>
                </select>
              </div>
              {seriesPattern === "custom" && (
                <div>
                  <label>Every N days</label>
                  <input type="number" min={1} value={seriesGapDays} onChange={(e) => setSeriesGapDays(e.target.value)} />
                </div>
              )}
              <div>
                <label>Label (optional)</label>
                <input value={seriesLabel} onChange={(e) => setSeriesLabel(e.target.value)} placeholder="e.g. Post-op knee protocol" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={creatingSeries} style={{ justifyContent: "center" }}>
                {creatingSeries ? "Creating sessions…" : "Create series"}
              </button>
            </form>

            {seriesResult && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: seriesResult.failures ? "var(--color-warning-bg)" : "var(--color-success-bg)", borderRadius: "var(--radius-xs)", fontSize: 13 }}>
                Created {seriesResult.created} of {seriesResult.requested} sessions.
                {seriesResult.failures > 0 && ` ${seriesResult.failures} failed — the others are still valid.`}
              </div>
            )}
          </div>

          {/* Features 3 & 8 - Appointments with no-show marking and payment tracking */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 19, margin: 0 }}>Appointments</h2>
              <span className="badge">{appointments.length} total</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {appointments.length === 0 && (
                <div className="card" style={{ padding: "20px", textAlign: "center" }}>
                  <p style={{ color: "var(--color-ink-muted)", fontSize: 13, margin: 0 }}>No appointments on record.</p>
                </div>
              )}
              {appointments.map((a) => {
                const isPast = new Date(a.ends_at ?? a.starts_at) < new Date();
                const canNoShow = a.status === "scheduled" && isPast;
                const draft = paymentDrafts[a.id] ?? { status: "unpaid", amount: "" };
                return (
                  <div key={a.id} className="card" style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {new Date(a.starts_at).toLocaleString("en-IN", {
                          weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                        })}
                      </div>
                      <span className={`badge badge-${a.status === "scheduled" ? "scheduled" : a.status === "no_show" ? "cancelled" : a.status}`}>
                        {a.status.replace("_", " ")}
                      </span>
                    </div>

                    {a.google_meet_url && a.status === "scheduled" && (
                      <a className="btn btn-outline" href={a.google_meet_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "5px 10px", marginBottom: 10 }}>
                        Launch Meet ↗
                      </a>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--color-border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <label style={{ margin: 0, fontSize: 12 }}>Payment:</label>
                        <select
                          value={draft.status}
                          onChange={(e) => setPaymentDrafts({ ...paymentDrafts, [a.id]: { ...draft, status: e.target.value } })}
                          style={{ width: "auto", minWidth: 110, padding: "6px 10px", minHeight: 34 }}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="waived">Waived</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={draft.amount}
                          onChange={(e) => setPaymentDrafts({ ...paymentDrafts, [a.id]: { ...draft, amount: e.target.value } })}
                          style={{ width: 100, minHeight: 34, padding: "6px 10px" }}
                        />
                        <button
                          className="btn btn-outline"
                          style={{ padding: "5px 12px", fontSize: 12 }}
                          onClick={() => savePayment(a.id)}
                          disabled={savingPaymentId === a.id}
                        >
                          {savingPaymentId === a.id ? "Saving…" : "Save"}
                        </button>
                      </div>

                      {canNoShow && (
                        <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => markNoShow(a.id)}>
                          Mark no-show
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise Library Quick Assignment Picker */}
          <div className="card" style={{ padding: "20px", background: "var(--color-surface-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>📚</span>
              <h3 style={{ fontSize: 15, margin: 0 }}>Assign from Clinical Library</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 14 }}>
              Click to prescribe an exercise directly to this patient's active therapy plan:
            </p>

            <div style={{ display: "grid", gap: 8, maxHeight: "320px", overflowY: "auto", paddingRight: 4 }}>
              {library.map((ex) => (
                <button
                  key={ex.id}
                  className="btn btn-outline"
                  style={{
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    textAlign: "left",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                  disabled={assigningId === ex.id}
                  onClick={() => assignExercise(ex.id)}
                >
                  <span style={{ fontWeight: 500 }}>{ex.title}</span>
                  <span style={{ color: "var(--color-brand-teal)", fontSize: 12 }}>
                    {assigningId === ex.id ? "Assigning…" : "+ Assign"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
