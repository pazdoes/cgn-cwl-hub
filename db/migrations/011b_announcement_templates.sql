CREATE TABLE IF NOT EXISTS announcement_templates (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  webhook_id  INTEGER REFERENCES discord_webhooks(id) ON DELETE SET NULL,
  embed_json  JSONB NOT NULL,
  username    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
