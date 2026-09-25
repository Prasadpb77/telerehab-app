import { Hono } from "hono";
import type { Env, AuthedUser } from "../env";
import { requireAuth, requireRole } from "../auth";
import { getSupabaseAdmin } from "../supabaseAdmin";
import { summarizeTranscript } from "../ai/summarize";

export const meetTranscript = new Hono<{ Bindings: Env }>();
meetTranscript.use("*", requireAuth);

/**
 * Isolated transcript-capture interface.
 *
 * Google Meet's real-time media/transcription API access is limited/preview,
 * so Phase 1 does NOT fake a live-capture integration. Instead this endpoint
 * accepts a transcript from any `source`:
 *   - "manual": doctor pastes/types the transcript after the call
 *   - "upload": doctor uploads a transcript file (frontend extracts text,
 *               posts it here the same way)
 *   - "meet_addon": reserved for a future Meet add-on/side-panel that streams
 *               real captions once that Google API access is available —
 *               it would call this exact same endpoint/shape, no schema change.
 *
 * A session must exist (created when appointment starts) with
 * recording_consent_confirmed = true before a transcript can be stored,
 * enforcing consent regardless of capture source.
 */
meetTranscript.post("/", requireRole("doctor"), async (c) => {
  const body = await c.req.json<{
    session_id: string;
    raw_text: string;
    source?: "manual" | "upload" | "meet_addon";
  }>();

  if (!body.session_id || !body.raw_text?.trim()) {
    return c.json({ error: "session_id and raw_text are required" }, 400);
  }

  const supabase = await getSupabaseAdmin(c.env);

  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", body.session_id)
    .single();
  if (sessionErr || !session) return c.json({ error: "Session not found" }, 404);

  if (!session.recording_consent_confirmed) {
    return c.json(
      { error: "Recording/transcription consent has not been confirmed for this session" },
      403
    );
  }

  const { data: transcript, error: transcriptErr } = await supabase
    .from("transcripts")
    .insert({
      session_id: body.session_id,
      raw_text: body.raw_text,
      source: body.source ?? "manual",
    })
    .select()
    .single();
  if (transcriptErr) return c.json({ error: transcriptErr.message }, 500);

  // Generate the structured AI draft note immediately.
  const summary = await summarizeTranscript(c.env, body.raw_text);

  const { data: note, error: noteErr } = await supabase
    .from("session_notes")
    .upsert(
      {
        session_id: body.session_id,
        patient_id: session.patient_id,
        doctor_id: session.doctor_id,
        status: "draft",
        ai_generated: true,
        ...summary,
      },
      { onConflict: "session_id" }
    )
    .select()
    .single();
  if (noteErr) return c.json({ error: noteErr.message }, 500);

  return c.json({ transcript, note }, 201);
});

/** Doctor edits the AI draft before approval. */
meetTranscript.patch("/notes/:noteId", requireRole("doctor"), async (c) => {
  const noteId = c.req.param("noteId");
  const body = await c.req.json<Partial<{
    concerns: string;
    therapy_discussed: string;
    exercises_discussed: string;
    patient_feedback: string;
    progress_notes: string;
    follow_up: string;
  }>>();

  const supabase = await getSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("session_notes")
    .update({ ...body, ai_generated: false })
    .eq("id", noteId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ note: data });
});

/** Doctor approves — only after this does the note become visible to the patient (RLS-enforced). */
meetTranscript.post("/notes/:noteId/approve", requireRole("doctor"), async (c) => {
  const doctor = c.get("user" as never) as AuthedUser;
  const noteId = c.req.param("noteId");
  const supabase = await getSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("session_notes")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: doctor.id })
    .eq("id", noteId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ note: data });
});
