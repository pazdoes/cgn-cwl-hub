import { NextResponse } from "next/server";
import { getOpenPoolSeason } from "@/lib/season";
import { recomputeCwlStatsFromDb } from "@/lib/pool";

// Manual admin trigger — recomputes player_cwl_stats and clan_season_history
// directly from war_attacks / war_defences / war_days, bypassing the live
// CoC API entirely. Use this when captureCwlData() can no longer pull fresh
// data for a season (e.g. the CWL war league group has expired) but the
// underlying war tables have already been backfilled.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let requestedSeason = null;
  try {
    const body = await request.json();
    requestedSeason = body?.season || null;
  } catch {
    // no body provided — fall back to the open season
  }

  const season = requestedSeason || await getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No season specified and no open season found" }, { status: 404 });
  }

  const result = await recomputeCwlStatsFromDb(season);

  return NextResponse.json({
    ok: true,
    season,
    ...result,
    recomputedAt: new Date().toISOString(),
  });
}
