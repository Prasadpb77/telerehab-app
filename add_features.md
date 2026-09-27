# Task: Add 8 features to the existing Neuro TeleRehab app

You are working in an EXISTING, already-deployed production repo. Do not
rewrite or restructure things that already work. Read the code before
changing it, match existing patterns exactly, and make additive changes only.

## Stack & architecture (read the actual code to confirm — this is a summary)

- **Frontend**: `app/` — React + Vite + TypeScript. Routes in `app/src/routes/router.tsx`.
  Patient pages in `app/src/pages/patient/`, doctor pages in `app/src/pages/doctor/`,
  public pages in `app/src/pages/public/`.
- **Backend**: `worker/` — Cloudflare Worker using Hono. Routes in `worker/src/routes/`.
  `worker/src/auth.ts` exports `requireAuth` and `requireRole("doctor"|"patient")`
  middleware — use these on every new privileged route, exactly like the
  existing `worker/src/routes/appointments.ts` does.
- **Database**: Supabase Postgres. Schema in `supabase/schema.sql`, with an
  additive migration already applied in `supabase/migration_002_booking_dpdp.sql`.
  Auth is CUSTOM (not Supabase Auth) — a `users` table with a `role` enum
  (`doctor`/`patient`), passwords hashed with PBKDF2 in `worker/src/crypto.ts`,
  and HS256 JWTs signed/verified with `SUPABASE_JWT_SECRET`. The frontend
  Supabase client (`app/src/lib/supabaseClient.ts`) injects this custom JWT so
  direct-from-frontend reads/writes still go through Postgres Row Level
  Security (RLS) as the logged-in user.
- **Google Calendar/Meet**: `worker/src/google/calendar.ts` has
  `createCalendarEventWithMeet`, `updateCalendarEvent`, `cancelCalendarEvent`.
  Reuse these — do not write new Calendar API calls from scratch.
- **WhatsApp**: no API/business account — we generate `wa.me` click-to-chat
  links server-side (see `buildWhatsAppLink`/`formatSlot` helpers already in
  `worker/src/routes/appointments.ts`) and return them to the frontend, which
  renders them as a link the doctor clicks to actually send. Reuse this exact
  pattern for every new feature below that needs to message a patient.
- **RLS conventions**: `is_doctor()` is a Postgres function checking
  `auth.jwt() ->> 'email'` (or similar — check `supabase/schema.sql` for the
  exact current definition) against the single doctor account. Patient rows
  are gated by `patient_id = auth.uid()`. Follow this exact pattern for any
  new table.

## Non-negotiable ground rules

1. **Never write a destructive migration.** Every SQL change must be
   `create table if not exists`, `alter table ... add column if not exists`,
   or a `do $$ ... exception when duplicate_object then null; end $$;` block
   for new enum types. If you need to add a new enum VALUE to an existing
   type, put it in its own separate SQL file/section with a comment warning
   the user it must be run as its own execution before anything using that
   value (Postgres requires the new value to be committed first — this bit
   us before, see `supabase/migration_002_booking_dpdp.sql`'s PART 1/PART 2
   split for the exact pattern to copy).
2. **You cannot run SQL against the live database yourself.** Write each
   migration to a new numbered file in `supabase/` (e.g.
   `migration_003_<name>.sql`) and list, in your final summary, the exact
   order the user needs to run them in the Supabase SQL editor.
3. **Do not touch working code you don't need to touch.** If a feature only
   needs a new file plus one new route registration line, that's the entire
   diff — don't refactor surrounding code.
4. **Match existing naming and file organization exactly.** New doctor pages
   go in `app/src/pages/doctor/`, new worker routes in `worker/src/routes/`,
   etc.
5. **After each feature, do a short self-check**: does this need a new RLS
   policy? Did I add the route to `worker/src/index.ts`? Did I add the page
   to `app/src/routes/router.tsx` and, if patient/doctor-facing, to the nav
   in `app/src/components/Layout.tsx`?
6. Build and check for type errors after each feature before moving to the
   next one. Do not batch all 8 features into one untested change.

Build the following 8 features, in this order:

---

## Feature 1 — Doctor-created patient accounts with WhatsApp temp password

**Goal**: doctor can create a patient account for someone who hasn't signed
up themselves, and get them logged in via a WhatsApp-delivered temporary
password, without any email service.

- Add `must_change_password boolean not null default false` to `users`
  (migration).
- New Worker route `POST /api/doctor/patients` (doctor-only): accepts
  `{ full_name, email, phone }`, generates a readable random temp password
  (e.g. `Rehab-` + 4 random alphanumeric chars), hashes it with the existing
  password-hashing function from `worker/src/crypto.ts`, inserts the `users`
  row with `role='patient'`, `must_change_password=true`, and returns the
  **plaintext temp password once** in the response (never store it in
  plaintext anywhere).
- New Worker route `POST /api/doctor/patients/:id/regenerate-password`
  (doctor-only): generates and stores a new temp password the same way,
  sets `must_change_password=true` again, returns the new plaintext password
  once. Use this for "forgot/resend" instead of ever trying to reveal the
  original.
- Frontend: on `app/src/pages/doctor/PatientList.tsx`, add an "Add patient"
  button opening a small form (name, email, phone). On success, show a
  "Send login details" button that builds a `wa.me` link (reuse the
  WhatsApp link pattern) with a message like: "Hi {name}, your account is
  ready. Log in at {site URL} with {email} and this temporary password:
  {password}. You'll be asked to set your own password on first login."
  Also add a "Resend / regenerate password" action on the patient's profile
  page (`app/src/pages/doctor/PatientProfile.tsx`) that calls the
  regenerate endpoint and shows the same "send via WhatsApp" button.
- Auth flow: the existing login endpoint should return `must_change_password`
  in its response. On the frontend, if true after login, redirect to a new
  **"Set your password" page** before anything else is reachable (check
  `app/src/routes/ProtectedRoute.tsx` — add a check there or wrap it
  similarly) that collects a new password, calls a new Worker route
  `POST /api/auth/change-password` (authenticated, accepts `{ new_password }`,
  updates the hash, sets `must_change_password=false`), then continues to
  the normal patient dashboard.
- Self-service `/signup` must keep working unchanged for patients who sign
  themselves up (their `must_change_password` stays `false`).

## Feature 2 — Appointment reminders (Cron Trigger)

**Goal**: automatically prep WhatsApp reminder links for sessions coming up
tomorrow, without needing a real send API.

- Add a Cloudflare Cron Trigger to `worker/wrangler.toml` (e.g. daily at a
  fixed time) and a `scheduled()` handler in `worker/src/index.ts`.
- The handler queries `appointments` where `status='scheduled'` and
  `starts_at` falls within the next ~24–26 hours, joins the patient's name
  and phone, and for now **logs** (or stores in a new small
  `pending_whatsapp_reminders` table: `id, appointment_id, whatsapp_url,
  created_at, sent_at nullable`) a generated `wa.me` reminder link per
  appointment, using the same link-building helper as elsewhere.
- Add a doctor-facing page or dashboard section (e.g. a "Reminders to send
  today" card) that lists these pending reminder links so she can click
  through and send each one, then mark it `sent_at` via a small
  `POST /api/doctor/reminders/:id/mark-sent` route.
- Do not attempt to auto-send via any WhatsApp API — this is explicitly a
  "generate the link, doctor clicks send" flow, matching every other
  WhatsApp interaction in this app.

## Feature 3 — No-show marking

**Goal**: the `no_show` status already exists in the `appointment_status`
enum but nothing in the UI ever sets it.

- On `app/src/pages/doctor/PatientProfile.tsx` (or wherever past
  appointments are listed for a patient), add a "Mark no-show" action next
  to any appointment that is `scheduled` and in the past. It should call a
  small existing-style Worker route (add
  `POST /api/appointments/:id/no-show`, doctor-only, following the same
  pattern as the existing `/cancel` route) that sets `status='no_show'`.
- If the appointment had a `slot_id`, do NOT free the slot on no-show (the
  time already passed — freeing it would be meaningless/confusing). Only
  `/cancel` frees the slot.

## Feature 4 — Doctor's own exercise library UI

**Goal**: right now new exercises can only be added via the Supabase table
editor. Give the doctor an in-app way to manage the library.

- New doctor page `app/src/pages/doctor/ExerciseLibrary.tsx`: list existing
  `exercises` rows, with an "Add exercise" form (title, description,
  video_url, default_sets, default_reps) that inserts directly into
  `exercises` via the Supabase client (RLS already allows `is_doctor()` to
  write to `exercises` — confirm this in `supabase/schema.sql`, add a
  migration if the write policy is missing). Add edit and delete actions
  too (delete should probably be blocked or warned against if any
  `patient_exercises` row references it — check and handle gracefully,
  e.g. disable delete with a tooltip explaining why, rather than letting a
  DB FK error surface raw).
- Add this page to the doctor nav in `app/src/components/Layout.tsx` and to
  `app/src/routes/router.tsx`.

## Feature 5 — Patient search/filter

**Goal**: `app/src/pages/doctor/PatientList.tsx` will get unwieldy with more
than a handful of patients.

- Add a plain text search input above the list that filters by name, email,
  or phone (client-side filtering of the already-fetched list is sufficient
  at this scale — no need for a server-side search endpoint).

## Feature 6 — Ad-hoc Meet (instant, unscheduled video call)

**Goal**: let the doctor start a Meet with a specific patient right now,
without a pre-existing appointment.

- New Worker route `POST /api/appointments/adhoc` (doctor-only): accepts
  `{ patient_id }`, creates an appointment row with `starts_at = now()`,
  `ends_at = now() + 30 minutes` (or a sensible default), `status='scheduled'`,
  no `slot_id`, then immediately calls `createCalendarEventWithMeet` exactly
  like the existing `/accept` route does, saves `google_event_id` and
  `google_meet_url`, and returns the appointment plus the Meet URL directly
  (no WhatsApp step needed here — assume the doctor is about to call/message
  the patient directly, but you MAY also return a `whatsapp_url` using the
  same helper for convenience, doctor's choice whether to use it).
- Frontend: on the patient's profile page
  (`app/src/pages/doctor/PatientProfile.tsx`), add a "Start Meet now" button
  that calls this route and opens/shows the returned Meet link immediately.

## Feature 7 — Bulk/recurring session scheduling (N sessions at once)

**Goal**: doctor can create a block of N appointments for one patient in one
action (e.g. "6 weekly sessions starting Tuesday at 5pm").

Design decisions already made — implement exactly this, do not re-derive:
- Model as N independent `appointments` rows, NOT a single recurring
  Calendar event. Each row gets its own Calendar event + Meet link when
  accepted/created, so cancelling/rescheduling one session never affects
  the others, and each keeps its own `session_notes` row — this matches
  the existing one-appointment-per-Meet-link assumption everywhere else in
  the codebase.
- Add a nullable `treatment_plan_id uuid` column to `appointments` (new
  migration) purely as a label to group the N rows together for display
  (e.g. "Session 3 of 6") — it is not a foreign key to any new table unless
  you find it cleaner to add a minimal `treatment_plans (id, patient_id,
  label, created_at)` table; either is fine, pick whichever is less code,
  but be consistent.
- Frontend: on the doctor's patient profile or calendar page, add a "Create
  a series" form: patient (pre-filled if on their profile page), number of
  sessions, starting date/time, recurrence (weekly / twice-weekly / custom
  day gap in days), duration per session. On submit, create all N
  appointment rows directly as `status='scheduled'` (skip the
  pending-request flow entirely — the doctor is creating these directly,
  same as the existing single direct-create flow) AND create the Calendar
  event + Meet link for each one in the same request (loop the existing
  `createCalendarEventWithMeet` call N times). Show a summary of all N
  created sessions with their dates on success.
- Add this as a new Worker route, e.g. `POST /api/appointments/bulk`
  (doctor-only), rather than calling the single-create endpoint N times
  from the frontend — do the loop server-side so a partial failure can be
  handled/reported clearly (e.g. "created 4 of 6, session 5 failed because
  X — the other 5 are still valid, retry just that one").

## Feature 8 — Manual payment tracking

**Goal**: record whether a session has been paid for, without integrating a
real payment gateway.

- Add columns to `appointments` (migration): `payment_status text not null
  default 'unpaid'` (values: `unpaid`, `paid`, `waived`) and
  `payment_amount numeric` (nullable).
- On the doctor's view of an appointment (dashboard and/or patient profile),
  add a simple control to set payment status and amount (a small inline
  form or dropdown + number input, doctor-only write — reuse `is_doctor()`
  RLS or a small Worker route, whichever is less code given the existing
  pattern for similar small doctor-only field updates elsewhere in the
  codebase).
- No patient-facing payment UI is needed for this pass — this is purely
  the doctor's internal record-keeping.

---

## When you're done

Give a summary listing:
1. Every new/modified file, grouped by feature.
2. The exact filenames and order of new migration files to run in the
   Supabase SQL editor, and for each one, whether it's safe to run as a
   single execution or needs to be split (like migration_002 did for its
   enum addition).
3. Any new Worker secrets or `wrangler.toml` config needed (there should be
   none for this batch — flag it clearly if you found you needed one, since
   that wasn't expected).
4. Anything you deliberately skipped or simplified, and why.