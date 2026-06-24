ALTER TABLE clan_season_history
  ADD COLUMN IF NOT EXISTS wars_won              INTEGER,
  ADD COLUMN IF NOT EXISTS wars_lost             INTEGER,
  ADD COLUMN IF NOT EXISTS wars_drawn            INTEGER,
  ADD COLUMN IF NOT EXISTS total_stars           INTEGER,
  ADD COLUMN IF NOT EXISTS total_stars_conceded  INTEGER,
  ADD COLUMN IF NOT EXISTS total_attacks_used    INTEGER,
  ADD COLUMN IF NOT EXISTS total_attacks_available INTEGER,
  ADD COLUMN IF NOT EXISTS total_attacks_missed  INTEGER,
  ADD COLUMN IF NOT EXISTS avg_destruction_pct   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_defence_pct       NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS attack_efficiency     NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS defence_efficiency    NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS three_star_rate       NUMERIC(5,2);
