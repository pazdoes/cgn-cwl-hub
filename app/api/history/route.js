import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const history = await sql`
    SELECT
      clan_name, season, cwl_rank,
      wars_won, wars_lost, wars_drawn,
      total_stars, total_stars_conceded,
      total_attacks_used, total_attacks_available, total_attacks_missed,
      avg_destruction_pct, avg_defence_pct,
      attack_efficiency, defence_efficiency,
      three_star_rate
    FROM clan_season_history
    ORDER BY clan_name, season
  `;
  return NextResponse.json({ history });
}
