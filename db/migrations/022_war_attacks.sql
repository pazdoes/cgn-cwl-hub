-- Migration 022: per-war attack history
-- One row per attack per player per war day
-- war_tag + player_tag is unique — idempotent upsert safe

CREATE TABLE IF NOT EXISTS war_attacks (
  id                  SERIAL PRIMARY KEY,
  season              TEXT        NOT NULL,
  clan_name           TEXT        NOT NULL,
  war_tag             TEXT        NOT NULL,
  war_day             INTEGER     NOT NULL, -- 1-7
  player_tag          TEXT        NOT NULL,
  player_name         TEXT        NOT NULL,
  town_hall_level     INTEGER,
  attack_order        INTEGER     NOT NULL, -- 1 or 2
  defender_tag        TEXT,
  defender_th_level   INTEGER,
  stars               INTEGER     NOT NULL DEFAULT 0,
  destruction_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
  war_result          TEXT,                -- 'win' | 'loss' | 'draw'
  opponent_clan       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (war_tag, player_tag, attack_order)
);

CREATE INDEX IF NOT EXISTS war_attacks_season_idx    ON war_attacks (season);
CREATE INDEX IF NOT EXISTS war_attacks_player_idx    ON war_attacks (player_tag);
CREATE INDEX IF NOT EXISTS war_attacks_clan_idx      ON war_attacks (clan_name, season);
CREATE INDEX IF NOT EXISTS war_attacks_war_tag_idx   ON war_attacks (war_tag);
