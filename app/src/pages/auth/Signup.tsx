import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

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
      setError("Please consent to processing your details for account creation and booking — this is required to use the service.");
      return;
    }

    setLoading(true);
    try {
      // Signup only ever creates patient accounts. The single doctor account
      // is provisioned via the DB seed (Phase 1 has exactly one doctor).
      const user = await signUp({ full_name: fullName, email, password, phone });

      // Record each consent decision individually — DPDP Act requires
      // itemised, auditable consent per purpose, not one blanket checkbox.
      // Direct Supabase write: the freshly-issued JWT is now in authStorage,
      // so this runs under RLS as the new patient (patient_id = auth.uid()).
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
    <div style={{ maxWidth: 440, margin: "60px auto" }}>
      <h1 style={{ fontSize: 26 }}>Create your account</h1>
      <p style={{ color: "var(--color-ink-muted)", marginBottom: 20 }}>
        Start your neuro rehab journey with guided sessions and exercises.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Phone (WhatsApp number, with country code)
          <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>

        <div className="card" style={{ padding: 14, background: "#F7F5F0" }}>
          <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: "0 0 10px" }}>
            Under India's Digital Personal Data Protection Act, 2023, we ask for your consent
            separately for each purpose. Read our{" "}
            <Link to="/privacy-policy" target="_blank">Privacy Policy</Link> for full details.
          </p>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--color-ink)" }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={consentBooking} onChange={(e) => setConsentBooking(e.target.checked)} required />
            <span><strong>Required.</strong> I consent to my name, contact details and address being used to create my account and book sessions.</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginTop: 10 }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={consentHealth} onChange={(e) => setConsentHealth(e.target.checked)} />
            <span>I consent to sharing brief notes about my condition, to help the therapist prepare (optional).</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginTop: 10 }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={consentMarketing} onChange={(e) => setConsentMarketing(e.target.checked)} />
            <span>I'm okay receiving occasional offers or wellness tips beyond appointment confirmations (optional).</span>
          </label>
        </div>

        {error && <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}