import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { SessionNote } from "../../types/db";

export default function PatientSessionHistory() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    // RLS restricts this to status='approved' notes for this patient only —
    // draft/AI-unreviewed notes never reach this query's result set.
    supabase
      .from("session_notes")
      .select("*")
      .eq("patient_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotes((data as SessionNote[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  if (loading) return <p>Loading history…</p>;

  return (
    <div>
      <h1>Session history</h1>
      <p style={{ color: "var(--color-ink-muted)" }}>Notes shown here have been reviewed and approved by your therapist.</p>
      <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
        {notes.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No approved notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="card">
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 8 }}>
              {new Date(n.created_at).toLocaleDateString()}
            </div>
            {n.concerns && <p><strong>Concerns:</strong> {n.concerns}</p>}
            {n.therapy_discussed && <p><strong>Therapy discussed:</strong> {n.therapy_discussed}</p>}
            {n.exercises_discussed && <p><strong>Exercises:</strong> {n.exercises_discussed}</p>}
            {n.progress_notes && <p><strong>Progress:</strong> {n.progress_notes}</p>}
            {n.follow_up && <p><strong>Follow-up:</strong> {n.follow_up}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
