import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);
  const [totalRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true`;
  const totalClans = parseInt(totalRow?.count || 0);

  // Total in pool this season (any pool_entries row)
  const [inPoolRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries WHERE season = ${season}
  `;
  const inPool = parseInt(inPoolRow?.count || 0);

  // Assigned to a clan (matches admin overview statsAssigned)
  const [assignedRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND assigned_clan IS NOT NULL
  `;
  const assigned = parseInt(assignedRow?.count || 0);

  const pct = inPool > 0 ? Math.round((assigned / inPool) * 100) : 0;

  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans,
    assigned,
    inPool,
    pct,
    season,
  });
}
