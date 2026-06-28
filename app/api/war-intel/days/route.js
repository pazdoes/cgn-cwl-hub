import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const [days, seasons] = await Promise.all([
    sql`
      SELECT
        season, clan_name, war_day,
        war_result,
        ROUND(AVG(stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) AS war_count
      FROM war_days
      GROUP BY season, clan_name, war_day, war_result
      ORDER BY season DESC, war_day ASC
    `,
    sql`SELECT DISTINCT season FROM war_days ORDER BY season DESC`,
  ]);

  return NextResponse.json({
    days,
    seasons: seasons.map(r => r.season),
  });
}
