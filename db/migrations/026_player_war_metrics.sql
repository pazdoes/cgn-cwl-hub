-- Migration 026: computed per-war metrics on player_cwl_stats
ALTER TABLE player_cwl_stats
  ADD COLUMN IF NOT EXISTS avg_stars_per_attack  NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS three_star_rate        NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS punch_up_rate          NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS clutch_rate            NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS consistency_score      NUMERIC(4,2);
