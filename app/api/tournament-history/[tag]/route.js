import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const sql = getDb();

  const results = await sql`
    SELECT
      week_ending,
      pre_trophies,
      pre_league,
      pre_league_icon,
      post_league,
      post_league_icon,
      result,
      clan_name,
      th_level
    FROM tournament_results
    WHERE player_tag = ${playerTag}
    ORDER BY week_ending DESC
    LIMIT 12
  `;

  return NextResponse.json({ results });
}
