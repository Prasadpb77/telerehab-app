import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import ScrollReveal from "../../components/ScrollReveal";

const POLICY_VERSION = "2026-09-26";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [consentBooking, setConsentBooking] = useState(false);
  const [consentHealth, setConsentHealth] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentBooking) {
      setError(
        "Please consent to processing your details for account creation and booking — this is required under the DPDP Act to use the service."
      );
      return;
    }

    setLoading(true);
    try {
      const user = await signUp({ full_name: fullName, email, password, phone });

      await supabase.from("consent_records").insert([
        { patient_id: user.id, purpose: "account_and_booking", granted: true, policy_version: POLICY_VERSION },
        { patient_id: user.id, purpose: "health_notes", granted: consentHealth, policy_version: POLICY_VERSION },
        { patient_id: user.id, purpose: "marketing_communications", granted: consentMarketing, policy_version: POLICY_VERSION },
      ]);

      navigate("/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 20px",
      }}
    >
      <ScrollReveal from="scale">
        <div style={{ width: "100%", maxWidth: 500 }}>
          {/* Logo & Brand Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-sm)",
                  background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-teal))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  margin: "0 auto 14px",
                  boxShadow: "0 4px 14px rgba(29, 83, 74, 0.28)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-ink)" }}>
                Neuro TeleRehab
              </div>
            </Link>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginTop: 6 }}>
              Register for personalized physiotherapy, home visits, and TeleRehab care.
            </p>
          </div>

          <div className="card glass-panel" style={{ padding: "36px 32px" }}>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label htmlFor="full-name">Full Name</label>
                <input
                  id="full-name"
                  placeholder="e.g. Ramesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-phone">Phone / WhatsApp Number</label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* DPDP Act 2023 Consent Box */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--color-surface-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-brand-teal)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  DPDP Act 2023 Consent Itemisation
                </div>
                <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Under India's Digital Personal Data Protection Act, 2023, consent is collected separately for each purpose. Review our{" "}
                  <Link to="/privacy-policy" target="_blank" style={{ color: "var(--color-brand-teal)", textDecoration: "underline" }}>
                    Privacy Policy
                  </Link>.
                </p>

                <div style={{ display: "grid", gap: 10 }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--color-ink)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto", marginTop: 2, cursor: "pointer" }}
                      checked={consentBooking}
                      onChange={(e) => setConsentBooking(e.target.checked)}
                      required
                    />
                    <span>
                      <strong style={{ color: "var(--color-brand-teal)" }}>Required:</strong> I consent to my identity, contact details, and address being processed to book clinical sessions.
                    </span>
                  </label>

                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--color-ink-secondary)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto", marginTop: 2, cursor: "pointer" }}
                      checked={consentHealth}
                      onChange={(e) => setConsentHealth(e.target.checked)}
                    />
                    <span>
                      <strong>Optional:</strong> I consent to sharing clinical notes regarding symptoms to assist preparation.
                    </span>
                  </label>

                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--color-ink-secondary)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto", marginTop: 2, cursor: "pointer" }}
                      checked={consentMarketing}
                      onChange={(e) => setConsentMarketing(e.target.checked)}
                    />
                    <span>
                      <strong>Optional:</strong> I consent to occasional wellness communications and rehabilitation insights.
                    </span>
                  </label>
                </div>
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
                disabled={loading}
                style={{ padding: "12px", fontSize: 15, justifyContent: "center", marginTop: 6 }}
              >
                {loading ? "Creating Patient Account…" : "Create Patient Account"}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--color-border-subtle)", textAlign: "center", fontSize: 13 }}>
              <span style={{ color: "var(--color-ink-muted)" }}>Already registered? </span>
              <Link to="/login" style={{ color: "var(--color-brand-teal)", fontWeight: 600 }}>
                Log in here
              </Link>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12 }}>
            <Link to="/" style={{ color: "var(--color-ink-muted)" }}>
              ← Return to homepage
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
