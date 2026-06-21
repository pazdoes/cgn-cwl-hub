-- db/migrations/004_account_display_order.sql
--
-- Adds accounts.display_order, letting a user manually reorder their own
-- linked accounts on the signup page via drag-and-drop — item 13.
--
-- Nullable, no backfill: an account with NULL display_order (the default
-- for every existing row, and for any new account until someone actually
-- drags it) falls back to the existing verified_at DESC sort, exactly as
-- today. Only once a user drags an account does a real display_order
-- value get written for THEIR accounts specifically — this is a deliberate
-- opt-in behavior, not a migration that needs to assign every existing
-- account a position up front.
--
-- Apply this to Neon in the SAME deploy as the code that depends on it
-- (lib/pool.js's updateAccountOrder, and the new reorder route) — per
-- the convention in db/migrations/README.md.
--
-- Safe to re-run: idempotent.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS display_order INTEGER;
