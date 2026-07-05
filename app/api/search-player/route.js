import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const sql = getDb();

  // Search player_cwl_stats (CWL participants)
  const cwlResults = await sql`
    SELECT DISTINCT ON (player_tag)
      player_name AS name,
      player_tag  AS tag,
      clan_name   AS clan
    FROM player_cwl_stats
    WHERE player_name ILIKE ${"%" + q + "%"}
    ORDER BY player_tag, season DESC
    LIMIT 10
  `;

  // Also search player_army_cache for registered players not in CWL stats
  const cacheResults = await sql`
    SELECT DISTINCT ON (a.player_tag)
      c.data->>'name'       AS name,
      a.player_tag          AS tag,
      c.data->'clan'->>'name' AS clan
    FROM accounts a
    INNER JOIN player_army_cache c ON c.player_tag = a.player_tag
    WHERE c.data->>'name' ILIKE ${"%" + q + "%"}
      AND a.player_tag NOT IN (
        SELECT DISTINCT player_tag FROM player_cwl_stats
        WHERE player_name ILIKE ${"%" + q + "%"}
      )
    ORDER BY a.player_tag, c.captured_at DESC
    LIMIT 10
  `;

  // Merge and deduplicate
  const seen = new Set();
  const results = [];
  for (const r of [...cwlResults, ...cacheResults]) {
    if (!seen.has(r.tag)) {
      seen.add(r.tag);
      results.push(r);
    }
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
