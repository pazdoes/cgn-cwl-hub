import { getDb } from "@/lib/db";

// Returns the current open CWL season from Neon (item 30).
// Falls back to the date-derived value if the seasons table has no row
// yet (e.g. before the migration is applied, or in a fresh environment).
// This is an async function — callers must await it.
export async function getOpenPoolSeason() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT current_season FROM seasons WHERE id = 1`;
    if (rows[0]?.current_season) return rows[0].current_season;
  } catch {
    // Table doesn't exist yet or DB unreachable — fall through to
    // the date-derived fallback so nothing breaks during migration.
  }
  return getOpenPoolSeasonFromDate();
}

// Advances the season to the given label, recording the opened_at
// timestamp. Called by the Close Season route after archiving the
// current season's state.
export async function setCurrentSeason(season) {
  const sql = getDb();
  await sql`
    INSERT INTO seasons (id, current_season, opened_at)
    VALUES (1, ${season}, now())
    ON CONFLICT (id)
    DO UPDATE SET current_season = EXCLUDED.current_season, opened_at = now()
  `;
}

// Date-derived fallback — same logic as the original season.js.
// Always "next calendar month" from today. Used as a fallback only.
export function getOpenPoolSeasonFromDate(date = new Date()) {
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(nextMonth);
}
