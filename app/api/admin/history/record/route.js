import { NextResponse } from "next/server";
import { recordSeasonHistory, getAllClanNames } from "@/lib/pool";
import { getOpenPoolSeason } from "@/lib/season";

// Records the current CWL rank for every registered clan into
// clan_season_history for the current open season. Called once per
// season by an admin via the "Record Season" button on the admin page.
//
// Reads clan ranks from the request body (the admin page already has
// the current cwlRank for each clan from the pool data load) rather
// than making a fresh CoC API call here — the admin would have just
// used the rank refresh button to ensure ranks are current before
// recording, so reading from the request is correct and cheaper.
//
// Safe to call multiple times — re-recording a season overwrites the
// previous value, which is intentional (admin can correct an early
// recording after CWL results are finalised).
export async function POST(request) {
  const pin = request.headers.get("x-officer-pin");
  if (pin !== process.env.OFFICER_PIN) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { clanRanks } = body;
  // clanRanks: [{ clanName, cwlRank }]

  if (!Array.isArray(clanRanks) || clanRanks.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid clanRanks" },
      { status: 400 }
    );
  }

  const season = getOpenPoolSeason();
  if (!season) {
    return NextResponse.json({ error: "No open season found" }, { status: 400 });
  }

  try {
    await recordSeasonHistory(season, clanRanks);
  } catch (err) {
    console.error("Record season history failed:", err);
    return NextResponse.json(
      { error: `Couldn't record history: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ recorded: true, season, count: clanRanks.length });
}
