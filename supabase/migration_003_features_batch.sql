-- ============================================================================
-- Migration 003 - Feature batch (doctor-created accounts, reminders,
-- no-show, exercise library, ad-hoc Meet, recurring sessions, payments)
-- ADDITIVE ONLY. No table is dropped and no existing data is touched.
--
-- SAFE TO RUN AS A SINGLE EXECUTION - this migration adds no new enum
-- values (the `no_show` value already exists in `appointment_status`
-- from schema.sql), so there is no need for a PART 1 / PART 2 split.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- users: force a password change on first login for doctor-created accounts.
-- Self-service /signup accounts default to false and are unaffected.
-- ---------------------------------------------------------------------------
alter table users add column if not exists must_change_password boolean not null default false;

-- ---------------------------------------------------------------------------
-- appointments: treatment series grouping + manual payment tracking.
-- `treatment_plan_id` is a plain grouping label (no FK) so a series of N
-- independent appointment rows can be displayed as "Session 3 of 6".
-- ---------------------------------------------------------------------------
alter table appointments add column if not exists treatment_plan_id uuid;
alter table appointments add column if not exists payment_status text not null default 'unpaid';
alter table appointments add column if not exists payment_amount numeric;

-- Constrain payment_status to the three allowed values without a destructive
-- type change (added as a named check constraint, skipped if already present).
do $$ begin
  alter table appointments
    add constraint appointments_payment_status_check
    check (payment_status in ('unpaid', 'paid', 'waived'));
exception when duplicate_object then null;
end $$;

create index if not exists idx_appointments_treatment_plan on appointments(treatment_plan_id);

-- ---------------------------------------------------------------------------
-- pending_whatsapp_reminders: cron-generated reminder links the doctor clicks
-- to send (the app never auto-sends via any WhatsApp API - same click-to-chat
-- pattern used everywhere else).
-- ---------------------------------------------------------------------------
create table if not exists pending_whatsapp_reminders (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  whatsapp_url text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_pending_reminders_unsent
  on pending_whatsapp_reminders(created_at) where sent_at is null;

alter table pending_whatsapp_reminders enable row level security;

drop policy if exists reminders_doctor_only on pending_whatsapp_reminders;
create policy reminders_doctor_only on pending_whatsapp_reminders
  for all using (is_doctor()) with check (is_doctor());