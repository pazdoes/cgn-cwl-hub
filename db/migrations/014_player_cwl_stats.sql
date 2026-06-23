CREATE TABLE IF NOT EXISTS player_cwl_stats (
  id                SERIAL PRIMARY KEY,
  player_tag        TEXT NOT NULL,
  player_name       TEXT NOT NULL,
  season            TEXT NOT NULL,
  clan_name         TEXT NOT NULL,
  stars_earned      INTEGER NOT NULL DEFAULT 0,
  destruction_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  stars_conceded    INTEGER NOT NULL DEFAULT 0,
  defence_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  attacks_used      INTEGER NOT NULL DEFAULT 0,
  attacks_available INTEGER NOT NULL DEFAULT 0,
  missed_attacks    INTEGER NOT NULL DEFAULT 0,
  efficiency        NUMERIC(5,2) NOT NULL DEFAULT 0,
  recorded_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_tag, season)
);

CREATE INDEX IF NOT EXISTS player_cwl_stats_season_idx ON player_cwl_stats (season);
CREATE INDEX IF NOT EXISTS player_cwl_stats_clan_idx ON player_cwl_stats (clan_name);
