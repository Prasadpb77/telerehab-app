import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { AvailabilitySlot } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

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
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const { data } = await supabase
          .from("availability_slots")
          .select("*")
          .eq("is_booked", false)
          .gt("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });
        setSlots((data as AvailabilitySlot[]) ?? []);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSubmitting(true);

    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setError("Please pick a clinical slot.");
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
      setError(
        insertErr.message.includes("already booked")
          ? "That slot was just reserved — please choose another slot."
          : insertErr.message
      );
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div style={{ maxWidth: 540, margin: "40px auto" }}>
        <ScrollReveal from="scale">
          <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Consultation Requested</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              Your session request has been submitted. Dr. Neha Dhanokar will review and confirm your slot promptly.
              You will receive confirmation via WhatsApp and inside your portal.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/patient/appointments")} style={{ padding: "12px 24px" }}>
              View My Appointments →
            </button>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 6 }}>
            Book a Clinical Session
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Select an open availability slot with Dr. Neha Dhanokar for South Mumbai in-home or TeleRehab video care.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal from="up" delay={80}>
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            <div>
              <label htmlFor="slot-select">
                Available Clinical Slots <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              {loadingSlots ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>Loading open slots…</p>
              ) : slots.length === 0 ? (
                <div style={{ padding: 14, background: "var(--color-surface-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>
                    No upcoming open slots are available at this moment. Please check back shortly or contact the practice directly.
                  </p>
                </div>
              ) : (
                <select
                  id="slot-select"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose a convenient date & time
                  </option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.starts_at).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="visit-address">
                Visit Address <span style={{ color: "var(--color-ink-faint)", fontWeight: 400 }}>(Leave blank for a Google Meet TeleRehab video session)</span>
              </label>
              <textarea
                id="visit-address"
                rows={2}
                value={visitAddress}
                onChange={(e) => setVisitAddress(e.target.value)}
                placeholder="Apartment/Flat, Building name, Street, Area (e.g. Colaba, Worli, Malabar Hill)"
              />
            </div>

            <div>
              <label htmlFor="visit-reason">
                Reason for Consultation <span style={{ color: "var(--color-ink-faint)", fontWeight: 400 }}>(Optional clinical context)</span>
              </label>
              <textarea
                id="visit-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Post-stroke motor recovery, lower back disc herniation, post-knee replacement rehabilitation"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting || !selectedSlotId || slots.length === 0}
              style={{ padding: "12px", fontSize: 15, justifyContent: "center" }}
            >
              {submitting ? "Submitting Booking Request…" : "Request Selected Slot"}
            </button>
          </form>
        </div>
      </ScrollReveal>
    </div>
  );
}
