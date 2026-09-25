-- ============================================================================
-- Neuro TeleRehab — Phase 1 schema
-- Single doctor, multiple patients. Identity is handled by the Worker's custom
-- JWT auth (see worker/src/routes/auth.ts); `users` stores role + profile info
-- and a salted PBKDF2 password hash. The Worker issues HS256 JWTs signed with
-- the Supabase JWT secret so PostgREST accepts them and RLS `auth.uid()` works.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users: one row per account, carries role + password hash
-- ---------------------------------------------------------------------------
create type user_role as enum ('doctor', 'patient');

create table users (
  id uuid primary key default uuid_generate_v4(),
  role user_role not null default 'patient',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  -- Salted PBKDF2 hash: `pbkdf2$<iterations>$<saltB64>$<hashB64>`
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- patients: extra clinical/profile fields, 1:1 with users where role='patient'
-- ---------------------------------------------------------------------------
create table patients (
  user_id uuid primary key references users(id) on delete cascade,
  date_of_birth date,
  condition_summary text,          -- doctor-entered, e.g. "post-stroke left hemiparesis"
  emergency_contact text,
  consent_recording boolean not null default false,   -- consent to session recording/transcription
  consent_ai_processing boolean not null default false, -- consent to AI summarization/chatbot use of their data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table appointments (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid not null references users(id),
  patient_id uuid not null references users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  google_event_id text unique,        -- idempotency key: one event per appointment
  google_meet_url text,
  notes text,                          -- doctor's pre-appointment note (not clinical note)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_range check (ends_at > starts_at)
);

create index idx_appointments_patient on appointments(patient_id, starts_at);
create index idx_appointments_doctor on appointments(doctor_id, starts_at);

-- Prevent doctor double-booking the same slot twice (simple overlap guard is
-- enforced at the Worker level before insert; this unique index blocks exact
-- duplicate re-submits of the same slot from creating two Meet links).
create unique index uq_doctor_slot on appointments(doctor_id, starts_at)
  where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- sessions: the clinical encounter tied to an appointment (1:1, created when
-- a session starts / Meet begins, or manually by doctor)
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  doctor_id uuid not null references users(id),
  patient_id uuid not null references users(id),
  started_at timestamptz,
  ended_at timestamptz,
  recording_consent_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transcripts: raw captured/pasted transcript text for a session
-- (isolated interface — see worker/routes/meetTranscript.ts)
-- ---------------------------------------------------------------------------
create table transcripts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  source text not null default 'manual',  -- 'manual' | 'upload' | 'meet_addon' (future)
  raw_text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- session_notes: AI-drafted, doctor-approved structured note
-- ---------------------------------------------------------------------------
create type note_status as enum ('draft', 'approved', 'rejected');

create table session_notes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique references sessions(id) on delete cascade,
  patient_id uuid not null references users(id),
  doctor_id uuid not null references users(id),
  status note_status not null default 'draft',
  concerns text,
  therapy_discussed text,
  exercises_discussed text,
  patient_feedback text,
  progress_notes text,
  follow_up text,
  ai_generated boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- exercises: master library authored/curated by the doctor
-- ---------------------------------------------------------------------------
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references users(id),
  title text not null,
  description text,
  video_url text,
  default_sets int,
  default_reps int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- patient_exercises: assignment of an exercise to a patient (a therapy plan)
-- ---------------------------------------------------------------------------
create type assignment_status as enum ('active', 'paused', 'completed');

create table patient_exercises (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references users(id),
  exercise_id uuid not null references exercises(id),
  assigned_by uuid not null references users(id),
  sets int,
  reps int,
  frequency_per_week int,
  status assignment_status not null default 'active',
  started_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_patient_exercises_patient on patient_exercises(patient_id);

-- ---------------------------------------------------------------------------
-- progress: patient-logged or doctor-logged completion/progress entries
-- ---------------------------------------------------------------------------
create table progress (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references users(id),
  patient_exercise_id uuid references patient_exercises(id),
  logged_by uuid not null references users(id),
  log_date date not null default current_date,
  completed boolean not null default true,
  pain_score int check (pain_score between 0 and 10),
  difficulty_score int check (difficulty_score between 0 and 10),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_progress_patient on progress(patient_id, log_date);

-- ---------------------------------------------------------------------------
-- chatbot_messages: conversation log, scoped per user
-- ---------------------------------------------------------------------------
create table chatbot_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),         -- who asked (doctor or patient)
  subject_patient_id uuid references users(id),        -- for doctor queries: which patient it's about
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_chatbot_user on chatbot_messages(user_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();
create trigger trg_patients_updated before update on patients
  for each row execute function set_updated_at();
create trigger trg_appointments_updated before update on appointments
  for each row execute function set_updated_at();
create trigger trg_notes_updated before update on session_notes
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table users enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table sessions enable row level security;
alter table transcripts enable row level security;
alter table session_notes enable row level security;
alter table exercises enable row level security;
alter table patient_exercises enable row level security;
alter table progress enable row level security;
alter table chatbot_messages enable row level security;

-- Helper: is the current user the doctor?
create or replace function is_doctor() returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'doctor'
  );
$$ language sql stable security definer;

-- users: self read/update; doctor can read all
create policy users_select_self_or_doctor on users
  for select using (id = auth.uid() or is_doctor());
create policy users_update_self on users
  for update using (id = auth.uid());
create policy users_insert_self on users
  for insert with check (id = auth.uid());

-- ============================================================================
-- SEED ACCOUNTS
-- Phase 1 ships with exactly one doctor + one demo patient. Passwords below
-- are PBKDF2-hashed (100k iterations, SHA-256); CHANGE THEM in production.
--   doctor@telerehab.local  / Doctor123!
--   patient@telerehab.local / Patient123!
-- ============================================================================
insert into users (id, role, full_name, email, password_hash) values
  (
    uuid_generate_v4(),
    'doctor',
    'Dr. Demo',
    'doctor@telerehab.local',
    'pbkdf2$100000$FdODbISOD1ZHLB+vaZwnFw==$FEP068LNlvgrBfMgV3qBbAp6oDaPAwt0A63oXXOTTwE='
  ),
  (
    uuid_generate_v4(),
    'patient',
    'Demo Patient',
    'patient@telerehab.local',
    'pbkdf2$100000$t1qy+oW5zESeBlor+6e+/Q==$IYD1+ENEymVjR70CWAL5US3s5tCO85m3QVdjM0cOP0A='
  );

insert into patients (user_id, condition_summary)
select id, 'post-stroke left hemiparesis'
from users
where email = 'patient@telerehab.local';

-- patients: patient reads/updates own row (limited fields enforced in app layer);
-- doctor full access
create policy patients_select on patients
  for select using (user_id = auth.uid() or is_doctor());
create policy patients_upsert_self on patients
  for insert with check (user_id = auth.uid());
create policy patients_update on patients
  for update using (user_id = auth.uid() or is_doctor());

-- appointments: patient sees own; doctor sees all; only doctor writes
-- (actual writes happen via the Worker's service-role client, these policies
-- also allow a doctor logged in directly to manage rows if ever needed)
create policy appointments_select on appointments
  for select using (patient_id = auth.uid() or doctor_id = auth.uid() or is_doctor());
create policy appointments_write_doctor on appointments
  for all using (is_doctor()) with check (is_doctor());

-- sessions: same pattern
create policy sessions_select on sessions
  for select using (patient_id = auth.uid() or is_doctor());
create policy sessions_write_doctor on sessions
  for all using (is_doctor()) with check (is_doctor());

-- transcripts: doctor only (raw transcript never exposed to patient directly)
create policy transcripts_doctor_only on transcripts
  for all using (is_doctor()) with check (is_doctor());

-- session_notes: patient sees only APPROVED notes for their own sessions;
-- doctor sees/writes everything
create policy notes_select_patient on session_notes
  for select using (
    (patient_id = auth.uid() and status = 'approved')
    or is_doctor()
  );
create policy notes_write_doctor on session_notes
  for all using (is_doctor()) with check (is_doctor());

-- exercises: readable by all authenticated (library), writable by doctor
create policy exercises_select_all on exercises
  for select using (auth.uid() is not null);
create policy exercises_write_doctor on exercises
  for all using (is_doctor()) with check (is_doctor());

-- patient_exercises: patient sees own assignments; doctor manages all
create policy patient_exercises_select on patient_exercises
  for select using (patient_id = auth.uid() or is_doctor());
create policy patient_exercises_write_doctor on patient_exercises
  for all using (is_doctor()) with check (is_doctor());

-- progress: patient can insert/select own; doctor can select/insert for any patient
create policy progress_select on progress
  for select using (patient_id = auth.uid() or is_doctor());
create policy progress_insert on progress
  for insert with check (patient_id = auth.uid() or is_doctor());

-- chatbot_messages: user sees own conversation only (doctor's "own" includes
-- messages where they are the asker, scoped further in the Worker by patient)
create policy chatbot_select_own on chatbot_messages
  for select using (user_id = auth.uid());
create policy chatbot_insert_own on chatbot_messages
  for insert with check (user_id = auth.uid());
