ALTER TABLE scheduled_announcements
  ADD COLUMN IF NOT EXISTS recurrence TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end TIMESTAMPTZ;
