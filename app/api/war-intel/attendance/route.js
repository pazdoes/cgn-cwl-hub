import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const attendance = await sql`
    SELECT
      ps.player_tag,
      ps.player_name,
      ps.clan_name,
      SUM(ps.missed_attacks) AS missed,
      COUNT(ps.season) AS seasons_played
    FROM player_cwl_stats ps
    WHERE ps.missed_attacks > 0
    GROUP BY ps.player_tag, ps.player_name, ps.clan_name
    ORDER BY missed DESC, player_name ASC
  `;

  return NextResponse.json({ attendance });
}
