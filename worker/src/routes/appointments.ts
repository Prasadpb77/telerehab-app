import { Hono } from "hono";
import type { Env, AuthedUser } from "../env";
import { requireAuth, requireRole } from "../auth";
import { getSupabaseAdmin } from "../supabaseAdmin";
import {
  createCalendarEventWithMeet,
  updateCalendarEvent,
  cancelCalendarEvent,
} from "../google/calendar";

export const appointments = new Hono<{ Bindings: Env }>();

appointments.use("*", requireAuth);

function toWhatsAppDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}

function formatSlot(startsAt: string): string {
  return new Date(startsAt).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

/**
 * Doctor creates a slot (optionally pre-assigned to a patient, or left open
 * and booked later — Phase 1 assumes doctor assigns patient at creation).
 *
 * Flow (in order, per spec):
 *  1. Insert appointment row in Supabase (status=scheduled, no google ids yet).
 *  2. Create Calendar event + Meet link.
 *  3. Patch the row with google_event_id + google_meet_url.
 * If step 2/3 fails, the appointment row is rolled back (deleted) so we never
 * leave a "scheduled" slot with no Meet link.
 */
appointments.post("/", requireRole("doctor"), async (c) => {
  const doctor = c.get("user" as never) as AuthedUser;
  const body = await c.req.json<{
    patient_id: string;
    starts_at: string; // ISO
    ends_at: string; // ISO
    notes?: string;
  }>();

  if (!body.patient_id || !body.starts_at || !body.ends_at) {
    return c.json({ error: "patient_id, starts_at, ends_at are required" }, 400);
  }
  if (new Date(body.ends_at) <= new Date(body.starts_at)) {
    return c.json({ error: "ends_at must be after starts_at" }, 400);
  }

  const supabase = await getSupabaseAdmin(c.env);

  // Fetch patient + doctor emails for calendar invite.
  const { data: patientUser, error: patientErr } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", body.patient_id)
    .single();
  if (patientErr || !patientUser || patientUser.role !== "patient") {
    return c.json({ error: "Invalid patient_id" }, 400);
  }

  // 1. Insert row (unique index on (doctor_id, starts_at) where scheduled
  //    blocks exact duplicate slot creation).
  const { data: appt, error: insertErr } = await supabase
    .from("appointments")
    .insert({
      doctor_id: doctor.id,
      patient_id: body.patient_id,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      notes: body.notes ?? null,
      status: "scheduled",
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return c.json({ error: "A slot already exists at this time" }, 409);
    }
    return c.json({ error: insertErr.message }, 500);
  }

  // 2. Create Calendar event + Meet link. requestId = appointment id makes
  //    this idempotent at Google's end if we ever retry.
  try {
    const { googleEventId, meetUrl } = await createCalendarEventWithMeet(c.env, {
      requestId: appt.id,
      summary: `Neuro TeleRehab session — ${patientUser.full_name}`,
      description: body.notes ?? "",
      startIso: body.starts_at,
      endIso: body.ends_at,
      attendeeEmails: [patientUser.email, doctor.email],
    });

    // 3. Save Calendar event id + Meet URL.
    const { data: updated, error: updateErr } = await supabase
      .from("appointments")
      .update({ google_event_id: googleEventId, google_meet_url: meetUrl })
      .eq("id", appt.id)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);

    return c.json({ appointment: updated }, 201);
  } catch (err: any) {
    // Roll back the Supabase row so we never persist a scheduled slot
    // without a working Meet link.
    await supabase.from("appointments").delete().eq("id", appt.id);
    return c.json({ error: `Failed to create Meet event: ${err.message}` }, 502);
  }
});

/**
 * Doctor accepts a patient-requested (status='pending') appointment:
 *  1. Create the Calendar event + Meet link (idempotent via requestId = appointment id).
 *  2. Patch the appointment: status=scheduled, google_event_id, google_meet_url.
 *  3. Return a ready-to-send WhatsApp click-to-chat confirmation link.
 * Direct doctor-created appointments (via POST / below) skip this step
 * entirely since they're already confirmed at creation.
 */
appointments.post("/:id/accept", requireRole("doctor"), async (c) => {
  const doctor = c.get("user" as never) as AuthedUser;
  const id = c.req.param("id");
  const supabase = await getSupabaseAdmin(c.env);

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*, users!appointments_patient_id_fkey(full_name, phone, email)")
    .eq("id", id)
    .single();
  if (error || !appt) return c.json({ error: "Appointment not found" }, 404);
  if (appt.status !== "pending") return c.json({ error: "Only pending appointments can be accepted" }, 400);

  const patientInfo = appt.users as { full_name: string; phone: string | null; email: string };

  try {
    const { googleEventId, meetUrl } = await createCalendarEventWithMeet(c.env, {
      requestId: appt.id,
      summary: `Neuro TeleRehab session — ${patientInfo.full_name}`,
      description: appt.notes ?? "",
      startIso: appt.starts_at,
      endIso: appt.ends_at,
      attendeeEmails: [patientInfo.email, doctor.email],
    });

    const { data: updated, error: updateErr } = await supabase
      .from("appointments")
      .update({ status: "scheduled", google_event_id: googleEventId, google_meet_url: meetUrl })
      .eq("id", id)
      .select()
      .single();
    if (updateErr) throw new Error(updateErr.message);

    let whatsapp_url: string | null = null;
    if (patientInfo.phone) {
      const message =
        `Hi ${patientInfo.full_name}, this is your Neuro TeleRehab clinic. ` +
        `Your session on ${formatSlot(appt.starts_at)} is confirmed. ` +
        (meetUrl ? `Join here when it's time: ${meetUrl}. ` : "") +
        `Reply here if you need to reschedule.`;
      whatsapp_url = buildWhatsAppLink(patientInfo.phone, message);
    }

    return c.json({ appointment: updated, whatsapp_url });
  } catch (err: any) {
    return c.json({ error: `Failed to accept: ${err.message}` }, 502);
  }
});

/**
 * Doctor reschedules a pending or scheduled appointment to a different open
 * slot from availability_slots (frees the old slot if one was set, books the
 * new one, patches the SAME Calendar event's time rather than creating a
 * new one).
 */
appointments.post("/:id/reschedule", requireRole("doctor"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ new_slot_id: string }>();
  const supabase = await getSupabaseAdmin(c.env);

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*, users!appointments_patient_id_fkey(full_name, phone)")
    .eq("id", id)
    .single();
  if (error || !appt) return c.json({ error: "Appointment not found" }, 404);
  if (appt.status === "cancelled" || appt.status === "completed") {
    return c.json({ error: "Cannot reschedule a cancelled/completed appointment" }, 400);
  }

  const { data: newSlot, error: slotErr } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", body.new_slot_id)
    .eq("is_booked", false)
    .single();
  if (slotErr || !newSlot) return c.json({ error: "Selected new slot is not available" }, 400);

  if (appt.slot_id) {
    await supabase.from("availability_slots").update({ is_booked: false }).eq("id", appt.slot_id);
  }
  await supabase.from("availability_slots").update({ is_booked: true }).eq("id", newSlot.id);

  if (appt.google_event_id) {
    try {
      await updateCalendarEvent(c.env, appt.google_event_id, {
        startIso: newSlot.starts_at,
        endIso: newSlot.ends_at,
      });
    } catch (err: any) {
      return c.json({ error: `Slot updated but Calendar sync failed: ${err.message}` }, 502);
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from("appointments")
    .update({ slot_id: newSlot.id, starts_at: newSlot.starts_at, ends_at: newSlot.ends_at })
    .eq("id", id)
    .select()
    .single();
  if (updateErr) return c.json({ error: updateErr.message }, 500);

  const patientInfo = appt.users as { full_name: string; phone: string | null };
  let whatsapp_url: string | null = null;
  if (patientInfo.phone) {
    const message =
      `Hi ${patientInfo.full_name}, this is your Neuro TeleRehab clinic. ` +
      `Your session has been rescheduled to ${formatSlot(newSlot.starts_at)}. ` +
      `Please confirm this works, or reply here for a different time.`;
    whatsapp_url = buildWhatsAppLink(patientInfo.phone, message);
  }

  return c.json({ appointment: updated, whatsapp_url });
});

/**
 * Edit a slot's time — updates the existing Calendar event in place rather
 * than creating a new one (per spec: "editing updates the existing event").
 */
appointments.patch("/:id", requireRole("doctor"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ starts_at?: string; ends_at?: string }>();
  const supabase = await getSupabaseAdmin(c.env);

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !appt) return c.json({ error: "Appointment not found" }, 404);
  if (appt.status !== "scheduled") {
    return c.json({ error: "Only scheduled appointments can be edited" }, 400);
  }

  if (appt.google_event_id) {
    await updateCalendarEvent(c.env, appt.google_event_id, {
      startIso: body.starts_at,
      endIso: body.ends_at,
    });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("appointments")
    .update({
      starts_at: body.starts_at ?? appt.starts_at,
      ends_at: body.ends_at ?? appt.ends_at,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return c.json({ error: updateErr.message }, 500);
  return c.json({ appointment: updated });
});

/**
 * Cancel — cancels the Calendar event (idempotent: 410/404 from Google is
 * treated as already-cancelled) and marks the row cancelled rather than
 * deleting it, preserving history for the doctor's patient view.
 */
appointments.post("/:id/cancel", requireRole("doctor"), async (c) => {
  const id = c.req.param("id");
  const supabase = await getSupabaseAdmin(c.env);

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*, users!appointments_patient_id_fkey(full_name, phone)")
    .eq("id", id)
    .single();
  if (error || !appt) return c.json({ error: "Appointment not found" }, 404);

  if (appt.google_event_id) {
    await cancelCalendarEvent(c.env, appt.google_event_id);
  }

  const { data: updated, error: updateErr } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return c.json({ error: updateErr.message }, 500);

  // The free_slot_on_cancel trigger handles freeing appt.slot_id automatically.

  const patientInfo = appt.users as { full_name: string; phone: string | null };
  let whatsapp_url: string | null = null;
  if (patientInfo.phone) {
    const message =
      `Hi ${patientInfo.full_name}, this is your Neuro TeleRehab clinic. ` +
      `Unfortunately we need to cancel your upcoming session. Please reply here or rebook on our site — sorry for the inconvenience.`;
    whatsapp_url = buildWhatsAppLink(patientInfo.phone, message);
  }

  return c.json({ appointment: updated, whatsapp_url });
});

/** List appointments — patient sees own, doctor sees all (RLS would also
 *  enforce this if called with a user JWT; here the Worker filters explicitly
 *  since it uses the service-role client). */
appointments.get("/", async (c) => {
  const user = c.get("user" as never) as AuthedUser;
  const supabase = await getSupabaseAdmin(c.env);

  let query = supabase.from("appointments").select("*").order("starts_at", { ascending: true });
  query = user.role === "doctor" ? query : query.eq("patient_id", user.id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ appointments: data });
});
