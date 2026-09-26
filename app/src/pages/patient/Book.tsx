import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { AvailabilitySlot } from "../../types/db";

export default function PatientBook() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [visitAddress, setVisitAddress] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from("availability_slots")
      .select("*")
      .eq("is_booked", false)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .then(({ data }) => setSlots((data as AvailabilitySlot[]) ?? []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSubmitting(true);

    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setError("Please pick a slot.");
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase.from("appointments").insert({
      doctor_id: slot.doctor_id,
      patient_id: profile.id,
      slot_id: slot.id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      visit_address: visitAddress || null,
      notes: reason || null,
      status: "pending",
    });

    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message.includes("already booked") ? "That slot was just taken — please pick another." : insertErr.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
        <h2>Request sent!</h2>
        <p style={{ color: "var(--color-ink-muted)" }}>
          Dr. Neha Dhanokar will confirm your session shortly. You can track its status under "Appointments".
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/patient/appointments")}>View my appointments</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Book a session</h1>
      <p style={{ color: "var(--color-ink-muted)" }}>Pick an open slot — your therapist will confirm it.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 16 }}>
        <label>Choose a slot
          <select value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)} required>
            <option value="" disabled>Select a date & time</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </option>
            ))}
          </select>
          {slots.length === 0 && <p style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>No open slots right now — please check back soon.</p>}
        </label>
        <label>Visit address (leave blank for a video session)
          <textarea rows={2} value={visitAddress} onChange={(e) => setVisitAddress(e.target.value)} placeholder="Flat/House no., building, street, area" />
        </label>
        <label>Reason for visit (optional)
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. lower back pain, post-surgery recovery" />
        </label>
        {error && <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting || !selectedSlotId}>
          {submitting ? "Requesting…" : "Request this slot"}
        </button>
      </form>
    </div>
  );
}
