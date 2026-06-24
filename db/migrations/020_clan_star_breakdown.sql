ALTER TABLE clan_season_history
  ADD COLUMN IF NOT EXISTS three_stars_clan INTEGER,
  ADD COLUMN IF NOT EXISTS two_stars_clan   INTEGER,
  ADD COLUMN IF NOT EXISTS one_stars_clan   INTEGER,
  ADD COLUMN IF NOT EXISTS zero_stars_clan  INTEGER;
