import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData, captureWarAttacks } from "@/lib/cwlCapture";

// Called by cron-job.org:
//   - 10th of each month at 23:00 UTC (season aggregate)
//   - Daily 1st-12th at 09:00 UTC (per-war attack capture)
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

  // Always run per-war attack capture (idempotent — skips already-captured wars)
  const warResult = await captureWarAttacks(season);

  // Run full season aggregate capture (existing behaviour)
  const result = await captureCwlData(season);

  return NextResponse.json({
    ok: true,
    season,
    ...result,
    warAttacks: warResult,
    capturedAt: new Date().toISOString(),
  });
}
