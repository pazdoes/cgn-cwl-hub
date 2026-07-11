import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { captureCwlData, captureWarAttacks } from "@/lib/cwlCapture";
import { getDb } from "@/lib/pool";

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

  // Update position-based stats directly via SQL from war_attacks
  await sql`
    UPDATE player_cwl_stats ps
    SET
      punch_up_rate   = sub.punch_up_rate,
      dips            = sub.dips,
      reaches         = sub.reaches,
      avg_target_position  = sub.avg_target_pos,
      avg_target_distance  = sub.avg_target_dist,
      clutch_rate     = sub.clutch_rate,
      consistency_score = sub.consistency_score
    FROM (
      SELECT
        player_tag,
        ROUND(100.0 * COUNT(*) FILTER (WHERE defender_map_position > attacker_map_position) / NULLIF(COUNT(*) FILTER (WHERE attacker_map_position IS NOT NULL), 0), 2) as punch_up_rate,
        COUNT(*) FILTER (WHERE defender_map_position < attacker_map_position) as dips,
        COUNT(*) FILTER (WHERE defender_map_position > attacker_map_position) as reaches,
        ROUND(AVG(defender_map_position) FILTER (WHERE defender_map_position IS NOT NULL), 2) as avg_target_pos,
        ROUND(AVG(ABS(defender_map_position - attacker_map_position)) FILTER (WHERE attacker_map_position IS NOT NULL AND defender_map_position IS NOT NULL), 2) as avg_target_dist,
        ROUND(AVG(stars) FILTER (WHERE stars IS NOT NULL), 2) as consistency_score,
        ROUND(100.0 * COUNT(*) FILTER (WHERE stars = 3 AND defender_map_position <= attacker_map_position) / NULLIF(COUNT(*) FILTER (WHERE defender_map_position <= attacker_map_position), 0), 2) as clutch_rate
      FROM war_attacks
      WHERE season = ${season}
        AND attacker_map_position IS NOT NULL
        AND defender_map_position IS NOT NULL
      GROUP BY player_tag
    ) sub
    WHERE ps.player_tag = sub.player_tag
      AND ps.season = ${season}
  `.catch(() => null);

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
    capturedAt: new Date().toISOString(),
  });
}
