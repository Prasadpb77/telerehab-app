-- ============================================================================
-- Migration 005 — Remove chatbot & tighten AI note-drafting consent
-- ADDITIVE / LOCKDOWN ONLY. No table is dropped and no existing data is touched.
--
-- ⚠️ RUN IN TWO STEPS, as two separate executions in the Supabase SQL editor.
-- Postgres does not allow a new enum value to be used in the same
-- transaction/script that adds it, so PART 1 must be run and committed on
-- its own before PART 2.
-- ============================================================================


-- ============================================================================
-- PART 1 — run this alone first, then click "Run" again for PART 2 below.
-- ============================================================================

alter type consent_purpose add value if not exists 'ai_note_drafting';


-- ============================================================================
-- PART 2 — run this after PART 1 has completed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Lockdown chatbot_messages:
-- The interactive chatbot has been removed. Drop all existing RLS policies
-- on chatbot_messages and add none back. RLS stays enabled with 0 policies,
-- which makes the table completely inaccessible via the PostgREST API to all
-- roles (including users who authored the messages).
-- The table and its historical data remain intact for doctor export via Supabase
-- dashboard or future deliberate administrative decision.
-- ---------------------------------------------------------------------------

alter table chatbot_messages enable row level security;

drop policy if exists chatbot_select_own on chatbot_messages;
drop policy if exists chatbot_insert_own on chatbot_messages;