-- ============================================================================
-- Migration 004 - Doctor finance tracking (P&L) + insights patient fields
-- ADDITIVE ONLY. No table is dropped and no existing data is touched.
--
-- SAFE TO RUN AS A SINGLE EXECUTION: no new enum types are added anywhere
-- in this file, so there is no PART 1 / PART 2 split requirement.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- expense_categories: doctor-defined expense categories ("Rent", "Travel",
-- etc). Unique on lower(name) so "Rent" and "rent" can't both exist.
-- Locked to the doctor: RLS enabled + ONE policy gating everything on
-- is_doctor(). No policy for any other role -> patients get NOTHING.
-- ---------------------------------------------------------------------------
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_expense_categories_lower_name
  on expense_categories (lower(name));

alter table expense_categories enable row level security;

drop policy if exists expense_categories_doctor_only on expense_categories;
create policy expense_categories_doctor_only on expense_categories
  for all using (is_doctor()) with check (is_doctor());

-- ---------------------------------------------------------------------------
-- expenses: manual expense entries linked to a category.
-- Locked to the doctor exactly like expense_categories.
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references expense_categories(id),
  amount numeric not null,
  expense_date date not null default current_date,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on expenses(expense_date);

alter table expenses enable row level security;

drop policy if exists expenses_doctor_only on expenses;
create policy expenses_doctor_only on expenses
  for all using (is_doctor()) with check (is_doctor());

-- ---------------------------------------------------------------------------
-- income_entries: income NOT tied to a booked appointment (walk-in, product
-- sold, etc). Session fees flow through appointments.payment_amount /
-- appointments.payment_status (already exist since migration 003) and are
-- only READ for P&L, never structurally changed here.
-- Locked to the doctor exactly like the categories/expenses tables.
-- ---------------------------------------------------------------------------
create table if not exists income_entries (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null,
  income_date date not null default current_date,
  source text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_income_entries_date on income_entries(income_date);

alter table income_entries enable row level security;

drop policy if exists income_entries_doctor_only on income_entries;
create policy income_entries_doctor_only on income_entries
  for all using (is_doctor()) with check (is_doctor());

-- ---------------------------------------------------------------------------
-- patients: free-text insights fields for Feature 3. Both nullable so all
-- existing patient rows stay valid; old patients simply show as
-- "Unspecified" in the insights charts until backfilled.
-- ---------------------------------------------------------------------------
alter table patients add column if not exists area text;
alter table patients add column if not exists therapy_type text;

-- Keep therapy_type to the six specialties from the public landing page
-- (Orthopaedic, Neuro, Geriatric, Post-operative, Women's health, General).
-- Plain CHECK (no enum) so future specialties never require a migration.
do $$ begin
  alter table patients
    add constraint patients_therapy_type_check
    check (
      therapy_type is null or therapy_type in
      ('Orthopaedic', 'Neuro', 'Geriatric', 'Post-operative', 'Women''s health', 'General')
    );
exception when duplicate_object then null;
end $$;