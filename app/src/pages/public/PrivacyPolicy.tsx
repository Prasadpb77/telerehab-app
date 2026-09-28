import { Link } from "react-router-dom";
import ScrollReveal from "../../components/ScrollReveal";

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 64 }}>
      <ScrollReveal from="subtle-up">
        <Link to="/" style={{ fontSize: 13, color: "var(--color-ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back to homepage
        </Link>
        <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
          <span className="badge-dot" /> DPDP Act 2023 Compliance
        </div>
        <h1 style={{ fontSize: "clamp(26px, 3vw, 36px)", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 28 }}>
          Effective: 28 September 2026 · Data Fiduciary Notice
        </p>
      </ScrollReveal>

      <ScrollReveal from="up" delay={80}>
        <div className="card" style={{ padding: "36px 32px", display: "grid", gap: 28, lineHeight: 1.65 }}>
          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>1. Who We Are (Data Fiduciary)</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              This service is operated by Dr. Neha Dhanokar's independent clinical physiotherapy practice ("we", "us", "the practice").
              For the purposes of India's Digital Personal Data Protection Act, 2023 ("DPDP Act"), we act as the <strong>Data Fiduciary</strong> for
              personal and health data you provide through this portal.
            </p>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginTop: 8 }}>
              Grievance Officer: <a href="mailto:privacy@example.com">privacy@example.com</a> (monitored for DPDP inquiries).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>2. What Personal Data We Collect</h2>
            <ul style={{ paddingLeft: 20, margin: 0, color: "var(--color-ink-secondary)" }}>
              <li><strong>Account Identifiers:</strong> Full legal name, email address, WhatsApp/phone number, salted cryptographic password hash.</li>
              <li><strong>Clinical Records:</strong> Symptom presentations, clinical session notes, prescribed motor regimens, and self-reported progress metrics.</li>
              <li><strong>Booking Details:</strong> Appointment timestamps, South Mumbai doorstep residential addresses (for in-home care), and clinical notes.</li>
              <li><strong>Telehealth Telemetry:</strong> Encrypted Google Meet room links and automated session summaries.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>3. Specified Purpose & Consent Itemisation</h2>
            <p style={{ color: "var(--color-ink-secondary)", marginBottom: 12 }}>
              Under the DPDP Act, personal data is processed exclusively for explicit purposes you have consented to at registration:
            </p>
            <div style={{ display: "grid", gap: 10, background: "var(--color-surface-subtle)", padding: 16, borderRadius: "var(--radius-sm)" }}>
              <div>
                <strong style={{ color: "var(--color-brand-teal)", fontSize: 13 }}>Account & Booking (Required):</strong>
                <span style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}> To manage schedules, confirm home visits, and provide telehealth access.</span>
              </div>
              <div>
                <strong style={{ color: "var(--color-brand-teal)", fontSize: 13 }}>Health Context Notes (Optional):</strong>
                <span style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}> To prepare customized clinical equipment and motor exercises prior to visits.</span>
              </div>
              <div>
                <strong style={{ color: "var(--color-brand-teal)", fontSize: 13 }}>AI-Drafted Visit Notes (Optional):</strong>
                <span style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}> To synthesize consultation transcripts into draft clinical visit notes for clinician review.</span>
              </div>
              <div>
                <strong style={{ color: "var(--color-brand-teal)", fontSize: 13 }}>Communications (Optional):</strong>
                <span style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}> Educational rehabilitation newsletters and wellness tips.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>4. AI-Assisted Clinical Summaries</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
              Under specific, itemized consent (<code>ai_note_drafting</code>), recorded consultation transcripts
              are processed by <strong>Cloudflare Workers AI</strong> (running the open-weights <code>@cf/meta/llama-3.1-8b-instruct</code> model on Cloudflare's secure edge infrastructure)
              to synthesize an initial structured draft of clinical visit notes.
            </p>
            <p style={{ color: "var(--color-ink-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
              <strong>Human Verification Gate:</strong> Dr. Neha Dhanokar personally reviews, edits, and authorizes every draft note before
              it is approved and made visible on your patient record. The AI model is strictly a drafting tool and never issues prescriptions,
              diagnoses, or autonomous treatment plans. No patient data is ever used to train public AI models.
            </p>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0, lineHeight: 1.6 }}>
              <strong>Declining or Withdrawing Consent:</strong> Giving this consent is entirely optional. If you decline or subsequently
              withdraw consent for AI note drafting, clinical visit notes are authored completely manually by Dr. Neha Dhanokar.
              Your access to appointments, in-home visits, TeleRehab video consultations, and all other practice services remains completely unaffected.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>5. Storage, Security, & Row-Level Isolation</h2>
            <p style={{ color: "var(--color-ink-secondary)", margin: 0 }}>
              All records are stored within PostgreSQL tables secured with Supabase Row-Level Security (RLS).
              Only you and your treating clinician possess cryptographically authenticated access keys.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>6. Your Rights as a Data Principal</h2>
            <p style={{ color: "var(--color-ink-secondary)", marginBottom: 10, lineHeight: 1.6 }}>
              Under the DPDP Act 2023, you retain comprehensive rights to access, correct, erase, or withdraw consent for optional purposes.
              You can instantly view and toggle your optional consents (including AI note drafting, clinical health context notes, and wellness communications)
              at any time directly from the patient portal:
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <Link to="/patient/privacy-settings" className="btn btn-primary" style={{ display: "inline-flex" }}>
                Manage Privacy & Consent Settings →
              </Link>
              <Link to="/data-request" className="btn btn-outline" style={{ display: "inline-flex" }}>
                Submit a Formal Data Rights Request →
              </Link>
            </div>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 12, margin: 0 }}>
              Consent withdrawals take effect immediately for all subsequent sessions and processing activities.
            </p>
          </section>
        </div>
      </ScrollReveal>
    </div>
  );
}
