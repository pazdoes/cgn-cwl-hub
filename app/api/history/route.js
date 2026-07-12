import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  const history = season
    ? await sql`
        SELECT
          csh.clan_tag, csh.clan_name, csh.season, csh.cwl_rank,
          c.cwl_rank as current_cwl_rank,
          csh.wars_won, csh.wars_lost, csh.wars_drawn,
          csh.total_stars, csh.total_stars_conceded,
          csh.total_attacks_used, csh.total_attacks_available, csh.total_attacks_missed,
          csh.avg_destruction_pct, csh.avg_defence_pct,
          csh.attack_efficiency, csh.defence_efficiency,
          csh.three_star_rate,
          csh.three_stars_clan, csh.two_stars_clan, csh.one_stars_clan, csh.zero_stars_clan
        FROM clan_season_history csh
        LEFT JOIN season_registry sr ON sr.season = csh.season
        LEFT JOIN clans c ON c.clan_name = csh.clan_name
        WHERE csh.season = ${season}
          AND csh.total_stars IS NOT NULL
          AND csh.clan_name NOT IN (
            SELECT clan_name FROM clans WHERE cwl_absent = true
          )
        ORDER BY csh.total_stars DESC NULLS LAST
      `
    : await sql`
        SELECT
          csh.clan_tag, csh.clan_name, csh.season, csh.cwl_rank,
          c.cwl_rank as current_cwl_rank,
          csh.wars_won, csh.wars_lost, csh.wars_drawn,
          csh.total_stars, csh.total_stars_conceded,
          csh.total_attacks_used, csh.total_attacks_available, csh.total_attacks_missed,
          csh.avg_destruction_pct, csh.avg_defence_pct,
          csh.attack_efficiency, csh.defence_efficiency,
          csh.three_star_rate,
          csh.three_stars_clan, csh.two_stars_clan, csh.one_stars_clan, csh.zero_stars_clan
        FROM clan_season_history csh
        LEFT JOIN season_registry sr ON sr.season = csh.season
        LEFT JOIN clans c ON c.clan_name = csh.clan_name
        WHERE csh.total_stars IS NOT NULL
          AND csh.clan_name IN (
            SELECT clan_name FROM clans WHERE cwl_absent = false OR cwl_absent IS NULL
          )
        ORDER BY csh.clan_name, sr.season_date ASC NULLS LAST
      `;

  return NextResponse.json({ history });
}
