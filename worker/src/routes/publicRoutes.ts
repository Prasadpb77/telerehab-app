import { Hono } from "hono";
import type { Env } from "../env";
import { getSupabaseAdmin } from "../supabaseAdmin";

export const publicRoutes = new Hono<{ Bindings: Env }>();

/**
 * DPDP Act data-rights intake (access/correction/erasure/grievance/consent
 * withdrawal). Deliberately public/unauthenticated — this app's frontend
 * Supabase client only ever carries the custom JWT (empty when logged out),
 * so anonymous visitors can't write via PostgREST directly; this Worker
 * route is the reliable path for both logged-in and logged-out visitors.
 */
publicRoutes.post("/data-request", async (c) => {
  const body = await c.req.json<{
    patient_id?: string;
    contact_email: string;
    request_type: "access" | "correction" | "erasure" | "grievance" | "consent_withdrawal";
    details?: string;
  }>();

  if (!body.contact_email || !body.request_type) {
    return c.json({ error: "contact_email and request_type are required" }, 400);
  }

  const supabase = await getSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("data_requests")
    .insert({
      patient_id: body.patient_id ?? null,
      contact_email: body.contact_email,
      request_type: body.request_type,
      details: body.details ?? null,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ request: data }, 201);
});
