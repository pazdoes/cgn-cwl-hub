-- db/migrations/003_allow_unlinked_accounts.sql
--
-- Relaxes accounts.owner_secret from NOT NULL to nullable, so an account
-- can be "unlinked" (NULL owner_secret) without deleting the accounts row
-- or any pool_entries history tied to it — item 9's account-removal
-- feature on the signup page.
--
-- NULL is the correct semantic value for "no current owner," clearer
-- than a sentinel string (e.g. empty string) that future code would need
-- to remember as a special case. getAccountsByOwner's WHERE owner_secret
-- = $1 comparison already correctly excludes NULL rows regardless —
-- standard SQL NULL comparison semantics, no code change needed there.
--
-- Apply this to Neon in the SAME deploy as the code that depends on it
-- (lib/pool.js's unlinkAccount, and the new delete-account route) — per
-- the convention in db/migrations/README.md.
--
-- Safe to re-run: idempotent.

ALTER TABLE accounts
  ALTER COLUMN owner_secret DROP NOT NULL;
