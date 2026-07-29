import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Total active clans
  const [totalRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true`;
  const totalClans = parseInt(totalRow?.count || 0);

  // Published clans (active only)
  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);

  // Total players assigned to published rosters this season
  const [playerRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries pe
    JOIN clans c ON pe.assigned_clan = c.clan_name
    WHERE c.included = true AND c.roster_published = true
    AND pe.season = ${season}
    AND pe.assigned_clan IS NOT NULL
  `;
  const totalPlayers = parseInt(playerRow?.count || 0);

  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans,
    totalPlayers,
    season,
  });
}
