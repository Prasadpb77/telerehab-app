import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Appointment } from "../../types/db";

function statusBadgeClass(status: string) {
  return `badge badge-${status}`;
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.appointments.list().then(({ appointments }) => {
      setAppointments(appointments);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading appointments…</p>;

  return (
    <div>
      <h1>Your appointments</h1>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {appointments.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No appointments yet.</p>}
        {appointments.map((a) => {
          const isJoinable =
            a.status === "scheduled" &&
            new Date(a.starts_at).getTime() - Date.now() < 15 * 60 * 1000; // joinable 15 min before
          return (
            <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{new Date(a.starts_at).toLocaleString()}</div>
                <span className={statusBadgeClass(a.status)}>{a.status}</span>
              </div>
              {a.google_meet_url && a.status === "scheduled" && (
                <a
                  className="btn btn-primary"
                  href={a.google_meet_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ opacity: isJoinable ? 1 : 0.5, pointerEvents: isJoinable ? "auto" : "none" }}
                >
                  Join Meet
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
