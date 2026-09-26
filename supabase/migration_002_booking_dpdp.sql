-- ============================================================================
-- Migration 002 — Patient self-booking + DPDP Act compliance
-- ADDITIVE ONLY. No table is dropped and no existing data is touched.
--
-- ⚠️ RUN IN TWO STEPS, as two separate executions in the Supabase SQL editor.
-- Postgres does not allow a new enum value to be used in the same
-- transaction/script that adds it, so PART 1 must be run and committed on
-- its own before PART 2.
-- ============================================================================


-- ============================================================================
-- PART 1 — run this alone first, then click "Run" again for PART 2 below.
-- ============================================================================

alter type appointment_status add value if not exists 'pending';


-- ============================================================================
-- PART 2 — run this after PART 1 has completed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- availability_slots: doctor-defined open slots patients can request.
-- doctor_id is set to whichever doctor created the slot (Phase 1 has one).
-- ---------------------------------------------------------------------------
create table if not exists availability_slots (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid not null references users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_slot_range check (ends_at > starts_at)
);

create index if not exists idx_slots_open on availability_slots(starts_at) where is_booked = false;

alter table availability_slots enable row level security;

drop policy if exists slots_select_open_or_doctor on availability_slots;
create policy slots_select_open_or_doctor on availability_slots
  for select using (is_booked = false or auth.uid() is not null);

drop policy if exists slots_write_doctor on availability_slots;
create policy slots_write_doctor on availability_slots
  for all using (is_doctor()) with check (is_doctor());

-- ---------------------------------------------------------------------------
-- appointments: extend with slot linkage, visit address, WhatsApp tracking.
-- 'pending' (added in Part 1) means a patient has requested this slot and
-- the doctor hasn't accepted yet; 'scheduled' now also means confirmed.
-- ---------------------------------------------------------------------------
alter table appointments add column if not exists slot_id uuid references availability_slots(id);
alter table appointments add column if not exists visit_address text;
alter table appointments add column if not exists whatsapp_confirmed_at timestamptz;

-- Patients can now insert their OWN pending request (previously only the
-- doctor could write to appointments at all).
drop policy if exists appointments_insert_patient on appointments;
create policy appointments_insert_patient on appointments
  for insert with check (patient_id = auth.uid() and status = 'pending');

-- Patients may cancel their own appointment (pending or confirmed).
drop policy if exists appointments_update_patient_cancel on appointments;
create policy appointments_update_patient_cancel on appointments
  for update using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Prevent double-booking a slot: booking atomically marks it booked; a
-- race on the same slot_id raises and the insert is rejected.
-- ---------------------------------------------------------------------------
create or replace function mark_slot_booked() returns trigger as $$
begin
  if new.slot_id is null then
    return new;
  end if;
  update availability_slots set is_booked = true where id = new.slot_id and is_booked = false;
  if not found then
    raise exception 'Slot % is already booked', new.slot_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_mark_slot_booked on appointments;
create trigger trg_mark_slot_booked before insert on appointments
  for each row execute function mark_slot_booked();

create or replace function free_slot_on_cancel() returns trigger as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' and new.slot_id is not null then
    update availability_slots set is_booked = false where id = new.slot_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_free_slot_on_cancel on appointments;
create trigger trg_free_slot_on_cancel after update on appointments
  for each row execute function free_slot_on_cancel();

-- ---------------------------------------------------------------------------
-- consent_records: DPDP Act 2023 requires clear, itemised, revocable consent
-- per purpose. One row per consent event (given or withdrawn).
-- ---------------------------------------------------------------------------
do $$ begin
  create type consent_purpose as enum ('account_and_booking', 'health_notes', 'marketing_communications');
exception when duplicate_object then null;
end $$;

create table if not exists consent_records (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references users(id) on delete cascade,
  purpose consent_purpose not null,
  granted boolean not null,
  policy_version text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_consent_patient on consent_records(patient_id, purpose, recorded_at);

alter table consent_records enable row level security;

drop policy if exists consent_select_self on consent_records;
create policy consent_select_self on consent_records
  for select using (patient_id = auth.uid());
drop policy if exists consent_insert_self on consent_records;
create policy consent_insert_self on consent_records
  for insert with check (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- data_requests: DPDP data-rights intake (access/correction/erasure/
-- grievance/consent withdrawal), trackable to resolution.
-- ---------------------------------------------------------------------------
do $$ begin
  create type data_request_type as enum ('access', 'correction', 'erasure', 'grievance', 'consent_withdrawal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type data_request_status as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null;
end $$;

create table if not exists data_requests (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references users(id) on delete set null,
  contact_email text not null,
  request_type data_request_type not null,
  details text,
  status data_request_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table data_requests enable row level security;

drop policy if exists data_requests_insert_any on data_requests;
create policy data_requests_insert_any on data_requests
  for insert with check (true);
drop policy if exists data_requests_select_self on data_requests;
create policy data_requests_select_self on data_requests
  for select using (patient_id = auth.uid());
