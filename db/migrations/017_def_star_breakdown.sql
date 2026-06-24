ALTER TABLE player_cwl_stats
  ADD COLUMN IF NOT EXISTS three_stars_conceded INTEGER,
  ADD COLUMN IF NOT EXISTS two_stars_conceded   INTEGER,
  ADD COLUMN IF NOT EXISTS one_stars_conceded   INTEGER,
  ADD COLUMN IF NOT EXISTS zero_stars_conceded  INTEGER;
