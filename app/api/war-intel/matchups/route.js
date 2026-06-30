import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const sql = getDb();

  const matchups = season
    ? await sql`
        SELECT
          town_hall_level AS attacker_th,
          defender_th_level AS defender_th,
          COUNT(*) AS total,
          ROUND((COUNT(*) FILTER (WHERE stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate,
          ROUND(AVG(stars)::NUMERIC, 2) AS avg_stars
        FROM war_attacks
        WHERE town_hall_level IS NOT NULL
          AND defender_th_level IS NOT NULL
          AND season = ${season}
        GROUP BY town_hall_level, defender_th_level
        HAVING COUNT(*) >= 3
        ORDER BY town_hall_level DESC, defender_th_level DESC
      `
    : await sql`
        SELECT
          town_hall_level AS attacker_th,
          defender_th_level AS defender_th,
          COUNT(*) AS total,
          ROUND((COUNT(*) FILTER (WHERE stars = 3) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS three_star_rate,
          ROUND(AVG(stars)::NUMERIC, 2) AS avg_stars
        FROM war_attacks
        WHERE town_hall_level IS NOT NULL
          AND defender_th_level IS NOT NULL
        GROUP BY town_hall_level, defender_th_level
        HAVING COUNT(*) >= 3
        ORDER BY town_hall_level DESC, defender_th_level DESC
      `;

  return NextResponse.json({ matchups });
}
