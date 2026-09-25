import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Signup only ever creates patient accounts. The single doctor account
      // is provisioned via the DB seed (Phase 1 has exactly one doctor).
      await signUp({ full_name: fullName, email, password });
      navigate("/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "80px auto" }}>
      <h1 style={{ fontSize: 26 }}>Create your account</h1>
      <p style={{ color: "var(--color-ink-muted)", marginBottom: 24 }}>
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
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
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