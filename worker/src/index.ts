import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { appointments } from "./routes/appointments";
import { meetTranscript } from "./routes/meetTranscript";
import { auth } from "./routes/auth";
import { publicRoutes } from "./routes/publicRoutes";
import { doctor } from "./routes/doctor";
import { finance } from "./routes/finance";
import { insights } from "./routes/insights";
import { getSupabaseAdmin } from "./supabaseAdmin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE"],
  });
  return corsMiddleware(c, next);
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api/auth", auth);
app.route("/api/appointments", appointments);
app.route("/api/meet-transcript", meetTranscript);
app.route("/api/public", publicRoutes);
app.route("/api/doctor", doctor);
app.route("/api/doctor/finance", finance);
app.route("/api/doctor/insights", insights);

// ---------------------------------------------------------------------------
// Cron: generate WhatsApp reminder links for sessions happening in the next
// ~24-26 hours. This NEVER auto-sends — it stages click-to-chat links the
// doctor reviews and sends from the "Reminders to send" page, matching every
// other WhatsApp interaction in the app.
// ---------------------------------------------------------------------------
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

export async function runReminderGeneration(env: Env): Promise<number> {
  const supabase = await getSupabaseAdmin(env);

  const now = Date.now();
  const windowStart = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 26 * 60 * 60 * 1000).toISOString();

  const { data: appts, error } = await supabase
    .from("appointments")
    .select("id, starts_at, users!appointments_patient_id_fkey(full_name, phone)")
    .eq("status", "scheduled")
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);
  if (error) {
    console.error("reminders: query failed", error.message);
    return 0;
  }

  let created = 0;
  for (const appt of appts ?? []) {
    const info = appt.users as unknown as { full_name: string; phone: string | null };
    if (!info?.phone) continue;

    // Skip if an unsent reminder already exists for this appointment.
    const { data: existing } = await supabase
      .from("pending_whatsapp_reminders")
      .select("id")
      .eq("appointment_id", appt.id)
      .is("sent_at", null)
      .maybeSingle();
    if (existing) continue;

    const message =
      `Hi ${info.full_name}, a reminder about your Neuro TeleRehab session on ` +
      `${formatSlot(appt.starts_at)}. Reply here if you need to reschedule.`;
    const whatsapp_url = buildWhatsAppLink(info.phone, message);

    const { error: insertErr } = await supabase
      .from("pending_whatsapp_reminders")
      .insert({ appointment_id: appt.id, whatsapp_url });
    if (!insertErr) created++;
    else console.error("reminders: insert failed", insertErr.message);
  }

  console.log(`reminders: generated ${created} reminder link(s)`);
  return created;
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runReminderGeneration(env));
  },
};