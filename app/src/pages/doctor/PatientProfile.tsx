import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { AppUser, SessionNote, PatientExercise, Exercise } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function DoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const { profile } = useAuth();
  const [patient, setPatient] = useState<AppUser | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [assignments, setAssignments] = useState<PatientExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!patientId) return;
    try {
      const [{ data: p }, { data: n }, { data: a }, { data: lib }] = await Promise.all([
        supabase.from("users").select("*").eq("id", patientId).single(),
        supabase.from("session_notes").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("patient_exercises").select("*, exercises(*)").eq("patient_id", patientId),
        supabase.from("exercises").select("*"),
      ]);
      setPatient(p as AppUser);
      setNotes((n as SessionNote[]) ?? []);
      setAssignments((a as PatientExercise[]) ?? []);
      setLibrary((lib as Exercise[]) ?? []);
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

            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/doctor/calendar" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                Schedule Next Session
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
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
