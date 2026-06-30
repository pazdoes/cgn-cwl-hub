import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Only clans currently registered in the clans table (active OR paused)
  // appear here. Grouped by clan_tag (not just clan_name) for future-proofing
  // against any same-season name collisions, and ordered chronologically via
  // season_registry rather than an alphabetical string sort on season.
  const [days, seasonRows] = await Promise.all([
    sql`
      SELECT
        wd.season, wd.clan_tag, wd.clan_name, wd.war_day,
        wd.war_result,
        ROUND(AVG(wd.stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) AS war_count
      FROM war_days wd
      LEFT JOIN season_registry sr ON sr.season = wd.season
      WHERE wd.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
      GROUP BY wd.season, wd.clan_tag, wd.clan_name, wd.war_day, wd.war_result, sr.season_date
      ORDER BY sr.season_date DESC NULLS LAST, wd.war_day ASC
    `,
    sql`
      SELECT ds.season
      FROM (
        SELECT DISTINCT season
        FROM war_days
        WHERE clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
      ) ds
      LEFT JOIN season_registry sr ON sr.season = ds.season
      ORDER BY sr.season_date DESC NULLS LAST
    `,
  ]);

  return NextResponse.json({
    days,
    seasons: seasonRows.map(r => r.season),
  });
}
