-- Migration 027: per-day war performance per player
CREATE TABLE IF NOT EXISTS player_war_day_stats (
  id               SERIAL PRIMARY KEY,
  player_tag       TEXT        NOT NULL,
  season           TEXT        NOT NULL,
  clan_name        TEXT        NOT NULL,
  war_day          INTEGER     NOT NULL,
  stars            INTEGER,
  destruction_pct  NUMERIC(5,2),
  war_result       TEXT,
  opponent_clan    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (player_tag, season, war_day)
);

CREATE INDEX IF NOT EXISTS pwd_player_idx ON player_war_day_stats (player_tag);
CREATE INDEX IF NOT EXISTS pwd_season_idx ON player_war_day_stats (season);
