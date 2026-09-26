import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { Appointment, AppUser, AvailabilitySlot } from "../../types/db";

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsById, setPatientsById] = useState<Record<string, AppUser>>({});
  const [openSlots, setOpenSlots] = useState<AvailabilitySlot[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newSlotChoice, setNewSlotChoice] = useState("");
  const [whatsappLink, setWhatsappLink] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [{ appointments: appts }, { data: pts }, { data: slots }] = await Promise.all([
      api.appointments.list(),
      supabase.from("users").select("*").eq("role", "patient"),
      supabase.from("availability_slots").select("*").eq("is_booked", false).gt("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }),
    ]);
    setAppointments(appts);
    const map: Record<string, AppUser> = {};
    ((pts as AppUser[]) ?? []).forEach((p) => { map[p.id] = p; });
    setPatientsById(map);
    setOpenSlots((slots as AvailabilitySlot[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleAccept(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.accept(id);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReschedule(id: string) {
    if (!newSlotChoice) return;
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.reschedule(id, newSlotChoice);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      setReschedulingId(null);
      setNewSlotChoice("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    setBusyId(id);
    setError(null);
    try {
      const { whatsapp_url } = await api.appointments.cancel(id);
      if (whatsapp_url) setWhatsappLink({ id, url: whatsapp_url });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = appointments.filter((a) => a.status === "pending");
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
  const today = appointments.filter((a) => a.status === "scheduled" && isToday(a.starts_at));

  return (
    <div>
      <h1>Requests & today's schedule</h1>
      {error && <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>Pending requests ({pending.length})</h2>
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        {pending.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No new requests.</p>}
        {pending.map((a) => {
          const patient = patientsById[a.patient_id];
          return (
            <div key={a.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <Link to={`/doctor/patients/${a.patient_id}`}>{patient?.full_name ?? "Patient"}</Link>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{formatSlot(a.starts_at)}</div>
                  {a.visit_address && <div style={{ fontSize: 13 }}>{a.visit_address}</div>}
                  {a.notes && <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>Reason: {a.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button className="btn btn-primary" disabled={busyId === a.id} onClick={() => handleAccept(a.id)}>
                    {busyId === a.id ? "…" : "Accept + create Meet"}
                  </button>
                  <button className="btn btn-danger" disabled={busyId === a.id} onClick={() => handleCancel(a.id)}>Decline</button>
                </div>
              </div>
              {whatsappLink?.id === a.id && (
                <a className="btn btn-outline" style={{ marginTop: 10 }} href={whatsappLink.url} target="_blank" rel="noreferrer">
                  Send WhatsApp confirmation →
                </a>
              )}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Today ({today.length})</h2>
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        {today.length === 0 && <p style={{ color: "var(--color-ink-muted)" }}>No sessions scheduled for today.</p>}
        {today.map((a) => {
          const patient = patientsById[a.patient_id];
          return (
            <div key={a.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <Link to={`/doctor/patients/${a.patient_id}`}>{patient?.full_name ?? "Patient"}</Link>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
                    {new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {a.google_meet_url && (
                    <a className="btn btn-primary" href={a.google_meet_url} target="_blank" rel="noreferrer">Start Meet</a>
                  )}
                  <button className="btn btn-outline" onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}>Reschedule</button>
                  <button className="btn btn-danger" disabled={busyId === a.id} onClick={() => handleCancel(a.id)}>Cancel</button>
                </div>
              </div>

              {reschedulingId === a.id && (
                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select value={newSlotChoice} onChange={(e) => setNewSlotChoice(e.target.value)} style={{ maxWidth: 260 }}>
                    <option value="" disabled>Pick a new slot</option>
                    {openSlots.map((s) => (
                      <option key={s.id} value={s.id}>{formatSlot(s.starts_at)}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" disabled={!newSlotChoice || busyId === a.id} onClick={() => handleReschedule(a.id)}>
                    Confirm new time
                  </button>
                </div>
              )}

              {whatsappLink?.id === a.id && (
                <a className="btn btn-outline" style={{ marginTop: 10 }} href={whatsappLink.url} target="_blank" rel="noreferrer">
                  Send WhatsApp update →
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link to="/doctor/calendar">Manage calendar & open slots →</Link>
      </div>
    </div>
  );
}
