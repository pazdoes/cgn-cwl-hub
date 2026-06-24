import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData } from "@/lib/cwlCapture";

// Called by cron-job.org on the 10th of each month at 23:00 UTC
// Captures CWL rank history and player war stats for all clans
// for the current open season.
// Authorization: Bearer {CRON_SECRET}
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = await getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No open season found" }, { status: 404 });
  }

  const result = await captureCwlData(season);

  return NextResponse.json({
    ok: true,
    season,
    ...result,
    capturedAt: new Date().toISOString(),
  });
}
