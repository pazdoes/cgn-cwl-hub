-- Migration 025: extend player_cwl_stats with punch-up/down and target metrics
ALTER TABLE player_cwl_stats
  ADD COLUMN IF NOT EXISTS dips                INTEGER,
  ADD COLUMN IF NOT EXISTS reaches             INTEGER,
  ADD COLUMN IF NOT EXISTS avg_target_position NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_target_distance NUMERIC(5,2);
