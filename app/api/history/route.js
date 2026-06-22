import { NextResponse } from "next/server";
import { getClanSeasonHistory } from "@/lib/pool";

// Returns all recorded clan season history for the CWL rank
// progression chart on the homepage. Public — no auth needed since
// this is the same kind of data already visible on the homepage
// (current CWL ranks per clan).
export async function GET() {
  try {
    const rows = await getClanSeasonHistory();
    return NextResponse.json({ history: rows });
  } catch (err) {
    console.error("Failed to load clan season history:", err);
    return NextResponse.json({ history: [] });
  }
}
