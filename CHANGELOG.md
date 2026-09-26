# Changelog — Patient self-booking, doctor accept/reschedule/WhatsApp, DPDP compliance

## Do you need to delete any tables? No.

Everything below is **additive**. `supabase/migration_002_booking_dpdp.sql` only
uses `create table if not exists`, `add column if not exists`, and
`alter type ... add value if not exists` — your existing `users`,
`appointments`, `sessions`, `session_notes`, `exercises`,
`patient_exercises`, `progress`, `transcripts`, and `chatbot_messages` tables
and all their data are untouched.

## How to apply

1. **Database**: open the Supabase SQL editor and run
   `supabase/migration_002_booking_dpdp.sql` in **two separate executions**:
   - Run the block under `PART 1` alone first (adds the `pending` status).
   - Then run the block under `PART 2` (everything else).
   This split is required — Postgres won't let a brand-new enum value be used
   in the same transaction that creates it.
2. **Worker**: redeploy — `worker/src/routes/appointments.ts` has new
   `/accept` and `/reschedule` endpoints and an updated `/cancel`;
   `worker/src/routes/publicRoutes.ts` is new (DPDP data-request intake) and
   is wired into `worker/src/index.ts`. No new secrets are needed.
   ```bash
   cd worker && npm run deploy
   ```
3. **Frontend**: redeploy as usual (`npm run build`, publish `dist/`). No new
   env vars are needed.

## What changed and why

### New booking flow (patient requests → doctor accepts)
- **`availability_slots`** (new table): the doctor opens slots from
  `/doctor/calendar` (a new section there); patients pick one on the new
  `/patient/book` page, which inserts a `pending` appointment directly via
  Supabase (RLS: a patient can only insert their own row, and only as
  `pending`). A trigger marks the slot booked atomically, so two patients
  can't grab the same slot.
- The doctor's dashboard (`/doctor`) now has a **Pending requests** section:
  **Accept + create Meet** calls the Worker, which creates the Calendar
  event/Meet link and flips the appointment to `scheduled` — exactly the
  same Google Calendar logic as before, just triggered by "accept" instead
  of "create."
- **Reschedule**: pick a different open slot; the Worker frees the old slot,
  books the new one, and **patches the same Calendar event's time** rather
  than creating a new event.
- **Cancel**: unchanged Calendar-side, but now also frees the slot
  (`free_slot_on_cancel` trigger) and returns a WhatsApp link.
- The original doctor-direct-create flow (pick a patient + time, confirmed
  immediately) still works exactly as before — the two flows coexist.

### WhatsApp click-to-chat confirmations
No WhatsApp Business API or extra secrets needed. Every accept/reschedule/
cancel action returns a `wa.me` link pre-filled with a confirmation message
to the patient's stored phone number; the doctor clicks it and sends from
their own WhatsApp. Requires patients to have a phone number on file —
`Signup.tsx` now collects it (it was already a column on `users`, just
unused in the form before).

### DPDP Act 2023 compliance
- **Itemised consent at signup**: `consent_records` (new table) logs each
  purpose (`account_and_booking` required, `health_notes` and
  `marketing_communications` optional) separately, with the policy version
  shown at the time — not a single blanket checkbox.
- **`/privacy-policy`, `/terms`, `/data-request`** (new public pages): Data
  Fiduciary identification, purposes, Data Principal rights (access,
  correction, erasure, consent withdrawal, nomination, grievance), and a
  standing intake form logged to `data_requests` (new table). The intake
  form posts to a new unauthenticated Worker route
  (`POST /api/public/data-request`) rather than writing directly via
  Supabase, since this app's frontend Supabase client only ever carries the
  custom JWT (empty when logged out) — direct anonymous PostgREST writes
  wouldn't get past authentication in this setup.
- **Replace the placeholder Grievance Officer email** in
  `app/src/pages/public/PrivacyPolicy.tsx` with the practice's real,
  monitored contact before relying on this in production.

### Public landing page + scroll motion
- `/` is now a public marketing page (`app/src/pages/public/Home.tsx`) using
  Dr. Neha Dhanokar's real profile content, instead of redirecting straight
  to `/login`.
- `app/src/components/ScrollReveal.tsx` (fade/slide-in on scroll via
  `IntersectionObserver`, respects `prefers-reduced-motion`) and
  `ScrollProgressBar.tsx` (thin gradient progress bar) — reusable anywhere,
  not just on the new landing page.

## Files touched

**New:**
- `supabase/migration_002_booking_dpdp.sql`
- `worker/src/routes/publicRoutes.ts`
- `app/src/pages/public/Home.tsx`, `PrivacyPolicy.tsx`, `Terms.tsx`, `DataRequest.tsx`
- `app/src/pages/patient/Book.tsx`
- `app/src/components/ScrollReveal.tsx`, `ScrollProgressBar.tsx`

**Modified:**
- `worker/src/index.ts` — mounted `publicRoutes`
- `worker/src/routes/appointments.ts` — added accept/reschedule, updated cancel
- `app/src/lib/api.ts` — added `accept`, `reschedule`, `dataRequest.submit`, `signup` now takes `phone`
- `app/src/types/db.ts` — `AppointmentStatus` gains `pending`; `Appointment` gains `slot_id`/`visit_address`/`whatsapp_confirmed_at`; new `AvailabilitySlot`
- `app/src/contexts/AuthContext.tsx` — `signUp` now takes optional `phone`
- `app/src/pages/auth/Signup.tsx` — phone field + itemised DPDP consent
- `app/src/pages/doctor/Calendar.tsx` — added open-slot creation section
- `app/src/pages/doctor/Dashboard.tsx` — rewritten: pending requests + today's schedule, accept/reschedule/cancel + WhatsApp links
- `app/src/pages/patient/Appointments.tsx` — "Book a session" link, pending status note
- `app/src/components/Layout.tsx` — nav gains "Book a session", footer policy links
- `app/src/routes/router.tsx` — public routes + `/patient/book`, catch-all now goes to `/` instead of `/login`
- `app/src/styles/tokens.css` — added `.badge-pending`
