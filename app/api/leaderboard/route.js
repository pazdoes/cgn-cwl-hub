import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  // Seasons list — any season where a linked alliance account has data,
  // regardless of whether the clan they played under is still active.
  // Uses a subquery for DISTINCT so it can be safely ORDERed by season_date
  // without violating Postgres's "ORDER BY must appear in SELECT" rule for DISTINCT.
  const seasonRows = await sql`
    SELECT ps.season
    FROM (
      SELECT DISTINCT season
      FROM player_cwl_stats
      WHERE player_tag IN (SELECT player_tag FROM accounts)
    ) ps
    LEFT JOIN season_registry sr ON sr.season = ps.season
    ORDER BY sr.season_date DESC NULLS LAST
  `;
  const seasons = seasonRows.map(r => r.season);

  if (!season && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = season || seasons[0];

  // Alliance member = anyone with a linked account (accounts table). Their
  // historical seasons must show regardless of whether the clan they played
  // under at the time is still active today — clan deletion/rename does not
  // erase a real alliance member's CWL history.
  const stats = await sql`
    SELECT
      ps.*,
      csh.cwl_rank
    FROM player_cwl_stats ps
    LEFT JOIN clan_season_history csh
      ON csh.clan_name = ps.clan_name
      AND csh.season = ps.season
    WHERE ps.season = ${targetSeason}
      AND ps.player_tag IN (SELECT player_tag FROM accounts)
    ORDER BY ps.stars_earned DESC, ps.destruction_pct DESC
  `;

  return NextResponse.json({ stats, seasons, currentSeason: targetSeason });
}
