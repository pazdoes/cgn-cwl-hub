import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const sql = getDb();

  const rows = await sql`
    SELECT
      ps.player_tag, ps.player_name, ps.season, ps.clan_name,
      ps.stars_earned, ps.stars_conceded, ps.destruction_pct, ps.defence_pct,
      ps.attacks_used, ps.attacks_available, ps.missed_attacks,
      ps.efficiency, ps.defence_efficiency, ps.town_hall_level,
      ps.three_stars, ps.two_stars, ps.one_stars, ps.zero_stars,
      ps.three_stars_conceded, ps.two_stars_conceded, ps.one_stars_conceded, ps.zero_stars_conceded,
      csh.cwl_rank
    FROM player_cwl_stats ps
    LEFT JOIN clan_season_history csh
      ON csh.clan_name = ps.clan_name AND csh.season = ps.season
    WHERE ps.player_tag = ${playerTag}
    ORDER BY ps.season DESC
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const seasons = rows.map(r => ({
    ...r,
    overall: (r.attacks_used > 0 && r.attacks_available > 0)
      ? parseFloat(((parseFloat(r.efficiency||0)*0.6)+((3-parseFloat(r.defence_efficiency||0))*0.4)).toFixed(2))
      : null,
  }));

  // Get rank among all players for latest season
  const latestSeason = seasons[0]?.season;
  let currentRank = null;
  if (latestSeason) {
    const allLatest = await sql`
      SELECT player_tag, efficiency, defence_efficiency, attacks_used, attacks_available
      FROM player_cwl_stats
      WHERE season = ${latestSeason} AND attacks_used > 0 AND attacks_available > 0
    `;
    const ranked = allLatest
      .map(r => ({
        tag: r.player_tag,
        overall: (parseFloat(r.efficiency||0)*0.6)+((3-parseFloat(r.defence_efficiency||0))*0.4)
      }))
      .sort((a,b) => b.overall - a.overall);
    const idx = ranked.findIndex(r => r.tag === playerTag);
    if (idx !== -1) currentRank = idx + 1;
  }

  const withOverall = seasons.filter(s => s.overall !== null);
  const bestOverall = withOverall.reduce((best, s) => s.overall > (best?.overall||0) ? s : best, null);
  const bestEfficiency = seasons.reduce((best, s) => parseFloat(s.efficiency||0) > parseFloat(best?.efficiency||0) ? s : best, null);

  return NextResponse.json({
    player_tag: playerTag,
    player_name: rows[0].player_name,
    town_hall_level: rows[0].town_hall_level,
    seasons,
    bestOverall,
    bestEfficiency,
    totalSeasons: seasons.length,
    currentRank,
  });
}
