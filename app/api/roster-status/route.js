import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();

  // Mirror exact logic from admin overview:
  // in_pool = accounts with a pool_entries row this season
  // assigned = in_pool accounts that also have assigned_clan set
  const [inPoolRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries WHERE season = ${season}
  `;
  const inPool = parseInt(inPoolRow?.count || 0);

  const [assignedRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND assigned_clan IS NOT NULL
  `;
  const assigned = parseInt(assignedRow?.count || 0);

  const pct = inPool > 0 ? Math.round((assigned / inPool) * 100) : 0;

  // Published clans check
  const [pubRow] = await sql`SELECT COUNT(*) as count FROM clans WHERE included = true AND roster_published = true`;
  const publishedCount = parseInt(pubRow?.count || 0);

  return NextResponse.json({ inPool, assigned, pct, publishedCount, anyPublished: publishedCount > 0 });
}
