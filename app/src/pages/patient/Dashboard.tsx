import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import type { Appointment } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [nextAppt, setNextAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(({ appointments }) => {
      const upcoming = (appointments as Appointment[])
        .filter((a) => a.status === "scheduled" && new Date(a.starts_at) > new Date())
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
      setNextAppt(upcoming[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "Patient";
  const isJoinable =
    nextAppt &&
    nextAppt.google_meet_url &&
    new Date(nextAppt.starts_at).getTime() - Date.now() < 15 * 60 * 1000;

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Welcome Banner */}
      <ScrollReveal from="subtle-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
              <span className="badge-dot" /> TeleRehab Active
            </div>
            <h1 style={{ fontSize: "clamp(26px, 2.5vw, 34px)", marginBottom: 4 }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
              Here is your active physiotherapy and recovery summary for today.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/patient/book" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Book Session
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Focus Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24, marginTop: 8 }}>
        {/* Next Appointment Card */}
        <ScrollReveal from="up" delay={80}>
          <div
            className="card"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderTop: "4px solid var(--color-brand-teal)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-xs)",
                    background: "var(--color-brand-teal-glaze)",
                    color: "var(--color-brand-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, margin: 0 }}>Next Scheduled Session</h3>
              </div>
              <span className={nextAppt ? "badge badge-scheduled" : "badge"}>
                {nextAppt ? "Confirmed" : "No Pending Sessions"}
              </span>
            </div>

            {loading ? (
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>Checking schedule…</p>
            ) : nextAppt ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface-subtle)",
                    border: "1px solid var(--color-border-subtle)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)", marginBottom: 4 }}>
                    {new Date(nextAppt.starts_at).toLocaleString("en-IN", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
                    {nextAppt.visit_address ? (
                      <span>📍 In-home visit: {nextAppt.visit_address}</span>
                    ) : (
                      <span>💻 TeleRehab Video Session (Google Meet)</span>
                    )}
                  </div>
                </div>

                {nextAppt.google_meet_url && (
                  <div style={{ marginTop: "auto" }}>
                    <a
                      className={`btn btn-primary ${isJoinable ? "pulse-active" : ""}`}
                      href={nextAppt.google_meet_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: "100%",
                        padding: "12px 18px",
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                      {isJoinable ? "Join Google Meet Now" : "Google Meet Video Link Ready"}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 0" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginBottom: 16 }}>
                  You don't have any upcoming physiotherapy sessions scheduled.
                </p>
                <Link to="/patient/book" className="btn btn-outline" style={{ alignSelf: "flex-start" }}>
                  Schedule a Consultation →
                </Link>
              </div>
            )}

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border-subtle)" }}>
              <Link to="/patient/appointments" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-brand-teal)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                View all past & upcoming appointments →
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Today's Regimen Card */}
        <ScrollReveal from="up" delay={160}>
          <div
            className="card"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderTop: "4px solid var(--color-brand-accent)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-xs)",
                    background: "var(--color-brand-accent-soft)",
                    color: "var(--color-brand-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, margin: 0 }}>Assigned Therapy Plan</h3>
              </div>
              <span className="badge" style={{ background: "var(--color-brand-accent-soft)", color: "var(--color-brand-accent)" }}>
                Active Regimen
              </span>
            </div>

            <p style={{ color: "var(--color-ink-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              Review prescribed motor patterns, daily repetitions, sets, and instructional video demos
              tailored to your neuro/physical recovery.
            </p>

            <div
              style={{
                marginTop: "auto",
                padding: "16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border-subtle)",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Today's Focus:</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>
                Complete your assigned movement repetitions and log pain/difficulty metrics.
              </div>
            </div>

            <Link
              to="/patient/exercises"
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "center", padding: "10px" }}
            >
              Open Therapy Plan →
            </Link>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border-subtle)" }}>
              <Link to="/patient/progress" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-brand-teal)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Review pain & difficulty recovery trend →
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          Care Management Shortcuts
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            {
              title: "Session History",
              desc: "Therapist-approved notes and clinical observations",
              to: "/patient/history",
              icon: "📋",
            },
            {
              title: "Care Assistant",
              desc: "Ask questions about your exercises and care plan",
              to: "/patient/chatbot",
              icon: "💬",
            },
            {
              title: "Book Next Session",
              desc: "Check Dr. Neha's open calendar slots",
              to: "/patient/book",
              icon: "📅",
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card card-interactive"
              style={{ padding: "18px 20px", display: "flex", flexDirection: "column", textDecoration: "none" }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.4 }}>{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
