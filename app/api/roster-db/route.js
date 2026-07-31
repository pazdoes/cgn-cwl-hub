import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  try {
    const season = await getOpenPoolSeason();

    // Return confirmed+substitute players from published clans only
    const rows = await sql`
      SELECT
        pe.player_tag AS "playerTag",
        a.player_name AS account,
        a.town_hall_level AS "townHall",
        pe.assigned_clan AS clan,
        pe.status
      FROM pool_entries pe
      JOIN accounts a ON a.player_tag = pe.player_tag
      JOIN clans c ON c.clan_name = pe.assigned_clan
      WHERE pe.season = ${season}
        AND pe.assigned_clan IS NOT NULL
        AND c.roster_published = true
        AND c.included = true
      ORDER BY pe.assigned_clan, a.player_name ASC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load roster data" }, { status: 500 });
  }
}
