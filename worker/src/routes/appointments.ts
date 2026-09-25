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
    .select("*")
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
  return c.json({ appointment: updated });
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
