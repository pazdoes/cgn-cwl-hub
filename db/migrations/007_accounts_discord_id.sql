-- db/migrations/007_accounts_discord_id.sql
--
-- Adds accounts.discord_id as the durable identity key for players
-- who choose to sign in with Discord (item 17).
--
-- Nullable: accounts registered before this migration, or by players
-- who never use Discord sign-in, simply have NULL here and continue
-- using the existing owner_secret cookie path unchanged.
--
-- UNIQUE: one Discord account maps to one owner_secret (one set of
-- linked CoC accounts). If a player signs in from a new device with
-- the same Discord account, the system finds their existing row and
-- returns their already-linked CoC accounts — which is the entire
-- point of this feature.
--
-- Safe to re-run: idempotent.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- Index for fast lookup by discord_id on every request from a
-- Discord-authenticated session.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_discord_id_idx
  ON accounts (discord_id)
  WHERE discord_id IS NOT NULL;
