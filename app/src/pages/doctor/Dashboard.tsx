import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Appointment } from "../../types/db";

export default function DoctorDashboard() {
  const [today, setToday] = useState<Appointment[]>([]);

  useEffect(() => {
    api.appointments.list().then(({ appointments }) => {
      const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
      setToday((appointments as Appointment[]).filter((a) => isToday(a.starts_at) && a.status === "scheduled"));
    });
  }, []);

  return (
    <div>
      <h1>Today's schedule</h1>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {today.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No sessions scheduled for today.</p>}
        {today.map((a) => (
          <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>{new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            {a.google_meet_url && (
              <a className="btn btn-primary" href={a.google_meet_url} target="_blank" rel="noreferrer">
                Start Meet
              </a>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Link to="/doctor/calendar">Manage calendar & create slots →</Link>
      </div>
    </div>
  );
}
