import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const activeClanRows = await sql`SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL`;
  const activeTags = activeClanRows.map(r => r.clan_tag);

  const latestSeasonRow = await sql`
    SELECT season FROM season_registry ORDER BY season_date DESC LIMIT 1
  `;
  const latestSeason = latestSeasonRow[0]?.season;

  const attendance = await sql`
    SELECT
      ps.player_tag,
      ps.player_name,
      ps.clan_name,
      SUM(ps.missed_attacks) AS missed,
      COUNT(ps.season) AS seasons_played
    FROM player_cwl_stats ps
    JOIN clans c ON c.clan_name = ps.clan_name
    WHERE ps.missed_attacks > 0
      AND c.clan_tag = ANY(${activeTags})
      AND ps.player_tag IN (
        SELECT player_tag FROM accounts
        UNION
        SELECT player_tag FROM player_cwl_stats
        WHERE season = ${latestSeason}
      )
    GROUP BY ps.player_tag, ps.player_name, ps.clan_name
    ORDER BY missed DESC, player_name ASC
  `;

  return NextResponse.json({ attendance });
}
