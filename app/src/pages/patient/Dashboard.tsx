import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import type { Appointment } from "../../types/db";

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [nextAppt, setNextAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    api.appointments.list().then(({ appointments }) => {
      const upcoming = (appointments as Appointment[])
        .filter((a) => a.status === "scheduled" && new Date(a.starts_at) > new Date())
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
      setNextAppt(upcoming[0] ?? null);
    });
  }, []);

  return (
    <div>
      <h1>Hi {profile?.full_name?.split(" ")[0]}</h1>
      <p style={{ color: "var(--color-ink-muted)" }}>Here's where you stand today.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <div className="card">
          <h3>Next appointment</h3>
          {nextAppt ? (
            <>
              <p>{new Date(nextAppt.starts_at).toLocaleString()}</p>
              {nextAppt.google_meet_url && (
                <a className="btn btn-primary" href={nextAppt.google_meet_url} target="_blank" rel="noreferrer">
                  Join Google Meet
                </a>
              )}
            </>
          ) : (
            <p style={{ color: "var(--color-ink-muted)" }}>No upcoming sessions scheduled.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <Link to="/patient/appointments">View all appointments →</Link>
          </div>
        </div>

        <div className="card">
          <h3>Today's plan</h3>
          <p style={{ color: "var(--color-ink-muted)" }}>Check your assigned exercises for today.</p>
          <Link to="/patient/exercises">Go to therapy plan →</Link>
        </div>
      </div>
    </div>
  );
}
