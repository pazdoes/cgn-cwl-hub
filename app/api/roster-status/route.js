import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT COUNT(*) as count FROM clans WHERE roster_published = true`;
  const anyPublished = parseInt(rows[0]?.count || 0) > 0;
  return NextResponse.json({ anyPublished });
}
