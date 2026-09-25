import { useEffect, useState, FormEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { Appointment, AppUser } from "../../types/db";

export default function DoctorCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [{ appointments }, { data: pts }] = await Promise.all([
      api.appointments.list(),
      supabase.from("users").select("*").eq("role", "patient"),
    ]);
    setAppointments(appointments);
    setPatients((pts as AppUser[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const starts = new Date(`${date}T${time}`);
      const ends = new Date(starts.getTime() + durationMin * 60000);
      await api.appointments.create({
        patient_id: patientId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      });
      setPatientId("");
      setDate("");
      setTime("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment? This will also cancel the Google Calendar event.")) return;
    await api.appointments.cancel(id);
    await load();
  }

  return (
    <div>
      <h1>Calendar</h1>

      <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
        <h3 style={{ fontSize: 16 }}>Create a slot</h3>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 10, marginTop: 8 }}>
          <label>
            Patient
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="" disabled>Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label style={{ flex: 1 }}>
              Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </label>
          </div>
          <label>
            Duration (minutes)
            <input type="number" value={durationMin} min={15} step={15} onChange={(e) => setDurationMin(Number(e.target.value))} />
          </label>
          {error && <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? "Creating Meet link…" : "Create slot + Meet link"}
          </button>
        </form>
      </div>

      <h3 style={{ marginTop: 32 }}>Upcoming</h3>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {appointments
          .filter((a) => a.status === "scheduled")
          .map((a) => (
            <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>{new Date(a.starts_at).toLocaleString()}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {a.google_meet_url && (
                  <a className="btn btn-outline" href={a.google_meet_url} target="_blank" rel="noreferrer">
                    Start Meet
                  </a>
                )}
                <button className="btn btn-danger" onClick={() => handleCancel(a.id)}>Cancel</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
