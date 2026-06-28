import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const [days, seasons] = await Promise.all([
    sql`
      SELECT
        wd.season, wd.clan_name, wd.war_day,
        wd.war_result,
        ROUND(AVG(wd.stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) AS war_count
      FROM war_days wd
      LEFT JOIN season_registry sr ON sr.season = wd.season
      GROUP BY wd.season, wd.clan_name, wd.war_day, wd.war_result, sr.season_date
      ORDER BY sr.season_date DESC NULLS LAST, wd.war_day ASC
    `,
    sql`
      SELECT wd.season
      FROM (SELECT DISTINCT season FROM war_days) wd
      LEFT JOIN season_registry sr ON sr.season = wd.season
      ORDER BY sr.season_date DESC NULLS LAST
    `,
  ]);

  return NextResponse.json({
    days,
    seasons: seasons.map(r => r.season),
  });
}
