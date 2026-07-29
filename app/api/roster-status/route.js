import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Published clans check
  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);

  // Unpublished active clans and their capacity
  const unpublishedClans = await sql`
    SELECT clan_name, cwl_format FROM clans 
    WHERE included = true AND (roster_published = false OR roster_published IS NULL)
  `;
  const totalClans = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true`;
  const totalClansCount = parseInt(totalClans[0]?.count || 0);

  const totalCapacity = unpublishedClans.reduce((sum, c) => {
    return sum + (c.cwl_format === '30v30' ? 30 : 15);
  }, 0);

  const unpublishedClanNames = unpublishedClans.map(c => c.clan_name);

  // Confirmed (non-sub) players in unpublished clans only
  let confirmedPlayers = 0;
  if (unpublishedClanNames.length > 0) {
    const [confRow] = await sql`
      SELECT COUNT(*) as count FROM pool_entries
      WHERE season = ${season}
      AND assigned_clan = ANY(${unpublishedClanNames})
      AND (status = 'confirmed' OR status = 'active')
    `;
    confirmedPlayers = parseInt(confRow?.count || 0);
  }

  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans: totalClansCount,
    unpublishedCount: unpublishedClans.length,
    confirmedPlayers,
    totalCapacity,
    season,
  });
}
