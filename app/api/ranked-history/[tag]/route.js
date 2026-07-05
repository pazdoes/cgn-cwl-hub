import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const { tag } = await params;
  const playerTag = tag.startsWith("#") ? tag : `#${tag}`;
  const sql = getDb();

  const snapshots = await sql`
    SELECT
      (data->>'trophies')::int     AS trophies,
      data->'league'->>'name'      AS league_name,
      data->'league'->>'iconUrl'   AS league_icon,
      captured_at
    FROM player_army_cache
    WHERE player_tag = ${playerTag}
      AND data->>'trophies' IS NOT NULL
      AND data->'league' IS NOT NULL
    ORDER BY captured_at DESC
    LIMIT 5
  `;

  return NextResponse.json({ snapshots });
}
