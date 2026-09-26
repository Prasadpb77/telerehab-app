# Neuro TeleRehab — Phase 1

A single-therapist neuro telerehabilitation app: patients book/attend Google Meet
sessions, follow a doctor-assigned exercise plan, log progress, read
doctor-approved session notes, and ask a records-scoped AI assistant questions.
The doctor manages patients, calendar/Meet slots, reviews AI-drafted notes
before they reach the patient, and has their own assistant for
searching/summarizing patient data.

## Stack & why it's split this way

- **Frontend**: React + Vite + TypeScript on Cloudflare Pages. Talks to
  Supabase directly for anything RLS can safely gate (reads of your own
  appointments/exercises/notes), and to the Worker for anything privileged.
- **Worker (Cloudflare)**: the only place holding the Supabase **service role**
  key, Google OAuth client secret/refresh token, and the JWT **signing key**.
  Secrets are bound from **Cloudflare Secrets Store** and resolved
  asynchronously (`await secret.get()`). It verifies the caller's custom JWT,
  checks their role, then performs the Calendar/Meet call or AI call and writes
  back to Supabase. **AI runs entirely on Cloudflare Workers AI**
  (`@cf/meta/llama-3.1-8b-instruct`) via the `[ai]` binding — no external AI
  provider or API key.
- **Supabase**: Postgres + Row Level Security. Identity is handled by the
  Worker's own auth endpoints (`/api/auth/signup|login|me`) using salted
  PBKDF2 password hashes; the Worker issues **ES256** JWTs signed with the
  Supabase asymmetric (ECC P-256) signing key so PostgREST accepts them and RLS
  `auth.uid()` resolves to the `sub` claim. RLS is the real boundary for direct
  browser reads — a patient's query for `session_notes` can only ever return
  rows where `patient_id = auth.uid() AND status = 'approved'`.

## Repo layout

```
app/       React + Vite + TS frontend → Cloudflare Pages
worker/    Cloudflare Worker (Hono) → the API, holds all secrets
supabase/  schema.sql — tables + RLS policies
```

## One-time setup

### 1. Supabase
1. Create a project, run `supabase/schema.sql` in the SQL editor. The schema
   creates the tables, RLS policies, and **seed accounts**:
   - `doctor@telerehab.local` / `Doctor123!` (role = doctor)
   - `patient@telerehab.local` / `Patient123!` (role = patient)
   Change these credentials before any real deployment.
2. Copy your Project URL, anon key, and service role key
   (Settings → API).
3. Configure JWT signing. Supabase Dashboard → **Project Settings → API →
   JWT Settings** shows your **JWT Secret** (this is the "Legacy JWT Secret"
   view — if your project only shows "JWT Signing Keys" with no legacy
   secret, click "Switch to legacy JWT secret" or generate one there first).
   Copy that value and store it as the Worker secret **`SUPABASE_JWT_SECRET`**.
   The Worker signs **HS256** with this same shared secret; Supabase's own
   PostgREST/RLS layer verifies with that identical secret, so RLS
   `auth.uid()` resolves to the token's `sub` claim on both sides. No key id,
   no public/private key pair — just the one secret value.

### 2. Google Cloud
1. Create a project, enable the **Google Calendar API**.
2. Create an OAuth 2.0 Client ID (Web application).
3. Run a one-time consent flow as the doctor's Google account, scope
   `https://www.googleapis.com/auth/calendar`, to obtain a **refresh token**
   (e.g. via Google's OAuth Playground with your own client ID/secret, or a
   short throwaway script — this only needs to be done once at onboarding).
4. Store client ID, client secret, and that refresh token as Worker secrets.

### 3. Worker
Secrets are bound via `[[secrets_store_secrets]]` in `wrangler.toml` (set
`store_id` to your Secrets Store id) and read with `await env.<BINDING>.get()`:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

```bash
cd worker
npm install
# edit wrangler.toml: set Secrets Store store_id + `vars` (calendar id, allowed origin)
npm run deploy
```

### 4. Frontend
```bash
cd app
cp .env.example .env       # fill in Supabase URL/anon key + the deployed Worker URL
npm install
npm run dev                # or: npm run build, then deploy dist/ to Cloudflare Pages
```

## Appointment flow (as implemented in `worker/src/routes/appointments.ts`)

1. Doctor submits a slot (patient + start/end) from `/doctor/calendar`.
2. Worker inserts the `appointments` row first (`status = scheduled`, no
   Google IDs yet). A unique index on `(doctor_id, starts_at)` blocks exact
   duplicate slot creation at the DB level.
3. Worker calls Google Calendar with `conferenceDataVersion=1` and a
   `createRequest` (idempotent via `requestId = appointment.id`), which
   auto-generates the Meet link.
4. Worker patches the same row with `google_event_id` + `google_meet_url`.
5. If step 3/4 fails, the Worker deletes the row it inserted in step 2 —
   there is never a "scheduled" appointment without a working Meet link.
6. Editing (`PATCH /api/appointments/:id`) patches the *existing* Calendar
   event rather than creating a new one. Cancelling deletes the Calendar
   event (idempotent — a 404/410 from Google is treated as already-gone) and
   marks the row `cancelled` rather than deleting it, so history is kept.

## Meet AI notes pipeline

Google Meet's live-media/transcription API access is limited/preview, so
Phase 1 does not fake a real-time in-Meet capture. Instead
`POST /api/meet-transcript` is a stable ingestion interface with a `source`
field (`manual` | `upload` | `meet_addon`) — the doctor pastes or uploads a
transcript after a call today; a future Meet side-panel add-on can call the
exact same endpoint once broader API access is available, with no schema or
workflow change. Every submission requires `sessions.recording_consent_confirmed
= true` first. On ingestion the Worker calls Cloudflare Workers AI
(`@cf/meta/llama-3.1-8b-instruct`) to draft a structured
`session_notes` row (`status = draft`), which the doctor edits and explicitly
approves; only `status = 'approved'` notes are ever visible to the patient
(enforced by RLS, not just app logic).

## AI chatbot scoping

Both chatbots (`worker/src/routes/chatbot.ts`) build their context by
querying Supabase with the service-role key but constrained to exactly the
rows the caller may see (patient: their own approved notes/active
exercises/recent progress; doctor: same, for a patient id they pass), then
pass only that JSON as context to Workers AI with a system prompt that forbids
diagnosis or treatment changes. Nothing outside that context block can enter
the answer.

## What's deliberately not built (per spec)

Multiple doctors/therapists, payments, wearable integrations, computer
vision, advanced analytics, and any autonomous diagnosis or treatment
change — the chatbot's system prompt and doctor approval gate are the two
enforcement points for the "no autonomous diagnosis/prescription" rule.