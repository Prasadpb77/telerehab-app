import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { appointments } from "./routes/appointments";
import { meetTranscript } from "./routes/meetTranscript";
import { chatbot } from "./routes/chatbot";
import { auth } from "./routes/auth";

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
app.route("/api/chatbot", chatbot);

export default app;
