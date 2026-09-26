import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { SessionNote } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

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

  if (loading) {
    return (
      <div style={{ maxWidth: 840, padding: "40px 0" }}>
        <p style={{ color: "var(--color-ink-muted)" }}>Loading session clinical history…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-approved" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Verified Clinical Records
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 6 }}>
            Session History & Clinical Summaries
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Every summary here has been documented during consultations and personally reviewed and approved by Dr. Neha Dhanokar.
          </p>
        </div>
      </ScrollReveal>

      {/* Notes List */}
      <div style={{ display: "grid", gap: 20 }}>
        {notes.length === 0 && (
          <ScrollReveal from="up">
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>No Approved Notes Yet</h3>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, maxWidth: 440, margin: "0 auto" }}>
                Session notes appear here once your therapist completes and validates their clinical observations following your appointments.
              </p>
            </div>
          </ScrollReveal>
        )}

        {notes.map((n, i) => (
          <ScrollReveal key={n.id} from="up" delay={i * 70}>
            <div
              className="card"
              style={{
                padding: "24px",
                borderLeft: "4px solid var(--color-brand-teal)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
                    Session on {new Date(n.created_at).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="badge badge-approved">Approved</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div style={{ display: "grid", gap: 14, fontSize: 14, lineHeight: 1.6 }}>
                {n.concerns && (
                  <div>
                    <strong style={{ color: "var(--color-ink)", display: "block", marginBottom: 2, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Patient Concerns & Symptoms
                    </strong>
                    <div style={{ color: "var(--color-ink-secondary)" }}>{n.concerns}</div>
                  </div>
                )}

                {n.therapy_discussed && (
                  <div>
                    <strong style={{ color: "var(--color-ink)", display: "block", marginBottom: 2, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Therapy & Treatment Administered
                    </strong>
                    <div style={{ color: "var(--color-ink-secondary)" }}>{n.therapy_discussed}</div>
                  </div>
                )}

                {n.exercises_discussed && (
                  <div>
                    <strong style={{ color: "var(--color-ink)", display: "block", marginBottom: 2, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Exercises & Motor Regimen
                    </strong>
                    <div style={{ color: "var(--color-ink-secondary)" }}>{n.exercises_discussed}</div>
                  </div>
                )}

                {n.progress_notes && (
                  <div>
                    <strong style={{ color: "var(--color-ink)", display: "block", marginBottom: 2, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Clinical Progress Observations
                    </strong>
                    <div style={{ color: "var(--color-ink-secondary)" }}>{n.progress_notes}</div>
                  </div>
                )}

                {n.follow_up && (
                  <div style={{ padding: "12px 14px", background: "var(--color-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--color-border-subtle)" }}>
                    <strong style={{ color: "var(--color-brand-teal)", display: "block", marginBottom: 2, fontSize: 13 }}>
                      Next Steps & Follow-up Recommendation
                    </strong>
                    <div style={{ color: "var(--color-ink-secondary)" }}>{n.follow_up}</div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
