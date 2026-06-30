import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Days tab is filtered client-side by selectedSeason (it needs the full
  // multi-season dataset upfront for the season picker to work). Per the
  // season-snapshot rule, this returns ALL clans across all seasons (no
  // registered-clan restriction) — the frontend's client-side season filter
  // then naturally shows the complete picture for whichever season is chosen,
  // while an aggregate "All Seasons" view would need its own registered-only
  // scoping if ever added as a true cross-season rollup (not currently the
  // case here since Days shows per-day breakdowns, not season totals).
  const [days, seasonRows] = await Promise.all([
    sql`
      SELECT
        wd.season, wd.clan_tag, wd.clan_name, wd.war_day,
        wd.war_result,
        ROUND(AVG(wd.stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) AS war_count
      FROM war_days wd
      LEFT JOIN season_registry sr ON sr.season = wd.season
      GROUP BY wd.season, wd.clan_tag, wd.clan_name, wd.war_day, wd.war_result, sr.season_date
      ORDER BY sr.season_date DESC NULLS LAST, wd.war_day ASC
    `,
    sql`
      SELECT ds.season
      FROM (SELECT DISTINCT season FROM war_days) ds
      LEFT JOIN season_registry sr ON sr.season = ds.season
      ORDER BY sr.season_date DESC NULLS LAST
    `,
  ]);

  return NextResponse.json({
    days,
    seasons: seasonRows.map(r => r.season),
  });
}
