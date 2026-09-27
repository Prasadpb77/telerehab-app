import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import ScrollReveal from "../../components/ScrollReveal";

export default function SetPassword() {
  const { profile, loading, refreshProfile, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!profile) return <Navigate to="/login" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.auth.changePassword(password);
      await refreshProfile();
      navigate(profile?.role === "doctor" ? "/doctor" : "/patient", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password");
      setSaving(false);
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
          <div style={{ textAlign: "center", marginBottom: 28 }}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-ink)" }}>
              Set Your Password
            </div>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginTop: 6 }}>
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Please choose a personal
              password to secure your account before continuing.
            </p>
          </div>

          <div className="card glass-panel" style={{ padding: "32px 28px" }}>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                disabled={saving}
                style={{ padding: "12px", fontSize: 15, justifyContent: "center", marginTop: 4 }}
              >
                {saving ? "Saving…" : "Save Password & Continue"}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border-subtle)", textAlign: "center" }}>
              <button className="btn btn-ghost" onClick={signOut} style={{ fontSize: 13 }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}