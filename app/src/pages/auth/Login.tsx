import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ScrollReveal from "../../components/ScrollReveal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await signIn(email, password);
      navigate(user.role === "doctor" ? "/doctor" : "/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        padding: "40px 20px",
      }}
    >
      <ScrollReveal from="scale">
        <div style={{ width: "100%", maxWidth: 420 }}>
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
              Log in to access your consultations, exercises, and clinical notes.
            </p>
          </div>

          <div className="card glass-panel" style={{ padding: "36px 32px" }}>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                disabled={loading}
                style={{ padding: "12px", fontSize: 15, justifyContent: "center", marginTop: 4 }}
              >
                {loading ? "Authenticating…" : "Log In"}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--color-border-subtle)", textAlign: "center", fontSize: 13 }}>
              <span style={{ color: "var(--color-ink-muted)" }}>New to Neuro TeleRehab? </span>
              <Link to="/signup" style={{ color: "var(--color-brand-teal)", fontWeight: 600 }}>
                Create a patient account
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
