import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ScrollProgressBar from "./ScrollProgressBar";

const patientLinks = [
  {
    to: "/patient",
    label: "Dashboard",
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    to: "/patient/book",
    label: "Book a session",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
  },
  {
    to: "/patient/appointments",
    label: "Appointments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  },
  {
    to: "/patient/exercises",
    label: "Therapy Plan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    to: "/patient/history",
    label: "Session History",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 14 14"></polyline>
      </svg>
    ),
  },
  {
    to: "/patient/progress",
    label: "Progress Trend",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
      </svg>
    ),
  },
  {
    to: "/patient/chatbot",
    label: "Care Assistant",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  },
];

const doctorLinks = [
  {
    to: "/doctor",
    label: "Overview & Schedule",
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    to: "/doctor/patients",
    label: "Patient Roster",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    to: "/doctor/calendar",
    label: "Calendar & Slots",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  },
  {
    to: "/doctor/chatbot",
    label: "Clinical Assistant",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
        <path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path>
        <path d="M12 12L2.5 7.5"></path>
        <path d="M12 12v10"></path>
      </svg>
    ),
  },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const isDoctor = profile?.role === "doctor";
  const links = isDoctor ? doctorLinks : patientLinks;

  return (
    <div className="app-shell">
      <ScrollProgressBar />
      
      {/* Sidebar Navigation */}
      <aside className="app-nav">
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-teal))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              boxShadow: "0 2px 8px rgba(29, 83, 74, 0.25)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.2 }}>
              Neuro TeleRehab
            </div>
            <div style={{ fontSize: 11, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 2 }}>
              {isDoctor ? "Clinical Workspace" : "Patient Portal"}
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-faint)", fontWeight: 600, marginBottom: 10, paddingLeft: 8 }}>
          Menu
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: 14,
                textDecoration: "none",
                color: isActive ? "var(--color-brand-teal)" : "var(--color-ink-secondary)",
                background: isActive ? "var(--color-brand-teal-glaze)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? "3px solid var(--color-brand-teal)" : "3px solid transparent",
                transition: "all var(--transition-fast)",
              })}
            >
              <span style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Card & Bottom Utilities */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              background: "var(--color-surface-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--color-brand-teal-glaze)",
                  color: "var(--color-brand-teal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {profile?.full_name ?? "User"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-ink-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {profile?.email}
                </div>
              </div>
            </div>
            <button
              className="btn btn-outline"
              style={{
                marginTop: 10,
                width: "100%",
                padding: "6px 12px",
                fontSize: 12,
                justifyContent: "center",
              }}
              onClick={signOut}
            >
              Sign out
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", fontSize: 11, color: "var(--color-ink-faint)", paddingLeft: 4 }}>
            <Link to="/privacy-policy" style={{ color: "var(--color-ink-muted)" }}>Privacy</Link>
            <span>·</span>
            <Link to="/terms" style={{ color: "var(--color-ink-muted)" }}>Terms</Link>
            <span>·</span>
            <Link to="/data-request" style={{ color: "var(--color-ink-muted)" }}>Data rights</Link>
          </div>
        </div>
      </aside>

      {/* Main Clinical / Patient Content Canvas */}
      <main className="main-content">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}
