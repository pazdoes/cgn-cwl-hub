-- db/migrations/010_announcements.sql
--
-- Two tables for the Discord announcement system (item 33):
--
-- discord_webhooks: stores one or more webhook URLs, each with a label
--   (e.g. "Announcements", "Roster Updates") and optional channel name.
--   Admins manage these from the announcements page UI.
--
-- announcement_history: log of every embed posted — title, channel,
--   timestamp, and the full embed JSON so admins can see exactly what
--   was sent and reuse/resend previous announcements.
--
-- Safe to re-run: idempotent.

CREATE TABLE IF NOT EXISTS discord_webhooks (
  id          SERIAL PRIMARY KEY,
  label       TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  channel     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_history (
  id          SERIAL PRIMARY KEY,
  webhook_id  INTEGER REFERENCES discord_webhooks(id) ON DELETE SET NULL,
  title       TEXT,
  embed_json  JSONB NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT now(),
  sent_by     TEXT  -- discord username of admin who sent it
);
