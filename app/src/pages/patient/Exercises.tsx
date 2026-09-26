import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { PatientExercise } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function PatientExercises() {
  const { profile } = useAuth();
  const [items, setItems] = useState<PatientExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setLoggingId(patientExerciseId);
    try {
      await supabase.from("progress").insert({
        patient_id: profile.id,
        patient_exercise_id: patientExerciseId,
        completed: true,
      });
      setToastMessage("Session activity logged! Excellent work on maintaining momentum.");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setLoggingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 840, padding: "40px 0" }}>
        <p style={{ color: "var(--color-ink-muted)" }}>Loading your custom therapy plan…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "var(--color-ink)",
            color: "#FFF",
            padding: "12px 20px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            animation: "subtle-up 0.3s ease",
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge" style={{ marginBottom: 8, background: "var(--color-brand-accent-soft)", color: "var(--color-brand-accent)" }}>
            Clinical Regimen
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 6 }}>
            Your Prescribed Therapy Plan
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Structured exercises assigned by Dr. Neha Dhanokar. Review technique guidelines, target repetitions, and log daily completion.
          </p>
        </div>
      </ScrollReveal>

      {/* Exercise List */}
      <div style={{ display: "grid", gap: 18 }}>
        {items.length === 0 && (
          <ScrollReveal from="up">
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧘</div>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>No Active Exercises Assigned</h3>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, maxWidth: 440, margin: "0 auto" }}>
                Dr. Neha will curate and assign exercises to this dashboard following your initial evaluation consultation.
              </p>
            </div>
          </ScrollReveal>
        )}

        {items.map((pe, i) => (
          <ScrollReveal key={pe.id} from="up" delay={i * 70}>
            <div
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: 20,
                padding: "24px",
                borderLeft: "4px solid var(--color-brand-teal)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 18, margin: 0, color: "var(--color-ink)" }}>
                    {pe.exercises?.title}
                  </h3>
                  <span className="badge badge-scheduled">Active</span>
                </div>

                <p style={{ color: "var(--color-ink-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                  {pe.exercises?.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", fontSize: 13, color: "var(--color-ink-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong style={{ color: "var(--color-ink)" }}>Target:</strong>
                    <span>{pe.sets ?? pe.exercises?.default_sets} sets × {pe.reps ?? pe.exercises?.default_reps} reps</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong style={{ color: "var(--color-ink)" }}>Frequency:</strong>
                    <span>{pe.frequency_per_week} times / week</span>
                  </div>
                  {pe.exercises?.video_url && (
                    <a
                      href={pe.exercises.video_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--color-brand-teal)",
                        fontWeight: 600,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Watch Demo Video
                    </a>
                  )}
                </div>
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => logCompletion(pe.id)}
                  disabled={loggingId === pe.id}
                  style={{
                    padding: "10px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {loggingId === pe.id ? "Saving…" : "Mark Done Today"}
                </button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
