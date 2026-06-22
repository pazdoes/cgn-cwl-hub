-- db/migrations/008_clan_season_history.sql
--
-- Creates clan_season_history to track each clan's CWL rank per season.
-- One row per clan per season, written manually by an admin at the end
-- of each CWL window via the "Record Season" button on the admin page.
--
-- This is the foundation for the CWL rank progression line chart —
-- data accumulates over time and the chart fills in from whenever
-- recording begins. Historical data before this point is not available
-- from the CoC API and must be entered manually if desired.
--
-- Safe to re-run: idempotent.

CREATE TABLE IF NOT EXISTS clan_season_history (
  id          SERIAL PRIMARY KEY,
  clan_name   TEXT NOT NULL,
  season      TEXT NOT NULL,
  cwl_rank    TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clan_name, season)
);

CREATE INDEX IF NOT EXISTS clan_season_history_clan_idx
  ON clan_season_history (clan_name);
