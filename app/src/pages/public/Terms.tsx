import { Link } from "react-router-dom";
import ScrollReveal from "../../components/ScrollReveal";

export default function Terms() {
  return (
    <div className="container" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 64 }}>
      <ScrollReveal from="subtle-up">
        <Link to="/" style={{ fontSize: 13, color: "var(--color-ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back to homepage
        </Link>
        <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
          <span className="badge-dot" /> Terms & Conditions
        </div>
        <h1 style={{ fontSize: "clamp(26px, 3vw, 36px)", marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 28 }}>
          Effective: 26 September 2026 · Clinical Practice Agreement
        </p>
      </ScrollReveal>

      <ScrollReveal from="up" delay={80}>
        <div className="card" style={{ padding: "36px 32px", display: "grid", gap: 24, lineHeight: 1.65 }}>
          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>1. Clinical Physiotherapy Services</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              This platform enables scheduling and management of in-home physical therapy visits and TeleRehab video consultations
              with Dr. Neha Dhanokar. A requested slot is confirmed once the clinician accepts and verifies the clinical match.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>2. Non-Emergency Notice</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              This service is strictly for scheduled motor rehabilitation, musculoskeletal physical therapy, and functional follow-ups.
              It is not a replacement for acute emergency medical care. In case of cardiovascular, respiratory, or severe acute trauma,
              contact your nearest emergency medical facility immediately.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>3. Rescheduling & Cancellations</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              Either the patient or therapist may modify or reschedule a confirmed session when circumstances change.
              Updates are conveyed via WhatsApp and portal notifications.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>4. Privacy & Consent Compliance</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              All health and booking data is managed according to India's DPDP Act, 2023. Detailed terms are documented in our{" "}
              <Link to="/privacy-policy" style={{ color: "var(--color-brand-teal)", textDecoration: "underline" }}>
                Privacy Policy
              </Link>.
            </p>
          </section>
        </div>
      </ScrollReveal>
    </div>
  );
}
