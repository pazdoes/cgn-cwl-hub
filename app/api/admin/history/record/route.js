import { NextResponse } from "next/server";
import { recordSeasonHistory, getAllClanNames, getClanFallbackData } from "@/lib/pool";
import { getOpenPoolSeason } from "@/lib/season";

// Records the current CWL rank for every registered clan into
// clan_season_history for the current open season.
// Reads ranks directly from Neon (getClanFallbackData) rather than
// trusting the admin page to pass them — this means the recorded rank
// always matches what's stored in the clans table, which the admin
// keeps current via the per-clan rank refresh button.
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const season = getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No open season found" }, { status: 400 });
  }

  try {
    const clanNames = await getAllClanNames();
    const clanRanks = await Promise.all(
      clanNames.map(async (clanName) => {
        const data = await getClanFallbackData(clanName);
        return {
          clanName,
          cwlRank: data.cwl_rank || "Unranked",
        };
      })
    );

    await recordSeasonHistory(season, clanRanks);

    return NextResponse.json({
      recorded: true,
      season,
      count: clanRanks.length,
      clans: clanRanks,
    });
  } catch (err) {
    console.error("Record season history failed:", err);
    return NextResponse.json(
      { error: `Couldn't record history: ${err.message}` },
      { status: 500 }
    );
  }
}
