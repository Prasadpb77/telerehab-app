import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import ScrollReveal from "../../components/ScrollReveal";

export default function DataRequest() {
  const { profile } = useAuth();
  const [requestType, setRequestType] = useState("access");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.dataRequest.submit({
        patient_id: profile?.id,
        contact_email: email,
        request_type: requestType,
        details: details || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="container" style={{ maxWidth: 540, paddingTop: 80, paddingBottom: 64 }}>
        <ScrollReveal from="scale">
          <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Request Dispatched</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Your Data Principal request has been logged. Our Grievance Officer will review your request and
              respond to <strong>{email}</strong> within statutory timeframes prescribed by the DPDP Act 2023.
            </p>
            <Link to="/" className="btn btn-outline">
              ← Return Home
            </Link>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 580, paddingTop: 48, paddingBottom: 64 }}>
      <ScrollReveal from="subtle-up">
        <Link to="/" style={{ fontSize: 13, color: "var(--color-ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back to homepage
        </Link>
        <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
          <span className="badge-dot" /> DPDP Act 2023 Rights
        </div>
        <h1 style={{ fontSize: "clamp(24px, 2.8vw, 32px)", marginBottom: 8 }}>
          Data Rights & Grievance Request
        </h1>
        <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          Exercise your statutory rights under India's Digital Personal Data Protection Act to access, correct, erase personal records, or withdraw specific consents.
        </p>
      </ScrollReveal>

      <ScrollReveal from="up" delay={80}>
        <div className="card glass-panel" style={{ padding: "36px 32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
            <div>
              <label htmlFor="request-type">Select Right to Exercise</label>
              <select id="request-type" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                <option value="access">Access my personal & clinical data summary</option>
                <option value="correction">Correct inaccurate or outdated details</option>
                <option value="erasure">Erase personal data no longer necessary</option>
                <option value="consent_withdrawal">Withdraw an optional consent</option>
                <option value="grievance">Raise a privacy grievance</option>
              </select>
            </div>

            <div>
              <label htmlFor="request-email">Reply Contact Email Address</label>
              <input
                id="request-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="request-details">
                Details & Context <span style={{ color: "var(--color-ink-faint)", fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                id="request-details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Specify details or particular records you would like addressed…"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  borderRadius: "var(--radius-xs)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              style={{ padding: "12px", fontSize: 15, justifyContent: "center" }}
            >
              {submitting ? "Transmitting Request…" : "Submit Formal Request"}
            </button>
          </form>
        </div>
      </ScrollReveal>
    </div>
  );
}
