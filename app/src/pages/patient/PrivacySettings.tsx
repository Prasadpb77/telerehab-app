import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { POLICY_VERSION } from "../../lib/constants";
import ScrollReveal from "../../components/ScrollReveal";

interface ConsentConfig {
  purpose: "health_notes" | "ai_note_drafting" | "marketing_communications";
  title: string;
  tagline: string;
  description: string;
}

const OPTIONAL_PURPOSES: ConsentConfig[] = [
  {
    purpose: "ai_note_drafting",
    title: "AI-Drafted Visit Notes",
    tagline: "Third-party AI transcript summarization into draft notes",
    description:
      "When enabled, consultation transcripts are processed by a third-party AI service to synthesize draft clinical notes. Dr. Neha Dhanokar personally reviews, edits, and approves every note before it appears in your patient record. If turned off, notes are drafted completely manually by your therapist.",
  },
  {
    purpose: "health_notes",
    title: "Clinical Preparation Context",
    tagline: "Sharing symptom notes to help prepare equipment and exercises",
    description:
      "Permits sharing symptom context, physical presentation notes, and prior history with your therapist prior to home visits and TeleRehab sessions to prepare customized therapeutic equipment.",
  },
  {
    purpose: "marketing_communications",
    title: "Wellness & Rehabilitation Communications",
    tagline: "Occasional rehabilitation insights and clinic updates",
    description:
      "Permits receiving periodic wellness communications, home exercise safety reminders, and neurological rehabilitation educational updates via email or WhatsApp.",
  },
];

export default function PrivacySettings() {
  const { profile } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({
    ai_note_drafting: false,
    health_notes: false,
    marketing_communications: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingPurpose, setSavingPurpose] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadConsents() {
    if (!profile) return;
    try {
      // Query all consent records for this patient, ordered by recorded_at desc
      const { data, error: err } = await supabase
        .from("consent_records")
        .select("purpose, granted, recorded_at")
        .eq("patient_id", profile.id)
        .order("recorded_at", { ascending: false });

      if (err) throw err;

      // Extract the most recent record for each purpose
      const latest: Record<string, boolean> = {
        ai_note_drafting: false,
        health_notes: false,
        marketing_communications: false,
      };

      const seen = new Set<string>();
      for (const row of data ?? []) {
        if (!seen.has(row.purpose)) {
          seen.add(row.purpose);
          if (row.purpose in latest) {
            latest[row.purpose] = row.granted;
          }
        }
      }

      setConsents(latest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load consent settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleToggle(purpose: "health_notes" | "ai_note_drafting" | "marketing_communications") {
    if (!profile) return;
    const currentVal = consents[purpose] ?? false;
    const nextVal = !currentVal;

    setSavingPurpose(purpose);
    setError(null);

    try {
      // DPDP Act compliance requirement: NEVER update or delete past records.
      // Consent history must stay a complete append-only log; always insert a new row.
      const { error: insertErr } = await supabase.from("consent_records").insert({
        patient_id: profile.id,
        purpose,
        granted: nextVal,
        policy_version: POLICY_VERSION,
      });

      if (insertErr) throw insertErr;

      setConsents((prev) => ({ ...prev, [purpose]: nextVal }));
      flashToast(
        nextVal
          ? `Consent granted for ${purpose.replace(/_/g, " ")}.`
          : `Consent withdrawn for ${purpose.replace(/_/g, " ")}. Takes effect immediately.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update consent setting");
    } finally {
      setSavingPurpose(null);
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
      {toast && (
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
            fontSize: 14,
            animation: "subtle-up 0.3s ease",
          }}
        >
          ✓ {toast}
        </div>
      )}

      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> DPDP Act 2023 · Patient Rights
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 6 }}>
            Privacy & Consent Management
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0, lineHeight: 1.55 }}>
            Under India's Digital Personal Data Protection Act, 2023, you have the right to review
            and withdraw consent for any optional purpose at any time. Changes take effect immediately.
          </p>
        </div>
      </ScrollReveal>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-xs)",
            background: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Loading your consent records…</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Mandatory purpose card */}
          <div
            className="card"
            style={{
              padding: "22px 24px",
              background: "var(--color-surface-subtle)",
              borderLeft: "4px solid var(--color-brand-teal)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, margin: 0, color: "var(--color-ink)" }}>
                    Account & Clinical Booking
                  </h3>
                  <span className="badge badge-scheduled" style={{ fontSize: 11 }}>
                    Required for Service
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 8 }}>
                  Identity, contact number, email, and visit address
                </div>
                <p style={{ fontSize: 13, color: "var(--color-ink-secondary)", margin: 0, lineHeight: 1.55 }}>
                  Essential to establish your patient account, schedule appointments, coordinate in-home
                  visits in South Mumbai, and generate secure Google Meet video rooms. This purpose cannot be
                  opted out of while maintaining an active account. If you wish to close your account and request
                  erasure, please use our{" "}
                  <Link to="/data-request" style={{ color: "var(--color-brand-teal)", textDecoration: "underline" }}>
                    Data Rights Request Form
                  </Link>.
                </p>
              </div>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-brand-teal)",
                  padding: "6px 14px",
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                Always Active
              </span>
            </div>
          </div>

          {/* Optional purposes */}
          {OPTIONAL_PURPOSES.map((cfg, i) => {
            const isGranted = consents[cfg.purpose] ?? false;
            const isSaving = savingPurpose === cfg.purpose;

            return (
              <ScrollReveal key={cfg.purpose} from="up" delay={i * 60}>
                <div
                  className="card"
                  style={{
                    padding: "24px",
                    borderLeft: isGranted
                      ? "4px solid var(--color-brand-emerald, #10B981)"
                      : "4px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 17, margin: 0, color: "var(--color-ink)" }}>
                          {cfg.title}
                        </h3>
                        <span
                          className={isGranted ? "badge badge-approved" : "badge"}
                          style={{ fontSize: 11 }}
                        >
                          <span className="badge-dot" />
                          {isGranted ? "Consent Granted" : "Consent Not Granted"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-brand-teal)", fontWeight: 500 }}>
                        {cfg.tagline}
                      </div>
                    </div>

                    <button
                      className={isGranted ? "btn btn-outline" : "btn btn-primary"}
                      style={{
                        padding: "8px 18px",
                        fontSize: 13,
                        minWidth: 140,
                        justifyContent: "center",
                      }}
                      onClick={() => handleToggle(cfg.purpose)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving…" : isGranted ? "Withdraw Consent" : "Grant Consent"}
                    </button>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--color-ink-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {cfg.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}

          {/* Append-only audit notice card */}
          <div
            className="card"
            style={{
              padding: "18px 22px",
              background: "var(--color-surface-subtle)",
              border: "1px dashed var(--color-border)",
              marginTop: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
              DPDP Act Compliance Note
            </div>
            <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: 0, lineHeight: 1.5 }}>
              In compliance with Section 6 of the Digital Personal Data Protection Act, 2023, every consent
              grant and withdrawal is preserved in an immutable, append-only log with a timestamp and the active
              policy version ({POLICY_VERSION}). Previous entries are never modified or purged, ensuring a reliable
              record of your privacy choices.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}