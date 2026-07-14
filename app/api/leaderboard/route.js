import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const ALLIANCE_CLAN_TAGS = ["#2C8QQPCL2", "#2CPC8GR9R", "#2Y9PGJGVC", "#2YQJJUYQY", "#2YV9UCJG2"];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedSeason = searchParams.get("season");
  const sql = getDb();

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

  if (!requestedSeason && seasons.length === 0) {
    return NextResponse.json({ stats: [], seasons: [] });
  }

  const targetSeason = requestedSeason || seasons[0];

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
        LEFT JOIN accounts a ON a.player_tag = ps.player_tag
        WHERE ps.season = ${targetSeason}
          AND ps.player_tag IN (SELECT player_tag FROM accounts)
          AND COALESCE(a.active, true) = true
          AND a.current_clan_tag IN ('#2C8QQPCL2','#2CPC8GR9R','#2Y9PGJGVC','#2YQJJUYQY','#2YV9UCJG2')
          AND ps.clan_name NOT IN (
            SELECT clan_name FROM clans WHERE cwl_absent = true
          )
        ORDER BY ps.stars_earned DESC, ps.destruction_pct DESC
      `;

  return NextResponse.json({ stats, seasons, currentSeason: targetSeason });
}
