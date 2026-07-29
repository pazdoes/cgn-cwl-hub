import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOpenPoolSeason } from "@/lib/season";

export async function GET() {
  const sql = getDb();
  const season = await getOpenPoolSeason();
  const [row] = await sql`
    SELECT COUNT(*) as count FROM pool_entries
    WHERE season = ${season}
  `;
  return NextResponse.json({ count: parseInt(row?.count || 0), season });
}
