import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Grouped by player only (not clan) — a player's total missed attacks must
  // sum across every clan and season they've played in. Grouping by clan_name
  // previously fragmented a player's attendance record across multiple rows
  // if they had played for more than one clan over time, undercounting their
  // true total missed attacks per row.
  const attendance = await sql`
    SELECT
      ps.player_tag,
      ps.player_name,
      SUM(ps.missed_attacks) AS missed,
      COUNT(ps.season) AS seasons_played
    FROM player_cwl_stats ps
    WHERE ps.missed_attacks > 0
      AND ps.player_tag IN (SELECT player_tag FROM accounts)
    GROUP BY ps.player_tag, ps.player_name
    ORDER BY missed DESC, player_name ASC
  `;

  return NextResponse.json({ attendance });
}
