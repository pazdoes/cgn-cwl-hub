import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Published clans check
  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);
  const totalClansRow = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true`;
  const totalClans = parseInt(totalClansRow[0]?.count || 0);

  // All players in pool this season
  const [inPoolRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND assigned_clan IS NOT NULL
  `;
  const inPool = parseInt(inPoolRow?.count || 0);

  // Confirmed (non-sub) players assigned this season
  const [confirmedRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season}
    AND assigned_clan IS NOT NULL
    AND status = 'confirmed'
  `;
  const confirmed = parseInt(confirmedRow?.count || 0);

  const pct = inPool > 0 ? Math.round((confirmed / inPool) * 100) : 0;

  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans,
    confirmed,
    inPool,
    pct,
    season,
  });
}
