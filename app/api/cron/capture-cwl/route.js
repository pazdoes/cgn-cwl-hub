import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData, captureWarAttacks } from "@/lib/cwlCapture";
import { updatePositionStats, getDb } from "@/lib/pool";

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

  // Update position-based stats (punch_up_rate, dips, reaches) from war_attacks
  const positionUpdated = await updatePositionStats(season).catch(() => 0);

  // Update defence stats directly from war_defences — reliable SQL aggregation
  const sql = getDb();
  await sql`
    UPDATE player_cwl_stats ps
    SET
      stars_conceded       = sub.total_stars,
      three_stars_conceded = sub.three_stars,
      two_stars_conceded   = sub.two_stars,
      one_stars_conceded   = sub.one_stars,
      zero_stars_conceded  = sub.zero_stars,
      defence_efficiency   = CASE WHEN ps.attacks_available > 0
        THEN ROUND(sub.total_stars::numeric / LEAST(ps.attacks_available, 7), 2)
        ELSE 0 END
    FROM (
      SELECT
        player_tag,
        SUM(stars_conceded)                               as total_stars,
        COUNT(*) FILTER (WHERE stars_conceded = 3)        as three_stars,
        COUNT(*) FILTER (WHERE stars_conceded = 2)        as two_stars,
        COUNT(*) FILTER (WHERE stars_conceded = 1)        as one_stars,
        COUNT(*) FILTER (WHERE stars_conceded = 0)        as zero_stars
      FROM war_defences
      WHERE season = ${season}
      GROUP BY player_tag
    ) sub
    WHERE ps.player_tag = sub.player_tag
      AND ps.season = ${season}
  `.catch(() => null);

  return NextResponse.json({
    ok: true,
    season,
    ...statsResult,
    warsProcessed: attackResult.warsProcessed,
    attacksProcessed: attackResult.attacksProcessed,
    positionUpdated,
    capturedAt: new Date().toISOString(),
  });
}
