import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Appointment } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

function statusBadge(status: string) {
  if (status === "scheduled") return <span className="badge badge-scheduled"><span className="badge-dot" /> Confirmed</span>;
  if (status === "pending") return <span className="badge badge-pending"><span className="badge-dot" /> Pending Review</span>;
  if (status === "approved") return <span className="badge badge-approved"><span className="badge-dot" /> Approved</span>;
  return <span className="badge">{status}</span>;
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(({ appointments }) => {
      setAppointments(appointments);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 840, padding: "40px 0" }}>
        <p style={{ color: "var(--color-ink-muted)" }}>Loading appointment records…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 4 }}>
              Your Appointments
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
              Track scheduled TeleRehab video calls, in-home consultations, and booking statuses.
            </p>
          </div>
          <Link to="/patient/book" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Book New Session
          </Link>
        </div>
      </ScrollReveal>

      {/* Appointment Cards List */}
      <div style={{ display: "grid", gap: 16 }}>
        {appointments.length === 0 && (
          <ScrollReveal from="up">
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>No Consultations Found</h3>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, maxWidth: 420, margin: "0 auto 20px" }}>
                You don't have any pending or past physiotherapy sessions yet. Pick a slot to begin care.
              </p>
              <Link to="/patient/book" className="btn btn-primary">
                Book a Session
              </Link>
            </div>
          </ScrollReveal>
        )}

        {appointments.map((a, i) => {
          const isJoinable =
            a.status === "scheduled" &&
            new Date(a.starts_at).getTime() - Date.now() < 15 * 60 * 1000;
          const isPast = new Date(a.ends_at ?? a.starts_at) < new Date();

          return (
            <ScrollReveal key={a.id} from="up" delay={i * 60}>
              <div
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "20px 24px",
                  borderLeft: a.status === "scheduled" ? "4px solid var(--color-brand-teal)" : "4px solid var(--color-border)",
                  opacity: isPast && a.status !== "pending" ? 0.85 : 1,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
                      {new Date(a.starts_at).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {statusBadge(a.status)}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", fontSize: 13, color: "var(--color-ink-muted)" }}>
                    {a.visit_address ? (
                      <span>📍 Home Visit: {a.visit_address}</span>
                    ) : (
                      <span>💻 TeleRehab Video Session (Google Meet)</span>
                    )}

                    {a.status === "pending" && (
                      <span style={{ color: "var(--color-warning)", fontWeight: 500 }}>
                        ⏳ Awaiting Dr. Neha's confirmation
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {a.google_meet_url && a.status === "scheduled" ? (
                    <a
                      className={`btn btn-primary ${isJoinable ? "pulse-active" : ""}`}
                      href={a.google_meet_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        opacity: isJoinable ? 1 : 0.6,
                        pointerEvents: isJoinable ? "auto" : "none",
                        padding: "10px 18px",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                      {isJoinable ? "Join Google Meet" : "Active 15m Prior"}
                    </a>
                  ) : null}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
