import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

export default function DataRequest() {
  const { profile } = useAuth();
  const [requestType, setRequestType] = useState("access");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    }
  }

  if (submitted) {
    return (
      <div className="container" style={{ maxWidth: 480, paddingTop: 60 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Request received</h2>
          <p style={{ color: "var(--color-ink-muted)" }}>
            We'll respond within a reasonable time, as required under the DPDP Act.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 40, paddingBottom: 40 }}>
      <Link to="/" style={{ fontSize: 13 }}>← Back home</Link>
      <h1 style={{ marginTop: 16 }}>Access, correct, or delete your data</h1>
      <p style={{ color: "var(--color-ink-muted)" }}>
        Use this form to exercise your rights under India's Digital Personal Data Protection Act, 2023.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>Request type
          <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
            <option value="access">Access my data</option>
            <option value="correction">Correct my data</option>
            <option value="erasure">Erase my data</option>
            <option value="consent_withdrawal">Withdraw a consent</option>
            <option value="grievance">Raise a grievance</option>
          </select>
        </label>
        <label>Email we should reply to
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Details (optional)
          <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything specific we should know" />
        </label>
        {error && <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary" type="submit">Submit request</button>
      </form>
    </div>
  );
}
