import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  const activeClanRows = await sql`SELECT clan_tag, clan_name FROM clans WHERE clan_tag IS NOT NULL`;
  const activeTags = activeClanRows.map(r => r.clan_tag);
  const activeClanNames = activeClanRows.map(r => r.clan_name);

  const seasonRows = await sql`
    SELECT ps.season
    FROM (SELECT DISTINCT season FROM player_cwl_stats WHERE clan_name = ANY(${activeClanNames})) ps
    LEFT JOIN season_registry sr ON sr.season = ps.season
    ORDER BY sr.season_date DESC NULLS LAST
  `;
  const seasons = seasonRows.map(r => r.season);

  if (!season && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];

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
      AND ps.clan_name = ANY(${activeClanNames})
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
