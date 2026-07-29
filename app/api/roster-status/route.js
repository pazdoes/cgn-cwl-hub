import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Total active clans
  const [totalRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true`;
  const totalClans = parseInt(totalRow?.count || 0);

  // Published clans (for anyPublished check)
  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);

  // Confirmed (non-sub) players assigned to ANY active clan this season
  // regardless of published state — tracks roster builder progress
  const [confirmedRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries pe
    JOIN clans c ON pe.assigned_clan = c.clan_name
    WHERE c.included = true
    AND pe.season = ${season}
    AND pe.assigned_clan IS NOT NULL
    AND (pe.status = 'confirmed' OR pe.status = 'active')
  `;
  const confirmedPlayers = parseInt(confirmedRow?.count || 0);

  // Get format per clan to calculate total capacity
  const clanFormats = await sql`
    SELECT cwl_format FROM clans WHERE included = true
  `;
  const totalCapacity = clanFormats.reduce((sum, c) => {
    return sum + (c.cwl_format === '30v30' ? 30 : 15);
  }, 0);

  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans,
    confirmedPlayers,
    totalCapacity,
    season,
  });
}
