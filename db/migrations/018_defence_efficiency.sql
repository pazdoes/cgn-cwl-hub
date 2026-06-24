ALTER TABLE player_cwl_stats
  ADD COLUMN IF NOT EXISTS defence_efficiency NUMERIC(5,2);
