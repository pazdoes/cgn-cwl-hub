-- db/migrations/005_clans_display_order.sql
--
-- Adds clans.display_order, letting admins manually reorder the clan
-- tiles on the admin pool page via drag-and-drop — item 14.
--
-- Nullable, no backfill: a clan with NULL display_order (the default
-- for every existing row) falls back to sorting by clan_name ASC,
-- exactly as today. Only once an admin actually drags a clan tile does
-- a real display_order value get written — same opt-in pattern as
-- accounts.display_order (item 13).
--
-- Safe to re-run: idempotent.

ALTER TABLE clans
  ADD COLUMN IF NOT EXISTS display_order INTEGER;
