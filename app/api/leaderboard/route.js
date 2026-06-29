import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  const seasonRows = await sql`
    SELECT ps.season
    FROM (SELECT DISTINCT season FROM player_cwl_stats) ps
    LEFT JOIN season_registry sr ON sr.season = ps.season
    ORDER BY sr.season_date DESC NULLS LAST
  `;
  const seasons = seasonRows.map(r => r.season);

  if (!season && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];

  // Latest season from registry for fallback filter
  const latestSeasonRow = await sql`
    SELECT season FROM season_registry ORDER BY season_date DESC LIMIT 1
  `;
  const latestSeason = latestSeasonRow[0]?.season;

  const stats = await sql`
    SELECT
      ps.*,
      csh.cwl_rank
    FROM player_cwl_stats ps
    LEFT JOIN clan_season_history csh
      ON csh.clan_name = ps.clan_name
      AND csh.season = ps.season
    WHERE ps.season = ${targetSeason}
      AND ps.player_tag IN (
        SELECT player_tag FROM accounts
        UNION
        SELECT player_tag FROM player_cwl_stats
        WHERE season = ${latestSeason}
      )
    ORDER BY ps.stars_earned DESC, ps.destruction_pct DESC
  `;

  return NextResponse.json({ stats, seasons, currentSeason: targetSeason });
}
