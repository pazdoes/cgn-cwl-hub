import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const sql = getDb();
  const season = await getOpenPoolSeason();

  // All active alliance clans (excludes anything flagged cwl_absent)
  const clans = await sql`
    SELECT clan_name FROM clans
    WHERE cwl_absent = false OR cwl_absent IS NULL
    ORDER BY clan_name
  `;

  const days = await sql`
    SELECT clan_name, war_day, attacks_used, attacks_available, war_result, created_at
    FROM war_days
    WHERE season = ${season}
    ORDER BY clan_name, war_day
  `;

  const dayMap = {};
  for (const row of days) {
    if (!dayMap[row.clan_name]) dayMap[row.clan_name] = {};
    dayMap[row.clan_name][row.war_day] = row;
  }

  const clanRows = clans.map(c => {
    const captured = dayMap[c.clan_name] || {};
    const dayList = [1, 2, 3, 4, 5, 6, 7].map(day => {
      const row = captured[day];
      return row
        ? {
            day,
            captured: true,
            attacksUsed: row.attacks_used,
            attacksAvailable: row.attacks_available,
            warResult: row.war_result,
            capturedAt: row.created_at,
          }
        : { day, captured: false };
    });
    const daysCaptured = dayList.filter(d => d.captured).length;
    return { clanName: c.clan_name, days: dayList, daysCaptured };
  });

  return NextResponse.json({ season, clans: clanRows });
}
