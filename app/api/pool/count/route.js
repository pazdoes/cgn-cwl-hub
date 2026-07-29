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
  return NextResponse.json({
    count: parseInt(inRow?.count || 0),
    outCount: parseInt(outRow?.count || 0),
    season,
  });
}
