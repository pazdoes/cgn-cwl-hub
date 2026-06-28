-- Migration 024: extend war_attacks with true stars and map positions
ALTER TABLE war_attacks
  ADD COLUMN IF NOT EXISTS true_stars            INTEGER,
  ADD COLUMN IF NOT EXISTS attacker_map_position INTEGER,
  ADD COLUMN IF NOT EXISTS defender_map_position INTEGER;
