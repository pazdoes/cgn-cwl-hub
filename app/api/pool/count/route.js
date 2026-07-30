import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();
  const [inRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND (cwl_intent IS NULL OR cwl_intent = 'in')
  `;
  const [outRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND cwl_intent = 'out'
  `;
  const [inPoolRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries WHERE season = ${season}
  `;
  const [assignedRow] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season} AND assigned_clan IS NOT NULL
  `;
  const inPool = parseInt(inPoolRow?.count || 0);
  const assigned = parseInt(assignedRow?.count || 0);
  return NextResponse.json({
    count: parseInt(inRow?.count || 0),
    outCount: parseInt(outRow?.count || 0),
    inPool,
    assigned,
    pct: inPool > 0 ? Math.round((assigned / inPool) * 100) : 0,
    season,
  });
}
