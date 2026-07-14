import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();

  // Update current_clan_tag and current_clan_name from most recent player_army_cache snapshot
  const result = await sql`
    UPDATE accounts a
    SET
      current_clan_tag = (
        SELECT (pac.data->>'clan')::json->>'tag'
        FROM player_army_cache pac
        WHERE pac.player_tag = a.player_tag
        ORDER BY pac.captured_at DESC
        LIMIT 1
      ),
      current_clan_name = (
        SELECT (pac.data->>'clan')::json->>'name'
        FROM player_army_cache pac
        WHERE pac.player_tag = a.player_tag
        ORDER BY pac.captured_at DESC
        LIMIT 1
      )
    WHERE a.player_tag IN (SELECT DISTINCT player_tag FROM player_army_cache)
    RETURNING player_tag
  `;

  return NextResponse.json({ ok: true, updated: result.length });
}
