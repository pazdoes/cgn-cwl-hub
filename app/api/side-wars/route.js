import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — returns all active side wars for the homepage tile
export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, clan_name, clan_tag, clan_link, start_time
      FROM side_wars
      WHERE is_active = true
      ORDER BY start_time ASC
    `;
    return NextResponse.json({ wars: rows });
  } catch (err) {
    console.error("side-wars GET error:", err);
    return NextResponse.json({ wars: [] });
  }
}
