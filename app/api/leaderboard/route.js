import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedSeason = searchParams.get("season"); // null if caller didn't specify one
  const sql = getDb();

  // Seasons list — every season where a linked alliance account has data.
  // This drives the season picker, so it stays scoped to linked accounts
  // regardless of season specificity (the picker itself is a "current roster"
  // concept, distinct from viewing a specific historical snapshot).
  const seasonRows = await sql`
    SELECT DISTINCT ps.season
    FROM player_cwl_stats ps
    LEFT JOIN season_registry sr ON sr.season = ps.season
    WHERE ps.player_tag IN (SELECT player_tag FROM accounts)
    ORDER BY sr.season_date DESC NULLS LAST
  `;
  const seasons = seasonRows.map(r => r.season);

  if (!requestedSeason && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = requestedSeason || seasons[0];

  // Rule: an explicitly requested historical season is a snapshot of that
  // season and must show every player who played it, linked or not — this
  // keeps player-level data in sync with the equivalent clan-level rule.
  // The default/no-season request (latest season, used by the main
  // leaderboard view) stays scoped to linked accounts only, since that
  // represents the current alliance roster view.
  const stats = requestedSeason
    ? await sql`
        SELECT
          ps.*,
          csh.cwl_rank
        FROM player_cwl_stats ps
        LEFT JOIN clan_season_history csh
          ON csh.clan_name = ps.clan_name
          AND csh.season = ps.season
        WHERE ps.season = ${targetSeason}
        ORDER BY ps.stars_earned DESC, ps.destruction_pct DESC
      `
    : await sql`
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
