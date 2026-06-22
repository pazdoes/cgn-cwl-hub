-- db/migrations/006_accounts_town_hall_level.sql
--
-- Adds accounts.town_hall_level as a durable Neon-backed truth source
-- for each player's current Town Hall level — item 15.
--
-- Previously, TH level was fetched live from the CoC API on every page
-- load by every surface that needed it (admin pool, signup page, both
-- via /api/admin/th-levels). This created redundant API calls for the
-- same data, and left TH unavailable as a sort key without an async
-- fetch completing first.
--
-- With this column, TH is captured once at account-registration time
-- (in /api/accounts/verify, which already calls getPlayer(tag)) and
-- stored durably. Subsequent reads (admin pool, signup page) read from
-- Neon directly, with no CoC API call needed. Players and admins can
-- trigger a manual refresh (via dedicated refresh buttons) to update TH
-- values if a player has upgraded in the meantime.
--
-- Nullable: accounts registered before this migration have NULL
-- town_hall_level until they re-verify or a refresh is triggered.
-- Safe to re-run: idempotent.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS town_hall_level INTEGER;
