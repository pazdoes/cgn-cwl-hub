-- db/migrations/002_clans_full_fallback_data.sql
--
-- Extends the clans table with clan_tag, clan_link, and cwl_rank, so a
-- brand-new clan (created via the admin page's Add Clan form, zero
-- players assigned yet) has a durable, Neon-backed source for all three
-- clan-level values that assignPlayerToRoster's carry-forward logic
-- needs — closing the gap where the first player ever assigned to a new
-- clan would otherwise get blank Clan Link, CWL Rank, and Clan Tag,
-- since the Sheet-only carry-forward has no other row to borrow from on
-- a completely empty tab.
--
-- Apply this to Neon in the SAME deploy as the code that depends on it
-- (the Add Clan form, the create-clan route, and assignPlayerToRoster's
-- extended carry-forward) — per the convention in db/migrations/README.md.
--
-- Safe to re-run: every statement is idempotent.

ALTER TABLE clans
  ADD COLUMN IF NOT EXISTS clan_tag  TEXT,
  ADD COLUMN IF NOT EXISTS clan_link TEXT,
  ADD COLUMN IF NOT EXISTS cwl_rank  TEXT;
