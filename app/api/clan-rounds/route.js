import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season   = searchParams.get("season");
  const clanName = searchParams.get("clan");

  if (!season || !clanName) {
    return NextResponse.json({ rounds: [] });
  }

  const sql = getDb();

  const rounds = await sql`
    SELECT
      war_day,
      clan_name,
      opponent_clan,
      stars_earned,
      stars_conceded,
      destruction_pct,
      defence_pct,
      war_result,
      attacks_used,
      attacks_available
    FROM war_days
    WHERE season = ${season}
      AND clan_name = ${clanName}
    ORDER BY war_day ASC
  `;

  return NextResponse.json({ rounds });
}
