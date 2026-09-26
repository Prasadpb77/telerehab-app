import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const patientLinks = [
  { to: "/patient", label: "Dashboard", end: true },
  { to: "/patient/book", label: "Book a session" },
  { to: "/patient/appointments", label: "Appointments" },
  { to: "/patient/exercises", label: "Therapy Plan" },
  { to: "/patient/history", label: "Session History" },
  { to: "/patient/progress", label: "Progress" },
  { to: "/patient/chatbot", label: "Ask an Assistant" },
];

const doctorLinks = [
  { to: "/doctor", label: "Dashboard", end: true },
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/calendar", label: "Calendar" },
  { to: "/doctor/chatbot", label: "Assistant" },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const links = profile?.role === "doctor" ? doctorLinks : patientLinks;

  return (
    <div className="app-shell" style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
      <aside className="app-nav" style={{ borderRight: "1px solid var(--color-border)", padding: "24px 16px", background: "var(--color-surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 28 }}>Neuro TeleRehab</div>
        <nav style={{ display: "grid", gap: 4 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 14,
                textDecoration: "none",
                color: isActive ? "var(--color-primary-dark)" : "var(--color-ink)",
                background: isActive ? "#EDF3F1" : "transparent",
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{profile?.full_name}</div>
          <button className="btn btn-outline" style={{ marginTop: 8, fontSize: 12 }} onClick={signOut}>
            Sign out
          </button>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/data-request">My data rights</Link>
          </div>
        </div>
      </aside>
      <main style={{ padding: "32px 40px" }}>
        <Outlet />
      </main>
    </div>
  );
}
