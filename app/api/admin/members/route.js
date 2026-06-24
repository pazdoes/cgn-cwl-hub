import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";
import { readOwnerSecret } from "@/lib/ownerCookie";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  const members = await sql`
    SELECT
      a.player_tag,
      a.player_name,
      a.town_hall_level,
      a.discord_id,
      a.api_token_verified,
      a.verified_at,
      pe.assigned_clan,
      pe.status,
      CASE WHEN pe.player_tag IS NOT NULL THEN true ELSE false END AS in_pool
    FROM accounts a
    LEFT JOIN pool_entries pe
      ON pe.player_tag = a.player_tag
      AND pe.season = ${season}
    ORDER BY a.town_hall_level DESC NULLS LAST, a.player_name ASC
  `;

  // Stats
  const totalAccounts = members.length;
  const discordLinked = members.filter(m => m.discord_id).length;
  const inPool = members.filter(m => m.in_pool).length;
  const apiVerified = members.filter(m => m.api_token_verified).length;

  return NextResponse.json({
    members,
    stats: { totalAccounts, discordLinked, inPool, apiVerified },
    season,
  });
}
