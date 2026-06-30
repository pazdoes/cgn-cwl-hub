import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  const [clans, punchUp] = await Promise.all([
    season
      ? sql`
          SELECT
            wd.clan_tag,
            wd.clan_name,
            ROUND(AVG(wd.stars_earned)::NUMERIC, 2) AS avg_stars,
            ROUND(AVG(wd.stars_conceded)::NUMERIC, 2) AS avg_stars_conceded,
            ROUND((SUM(wd.stars_earned)::NUMERIC / NULLIF(SUM(wd.attacks_used), 0)), 2) AS avg_attack_efficiency,
            ROUND((SUM(wd.stars_conceded)::NUMERIC / NULLIF(SUM(wd.attacks_available), 0)), 2) AS avg_defence_efficiency,
            COUNT(*) FILTER (WHERE wd.war_result = 'win') AS wins,
            COUNT(*) FILTER (WHERE wd.war_result = 'loss') AS losses,
            COUNT(*) FILTER (WHERE wd.war_result = 'draw') AS draws,
            COUNT(*) AS total_wars
          FROM war_days wd
          WHERE wd.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
            AND wd.season = ${season}
          GROUP BY wd.clan_tag, wd.clan_name
          ORDER BY avg_stars DESC
        `
      : sql`
          SELECT
            wd.clan_tag,
            wd.clan_name,
            ROUND(AVG(wd.stars_earned)::NUMERIC, 2) AS avg_stars,
            ROUND(AVG(wd.stars_conceded)::NUMERIC, 2) AS avg_stars_conceded,
            ROUND((SUM(wd.stars_earned)::NUMERIC / NULLIF(SUM(wd.attacks_used), 0)), 2) AS avg_attack_efficiency,
            ROUND((SUM(wd.stars_conceded)::NUMERIC / NULLIF(SUM(wd.attacks_available), 0)), 2) AS avg_defence_efficiency,
            COUNT(*) FILTER (WHERE wd.war_result = 'win') AS wins,
            COUNT(*) FILTER (WHERE wd.war_result = 'loss') AS losses,
            COUNT(*) FILTER (WHERE wd.war_result = 'draw') AS draws,
            COUNT(*) AS total_wars
          FROM war_days wd
          WHERE wd.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
          GROUP BY wd.clan_tag, wd.clan_name
          ORDER BY avg_stars DESC
        `,
    season
      ? sql`
          SELECT
            wa.clan_tag,
            ROUND((COUNT(*) FILTER (WHERE wa.defender_th_level > wa.town_hall_level AND wa.town_hall_level IS NOT NULL AND wa.defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
            ROUND((COUNT(*) FILTER (WHERE wa.stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
          FROM war_attacks wa
          WHERE wa.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
            AND wa.season = ${season}
          GROUP BY wa.clan_tag
        `
      : sql`
          SELECT
            wa.clan_tag,
            ROUND((COUNT(*) FILTER (WHERE wa.defender_th_level > wa.town_hall_level AND wa.town_hall_level IS NOT NULL AND wa.defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
            ROUND((COUNT(*) FILTER (WHERE wa.stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
          FROM war_attacks wa
          WHERE wa.clan_tag IN (SELECT clan_tag FROM clans WHERE clan_tag IS NOT NULL)
          GROUP BY wa.clan_tag
        `,
  ]);

  const punchMap = Object.fromEntries(punchUp.map(r => [r.clan_tag, r]));
  const combined = clans.map(c => ({
    ...c,
    punch_up_rate: punchMap[c.clan_tag]?.punch_up_rate ?? null,
    three_star_rate: punchMap[c.clan_tag]?.three_star_rate ?? null,
  }));

  return NextResponse.json({ clans: combined });
}
