-- Migration 023: per-war day summary per clan
-- One row per clan per war day
-- war_tag + clan_name is unique — idempotent upsert safe

CREATE TABLE IF NOT EXISTS war_days (
  id                    SERIAL PRIMARY KEY,
  season                TEXT        NOT NULL,
  clan_name             TEXT        NOT NULL,
  war_tag               TEXT        NOT NULL,
  war_day               INTEGER     NOT NULL, -- 1-7
  stars_earned          INTEGER     NOT NULL DEFAULT 0,
  stars_conceded        INTEGER     NOT NULL DEFAULT 0,
  attacks_used          INTEGER     NOT NULL DEFAULT 0,
  attacks_available     INTEGER     NOT NULL DEFAULT 0,
  destruction_pct       NUMERIC(5,2),
  defence_pct           NUMERIC(5,2),
  war_result            TEXT,                -- 'win' | 'loss' | 'draw'
  opponent_clan         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (war_tag, clan_name)
);

CREATE INDEX IF NOT EXISTS war_days_season_idx   ON war_days (season);
CREATE INDEX IF NOT EXISTS war_days_clan_idx     ON war_days (clan_name, season);
CREATE INDEX IF NOT EXISTS war_days_war_tag_idx  ON war_days (war_tag);
