CREATE TABLE IF NOT EXISTS scheduled_announcements (
  id          SERIAL PRIMARY KEY,
  webhook_id  INTEGER REFERENCES discord_webhooks(id) ON DELETE CASCADE,
  title       TEXT,
  embed_json  JSONB NOT NULL,
  content     TEXT,
  username    TEXT,
  avatar_url  TEXT,
  send_at     TIMESTAMPTZ NOT NULL,
  sent        BOOLEAN NOT NULL DEFAULT false,
  sent_at     TIMESTAMPTZ,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scheduled_announcements_send_at_idx
  ON scheduled_announcements (send_at)
  WHERE sent = false;
