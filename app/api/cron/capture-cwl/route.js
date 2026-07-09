import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData, captureWarAttacks } from "@/lib/cwlCapture";

// Called by cron-job.org during CWL season
// Captures CWL rank history, player war stats, and per-war attack data
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

  // Run both captures — war attacks first so DB seed works on next run
  const [attackResult, statsResult] = await Promise.all([
    captureWarAttacks(season).catch(err => ({ warsProcessed: 0, attacksProcessed: 0, errors: [err.message] })),
    captureCwlData(season),
  ]);

  return NextResponse.json({
    ok: true,
    season,
    ...statsResult,
    warsProcessed: attackResult.warsProcessed,
    attacksProcessed: attackResult.attacksProcessed,
    capturedAt: new Date().toISOString(),
  });
}
