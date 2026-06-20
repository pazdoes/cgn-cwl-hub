-- CWL Hub — foundation schema for player sign-up / pool feature
-- Run this once in the Neon SQL editor against your new project.
-- Safe to re-run: every statement is idempotent.

-- Verified CoC accounts. One row per player tag, ever. owner_secret is a
-- random token stored in the signer's browser cookie — it links an account
-- to "whoever verified it" without storing any personal identity, and is
-- never exposed in any admin-facing view or API response.
CREATE TABLE IF NOT EXISTS accounts (
  player_tag   TEXT PRIMARY KEY,
  player_name  TEXT NOT NULL,
  owner_secret TEXT NOT NULL,
  verified_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounts_owner_secret_idx ON accounts (owner_secret);

-- Seasonal pool membership. A player_tag can appear once per season —
-- re-joining a later season is a fresh row, not an update, so history of
-- who signed up each season is preserved for free.
CREATE TABLE IF NOT EXISTS pool_entries (
  id          SERIAL PRIMARY KEY,
  player_tag  TEXT NOT NULL REFERENCES accounts (player_tag),
  season      TEXT NOT NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  UNIQUE (player_tag, season)
);

CREATE INDEX IF NOT EXISTS pool_entries_season_idx ON pool_entries (season);
