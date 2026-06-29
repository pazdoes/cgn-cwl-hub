import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const activeClanRows = await sql`SELECT clan_tag, clan_name FROM clans WHERE clan_tag IS NOT NULL`;
  const activeTags = activeClanRows.map(r => r.clan_tag);

  if (!activeTags.length) {
    return NextResponse.json({ clans: [] });
  }

  const [clans, punchUp, defEff] = await Promise.all([
    sql`
      SELECT
        clan_tag,
        clan_name,
        ROUND(AVG(stars_earned)::NUMERIC, 2) AS avg_stars,
        COUNT(*) FILTER (WHERE war_result = 'win') AS wins,
        COUNT(*) FILTER (WHERE war_result = 'loss') AS losses,
        COUNT(*) FILTER (WHERE war_result = 'draw') AS draws,
        COUNT(*) AS total_wars
      FROM war_days
      WHERE clan_tag = ANY(${activeTags})
      GROUP BY clan_tag, clan_name
      ORDER BY avg_stars DESC
    `,
    sql`
      SELECT
        clan_tag,
        ROUND((COUNT(*) FILTER (WHERE defender_th_level >= town_hall_level AND town_hall_level IS NOT NULL AND defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
        ROUND((COUNT(*) FILTER (WHERE stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
      FROM war_attacks
      WHERE clan_tag = ANY(${activeTags})
      GROUP BY clan_tag
    `,
    sql`
      SELECT
        clan_name,
        ROUND(AVG(efficiency)::NUMERIC, 2) AS avg_attack_efficiency,
        ROUND(AVG(defence_efficiency)::NUMERIC, 2) AS avg_defence_efficiency,
        ROUND(AVG(stars_conceded)::NUMERIC, 2) AS avg_stars_conceded
      FROM player_cwl_stats
      WHERE clan_name = ANY(${activeClanRows.map(r => r.clan_name)})
      GROUP BY clan_name
    `,
  ]);

  const punchMap = Object.fromEntries(punchUp.map(r => [r.clan_tag, r]));
  const defMap = Object.fromEntries(defEff.map(r => [r.clan_name, r]));

  const combined = clans.map(c => ({
    ...c,
    punch_up_rate: punchMap[c.clan_tag]?.punch_up_rate ?? null,
    three_star_rate: punchMap[c.clan_tag]?.three_star_rate ?? null,
    avg_attack_efficiency: defMap[c.clan_name]?.avg_attack_efficiency ?? null,
    avg_defence_efficiency: defMap[c.clan_name]?.avg_defence_efficiency ?? null,
    avg_stars_conceded: defMap[c.clan_name]?.avg_stars_conceded ?? null,
  }));

  return NextResponse.json({ clans: combined });
}
