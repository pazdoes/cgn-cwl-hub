import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  // Grouped by player only — a player's missed attacks sum across every clan
  // they've played for. When a season filter is active, only that season's
  // missed attacks count; "all" sums across full history.
  const attendance = season
    ? await sql`
        SELECT
          ps.player_tag,
          ps.player_name,
          SUM(ps.missed_attacks) AS missed,
          COUNT(ps.season) AS seasons_played
        FROM player_cwl_stats ps
        WHERE ps.missed_attacks > 0
          AND ps.player_tag IN (SELECT player_tag FROM accounts)
          AND ps.season = ${season}
        GROUP BY ps.player_tag, ps.player_name
        ORDER BY missed DESC, player_name ASC
      `
    : await sql`
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
