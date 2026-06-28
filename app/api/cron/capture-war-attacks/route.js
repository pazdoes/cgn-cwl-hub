import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureWarAttacks } from "@/lib/cwlCapture";

// Called by cron-job.org daily at 09:00 UTC, days 1-12 of each month
// Captures per-war attack data for all clans for the current open season.
// Idempotent — skips wars already stored. Safe to call multiple times.
// Authorization: Bearer {CWL_CRON_SECRET}
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CWL_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = await getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No open season found" }, { status: 404 });
  }

  const result = await captureWarAttacks(season);

  return NextResponse.json({
    ok: true,
    season,
    ...result,
    capturedAt: new Date().toISOString(),
  });
}
