import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const [row] = await sql`SELECT COUNT(*) as total FROM clans WHERE included = true`;
  const [pubRow] = await sql`SELECT COUNT(*) as published FROM clans WHERE roster_published = true AND included = true`;
  const totalClans = parseInt(row?.total || 5);
  const publishedCount = parseInt(pubRow?.published || 0);
  return NextResponse.json({
    anyPublished: publishedCount > 0,
    publishedCount,
    totalClans,
  });
}
