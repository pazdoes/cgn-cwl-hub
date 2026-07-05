import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Searches alliance members by name from player_cwl_stats
// Returns matching player_name, player_tag, clan_name
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const sql = getDb();
  const results = await sql`
    SELECT DISTINCT ON (player_tag)
      player_name AS name,
      player_tag  AS tag,
      clan_name   AS clan
    FROM player_cwl_stats
    WHERE player_name ILIKE ${"%" + q + "%"}
    ORDER BY player_tag, season DESC
    LIMIT 10
  `;

  return NextResponse.json({ results });
}
