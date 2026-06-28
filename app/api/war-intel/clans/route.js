import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const [clans, punchUp] = await Promise.all([
    sql`
      SELECT
        clan_name,
        ROUND(AVG(stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) FILTER (WHERE war_result = 'win') AS wins,
        COUNT(*) FILTER (WHERE war_result = 'loss') AS losses,
        COUNT(*) FILTER (WHERE war_result = 'draw') AS draws,
        COUNT(*) AS total_wars
      FROM war_days
      GROUP BY clan_name
      ORDER BY avg_stars DESC
    `,
    sql`
      SELECT
        clan_name,
        ROUND((COUNT(*) FILTER (WHERE defender_th_level >= town_hall_level AND town_hall_level IS NOT NULL AND defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
        ROUND((COUNT(*) FILTER (WHERE stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
      FROM war_attacks
      GROUP BY clan_name
    `,
  ]);

  const punchMap = Object.fromEntries(punchUp.map(r => [r.clan_name, r]));
  const combined = clans.map(c => ({
    ...c,
    punch_up_rate: punchMap[c.clan_name]?.punch_up_rate ?? null,
    three_star_rate: punchMap[c.clan_name]?.three_star_rate ?? null,
  }));

  return NextResponse.json({ clans: combined });
}
