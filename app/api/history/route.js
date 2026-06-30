import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  // Rule: a specific season is a historical snapshot — it must show every
  // clan that genuinely played that season, registered or not, so season
  // recaps, war intel, and history charts stay in sync with player-level data
  // (which already shows full history regardless of clan status).
  // An "all seasons" request (no season param) returns only clans currently
  // registered in the clans table, since that represents the ongoing roster.
  const history = season
    ? await sql`
        SELECT
          csh.clan_tag, csh.clan_name, csh.season, csh.cwl_rank,
          csh.wars_won, csh.wars_lost, csh.wars_drawn,
          csh.total_stars, csh.total_stars_conceded,
          csh.total_attacks_used, csh.total_attacks_available, csh.total_attacks_missed,
          csh.avg_destruction_pct, csh.avg_defence_pct,
          csh.attack_efficiency, csh.defence_efficiency,
          csh.three_star_rate,
          csh.three_stars_clan, csh.two_stars_clan, csh.one_stars_clan, csh.zero_stars_clan
        FROM clan_season_history csh
        LEFT JOIN season_registry sr ON sr.season = csh.season
        WHERE csh.season = ${season}
        ORDER BY csh.clan_tag, sr.season_date ASC NULLS LAST
      `
    : await sql`
        SELECT
          csh.clan_tag, csh.clan_name, csh.season, csh.cwl_rank,
          csh.wars_won, csh.wars_lost, csh.wars_drawn,
          csh.total_stars, csh.total_stars_conceded,
          csh.total_attacks_used, csh.total_attacks_available, csh.total_attacks_missed,
          csh.avg_destruction_pct, csh.avg_defence_pct,
          csh.attack_efficiency, csh.defence_efficiency,
          csh.three_star_rate,
          csh.three_stars_clan, csh.two_stars_clan, csh.one_stars_clan, csh.zero_stars_clan
        FROM clan_season_history csh
        LEFT JOIN season_registry sr ON sr.season = csh.season
        WHERE csh.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
        ORDER BY csh.clan_tag, sr.season_date ASC NULLS LAST
      `;

  return NextResponse.json({ history });
}
