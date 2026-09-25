import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { AppUser, SessionNote, PatientExercise, Exercise } from "../../types/db";

export default function DoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const { profile } = useAuth();
  const [patient, setPatient] = useState<AppUser | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [assignments, setAssignments] = useState<PatientExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);

  async function loadAll() {
    if (!patientId) return;
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
  }

  useEffect(() => {
    loadAll();
  }, [patientId]);

  async function saveNoteEdits() {
    if (!editingNote) return;
    await api.meetTranscript.updateNote(editingNote.id, {
      concerns: editingNote.concerns ?? "",
      therapy_discussed: editingNote.therapy_discussed ?? "",
      exercises_discussed: editingNote.exercises_discussed ?? "",
      patient_feedback: editingNote.patient_feedback ?? "",
      progress_notes: editingNote.progress_notes ?? "",
      follow_up: editingNote.follow_up ?? "",
    });
    setEditingNote(null);
    loadAll();
  }

  async function approveNote(id: string) {
    await api.meetTranscript.approveNote(id);
    loadAll();
  }

  async function assignExercise(exerciseId: string) {
    if (!patientId || !profile) return;
    await supabase.from("patient_exercises").insert({
      patient_id: patientId,
      exercise_id: exerciseId,
      assigned_by: profile.id,
      status: "active",
      frequency_per_week: 3,
    });
    loadAll();
  }

  if (!patient) return <p>Loading…</p>;

  return (
    <div>
      <h1>{patient.full_name}</h1>
      <p style={{ color: "var(--color-ink-muted)" }}>{patient.email}</p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18 }}>Session notes</h2>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {notes.map((n) =>
            editingNote?.id === n.id ? (
              <div key={n.id} className="card">
                {(["concerns", "therapy_discussed", "exercises_discussed", "patient_feedback", "progress_notes", "follow_up"] as const).map((field) => (
                  <div key={field} style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, textTransform: "capitalize" }}>{field.replace("_", " ")}</label>
                    <textarea
                      rows={2}
                      value={editingNote[field] ?? ""}
                      onChange={(e) => setEditingNote({ ...editingNote, [field]: e.target.value })}
                    />
                  </div>
                ))}
                <button className="btn btn-primary" onClick={saveNoteEdits}>Save edits</button>{" "}
                <button className="btn btn-outline" onClick={() => setEditingNote(null)}>Cancel</button>
              </div>
            ) : (
              <div key={n.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={`badge badge-${n.status}`}>{n.status}{n.ai_generated ? " · AI draft" : ""}</span>
                  <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p><strong>Concerns:</strong> {n.concerns || "—"}</p>
                <p><strong>Therapy:</strong> {n.therapy_discussed || "—"}</p>
                <p><strong>Exercises:</strong> {n.exercises_discussed || "—"}</p>
                <p><strong>Progress:</strong> {n.progress_notes || "—"}</p>
                <p><strong>Follow-up:</strong> {n.follow_up || "—"}</p>
                {n.status === "draft" && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-outline" onClick={() => setEditingNote(n)}>Edit</button>{" "}
                    <button className="btn btn-primary" onClick={() => approveNote(n.id)}>Approve for patient</button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18 }}>Therapy plan</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {assignments.map((a) => (
            <div key={a.id} className="card">
              {a.exercises?.title} — {a.sets ?? a.exercises?.default_sets}×{a.reps ?? a.exercises?.default_reps}, {a.frequency_per_week}x/week
              <span className="badge" style={{ marginLeft: 8 }}>{a.status}</span>
            </div>
          ))}
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 14 }}>+ Assign from exercise library</summary>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {library.map((ex) => (
              <button key={ex.id} className="btn btn-outline" style={{ justifyContent: "flex-start" }} onClick={() => assignExercise(ex.id)}>
                {ex.title}
              </button>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
