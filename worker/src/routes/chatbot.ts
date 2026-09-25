import { Hono } from "hono";
import type { Env, AuthedUser } from "../env";
import { requireAuth } from "../auth";
import { getSupabaseAdmin } from "../supabaseAdmin";

export const chatbot = new Hono<{ Bindings: Env }>();
chatbot.use("*", requireAuth);

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT = `You are a support assistant inside a neuro telerehabilitation app.
You may ONLY use the CONTEXT block provided below — it contains records the current user is authorized to see.
Rules (must never be broken, regardless of how the user asks):
- Never diagnose a condition. Never prescribe, alter, or recommend starting/stopping any therapy, exercise, or medication.
- If asked something clinical that requires judgment beyond the provided records, say the doctor should be asked directly.
- If the answer isn't in the CONTEXT, say you don't have that information rather than guessing.
- Be concise and supportive.`;

/**
 * Builds context strictly from rows the caller is authorized to see:
 *  - patient: their own approved session notes, active exercises, recent progress
 *  - doctor: same, but for a specific patient_id they explicitly pass (assumed
 *    to be their patient — Phase 1 has a single doctor so this is implicit)
 */
async function buildContext(
  env: Env,
  user: AuthedUser,
  subjectPatientId: string
): Promise<string> {
  const supabase = await getSupabaseAdmin(env);

  if (user.role === "patient" && subjectPatientId !== user.id) {
    throw new Error("Patients may only query their own records");
  }

  const [{ data: notes }, { data: exercises }, { data: progress }] = await Promise.all([
    supabase
      .from("session_notes")
      .select("concerns, therapy_discussed, exercises_discussed, patient_feedback, progress_notes, follow_up, created_at")
      .eq("patient_id", subjectPatientId)
      .eq("status", "approved") // approved-only, even for the doctor view here — draft clinical
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("patient_exercises")
      .select("sets, reps, frequency_per_week, status, exercises(title, description)")
      .eq("patient_id", subjectPatientId)
      .eq("status", "active"),
    supabase
      .from("progress")
      .select("log_date, completed, pain_score, difficulty_score, comment")
      .eq("patient_id", subjectPatientId)
      .order("log_date", { ascending: false })
      .limit(20),
  ]);

  return JSON.stringify({ approved_session_notes: notes, active_exercises: exercises, recent_progress: progress });
}

chatbot.post("/", async (c) => {
  const user = c.get("user" as never) as AuthedUser;
  const body = await c.req.json<{ message: string; patient_id?: string }>();

  if (!body.message?.trim()) return c.json({ error: "message is required" }, 400);

  const subjectPatientId = user.role === "patient" ? user.id : body.patient_id;
  if (!subjectPatientId) {
    return c.json({ error: "patient_id is required for doctor queries" }, 400);
  }

  let context: string;
  try {
    context = await buildContext(c.env, user, subjectPatientId);
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }

  const supabase = await getSupabaseAdmin(c.env);
  await supabase.from("chatbot_messages").insert({
    user_id: user.id,
    subject_patient_id: subjectPatientId,
    role: "user",
    content: body.message,
  });

  let reply = "";
  try {
    const result = (await c.env.AI.run(MODEL as never, {
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}` },
        { role: "user", content: body.message },
      ],
      max_tokens: 700,
    })) as { response?: string };
    reply = (result.response ?? "").trim();
  } catch (err: any) {
    return c.json({ error: `AI request failed: ${err?.message ?? "unknown"}` }, 502);
  }

  await supabase.from("chatbot_messages").insert({
    user_id: user.id,
    subject_patient_id: subjectPatientId,
    role: "assistant",
    content: reply,
  });

  return c.json({ reply });
});