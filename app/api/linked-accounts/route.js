import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Lightweight endpoint returning the full set of linked player tags.
// Used by client-side aggregation views (Leaderboard All Time, History
// Player Performance tracking) to filter cross-season rollups down to
// linked accounts only, since per-season snapshot fetches now correctly
// include unlinked players by design for single-season views.
export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT player_tag FROM accounts`;
  return NextResponse.json({ tags: rows.map(r => r.player_tag) });
}
