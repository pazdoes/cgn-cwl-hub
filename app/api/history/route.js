import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Only clans currently registered in the clans table (active OR paused —
  // anything still linked in admin) appear here. Deleted/removed clans like
  // Cogniti2n, old Incognito, old Cognitive are excluded from this view but
  // their underlying clan_season_history rows remain fully intact in the DB.
  const history = await sql`
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
