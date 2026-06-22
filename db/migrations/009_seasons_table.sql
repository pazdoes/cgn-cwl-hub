-- db/migrations/009_seasons_table.sql
--
-- Creates a seasons table to store the current open CWL season as a
-- durable Neon-backed truth source (item 30 — automatic season rollover).
--
-- Previously, the open season was computed purely from the current date
-- in lib/season.js (always "next calendar month"). This worked but meant
-- the season couldn't be advanced by an admin action — it changed
-- automatically on the 1st of each month regardless of whether the
-- previous CWL had actually concluded.
--
-- With this table, the season is set explicitly by an admin using the
-- "Close Season" button, which also archives the current roster state
-- and records CWL ranks before advancing. The date-derived fallback
-- is preserved in lib/season.js for any route that runs before the
-- first admin-controlled season is set.
--
-- Only one row ever exists (current_season). The UPSERT pattern in
-- setCurrentSeason() ensures this stays a single-row table.
--
-- Safe to re-run: idempotent.

CREATE TABLE IF NOT EXISTS seasons (
  id             INTEGER PRIMARY KEY DEFAULT 1,  -- always 1, single row
  current_season TEXT    NOT NULL,
  opened_at      TIMESTAMPTZ DEFAULT now(),
  CHECK (id = 1)  -- enforces single-row constraint at DB level
);

-- Seed with the current computed season so the app has a value
-- immediately after migration without requiring an admin action first.
-- The ON CONFLICT DO NOTHING means re-running this migration is safe.
INSERT INTO seasons (id, current_season)
VALUES (1, to_char(
  (date_trunc('month', now()) + interval '1 month'),
  'FMMonth YYYY'
))
ON CONFLICT (id) DO NOTHING;
