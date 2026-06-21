-- db/migrations/001_add_status_and_clans.sql
--
-- Adds Confirmed/Substitute status tracking to pool_entries, and a new
-- clans table to hold per-clan CWL Format (15 or 30) as the Neon source
-- of truth, kept in sync with the Sheet's "CWL Format" column.
--
-- Apply this to Neon in the SAME deploy as the code that depends on it
-- (the status-toggle and format-toggle API routes, and the admin pool
-- page changes) — per the convention in db/migrations/README.md.
--
-- Safe to re-run: every statement is idempotent.

-- status: set only once a pool_entries row has an assigned_clan.
-- NULL = not yet set (unassigned, or assigned but status not chosen yet).
-- 'confirmed' counts toward the clan's cwl_format cap; 'substitute' does
-- not. Enforced server-side in the status-toggle route, not by a DB
-- constraint, since the cap check requires comparing against the live
-- count of other confirmed rows for the same clan — a CHECK constraint
-- can't express that across rows.
ALTER TABLE pool_entries
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Per-clan CWL Format. clan_name matches the Sheet tab name exactly
-- (e.g. "Cognition {CGN}"), since both the Sheet write-through and the
-- existing assignPlayerToRoster lookups already key off that same string.
-- cwl_format is the plain numeric cap (15 or 30) — display strings like
-- "15v15"/"30v30" are derived from this wherever shown, never stored.
CREATE TABLE IF NOT EXISTS clans (
  clan_name  TEXT PRIMARY KEY,
  cwl_format INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
