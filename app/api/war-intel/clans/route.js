import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  // Rule: a specific season is a historical snapshot and must include every
  // clan that played that season, registered or not. The "All Seasons"
  // aggregate (no season param) stays scoped to currently registered clans.
  //
  // Grouped/filtered/joined by clan_name throughout — clan_name has been
  // NOT NULL and reliable on war_days/war_attacks since day one, unlike the
  // denormalized clan_tag column on those tables (never consistently
  // populated by the capture pipeline). clan_tag is only pulled in via a
  // lookup against `clans` at the end, purely for display.
  const [clans, punchUp] = await Promise.all([
    season
      ? sql`
          SELECT
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
          WHERE wd.season = ${season}
          GROUP BY wd.clan_name
          ORDER BY avg_stars DESC
        `
      : sql`
          SELECT
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
          WHERE wd.clan_name IN (SELECT clan_name FROM clans)
          GROUP BY wd.clan_name
          ORDER BY avg_stars DESC
        `,
    season
      ? sql`
          SELECT
            wa.clan_name,
            ROUND((COUNT(*) FILTER (WHERE wa.defender_th_level > wa.town_hall_level AND wa.town_hall_level IS NOT NULL AND wa.defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
            ROUND((COUNT(*) FILTER (WHERE wa.stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
          FROM war_attacks wa
          WHERE wa.season = ${season}
          GROUP BY wa.clan_name
        `
      : sql`
          SELECT
            wa.clan_name,
            ROUND((COUNT(*) FILTER (WHERE wa.defender_th_level > wa.town_hall_level AND wa.town_hall_level IS NOT NULL AND wa.defender_th_level IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS punch_up_rate,
            ROUND((COUNT(*) FILTER (WHERE wa.stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate
          FROM war_attacks wa
          WHERE wa.clan_name IN (SELECT clan_name FROM clans)
          GROUP BY wa.clan_name
        `,
  ]);

  const punchMap = Object.fromEntries(punchUp.map(r => [r.clan_name, r]));

  // clan_tag pulled in purely for display, via a fresh lookup against the
  // authoritative `clans` table — never trusted off the denormalized column.
  const clanTagRows = await sql`SELECT clan_name, clan_tag FROM clans`;
  const tagMap = Object.fromEntries(clanTagRows.map(r => [r.clan_name, r.clan_tag]));

  const combined = clans.map(c => ({
    ...c,
    clan_tag: tagMap[c.clan_name] ?? null,
    punch_up_rate: punchMap[c.clan_name]?.punch_up_rate ?? null,
    three_star_rate: punchMap[c.clan_name]?.three_star_rate ?? null,
  }));

  return NextResponse.json({ clans: combined });
}
