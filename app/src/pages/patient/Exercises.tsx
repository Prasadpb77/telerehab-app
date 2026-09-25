import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { PatientExercise } from "../../types/db";

export default function PatientExercises() {
  const { profile } = useAuth();
  const [items, setItems] = useState<PatientExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    // Direct Supabase read — RLS ensures this only ever returns the
    // logged-in patient's own rows.
    supabase
      .from("patient_exercises")
      .select("*, exercises(*)")
      .eq("patient_id", profile.id)
      .eq("status", "active")
      .then(({ data }) => {
        setItems((data as PatientExercise[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  async function logCompletion(patientExerciseId: string) {
    if (!profile) return;
    await supabase.from("progress").insert({
      patient_id: profile.id,
      patient_exercise_id: patientExerciseId,
      completed: true,
    });
    alert("Logged! Great work.");
  }

  if (loading) return <p>Loading your plan…</p>;

  return (
    <div>
      <h1>Your therapy plan</h1>
      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {items.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No active exercises assigned yet.</p>}
        {items.map((pe) => (
          <div key={pe.id} className="card">
            <h3 style={{ fontSize: 16 }}>{pe.exercises?.title}</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>{pe.exercises?.description}</p>
            <p style={{ fontSize: 13 }}>
              {pe.sets ?? pe.exercises?.default_sets} sets × {pe.reps ?? pe.exercises?.default_reps} reps,{" "}
              {pe.frequency_per_week}x/week
            </p>
            {pe.exercises?.video_url && (
              <a href={pe.exercises.video_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                Watch demo
              </a>
            )}
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={() => logCompletion(pe.id)}>
                Mark done today
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
