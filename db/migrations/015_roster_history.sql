-- Roster history: snapshot of assigned players at season close
-- Populated by the Migrate Season button, never by the cron job
CREATE TABLE IF NOT EXISTS roster_history (
  id             SERIAL PRIMARY KEY,
  season         TEXT NOT NULL,
  player_tag     TEXT NOT NULL,
  player_name    TEXT NOT NULL,
  clan_name      TEXT NOT NULL,
  town_hall_level INTEGER,
  status         TEXT,
  recorded_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_tag, season)
);

CREATE INDEX IF NOT EXISTS roster_history_season_idx ON roster_history (season);
CREATE INDEX IF NOT EXISTS roster_history_clan_idx ON roster_history (clan_name, season);
