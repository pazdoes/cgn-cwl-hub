import { NextResponse } from "next/server";
import { getDb } from "@/lib/pool";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  // Get all available seasons
  const seasonRows = await sql`
    SELECT DISTINCT season FROM player_cwl_stats
    ORDER BY season DESC
  `;
  const seasons = seasonRows.map(r => r.season);

  if (!season && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];

  // Join player stats with clan_season_history to get cwl_rank per player
  const stats = await sql`
    SELECT
      ps.*,
      csh.cwl_rank
    FROM player_cwl_stats ps
    LEFT JOIN clan_season_history csh
      ON csh.clan_name = ps.clan_name
      AND csh.season = ps.season
    WHERE ps.season = ${targetSeason}
    ORDER BY ps.stars_earned DESC, ps.destruction_pct DESC
  `;

  return NextResponse.json({ stats, seasons, currentSeason: targetSeason });
}
